// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:8080' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'));

export default API_BASE_URL;
