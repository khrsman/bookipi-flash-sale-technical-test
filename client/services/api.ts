import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/flash-sale';
const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/flash-sale', '/admin')
  : 'http://localhost:5000/api/admin';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for admin endpoints
const adminAxiosInstance = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log non-404 errors (404 means no flash sale exists, which is expected)
    if (error.response?.status !== 404) {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for admin instance
adminAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Admin API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface FlashSaleStatus {
  id?: string;
  _id?: string;
  productName: string;
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  stockRemaining: number;
  totalStock: number;
  startTime: string;
  endTime: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  purchaseId?: string;
}

export interface CheckPurchaseResponse {
  hasPurchased: boolean;
  purchaseTime: string | null;
}

export interface CreateFlashSaleRequest {
  productName: string;
  totalStock: number;
  startTime: string;
  endTime: string;
}

export interface AdminResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface FlashSaleListResponse {
  success: boolean;
  data: {
    flashSales: FlashSaleStatus[];
    totalFlashSales: number;
    totalPurchases: number;
  };
}

export const flashSaleAPI = {
  /**
   * Get flash sale status (for single flash sale)
   * @returns {Promise} API response with status data
   */
  getStatus: async (): Promise<{ data: { success: boolean; data: FlashSaleStatus } }> => {
    return axiosInstance.get('/status');
  },

  /**
   * Attempt to purchase item
   * @param {string} userIdentifier - User email or username
   * @returns {Promise} API response with purchase result
   */
  attemptPurchase: async (userIdentifier: string): Promise<{ data: PurchaseResponse }> => {
    return axiosInstance.post('/purchase', {
      userIdentifier,
    });
  },

  /**
   * Check if user already purchased
   * @param {string} userIdentifier - User email or username
   * @returns {Promise} API response with purchase status
   */
  checkPurchase: async (
    userIdentifier: string
  ): Promise<{ data: { success: boolean; data: CheckPurchaseResponse } }> => {
    return axiosInstance.get(`/check-purchase/${userIdentifier}`);
  },

  /**
   * Create a new flash sale (admin)
   * @param {CreateFlashSaleRequest} flashSaleData - Flash sale data
   * @returns {Promise} API response with created flash sale data
   */
  createFlashSale: async (
    flashSaleData: CreateFlashSaleRequest
  ): Promise<{ data: AdminResponse }> => {
    return axiosInstance.post('/create', flashSaleData);
  },
};

export const adminAPI = {
  /**
   * List all flash sales with statistics
   * @returns {Promise} API response with flash sales list
   */
  listFlashSales: async (): Promise<{ data: FlashSaleListResponse }> => {
    return adminAxiosInstance.get('/flash-sales');
  },

  /**
   * Reset all data - database and Redis
   * @returns {Promise} API response
   */
  resetAll: async (): Promise<{ data: AdminResponse }> => {
    return adminAxiosInstance.post('/reset-all');
  },
};
