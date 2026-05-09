import axios from 'axios';

/** Builds user-visible text from axios/API errors (includes server `detail` when present). */
export function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | {message?: string; detail?: string; reason?: string}
      | undefined;
    if (data && typeof data === 'object') {
      const parts = [data.message, data.detail].filter(Boolean);
      if (parts.length) {
        return parts.join('\n');
      }
    }
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
}
