// src/api/axiosClient.ts
import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:4000/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Token refresh management
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<{ accessToken: string }> => {
  try {
    console.log("🔄 Attempting token refresh...");
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
      withCredentials: true
    });
    
    if (!response.data.accessToken) {
      throw new Error("No access token received from refresh");
    }
    
    console.log("✅ Token refresh successful");
    return response.data;
  } catch (error) {
    console.error("❌ Token refresh failed:", error);
    // Clear tokens on refresh failure and return to login
    localStorage.removeItem("token");
    if (typeof window !== "undefined" && !window.location.pathname.match(/^\/($|signup)/)) {
      window.location.href = "/?session=expired";
    }
    throw error;
  }
};

// Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Skip auth for login and refresh endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip retry logic for auth endpoints
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken } = await refreshToken();
        localStorage.setItem("token", accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        return axiosClient(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Redirect to login with error message
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          if (!window.location.pathname.match(/^\/($|signup)/)) {
            window.location.href = "/?session=expired";
          }
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;