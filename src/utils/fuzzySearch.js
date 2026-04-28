/**
 * fuzzySearch.js
 * Lightweight fuzzy-match helper used across all listing pages.
 *
 * Usage:
 *   import { fuzzyMatch, fuzzyFilter } from '../utils/fuzzySearch';
 *
 *   // single value check
 *   fuzzyMatch('alm', 'Almari') // true
 *
 *   // filter an array by multiple fields
 *   fuzzyFilter(products, query, ['name', 'category', 'color'])
 */

/**
 * Returns true when every character of `query` appears in `str`
 * in the same order (case-insensitive).
 * Also returns true on a plain `.includes()` hit for faster common cases.
 */
export function fuzzyMatch(query, str) {
    if (!query) return true;
    if (!str) return false;

    const q = query.toLowerCase().trim();
    const s = str.toLowerCase();

    // Fast path: exact substring match
    if (s.includes(q)) return true;

    // Fuzzy path: all chars of q appear in order inside s
    let qi = 0;
    for (let i = 0; i < s.length && qi < q.length; i++) {
        if (s[i] === q[qi]) qi++;
    }
    return qi === q.length;
}

/**
 * Filters an array of objects.
 * `fields` is an array of dot-notation keys to check (e.g. ['name', 'company_name']).
 * Returns the items where AT LEAST ONE field matches the query.
 */
export function fuzzyFilter(items, query, fields) {
    if (!query || !query.trim()) return items;
    return items.filter(item =>
        fields.some(field => {
            const val = field.split('.').reduce((obj, key) => obj?.[key], item);
            return fuzzyMatch(query, val != null ? String(val) : '');
        })
    );
}

/**
 * Simple score: higher = better match.
 * Useful for sorting results by relevance.
 */
export function fuzzyScore(query, str) {
    if (!query || !str) return 0;
    const q = query.toLowerCase().trim();
    const s = str.toLowerCase();
    if (s.startsWith(q)) return 3;
    if (s.includes(q)) return 2;
    // fuzzy bonus
    let qi = 0, consecutive = 0, score = 0;
    for (let i = 0; i < s.length && qi < q.length; i++) {
        if (s[i] === q[qi]) {
            qi++;
            consecutive++;
            score += consecutive;
        } else {
            consecutive = 0;
        }
    }
    return qi === q.length ? score : 0;
}
