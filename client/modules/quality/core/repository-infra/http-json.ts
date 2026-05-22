import { readFriendlyHttpError } from "@/lib/http-error-message";

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(await readFriendlyHttpError(res));
  }
  return (await res.json()) as T;
}
