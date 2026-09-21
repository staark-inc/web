/*
 * Budget fields are free text ("15000", "15 000 SEK", "after offer"),
 * so only values that are purely numeric get formatted; anything else
 * is shown exactly as it was typed.
 */
export function formatAmount(value: string | null | undefined) {
  if (!value) return null;

  const trimmed = value.trim();

  /* Strip spaces and a trailing currency word before parsing. */
  const withoutCurrency = trimmed
    .replace(/\s*(sek|kr)\s*$/i, "")
    .trim();

  const normalized = withoutCurrency.replace(/[\s.,]/g, (match, offset) => {
    /* A comma or dot near the end is a decimal separator, not a grouping one. */
    const rest = withoutCurrency.length - offset - 1;
    return match !== " " && rest <= 2 ? "." : "";
  });

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return trimmed;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return trimmed;
  }

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
