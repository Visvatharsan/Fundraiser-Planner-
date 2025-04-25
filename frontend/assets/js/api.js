/**
 * API utility functions for making requests to the backend
 */

const API = {
  // Base URL for API requests
  baseUrl: '/api',
  
  // Get token from local storage
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Set token in local storage
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Remove token from local storage
  removeToken: () => {
    localStorage.removeItem('token');
  },
  
  // Get authentication headers
  getHeaders: () => {
    const token = API.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },
  
  // Make a GET request
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: API.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration explicitly
        if (response.status === 401 && data.error === 'Token expired') {
          throw new Error('Token expired');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('GET request error:', error);
      throw error;
    }
  },
  
  // Make a POST request
  post: async (endpoint, body) => {
    try {
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: API.getHeaders(),
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration explicitly
        if (response.status === 401 && data.error === 'Token expired') {
          throw new Error('Token expired');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('POST request error:', error);
      throw error;
    }
  },
  
  // Make a PUT request
  put: async (endpoint, body) => {
    try {
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: API.getHeaders(),
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration explicitly
        if (response.status === 401 && data.error === 'Token expired') {
          throw new Error('Token expired');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('PUT request error:', error);
      throw error;
    }
  },
  
  // Make a DELETE request
  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: API.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration explicitly
        if (response.status === 401 && data.error === 'Token expired') {
          throw new Error('Token expired');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('DELETE request error:', error);
      throw error;
    }
  },
  
  // Upload a file with form data
  upload: async (endpoint, formData) => {
    try {
      const token = API.getToken();
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
        // Note: Don't set Content-Type for multipart/form-data
      };
      
      const response = await fetch(`${API.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token expiration explicitly
        if (response.status === 401 && data.error === 'Token expired') {
          throw new Error('Token expired');
        }
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
  
  // Check for token expiration and handle appropriately
  handleTokenError: (error) => {
    if (error.message === 'Token expired') {
      API.removeToken();
      showFlash('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
      return true;
    }
    return false;
  },

  // Authentication endpoints
  auth: {
    register: async (userData) => {
      const data = await API.post('/auth/register', userData);
      API.setToken(data.token);
      return data;
    },
    
    login: async (credentials) => {
      const data = await API.post('/auth/login', credentials);
      API.setToken(data.token);
      return data;
    },
    
    getUser: async () => {
      return await API.get('/auth/user');
    },
    
    logout: () => {
      API.removeToken();
    }
  },
  
  // Campaign endpoints
  campaigns: {
    getAll: async () => {
      return await API.get('/campaigns');
    },
    
    getById: async (id) => {
      return await API.get(`/campaigns/${id}`);
    },
    
    create: async (formData) => {
      return await API.upload('/campaigns', formData);
    },
    
    update: async (id, formData) => {
      const token = API.getToken();
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      const response = await fetch(`${API.baseUrl}/campaigns/${id}`, {
        method: 'PUT',
        headers: headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      return data;
    },
    
    delete: async (id) => {
      return await API.delete(`/campaigns/${id}`);
    },
    
    getDonations: async (id) => {
      return await API.get(`/campaigns/${id}/donations`);
    }
  },
  
  // Donation endpoints
  donations: {
    create: async (donationData) => {
      return await API.post('/donations', donationData);
    },
    
    getCampaignSummary: async (campaignId) => {
      return await API.get(`/donations/campaigns/${campaignId}/summary`);
    },
    
    getRecentDonations: async (campaignId) => {
      return await API.get(`/donations/campaigns/${campaignId}/recent`);
    },
    
    getTotalRaised: async () => {
      return await API.get('/donations/total');
    },
    
    getStatistics: async () => {
      return await API.get('/donations/statistics');
    }
  },
  
  // User endpoints
  users: {
    getCampaigns: async () => {
      return await API.get('/users/campaigns');
    }
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!API.getToken();
};

// Flash message utility
const showFlash = (message, type = 'success') => {
  const flashContainer = document.querySelector('#flash-container');
  if (!flashContainer) return;
  
  const flashDiv = document.createElement('div');
  flashDiv.className = `flash flash-${type}`;
  flashDiv.textContent = message;
  
  flashContainer.appendChild(flashDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    flashDiv.style.opacity = '0';
    setTimeout(() => {
      flashContainer.removeChild(flashDiv);
    }, 500);
  }, 5000);
};

// Formatter for currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  let date;
  
  // Try to parse the date
  try {
    // Handle SQLite timestamp format (YYYY-MM-DD HH:MM:SS)
    // Handle ISO format (JavaScript's native format)
    // Handle various other formats
    date = new Date(dateString);
    
    // Check if date is valid after parsing
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return 'Recently';
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

// Calculate percentage for progress bars
const calculateProgress = (raised, goal) => {
  const percentage = (raised / goal) * 100;
  return Math.min(percentage, 100).toFixed(1);
}; 