// API configuration - change this to your XAMPP server URL
const API_BASE = 'http://localhost/studyquest/backend';

// Get stored token
const getToken = (): string | null => {
  return localStorage.getItem('studyquest-token');
};

// Set token
export const setToken = (token: string) => {
  localStorage.setItem('studyquest-token', token);
};

// Clear token
export const clearToken = () => {
  localStorage.removeItem('studyquest-token');
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    // If backend is not available, return null to fall back to localStorage
    console.warn('API request failed, using localStorage fallback:', error);
    return null;
  }
};

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string, displayName: string) => {
    return apiRequest('/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName }),
    });
  },

  login: async (username: string, password: string) => {
    return apiRequest('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  checkSession: async () => {
    return apiRequest('/auth.php?action=check');
  },
};

// Data API
export const dataAPI = {
  getStudyData: async () => {
    return apiRequest('/data.php?action=get');
  },

  saveStudyData: async (data: any) => {
    return apiRequest('/data.php?action=save', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  getQuizzes: async () => {
    return apiRequest('/data.php?action=getQuizzes');
  },

  saveQuizzes: async (data: any) => {
    return apiRequest('/data.php?action=saveQuizzes', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  updateProfile: async (displayName: string, avatar: string) => {
    return apiRequest('/data.php?action=updateProfile', {
      method: 'POST',
      body: JSON.stringify({ displayName, avatar }),
    });
  },
};
