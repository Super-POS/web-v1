/** Build a URL-safe menu code from a display name (e.g. "Iced Latte" → "ICED-LATTE"). */
export function nameToMenuCode(name: string, maxLength = 100): string {
    return String(name ?? '')
        .trim()
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toUpperCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, maxLength);
}
