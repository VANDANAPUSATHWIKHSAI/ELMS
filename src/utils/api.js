export const apiFetch = async (url, options = {}) => {
  // Dynamically rewrite localhost to the machine's actual IP/hostname
  let finalUrl = url;
  if (typeof finalUrl === 'string' && finalUrl.includes('localhost')) {
    finalUrl = finalUrl.replace('localhost', window.location.hostname);
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(finalUrl, { ...options, headers });
  
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    // Optional: handle token expiration globally, e.g., redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return response;
};
