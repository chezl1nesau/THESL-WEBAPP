let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

// Retry logic helper with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                // Exponential backoff: 100ms, 200ms, 400ms
                const delay = Math.pow(2, attempt) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
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

    let response;
    try {
        response = await fetchWithRetry(url, {
            ...options,
            headers,
            credentials: 'include'
        }, 3);
    } catch (err) {
        // If all retries fail, throw the error to be handled by caller
        throw err;
    }

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
            const refreshResponse = await fetchWithRetry('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            }, 3);
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
        return fetchWithRetry(url, {
            method: 'POST',
            body: formData,
            headers,
            credentials: 'include'
        }, 3);
    }
};
