export const apiFetch = async (url, options = {}) => {
  // Dynamically rewrite localhost to the machine's actual IP/hostname
  let finalUrl = url;
  if (typeof finalUrl === 'string' && finalUrl.includes('localhost')) {
    finalUrl = finalUrl.replace('localhost', window.location.hostname);
  }

  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  // Only set application/json if the body is NOT FormData 
  // (Let the browser set the multipart/form-data with boundary)
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const response = await fetch(finalUrl, { ...options, headers });
  
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    // Optional: handle token expiration globally, e.g., redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return response;
};
