import { cookies, headers } from "next/headers";
import en from "./en";
import es from "./es";

type Dict = typeof en;

function acceptLangPrefersEs(accept: string): boolean {
  return accept
    .split(",")
    .map((s) => s.trim().split(";")[0].slice(0, 2).toLowerCase())
    .some((l) => l === "es");
}

export async function getServerDict(): Promise<Dict> {
  try {
    const store = await cookies();
    const cookie = store.get("lang")?.value;
    if (cookie === "es") return es;
    if (cookie === "en") return en;
    const h = await headers();
    const accept = h.get("accept-language");
    if (accept && acceptLangPrefersEs(accept)) return es;
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
