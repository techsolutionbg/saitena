export const textSizeSettings = {
  key: "saitena-text-size",
  default: 100,
  min: 80,
  max: 150,
  step: 10,
} as const;

export function normalizeTextSize(value: unknown): number {
  const size = typeof value === "string" ? Number(value) : value;
  return typeof size === "number" &&
    Number.isInteger(size) &&
    size >= textSizeSettings.min &&
    size <= textSizeSettings.max &&
    size % textSizeSettings.step === 0
    ? size
    : textSizeSettings.default;
}

// Apply the saved size before the first paint; storage may be unavailable.
export const textSizeBootstrap = `(function(){var c=${JSON.stringify(textSizeSettings)},s=c.default;try{var v=Number(localStorage.getItem(c.key));if(Number.isInteger(v)&&v>=c.min&&v<=c.max&&v%c.step===0)s=v}catch(e){}document.documentElement.style.setProperty('--text-scale',String(s/100));document.documentElement.dataset.textSize=String(s)})();`;
