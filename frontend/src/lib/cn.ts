import { clsx, type ClassValue } from 'clsx'

/** Joins conditional class names. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
