const CODE_FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`([^`]+)`/g;
const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
const AUTOLINK_RE = /<https?:\/\/[^>\s]+>/gi;
const BARE_URL_RE = /https?:\/\/[^\s)]+/gi;
const MARKDOWN_SYMBOL_RE = /[#>*_~\-|]/g;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeSummaryText(input: string, maxLength = 180) {
  const plain = input
    .replace(CODE_FENCE_RE, " ")
    // Keep summaries clean: remove markdown images entirely (alt/file-name noise is not useful in card copy).
    .replace(IMAGE_RE, " ")
    .replace(LINK_RE, (_match, text: string) => ` ${text} `)
    .replace(AUTOLINK_RE, " ")
    .replace(BARE_URL_RE, " ")
    .replace(INLINE_CODE_RE, " $1 ")
    .replace(MARKDOWN_SYMBOL_RE, " ");

  return collapseWhitespace(plain).slice(0, maxLength);
}

export function generateSummaryFromMarkdown(markdown: string, maxLength = 180) {
  return sanitizeSummaryText(markdown, maxLength);
}
