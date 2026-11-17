import localFont from "next/font/local";

// Same Manrope v20 outlines as the previous static weights. Separate subsets
// retain glyph coverage; only the above-fold Cyrillic subset is preloaded.
const cyrillic = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-cyrillic",
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    },
  ],
  adjustFontFallback: false,
  fallback: [],
});
const latin = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-latin",
  preload: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
  adjustFontFallback: false,
  fallback: [],
});
const cyrillicExtended = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-ext-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-cyrillic-ext",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
    },
  ],
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});
const latinExtended = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-latin-ext",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    },
  ],
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});
const greek = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-greek-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-greek",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
    },
  ],
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});
const vietnamese = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-vietnamese-wght-normal.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope-vietnamese",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
    },
  ],
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});

export const fontVariables = [
  cyrillic.variable,
  latin.variable,
  cyrillicExtended.variable,
  latinExtended.variable,
  greek.variable,
  vietnamese.variable,
].join(" ");
