/**
 * Builds a browser-usable file URL. The API may store a path (e.g. `static/pos/...`)
 * or a full `https://...` URI from the upload service — only merge with `fileBase` for relative paths.
 */
export function resolveFileUrl(
    fileBase: string | null | undefined,
    path: string | null | undefined,
): string {
    if (path == null) {
        return '';
    }
    const p = String(path).trim();
    if (!p) {
        return '';
    }
    if (/^https?:\/\//i.test(p)) {
        return p;
    }
    const base = (fileBase != null && fileBase !== 'undefined' && String(fileBase) !== 'undefined'
        ? String(fileBase)
        : ''
    ).replace(/\/$/, '');
    if (!base) {
        return p;
    }
    return `${base}/${p.replace(/^\//, '')}`;
}
