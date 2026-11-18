/** The public website must never import the private platform tree or operations. */
export function isPrivatePlatformPath(value) {
  const path = value.replaceAll("\\", "/").replace(/^(?:\.\/)+/, "");
  return (
    /^(?:platform|apps\/(?:api|web)|infra|qa-private)(?:\/|$)/i.test(path) ||
    path.toLowerCase() === ".deployment/caddyfile.auth-local"
  );
}
