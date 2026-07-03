import { cookies } from "next/headers";
import en from "./en";
import es from "./es";

type Dict = typeof en;

export async function getServerDict(): Promise<Dict> {
  try {
    const store = await cookies();
    const lang = store.get("lang")?.value;
    if (lang === "es") return es;
  } catch {}
  return en;
}

export function st(key: keyof Dict, dict: Dict, params?: Record<string, string | number>): string {
  let val = dict[key] || en[key] || String(key);
  if (params) {
    const hasPlural = typeof params.n === "number" && params.n !== 1;
    const pluralKey = `${key}_plural` as keyof Dict;
    if (hasPlural && dict[pluralKey]) {
      val = dict[pluralKey] as string;
    } else if (hasPlural && en[pluralKey]) {
      val = en[pluralKey] as string;
    }
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, String(v));
    }
  }
  return val;
}
