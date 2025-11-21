/**
 * Backward compatibility - exports axiosInstance as api
 * Use axiosInstance.js for new code
 */
import axiosInstance from "./axiosInstance";

// Export as 'api' for backward compatibility
export default axiosInstance;
