import api from "./api";

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post("/api/v1/user/login", {
        email,
        password,
      });

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens
        this.setTokens(accessToken, refreshToken);

        // Store user data
        this.setUser(user);

        return { success: true, user, message: response.data.message };
      }

      return { success: false, message: "Login failed" };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Register student
  async registerStudent(userData) {
    try {
      const response = await api.post(
        "/api/v1/user/register/student",
        userData
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens and user
        this.setTokens(accessToken, refreshToken);
        this.setUser(user);

        return { success: true, user, message: response.data.message };
      }

      return { success: false, message: "Registration failed" };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Register startup
  async registerStartup(formData) {
    try {
      const response = await api.post(
        "/api/v1/user/register/startup",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;

        // Store tokens and user
        this.setTokens(accessToken, refreshToken);
        this.setUser(user);

        return { success: true, user, message: response.data.message };
      }

      return { success: false, message: "Registration failed" };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post("/api/v1/user/logout");

      // Clear local storage
      this.clearAuth();

      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      // Clear auth even if API call fails
      this.clearAuth();
      return { success: true, message: "Logged out" };
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const user = this.getUser();
      if (!user || !user.role) {
        throw new Error("User role not found");
      }

      // Determine endpoint based on role
      const endpoint =
        user.role === "student"
          ? "/api/v2/student/profile"
          : "/api/v3/startup/profile";

      const response = await api.get(endpoint);

      if (response.data.success && response.data.data) {
        // Update stored user data
        this.setUser(response.data.data);
        return { success: true, user: response.data.data };
      }

      return { success: false, message: "Failed to fetch profile" };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await api.post("/api/v1/user/refresh-token", {
        refreshToken,
      });

      if (response.data.success && response.data.data) {
        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        } = response.data.data;

        // Update tokens
        this.setTokens(accessToken, newRefreshToken);

        // Update user data if provided
        if (user) {
          this.setUser(user);
        }

        return {
          success: true,
          accessToken,
          message: "Token refreshed successfully",
        };
      }

      return { success: false, message: "Token refresh failed" };
    } catch (error) {
      // Clear auth on refresh failure
      this.clearAuth();
      return {
        success: false,
        message: error.message || "Token refresh failed",
      };
    }
  } // Token management
  setTokens(accessToken, refreshToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  getAccessToken() {
    return localStorage.getItem("accessToken");
  }

  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  }

  // User management
  setUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  getUser() {
    const userStr = sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Get user role
  getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  // Error handler
  handleError(error) {
    let message = "An error occurred. Please try again.";

    if (error.response) {
      // Server responded with error
      message =
        error.response.data?.message || error.response.data?.error || message;
    } else if (error.request) {
      // Request made but no response
      message =
        "Unable to connect to server. Please check your internet connection.";
    } else {
      // Something else happened
      message = error.message || message;
    }

    return { success: false, message };
  }
}

export default new AuthService();
