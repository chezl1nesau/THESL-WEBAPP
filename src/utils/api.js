let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

export const apiFetch = async (url, options = {}, token = null) => {
    // Favor the token from localStorage if available, as it might be fresher
    const currentToken = localStorage.getItem('thesl_hr_token') || token;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401 && !options._retry) {
        if (isRefreshing) {
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken) => {
                    resolve(apiFetch(url, { ...options, _retry: true }, newToken));
                });
            });
        }

        isRefreshing = true;
        try {
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });
            const data = await refreshResponse.json();

            if (data.success) {
                localStorage.setItem('thesl_hr_token', data.token); // Sync for other requests
                isRefreshing = false;
                onRefreshed(data.token);
                return apiFetch(url, { ...options, _retry: true }, data.token);
            }
        } catch {
            isRefreshing = false;
        }
    }

    return response;
};

export const api = {
    get: (url, token) => apiFetch(url, { method: 'GET' }, token),
    post: (url, body, token) => apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(body)
    }, token),
    put: (url, body, token) => apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(body)
    }, token),
    delete: (url, token) => apiFetch(url, { method: 'DELETE' }, token),
    upload: (url, formData, token) => {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, {
            method: 'POST',
            body: formData,
            headers,
            credentials: 'include'
        });
    }
};
