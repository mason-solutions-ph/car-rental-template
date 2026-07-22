import { DEFAULT_CURRENCY } from "@/lib/constants";

const numberFormatters = new Map<string, Intl.NumberFormat>();

function getMoneyFormatter(currency: string): Intl.NumberFormat {
  let fmt = numberFormatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency,
    });
    numberFormatters.set(currency, fmt);
  }
  return fmt;
}

/**
 * Format centavos (PayMongo / DB unit) as Philippine pesos.
 * @example formatMoney(250000) → "₱2,500.00"
 */
export function formatMoney(
  centavos: number,
  currency: string = DEFAULT_CURRENCY
): string {
  return getMoneyFormatter(currency).format(centavos / 100);
}

/** Convert peso major units to centavos (integer). */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/** Convert centavos to peso major units. */
export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}
