/**
 * Combines multiple class names into a single string, filtering out falsy values.
 * This utility is commonly used for conditional class application in components.
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
} 