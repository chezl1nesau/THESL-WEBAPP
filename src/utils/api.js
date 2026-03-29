let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

// ==========================================
// CONFIGURATION
// ==========================================
// Use the provided backend URL for production
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://thesl-backend.onrender.com';

// Improved retry logic to handle Render "Cold Starts" (takes up to 60s)
const fetchWithRetry = async (fullUrl, options, maxRetries = 5) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 20000 + (attempt * 10000));
            
            console.log(`[API] Attempt ${attempt + 1}: ${fullUrl}`);
            const response = await fetch(fullUrl, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            lastError = error;
            console.warn(`[API] Attempt ${attempt + 1} failed:`, error.message);
            if (attempt < maxRetries - 1) {
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

    try {
        const response = await fetchWithRetry(fullUrl, {
            ...options,
            headers,
            credentials: 'include'
        });
        return response;
    } catch (err) {
        console.error('[API] Fatal Connection Error:', err);
        throw err;
    }
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
