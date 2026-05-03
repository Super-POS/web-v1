/**
 * Stock / recipe units shown in ingredient create & edit dialogs.
 * Sorted for quick scanning; merge unknown saved values via `ingredientUnitSelectOptions`.
 */
export const INGREDIENT_UNIT_OPTIONS: readonly string[] = [
    'bag',
    'bottle',
    'box',
    'bunch',
    'bundle',
    'can',
    'clove',
    'cup',
    'dozen',
    'each',
    'fl oz',
    'g',
    'gal',
    'head',
    'jar',
    'kg',
    'L',
    'lb',
    'mg',
    'ml',
    'oz',
    'pack',
    'pair',
    'pcs',
    'piece',
    'portion',
    'pt',
    'qt',
    'roll',
    'serving',
    'sheet',
    'slice',
    'stick',
    'tbsp',
    'tray',
    'tsp',
] as const;

export function ingredientUnitSelectOptions(existing?: string | null): string[] {
    const merged = new Set<string>([...INGREDIENT_UNIT_OPTIONS]);
    const trimmed = existing?.trim();
    if (trimmed) {
        merged.add(trimmed);
    }
    return Array.from(merged).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
