import { watch } from "node:fs";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error(
    "Употреба: npm run format:watch -- src/components/pricing/plan-cards.tsx",
  );
  process.exit(1);
}

const target = resolve(process.cwd(), args[0]);
function ensureInsideProject(path) {
  const local = relative(root, path);
  if (
    !local ||
    local === ".." ||
    local.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(local)
  ) {
    throw new Error("Изберете файл в текущия проект Saitena.");
  }
}

async function validateTarget() {
  ensureInsideProject(target);
  const actualPath = await realpath(target);
  ensureInsideProject(actualPath);
  if (!(await stat(actualPath)).isFile())
    throw new Error("Подайте път към един файл.");
  const info = await prettier.getFileInfo(actualPath, {
    ignorePath: join(root, ".prettierignore"),
  });
  if (info.ignored) throw new Error("Файлът е изключен чрез .prettierignore.");
  if (!info.inferredParser)
    throw new Error("Типът на файла не се поддържа от Prettier.");
}

try {
  await validateTarget();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

let timer;
let running = false;
let pending = false;
let stopped = false;

function schedule() {
  if (stopped) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    pending = true;
    void formatPending();
  }, 180);
}

async function formatPending() {
  if (running || stopped) return;
  running = true;
  try {
    do {
      pending = false;
      try {
        await validateTarget();
        const original = await readFile(target, "utf8");
        const config = await prettier.resolveConfig(target, {
          useCache: false,
        });
        const formatted = await prettier.format(original, {
          ...config,
          filepath: target,
        });
        if (formatted === original || stopped) continue;
        // A newer editor save must win over an in-flight formatting operation.
        if ((await readFile(target, "utf8")) !== original) {
          schedule();
          continue;
        }
        if (stopped) return;
        await writeFile(target, formatted);
        console.log(`Форматиран: ${relative(root, target)}`);
      } catch (error) {
        // Atomic saves briefly remove a file; the directory watcher sees its replacement.
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        )
          continue;
        console.error(error instanceof Error ? error.message : String(error));
      }
    } while (pending && !stopped);
  } finally {
    running = false;
  }
}

// Watch the parent directory so editor "safe write"/rename saves keep working.
const watcher = watch(dirname(target), (_event, name) => {
  if (!name || name.toString() === basename(target)) schedule();
});
watcher.on("error", (error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});

function stop() {
  stopped = true;
  clearTimeout(timer);
  watcher.close();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
console.log(
  `Следя: ${relative(root, target)} — форматиране при запис. Спиране: Ctrl+C.`,
);
