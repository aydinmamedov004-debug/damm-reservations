// Generates reservation confirmation codes that are actually easy to say over
// the phone or remember — "AMBER-TERRACE-07" instead of a hash like
// "res_mt1z4gq2tqvfdi". Themed to the rooftop wine space itself.

const ADJECTIVES = [
  "GOLDEN", "VELVET", "AMBER", "MIDNIGHT", "ROSY", "SMOKY", "DUSKY", "CRIMSON",
  "HAZY", "SILKY", "COPPER", "MOONLIT", "STARRY", "RUSTIC", "SUNLIT", "MELLOW",
];

const NOUNS = [
  "TERRACE", "VINEYARD", "CELLAR", "SUNSET", "BALCONY", "ORCHARD", "HARBOR",
  "SKYLINE", "BREEZE", "LANTERN", "MERLOT", "RIESLING", "COURTYARD", "HORIZON",
  "GARDEN", "CHATEAU",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTwoDigits(): string {
  return String(Math.floor(Math.random() * 100)).padStart(2, "0");
}

/**
 * Generates a memorable, human-readable confirmation code, e.g. "GOLDEN-TERRACE-07".
 * Retries against `existingCodes` to avoid collisions; falls back to a wider
 * number range if the (large but finite) word-pair space is somehow exhausted.
 */
export function generateConfirmationCode(existingCodes: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${randomTwoDigits()}`;
    if (!existingCodes.has(code)) return code;
  }
  // Extremely unlikely fallback: widen the number space to guarantee uniqueness.
  let code: string;
  do {
    code = `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(Math.random() * 10000)}`;
  } while (existingCodes.has(code));
  return code;
}
