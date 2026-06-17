export type ApiResult<T> = {
  data?: T;
  error?: string;
};

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
