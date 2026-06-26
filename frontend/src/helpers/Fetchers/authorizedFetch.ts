// src/lib/fetchers/authorizedFetch.ts
import { get } from "svelte/store";
import { accessToken } from "../../stores/tokenStore";
import { logout } from "../Auth/authFunctions";
import { pushNotification } from "../../stores/NotificationStore";

const backendLink = import.meta.env.VITE_BACKEND_URL;

export type ApiErrorData = {
    code?: string;
    attemptsRemaining?: number;
    blocked?: boolean;
    blockedUntil?: string | Date;
    forceLogout?: boolean;
    [key: string]: any;
};

export type AuthorizedFetchError = {
    status: number;
    message: string;
    data: ApiErrorData | null;
    forceLogout?: boolean;
};

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

    if (!isFormData) {
        headers.set("Content-Type", "application/json");
    }

    if (options.headers) {
        const extraHeaders = new Headers(options.headers as HeadersInit);

        extraHeaders.forEach((value, key) => {
            headers.set(key, value);
        });
    }

    const res = await fetch(`${backendLink}${url}`, {
        ...options,
        method,
        headers,
        credentials: "include",
        ...(method === "GET" ? { body: undefined } : { body: options.body }),
    });

    const refreshedToken = res.headers.get("x-access-token");

    if (refreshedToken && refreshedToken !== token) {
        accessToken.set(refreshedToken);
    }

    let body: any = null;

    try {
        body = await res.json();
    } catch {
        body = null;
    }

    if (!res.ok) {
        const isForceLogout =
            res.status === 440 || body?.forceLogout === true;

        const message =
            body?.message ||
            body?.error ||
            `Request failed with status ${res.status}`;

        const error = {
            status: body?.status || res.status,
            message,
            data: body?.data ?? body ?? null,
            forceLogout: isForceLogout,
        } satisfies AuthorizedFetchError;

        if (isForceLogout) {
            accessToken.set(null);
            logout();

            pushNotification(
                message || "An unknown logout reason occurred.",
                "Error",
                false,
                5000,
                "Logout Forced"
            );

            throw error;
        }

        throw error;
    }

    return body as T;
}