const NOISE_PATTERNS = [
  /ZAKUP PRZY UŻYCIU KARTY/gi,
  /PŁATNOŚĆ KARTĄ/gi,
  /PRZELEW/gi,
  /BLIK/gi,
  /PAYU/gi,
  /\d{4}\s*\.\.\.\s*\d{4}/g,
  /\s{2,}/g,
];

const MERCHANT_ALIASES: Record<string, string> = {
  NETFLIX: "Netflix",
  SPOTIFY: "Spotify",
  GOOGLE: "Google One",
  OPENAI: "ChatGPT OpenAI",
  CHATGPT: "ChatGPT",
  DISNEY: "Disney+",
  HBO: "HBO Max",
  YOUTUBE: "YouTube Premium",
  PRIME: "Amazon Prime",
  APPLE: "Apple",
  MICROSOFT: "Microsoft 365",
  ADOBE: "Adobe",
};

function applyAlias(upper: string): string {
  for (const [keyword, label] of Object.entries(MERCHANT_ALIASES)) {
    if (upper.includes(keyword)) {
      return label;
    }
  }
  return upper;
}

function stripNoise(raw: string): string {
  let text = raw.trim();
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, " ");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeMerchant(counterparty: string): string {
  const stripped = stripNoise(counterparty);
  if (!stripped) {
    return counterparty.trim();
  }
  const upper = stripped.toUpperCase();
  const aliased = applyAlias(upper);
  if (aliased !== upper) {
    return aliased;
  }
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return counterparty.trim();
  }
  const first = words[0] ?? stripped;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}
