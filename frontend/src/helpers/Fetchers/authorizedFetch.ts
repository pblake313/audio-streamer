// src/lib/fetchers/authorizedFetch.ts
import { get } from "svelte/store";
import { accessToken } from "../../stores/tokenStore";
import { logout } from "../Auth/authFunctions";
import { pushNotification } from "../../stores/NotificationStore";
import { user } from "../../stores/UserStore";

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


        const rawMessage =
            body?.message ||
            body?.error ||
            `Request failed with status ${res.status}`;


        // if we have a specific message we want to change... this is for the refresh token, when the refresh token expires after 48 hours.
        const message =
            rawMessage === "jwt expired"
                ? "Session expired."
                : rawMessage;
                


        const error = {
            status: body?.status || res.status,
            message,
            data: body?.data ?? body ?? null,
        } satisfies AuthorizedFetchError;


        const haveUser = get(user)

        if (error.data.forceLogout) {

            accessToken.set(null);

            if (haveUser){
                logout();
                pushNotification( message || "An unknown logout reason occurred.", "Error", false, 5000, "Logout Forced");
            } else {
                // console.log('dont have a user, no logout notification to push.')
            }

            throw error;
        }

        throw error;
    }

    return body as T;
}