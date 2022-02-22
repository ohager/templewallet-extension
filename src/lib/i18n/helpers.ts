export const TEMPLATE_RGX = /\$(.*?)\$/g;

export function processTemplate(str: string, mix: any) {
  return str.replace(TEMPLATE_RGX, (x: any, key, y) => {
    x = 0;
    y = mix;
    key = key.trim().split('.');
    while (y && x < key.length) {
      y = y[key[x++]];
    }
    return y != null ? y : '';
  });
}

export function toList<T, U>(term: T | U[]): (T | U)[] {
  return Array.isArray(term) ? term : [term];
}
