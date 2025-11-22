// src/lib/protectedFetch.ts
import { get } from 'svelte/store';
import { pushNotification } from '../../stores/NotificationStore';

export async function protectedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
	const token =  '';

	let headers: Record<string, string> = {
		Authorization: `Bearer ${token}`,
	};

	// Normalize headers from options if present
	if (options.headers) {
		if (options.headers instanceof Headers) {
			options.headers.forEach((value, key) => {
				headers[key] = value;
			});
		} else if (Array.isArray(options.headers)) {
			for (const [key, value] of options.headers) {
				headers[key] = value;
			}
		} else {
			headers = {
				...options.headers,
				Authorization: `Bearer ${token}`,
			};
		}
	}

	// Automatically set content-type to JSON unless sending FormData
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	const res = await fetch(url, {
		credentials: 'include',
		...options,
		headers,
	});

	const newAccessToken = res.headers.get('x-access-token');
	if (newAccessToken) {
	}

	if (!res.ok) {
		const result = await res.json();

		if (res.status === 401 || res.status === 403) {
			if (result.resourceError) {
				pushNotification(`${result.resourceError} - Endpoint: ${url}`, 'Error', false, 7000, 'Resource Middleware Error');
			}
		}
	}

	return res.json();
}