let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

// Get API base URL from environment or use relative paths
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Retry logic helper with exponential backoff
const fetchWithRetry = async (fullUrl, options, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fetch(fullUrl, options);
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

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    let response;
    try {
        response = await fetchWithRetry(fullUrl, {
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
            const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
            const refreshResponse = await fetchWithRetry(refreshUrl, {
                method: 'POST',
                credentials: 'include'
            }, 3);
            const data = await refreshResponse.json();

            if (data.success) {
                localStorage.setItem('thesl_hr_token', data.token); // Sync for other requests
                isRefreshing = false;
                onRefreshed(data.token);
                return apiFetch(url, { ...options, _retry: true }, data.token);
            } else {
                // If refresh specifically fails, clear EVERYTHING and force relogin
                localStorage.removeItem('thesl_hr_token');
                localStorage.removeItem('thesl_hr_user');
                window.location.reload();
            }
        } catch (err) {
            isRefreshing = false;
            // Network error during refresh or other failure
            localStorage.removeItem('thesl_hr_token');
            localStorage.removeItem('thesl_hr_user');
            window.location.reload();
        }
    }

    // Handle 403 specifically if it's not a refresh issue (e.g. invalid permissions or genuinely invalid token)
    if (response.status === 403) {
        console.error('Session invalid - 403 Forbidden');
        localStorage.removeItem('thesl_hr_token');
        localStorage.removeItem('thesl_hr_user');
        window.location.reload();
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
