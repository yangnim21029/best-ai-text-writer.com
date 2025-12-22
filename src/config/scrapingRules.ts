/**
 * Common junk phrases and patterns to remove from scraped content
 */
export const SCRAPING_JUNK_PHRASES = [
  /^Ad Placement\s*:.*$/gim, // Remove "Ad Placement : xxxx" lines
  /^(Login|登入|Sign In).*$/gim, // Remove lines starting with Login/登入
  /^ADVERTISEMENT$/gim, // Remove strict "ADVERTISEMENT" lines
  /^CONTINUE READING BELOW$/gim, // Remove "CONTINUE READING BELOW"
  /^Share on:.*$/gim, // Remove "Share on: ..." lines
  /^recommended$/gim, // Remove standalone "recommended" lines
  /^Related Articles:?$/gim, // Common noise
  /^Read More:?$/gim, // Common noise
  /^SCROLL TO CONTINUE\s*:.*$/gim,
  /^[ \t]*\S{1,2}[ \t]*$/gm, // Remove lines with < 3 chars (e.g. "US", "Go", "|", "。" )
];

/**
 * Common noise words (Case insensitive)
 */
export const SCRAPING_NOISE_WORDS = [
  /^(holiday|girlstyle|businessfocus|mamidaily)\s*$/gim,
];

/**
 * Brand-specific UI junk
 */
export const BRAND_UI_JUNK = [
  /^\s*\u25b2?\s*Cosmopolitan\.com\.hk\s*$/gim, // Cosmopolitan.com.hk with optional ▲
];
