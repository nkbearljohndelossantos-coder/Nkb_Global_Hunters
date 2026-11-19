const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('nkb_hunter_token');
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('nkb_hunter_token', token);
  } else {
    localStorage.removeItem('nkb_hunter_token');
  }
}

export function getStoredUser() {
  const user = localStorage.getItem('nkb_hunter_user');
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('nkb_hunter_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('nkb_hunter_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized, clear token and notify auth listeners
    setStoredToken(null);
    setStoredUser(null);
    if (!window.location.pathname.includes('/login')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP error ${response.status}`);
  }

  return response;
}
