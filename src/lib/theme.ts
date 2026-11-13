export const themeStorageKey = "saitena-theme";

// Only this attribute differs before hydration, to avoid a light flash on reload.
export const themeBootstrap = `(function(){try{document.documentElement.dataset.theme=localStorage.getItem('${themeStorageKey}')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();`;
