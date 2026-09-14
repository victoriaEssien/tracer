/**
 * Is this text something the English heuristics can actually read?
 *
 * Every clarity and scope pattern in this directory is an English regex. An
 * issue written in Spanish or Japanese matches none of them, which used to come
 * out as "badly written" rather than "not read" — and because clarity can cap a
 * verdict, Tracer quietly recommended against contributing to projects that do
 * not work in English.
 *
 * This is a guard, not a language detector. It answers one question — can the
 * heuristics be trusted here — and a wrong "no" costs a neutral score with low
 * confidence, which is the honest answer anyway.
 */

/**
 * Function words, which is what separates English prose from a list of
 * identifiers. Content words are no use: half the world's issue trackers are
 * full of English nouns like "server" and "config" whatever the prose is.
 */
const FUNCTION_WORDS = new Set([
  "the", "and", "is", "to", "of", "in", "it", "that", "for", "this", "with",
  "not", "on", "when", "should", "but", "are", "as", "be", "have", "has",
  "was", "would", "there", "then", "from", "if", "can", "does", "do", "we",
  "you", "i", "at", "by", "or", "an", "all", "so", "which", "what", "how",
]);

/** Below this many words there is not enough prose to judge either way. */
const MINIMUM_WORDS = 12;

/** Share of words that must be English function words. */
const FUNCTION_WORD_FLOOR = 0.08;

/** Share of letters outside the Latin script that means this is not English. */
const NON_LATIN_CEILING = 0.15;

/**
 * Code is not prose in any language, and it is full of English-looking
 * identifiers, so it is removed before anything is counted.
 */
function proseOnly(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^\s{4,}\S.*$/gm, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ");
}

export function looksEnglish(text: string): boolean {
  const prose = proseOnly(text);

  const latin = (prose.match(/[a-z]/gi) ?? []).length;
  // Scripts an English issue would not be written in. Combined, rather than
  // per-script, because the question is only "is this Latin prose".
  const nonLatin = (
    prose.match(
      /[Ѐ-ӿ֐-׿؀-ۿऀ-ॿ฀-๿぀-ヿ㐀-鿿가-힯]/g,
    ) ?? []
  ).length;

  if (latin + nonLatin === 0) return true;
  if (nonLatin / (latin + nonLatin) > NON_LATIN_CEILING) return false;

  const words = prose.toLowerCase().match(/[a-z']+/g) ?? [];
  // Not enough prose to say. Assume it reads, so a terse English issue is
  // judged the way it always was.
  if (words.length < MINIMUM_WORDS) return true;

  const functionWords = words.filter((word) => FUNCTION_WORDS.has(word)).length;
  return functionWords / words.length >= FUNCTION_WORD_FLOOR;
}
