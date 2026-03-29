let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

// Production Backend URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://thesl-backend.onrender.com';

// Improved retry logic to handle Render "Cold Starts" (takes up to 60s)
const fetchWithRetry = async (fullUrl, options, maxRetries = 5) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Increase timeout as retries progress
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000 + (attempt * 10000));
            
            const response = await fetch(fullUrl, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            lastError = error;
            console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
            if (attempt < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s, 8s
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};

export const apiFetch = async (url, options = {}, token = null) => {
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
        });
    } catch (err) {
        console.error('API Connection Error:', err);
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
            });
            const data = await refreshResponse.json();

            if (data.success) {
                localStorage.setItem('thesl_hr_token', data.token);
                isRefreshing = false;
                onRefreshed(data.token);
                return apiFetch(url, { ...options, _retry: true }, data.token);
            } else {
                localStorage.removeItem('thesl_hr_token');
                localStorage.removeItem('thesl_hr_user');
                window.location.reload();
            }
        } catch (err) {
            isRefreshing = false;
            localStorage.removeItem('thesl_hr_token');
            localStorage.removeItem('thesl_hr_user');
            window.location.reload();
        }
    }

    if (response.status === 403) {
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
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        return fetchWithRetry(fullUrl, {
            method: 'POST',
            body: formData,
            headers,
            credentials: 'include'
        });
    }
};
