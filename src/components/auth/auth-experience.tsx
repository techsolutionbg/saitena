"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Icon } from "@/components/ui/icons";
import {
  AuthApiError,
  clientAreaUrl,
  registerAccount,
  registrationPolicy,
  type RegistrationPolicy,
  requestPasswordReset,
  resetPassword,
  signIn,
  verifyEmail,
} from "@/lib/auth-api";
import styles from "./auth-experience.module.css";

type Mode = "login" | "forgot" | "register" | "reset" | "verify";

const errorMessage = (error: unknown, mode: Mode) => {
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  if (!(error instanceof AuthApiError))
    return "Възникна неочаквана грешка. Опитайте отново.";
  if (error.status === -1)
    return "Връзката към клиентската зона не е конфигурирана за този сайт.";
  if (error.status === -2)
    return "Адресът на клиентската зона не е настроен за този сайт.";
  if (error.status === 0)
    return isRegister
      ? "Не успяхме да потвърдим резултата. Проверете имейла си и се свържете с нас, преди да подадете нова регистрация."
      : "Клиентската зона временно не е достъпна. Опитайте отново по-късно.";
  if (error.status === 419)
    return "Сесията изтече. Презаредете страницата и опитайте отново.";
  if (error.status === 422 && isLogin)
    return "Имейлът или паролата не са правилни.";
  if (error.status === 422 && isForgot)
    return "Проверете имейл адреса и опитайте отново.";
  if (error.status === 422 && mode === "reset")
    return "Връзката е невалидна или е изтекла. Поискайте нова връзка за смяна на паролата.";
  if (error.status === 401 && isLogin)
    return "Имейлът или паролата не са правилни.";
  if (error.status === 429)
    return "Има твърде много опити. Изчакайте малко и опитайте отново.";
  if (error.status === 403 && isRegister)
    return "В момента регистрацията не е достъпна. Свържете се с нас за съдействие.";
  if (error.status === 503 && isRegister)
    return "Регистрацията временно не е достъпна. Опитайте отново по-късно.";
  if (error.status >= 500 && isRegister)
    return "Не успяхме да потвърдим резултата. Проверете имейла си и се свържете с нас, преди да подадете нова регистрация.";
  if (error.status === 422 && isRegister)
    return "Не успяхме да завършим регистрацията с тези данни. Проверете ги или влезте, ако вече имате профил.";
  return "Възникна проблем при обработката на заявката. Опитайте отново по-късно.";
};

type VerificationState =
  "checking" | "success" | "invalid" | "unavailable" | "rate-limited";

function passwordRequirementsMet(value: string): boolean {
  const characters = Array.from(value);
  return (
    characters.length >= 12 &&
    /\p{Ll}/u.test(value) &&
    /\p{Lu}/u.test(value) &&
    /\p{N}/u.test(value) &&
    /[^\p{L}\p{N}\s]/u.test(value)
  );
}

function SecurityIllustration() {
  return (
    <svg
      className={styles.illustration}
      viewBox="0 0 600 390"
      role="img"
      aria-labelledby="illustration-title"
    >
      <title id="illustration-title">
        Защитен достъп до уебсайтовете и услугите Ви
      </title>
      <defs>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#78a6ff" />
          <stop offset="1" stopColor="#3158e8" />
        </linearGradient>
        <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5386ff" />
          <stop offset="1" stopColor="#183bc2" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="15"
            floodColor="#4769d8"
            floodOpacity=".2"
          />
        </filter>
      </defs>
      <g filter="url(#shadow)" transform="rotate(-5 295 190)">
        <rect
          x="82"
          y="78"
          width="410"
          height="250"
          rx="24"
          fill="#fff"
          fillOpacity=".72"
          stroke="#fff"
          strokeWidth="3"
        />
        <path
          d="M106 78h362a24 24 0 0 1 24 24v35H82v-35a24 24 0 0 1 24-24Z"
          fill="url(#screen)"
        />
        <circle cx="112" cy="105" r="6" fill="#e8efff" />
        <circle cx="136" cy="105" r="6" fill="#e8efff" />
        <circle cx="160" cy="105" r="6" fill="#e8efff" />
        <rect x="105" y="158" width="94" height="145" rx="12" fill="#e8edff" />
        <rect x="120" y="176" width="62" height="12" rx="6" fill="#b9c9ff" />
        <rect x="120" y="202" width="53" height="12" rx="6" fill="#c9d5fb" />
        <rect x="120" y="228" width="60" height="12" rx="6" fill="#c9d5fb" />
        <rect x="216" y="158" width="248" height="92" rx="14" fill="#f5f7ff" />
        <path d="m234 225 53-42 35 27 35-39 92 54Z" fill="#8facff" />
        <circle cx="270" cy="180" r="10" fill="#c7d5ff" />
        <rect x="216" y="265" width="155" height="12" rx="6" fill="#c5d2fb" />
        <rect x="216" y="287" width="104" height="9" rx="4" fill="#dce4fb" />
      </g>
      <g filter="url(#shadow)">
        <path
          d="m430 193 73 30v48c0 54-49 83-73 96-25-13-74-42-74-96v-48Z"
          fill="url(#shield)"
          stroke="#83a5ff"
          strokeWidth="5"
        />
        <path
          d="M409 270v-18a21 21 0 0 1 42 0v18"
          fill="none"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <rect x="399" y="265" width="62" height="55" rx="12" fill="#fff" />
        <circle cx="430" cy="287" r="7" fill="#4771f3" />
        <path
          d="M430 293v12"
          stroke="#4771f3"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function AuthExperience({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState<{
    email: string;
    token: string;
  } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [policy, setPolicy] = useState<RegistrationPolicy | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const [verificationState, setVerificationState] =
    useState<VerificationState>("checking");
  const verificationStarted = useRef(false);
  const resetLinkRead = useRef(false);
  const customerMode = process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
  const registrationEnabled =
    !customerMode ||
    process.env.NEXT_PUBLIC_CUSTOMER_REGISTRATION_ENABLED === "true";

  useEffect(() => {
    if (mode !== "register" || !customerMode || !registrationEnabled) return;
    let cancelled = false;
    registrationPolicy()
      .then((value) => {
        if (!cancelled) setPolicy(value);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorMessage(cause, "register"));
      });
    return () => {
      cancelled = true;
    };
  }, [mode, customerMode, registrationEnabled]);

  useEffect(() => {
    if (mode !== "reset" || resetLinkRead.current) return;
    resetLinkRead.current = true;
    const query = new URLSearchParams(window.location.search);
    const link = {
      email: query.get("email") ?? "",
      token: query.get("token") ?? "",
    };
    window.history.replaceState(null, "", "/reset-password");
    setResetLink(link);
  }, [mode]);

  useEffect(() => {
    if (mode !== "verify" || verificationStarted.current) return;
    verificationStarted.current = true;
    const query = new URLSearchParams(window.location.search);
    const credentials = {
      id: query.get("id") ?? "",
      hash: query.get("hash") ?? "",
      expires: query.get("expires") ?? "",
      signature: query.get("signature") ?? "",
    };
    window.history.replaceState(null, "", "/verify-email");

    async function verifyCredentials() {
      if (
        !/^\d+$/.test(credentials.id) ||
        !/^[a-f\d]{40}$/i.test(credentials.hash) ||
        !/^\d+$/.test(credentials.expires) ||
        !/^[a-f\d]{64}$/i.test(credentials.signature)
      ) {
        throw new AuthApiError(403);
      }
      await verifyEmail(credentials);
    }

    verifyCredentials()
      .then(() => setVerificationState("success"))
      .catch((cause: unknown) => {
        if (cause instanceof AuthApiError && cause.status === 429) {
          setVerificationState("rate-limited");
        } else if (
          cause instanceof AuthApiError &&
          (cause.status === 0 || cause.status === -1 || cause.status >= 500)
        ) {
          setVerificationState("unavailable");
        } else {
          setVerificationState("invalid");
        }
      });
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (isLogin) {
        const destination = clientAreaUrl(
          process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED === "true"
            ? "dashboard"
            : "login",
        );
        if (!destination) throw new AuthApiError(-2);
        await signIn(email.trim(), password);
        window.location.assign(destination);
      } else if (isForgot) {
        await requestPasswordReset(email.trim());
        setNotice(
          "Ако има профил с този имейл адрес, ще получите инструкции за смяна на паролата.",
        );
      } else if (isReset) {
        if (!resetLink?.email || !resetLink.token) {
          setError("Връзката е невалидна или е изтекла. Поискайте нова.");
          return;
        }
        if (!passwordRequirementsMet(password)) {
          setError(
            "Паролата трябва да е поне 12 знака и да съдържа малки и главни букви, цифра и символ.",
          );
          return;
        }
        if (password !== confirmation) {
          setError("Двете пароли не съвпадат.");
          return;
        }
        await resetPassword(
          resetLink.email,
          resetLink.token,
          password,
          confirmation,
        );
        setResetLink(null);
        setNotice("Паролата е сменена. Вече можете да влезете в профила си.");
      } else if (isRegister) {
        if (!registrationEnabled || (customerMode && !policy))
          throw new AuthApiError(503);
        if (!passwordRequirementsMet(password)) {
          setError(
            "Паролата трябва да е поне 12 знака и да съдържа малки и главни букви, цифра и символ.",
          );
          return;
        }
        if (password !== confirmation) {
          setError("Двете пароли не съвпадат.");
          return;
        }
        if (!acceptedTerms) {
          setError(
            policy?.mode === "owner-prelaunch"
              ? "Потвърдете участието си в ограниченото тестване."
              : "За да продължите, приемете Общите условия и Политиката за поверителност.",
          );
          return;
        }
        await registerAccount({
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          password,
          password_confirmation: confirmation,
          ...(policy?.mode === "owner-prelaunch"
            ? {
                prelaunch: {
                  accepted: acceptedTerms,
                  policy_sha256: policy.policy_sha256,
                },
              }
            : policy
              ? {
                  consent: {
                    accepted: acceptedTerms,
                    terms_version: policy.documents.terms.version,
                    privacy_version: policy.documents.privacy.version,
                  },
                }
              : {}),
        });
        setNotice(
          "Ако адресът е подходящ за регистрация, ще получите инструкции по имейл. Можете да влезете в профила си; клиентските услуги изискват потвърден имейл.",
        );
      }
    } catch (cause) {
      setError(errorMessage(cause, mode));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`${styles.authPage} auth-page`}>
      <header className={styles.topbar}>
        <Brand className={styles.brand} />
      </header>
      <div className={styles.main}>
        <section className={styles.intro} aria-labelledby="intro-title">
          <div className={styles.eyebrow}>
            <Icon name="user" />
            <span>Клиентска зона</span>
          </div>
          <h1 id="intro-title">
            {isLogin
              ? "Влезте в своя профил"
              : isRegister
                ? "Създайте своя профил"
                : isForgot
                  ? "Възстановете достъпа си"
                  : isReset
                    ? "Задайте нова парола"
                    : "Потвърдете имейла си"}
          </h1>
          <span className={styles.accent} aria-hidden="true" />
          <p>
            {isLogin
              ? "Управлявайте своите сайтове, абонаменти и заявки от едно място."
              : isRegister
                ? "Регистрирайте се, за да управлявате своите сайтове и услуги от едно място."
                : isForgot
                  ? "Въведете имейла към профила си и ще изпратим инструкции за смяна на паролата."
                  : isReset
                    ? "Изберете нова парола за профила си."
                    : "Следвайте връзката от имейла, за да активирате профила си."}
          </p>
          <SecurityIllustration />
          <ul
            className={styles.features}
            aria-label="Предимства на клиентската зона"
          >
            <li>
              <span>
                <Icon name="shield" />
              </span>
              Сигурен
              <br />
              достъп
            </li>
            <li>
              <span>
                <Icon name="layers" />
              </span>
              Защитена
              <br />
              сесия
            </li>
            <li>
              <span>
                <Icon name="rocket" />
              </span>
              Бърз достъп
              <br />
              до услугите
            </li>
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="form-title">
          <div className={styles.cardHeading}>
            <h2 id="form-title">
              {isLogin
                ? "Вход в профила"
                : isRegister
                  ? notice
                    ? "Проверете имейла си"
                    : "Създаване на профил"
                  : isForgot
                    ? "Забравена парола?"
                    : isReset
                      ? "Нова парола"
                      : "Потвърждение на имейл"}
            </h2>
            <p>
              {isLogin
                ? "Въведете Вашите данни за достъп."
                : isRegister
                  ? notice
                    ? "Проверете пощата си за връзка за потвърждение. Не сте влезли автоматично."
                    : "Попълнете данните си и ще изпратим имейл за потвърждение."
                  : isForgot
                    ? "Ще Ви изпратим връзка за възстановяване на паролата."
                    : isReset
                      ? "Въведете новата си парола и я потвърдете."
                      : "Проверяваме защитената връзка за потвърждение."}
            </p>
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
          {mode === "verify" && (
            <p
              className={
                verificationState === "success" ? styles.notice : styles.error
              }
              role={
                verificationState === "checking"
                  ? "status"
                  : verificationState === "success"
                    ? "status"
                    : "alert"
              }
            >
              {verificationState === "checking"
                ? "Проверяваме връзката…"
                : verificationState === "success"
                  ? "Имейлът е потвърден. Вече можете да влезете в профила си."
                  : verificationState === "rate-limited"
                    ? "Направени са твърде много опити. Изчакайте малко и отворете връзката отново."
                    : verificationState === "unavailable"
                      ? "Не успяхме да проверим връзката в момента. Опитайте отново по-късно."
                      : "Връзката е невалидна или е изтекла. Поискайте нова от клиентската зона."}
            </p>
          )}
          {isReset &&
            !notice &&
            (!resetLink || !resetLink.email || !resetLink.token) && (
              <p
                className={resetLink ? styles.error : styles.passwordHint}
                role={resetLink ? "alert" : "status"}
              >
                {resetLink
                  ? "Връзката е невалидна или е изтекла. Поискайте нова."
                  : "Зареждаме защитената връзка…"}
              </p>
            )}
          {mode !== "verify" &&
            !(isRegister && notice) &&
            !(isReset && (notice || !resetLink?.email || !resetLink.token)) && (
              <form className={styles.form} onSubmit={submit}>
                {isRegister && (
                  <div className={styles.nameFields}>
                    <div>
                      <label htmlFor="auth-first-name">Име</label>
                      <input
                        id="auth-first-name"
                        name="given-name"
                        type="text"
                        autoComplete="given-name"
                        maxLength={120}
                        required
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="auth-last-name">Фамилия</label>
                      <input
                        id="auth-last-name"
                        name="family-name"
                        type="text"
                        autoComplete="family-name"
                        maxLength={120}
                        required
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                      />
                    </div>
                  </div>
                )}
                {isLogin || isRegister || isForgot ? (
                  <>
                    <label htmlFor="auth-email">Имейл адрес</label>
                    <div className={styles.inputWrap}>
                      <Icon name="mail" />
                      <input
                        id="auth-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </>
                ) : isReset ? (
                  <p className={styles.passwordHint}>
                    Смяна на паролата за {resetLink?.email}
                  </p>
                ) : null}
                {(isLogin || isRegister || isReset) && (
                  <>
                    <label htmlFor="auth-password">Парола</label>
                    <div className={styles.inputWrap}>
                      <svg
                        className={styles.lock}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <rect x="5" y="10" width="14" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                      <input
                        id="auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          isLogin ? "current-password" : "new-password"
                        }
                        minLength={isLogin ? undefined : 12}
                        placeholder={
                          isReset
                            ? "Въведете новата парола"
                            : "Въведете паролата си"
                        }
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        className={styles.passwordToggle}
                        type="button"
                        onClick={() => setShowPassword((shown) => !shown)}
                        aria-label={
                          showPassword ? "Скрий паролата" : "Покажи паролата"
                        }
                        aria-pressed={showPassword}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
                          <circle cx="12" cy="12" r="2.7" />
                        </svg>
                      </button>
                    </div>
                    {isLogin ? (
                      <div className={styles.formLinks}>
                        <Link href="/forgot-password">Забравена парола?</Link>
                      </div>
                    ) : isRegister || isReset ? (
                      <>
                        <label htmlFor="auth-confirm-password">
                          Потвърдете паролата
                        </label>
                        <div className={styles.inputWrap}>
                          <input
                            id="auth-confirm-password"
                            name="password_confirmation"
                            type={showConfirmation ? "text" : "password"}
                            autoComplete="new-password"
                            minLength={12}
                            required
                            value={confirmation}
                            onChange={(event) =>
                              setConfirmation(event.target.value)
                            }
                          />
                          <button
                            className={styles.passwordToggle}
                            type="button"
                            onClick={() =>
                              setShowConfirmation((shown) => !shown)
                            }
                            aria-label={
                              showConfirmation
                                ? "Скрий потвърждението на паролата"
                                : "Покажи потвърждението на паролата"
                            }
                            aria-pressed={showConfirmation}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
                              <circle cx="12" cy="12" r="2.7" />
                            </svg>
                          </button>
                        </div>
                        <p className={styles.passwordHint}>
                          Най-малко 12 знака с малка и главна буква, цифра и
                          символ.
                        </p>
                        {isRegister && (
                          <label className={styles.terms} htmlFor="auth-terms">
                            <input
                              id="auth-terms"
                              name="terms"
                              type="checkbox"
                              required
                              checked={acceptedTerms}
                              onChange={(event) =>
                                setAcceptedTerms(event.target.checked)
                              }
                            />
                            {policy?.mode === "owner-prelaunch" ? (
                              <span>
                                {policy.registration_scope ===
                                "all-valid-emails"
                                  ? "Участвам в предварителното тестване."
                                  : "Участвам като разрешен тестер."}{" "}
                                Платформата още не приема реални клиентски
                                поръчки. Това потвърждение не е сключване на
                                договор за услуга.
                              </span>
                            ) : (
                              <span>
                                Прочетох и приемам{" "}
                                <Link href="/legal/terms">Общите условия</Link>{" "}
                                и{" "}
                                <Link href="/legal/privacy">
                                  Политиката за поверителност
                                </Link>
                                .
                              </span>
                            )}
                          </label>
                        )}
                      </>
                    ) : null}
                  </>
                )}
                <button
                  className={styles.submit}
                  type="submit"
                  disabled={
                    pending ||
                    (isRegister &&
                      (!registrationEnabled || (customerMode && !policy)))
                  }
                >
                  {pending
                    ? "Моля, изчакайте…"
                    : isLogin
                      ? "Вход"
                      : isRegister
                        ? "Създайте профил"
                        : isReset
                          ? "Запазете новата парола"
                          : "Изпратете връзка"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            )}
          <div className={styles.separator} />
          {isLogin ? (
            registrationEnabled ? (
              <p className={styles.cardFooter}>
                Нямате профил? <Link href="/register">Регистрация</Link>
              </p>
            ) : null
          ) : isRegister ? (
            <p className={styles.cardFooter}>
              Вече имате профил? <Link href="/login">Вход</Link>
            </p>
          ) : (
            <p className={styles.cardFooter}>
              <Link href="/login">Обратно към входа</Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
