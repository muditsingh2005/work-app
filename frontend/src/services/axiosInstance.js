/**
 * Production-grade Axios Instance Configuration
 *
 * Features:
 * - Centralized API configuration
 * - Request interceptor for token attachment
 * - Response interceptor for error handling
 * - Automatic 401/403 handling
 * - Network error handling
 */

import axios from "axios";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5252",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/CORS
  timeout: 30000, // 30 second timeout
});

// Request interceptor - attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method.toUpperCase()} ${
          response.config.url
        }`,
        response.data
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error("[API Error]", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login/register/refresh endpoints
      if (
        originalRequest.url.includes("/login") ||
        originalRequest.url.includes("/register") ||
        originalRequest.url.includes("/refresh-token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        isRefreshing = false;
        // Clear authentication data
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("user");

        // Redirect to login (skip if already on auth pages)
        const publicPaths = ["/login", "/register", "/role-selection", "/"];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axiosInstance.post(
          "/api/v1/user/refresh-token",
          {
            refreshToken,
          }
        );

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;

          // Update tokens
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Update authorization header
          axiosInstance.defaults.headers.common["Authorization"] =
            "Bearer " + accessToken;
          originalRequest.headers["Authorization"] = "Bearer " + accessToken;

          // Process queued requests
          processQueue(null, accessToken);
          isRefreshing = false;

          // Retry original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user");

        const publicPaths = ["/login", "/register", "/role-selection", "/"];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.warn("[API] Access forbidden - insufficient permissions");

      // Redirect to appropriate dashboard based on role
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const redirectPath =
            user.role === "student"
              ? "/student/dashboard"
              : "/startup/dashboard";
          window.location.href = redirectPath;
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error(`[API] Endpoint not found: ${error.config?.url}`);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error("[API] Server error occurred");
    }

    // Handle network errors (no response from server)
    if (!error.response) {
      console.error("[API] Network error - server may be unreachable");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
