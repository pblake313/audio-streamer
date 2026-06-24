const backendLink = import.meta.env.VITE_BACKEND_URL;

export type ApiErrorData = {
    code?: string;
    attemptsRemaining?: number;
    blocked?: boolean;
    blockedUntil?: string | Date;
    [key: string]: any;
};

export type PublicFetchError = {
    status: number;
    message: string;
    data: ApiErrorData | null;
};

export async function publicFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const method = options.method || "GET";

    const res = await fetch(`${backendLink}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        credentials: "include",
        ...(method === "GET" ? {} : { body: options.body }),
    });

    let body: any = null;

    try {
        body = await res.json();
    } catch {
        body = null;
    }

    if (!res.ok) {
        const message =
            body?.message ||
            body?.error ||
            `Request failed with status ${res.status}`;

        throw {
            status: body?.status || res.status,
            message,
            data: body?.data ?? body ?? null,
        } satisfies PublicFetchError;
    }

    return body as T;
}