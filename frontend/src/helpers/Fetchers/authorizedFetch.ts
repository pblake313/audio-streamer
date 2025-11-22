// src/lib/fetchers/authorizedFetch.ts
import { get } from "svelte/store";
import { accessToken } from "../../stores/tokenStore";

const backendLink = import.meta.env.VITE_BACKEND_URL;

export async function authorizedFetch<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const method = options.method || "GET";
    const token = get(accessToken);

    const headers = new Headers();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const isFormData = options.body instanceof FormData;

    // Only set JSON content-type when it's NOT FormData and NOT already provided
    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    // Merge any headers passed in options (can override above)
    if (options.headers) {
        const extraHeaders = new Headers(options.headers as HeadersInit);
        extraHeaders.forEach((value, key) => {
            headers.set(key, value);
        });
    }

    const res = await fetch(`${backendLink}${url}`, {
        method,
        headers,
        credentials: "include",
        // For GET, ignore body
        ...(method === "GET" ? {} : { body: options.body }),
    });

    const refreshedToken = res.headers.get("x-access-token");
    if (refreshedToken && refreshedToken !== token) {
        accessToken.set(refreshedToken);
        // console.log("🔁 Access token refreshed on client");
    }

    let data: any = null;

    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
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
