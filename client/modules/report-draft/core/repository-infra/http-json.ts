import { friendlyHttpErrorMessage } from "@/lib/http-error-message";

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(friendlyHttpErrorMessage(text, res.status));
  }
  return res.json() as Promise<T>;
}
