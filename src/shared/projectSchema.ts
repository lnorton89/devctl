/**
 * Stub — RED phase placeholder.
 * Will be implemented to pass all schema validation tests.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const projectInputSchema = {} as any;
export const projectSchema = {} as any;
export const registrySchema = {} as any;

export interface FormattedIssue {
  path: string;
  message: string;
}

export function formatZodIssues(_error: any): FormattedIssue[] {
  return [];
}
