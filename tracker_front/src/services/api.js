const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const getApiToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const clearApiToken = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
};

export const apiRequest = async (path, options = {}) => {
    const token = getApiToken();
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
    } catch {
        throw new Error(`Could not reach the API at ${API_BASE_URL}. Check that the backend is running and VITE_API_URL is configured.`);
    }

    const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.error || result.message || `Request failed (${response.status})`);
    }
    return result;
};

export const authenticate = async (mode, credentials) => {
    const result = await apiRequest(`/users/${mode}`, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    if (!result.token || !result.user) {
        throw new Error('The API response did not include a user session.');
    }
    return result;
};

export const getCurrentUser = async () => {
    const result = await apiRequest('/users/me');
    if (!result.user) throw new Error('The API response did not include the current user.');
    return result.user;
};
