/** Доллар + валюты стран Центральной Азии */
export const CURRENCIES = [
  { value: "USD", label: "USD (Доллар США)" },
  { value: "UZS", label: "UZS (Узбекские сумы)" },
  { value: "KZT", label: "KZT (Казахстанские тенге)" },
  { value: "KGS", label: "KGS (Киргизские сомы)" },
  { value: "TJS", label: "TJS (Таджикские сомони)" },
  { value: "TMT", label: "TMT (Туркменские манаты)" },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]["value"]
