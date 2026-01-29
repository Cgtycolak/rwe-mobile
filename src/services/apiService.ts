import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG, ENDPOINTS} from '../config/api';

/**
 * API Service
 * Handles all HTTP requests to the Flask backend
 */
class ApiService {
  private axiosInstance: AxiosInstance;
  private sessionCookie: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add authentication
    this.axiosInstance.interceptors.request.use(
      async config => {
        const session = await this.getSession();
        if (session) {
          // Add session cookie to request
          config.headers.Cookie = session;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Unauthorized - clear session
          await this.clearSession();
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Save session to AsyncStorage
   */
  private async saveSession(cookie: string): Promise<void> {
    try {
      await AsyncStorage.setItem('session_cookie', cookie);
      this.sessionCookie = cookie;
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get session from AsyncStorage
   */
  private async getSession(): Promise<string | null> {
    try {
      if (this.sessionCookie) {
        return this.sessionCookie;
      }
      const cookie = await AsyncStorage.getItem('session_cookie');
      this.sessionCookie = cookie;
      return cookie;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Clear session from AsyncStorage
   */
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('session_cookie');
      this.sessionCookie = null;
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Login
   */
  async login(username: string, password: string): Promise<any> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await this.axiosInstance.post(
        ENDPOINTS.LOGIN,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // Extract session cookie from response
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        await this.saveSession(setCookie[0]);
      }

      return {success: true, data: response.data};
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.axiosInstance.get(ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearSession();
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Generic GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: any,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(endpoint, {params});
  }

  /**
   * Generic POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(endpoint, data);
  }

  /**
   * Get Power Plants
   */
  async getPowerPlants() {
    try {
      const response = await this.get(ENDPOINTS.GET_POWERPLANTS);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Realtime Data
   */
  async getRealtimeData(powerPlantId: string, start: string, end: string) {
    try {
      const response = await this.post(ENDPOINTS.GET_REALTIME_DATA, {
        powerPlantId,
        start,
        end,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get AIC Data
   */
  async getAicData(range: string = 'week') {
    try {
      const response = await this.get(ENDPOINTS.GET_AIC_DATA, {range});
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Organizations
   */
  async getOrganizations(start: string, end: string) {
    try {
      const response = await this.post(ENDPOINTS.GET_ORGS, {start, end});
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get DPP Table Data
   */
  async getDppTableData(orgsData: any, start: string, end: string) {
    try {
      const response = await this.post(ENDPOINTS.GET_DPP_TABLE, {
        orgsData,
        start,
        end,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Heatmap Data
   */
  async getHeatmapData(date: string, version: string = 'first') {
    try {
      const response = await this.post(ENDPOINTS.HEATMAP_DATA, {
        date,
        version,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Realtime Heatmap Data (Natural Gas)
   */
  async getRealtimeHeatmapData(date: string) {
    try {
      const response = await this.post(ENDPOINTS.REALTIME_HEATMAP_DATA, {
        date,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Hydro Heatmap Data
   */
  async getHydroHeatmapData(date: string, version: string = 'first') {
    try {
      const response = await this.post(ENDPOINTS.HYDRO_HEATMAP_DATA, {
        date,
        version,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Hydro Realtime Heatmap Data
   */
  async getHydroRealtimeHeatmapData(date: string) {
    try {
      const response = await this.post(ENDPOINTS.HYDRO_REALTIME_HEATMAP_DATA, {
        date,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Lignite Heatmap Data
   */
  async getLigniteHeatmapData(date: string, version: string = 'first') {
    try {
      const response = await this.post(ENDPOINTS.LIGNITE_HEATMAP_DATA, {
        date,
        version,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Lignite Realtime Heatmap Data
   */
  async getLigniteRealtimeHeatmapData(date: string) {
    try {
      const response = await this.post(ENDPOINTS.LIGNITE_REALTIME_HEATMAP_DATA, {
        date,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Import Coal Heatmap Data
   */
  async getImportCoalHeatmapData(date: string, version: string = 'first') {
    try {
      const response = await this.post(ENDPOINTS.IMPORT_COAL_HEATMAP_DATA, {
        date,
        version,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Rolling Averages Data
   */
  async getRollingData() {
    try {
      const response = await this.get(ENDPOINTS.GET_ROLLING_DATA);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Demand Data
   */
  async getDemandData() {
    try {
      const response = await this.get(ENDPOINTS.GET_DEMAND_DATA);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get All Mini Table Data
   */
  async getAllTableData() {
    try {
      const response = await this.get(ENDPOINTS.GET_ALL_TABLE_DATA);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Forecast Performance Data
   */
  async getForecastPerformanceData(period: number = 30) {
    try {
      const response = await this.get(ENDPOINTS.FORECAST_PERFORMANCE_DATA, {
        period,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'Server error occurred';
      return new Error(message);
    } else if (error.request) {
      // No response from server
      return new Error('No response from server. Please check your connection.');
    } else {
      // Other errors
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new ApiService();

