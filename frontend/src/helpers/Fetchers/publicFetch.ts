// src/lib/publicFetch.ts
const backendLink = import.meta.env.VITE_BACKEND_URL;

export async function publicFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const method = options.method || 'GET';

    const res = await fetch(`${backendLink}${url}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        credentials: 'include',
        ...(method === 'GET' ? {} : { body: options.body }),
    });

  let data: any = null;

  // Try to parse JSON, but don't die if the body is empty/non-JSON
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        // Build a useful error object
        const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${res.status}`;

        const error = new Error(message) as Error & {
            status?: number;
            data?: unknown;
        };

        error.status = res.status;
        error.data = data;

        throw error;
    }

    return data as T;
}
