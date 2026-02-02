// src/lib/fetchers/authorizedFetch.ts
import { get } from "svelte/store";
import { accessToken } from "../../stores/tokenStore";
import { logout } from "../Auth/authFunctions";
import { pushNotification } from "../../stores/NotificationStore";

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
        const isForceLogout =
            res.status === 440 || data?.forceLogout === true;

        const message =
            data?.message ||
            data?.error ||
            `Request failed with status ${res.status}`;

        // 🔥 SPECIAL HANDLING: ForceLogoutError from backend
        if (isForceLogout) {
            console.log("🔴 Force logout triggered from backend");

            // 1) Clear client-side auth state
            accessToken.set(null);
            logout(); // your store logout: clears user, tokens, etc.


            console.log('---- finna data ----', data)
            // 2) Optional: show a toast
            pushNotification(data.message || 'An unknown logout reason occurred.', 'Error', false, 5000, 'Logout Forced');

            // 3) Throw a specialized error the caller can detect
            const forceErr = new Error(message) as Error & {
                status?: number;
                data?: unknown;
                forceLogout?: boolean;
            };
            forceErr.status = res.status;
            forceErr.data = data;
            forceErr.forceLogout = true;

            throw forceErr;
        }

        // Normal error path
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
