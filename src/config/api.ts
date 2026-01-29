/**
 * API Configuration
 * Replace the BASE_URL with your actual Flask backend URL
 */

// Development - Use your local IP address or deployed URL
export const API_CONFIG = {
  // For local development: Replace with your computer's IP address
  // BASE_URL: 'http://localhost:5000',
  
  // Production: Using deployed backend URL on Render
  BASE_URL: 'https://rwe-dashboard.onrender.com',
  
  // API timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  LOGIN: '/login',
  LOGOUT: '/logout',
  
  // Realtime Data
  GET_POWERPLANTS: '/powerplants',
  GET_REALTIME_DATA: '/realtime_data',
  GET_AIC_DATA: '/get_aic_data',
  
  // DPP Data
  GET_ORGS: '/get_orgs',
  GET_ORGS_UEVCBIDS: '/get_orgs_uevcbids',
  GET_DPP_TABLE: '/dpp_table',
  
  // Heatmaps
  HEATMAP_DATA: '/heatmap_data',
  REALTIME_HEATMAP_DATA: '/realtime_heatmap_data',
  IMPORT_COAL_HEATMAP_DATA: '/import_coal_heatmap_data',
  HYDRO_HEATMAP_DATA: '/hydro_heatmap_data',
  HYDRO_REALTIME_HEATMAP_DATA: '/hydro_realtime_heatmap_data',
  LIGNITE_HEATMAP_DATA: '/lignite_heatmap_data',
  LIGNITE_REALTIME_HEATMAP_DATA: '/lignite_realtime_heatmap_data',
  
  // Charts and Analysis
  GET_ROLLING_DATA: '/get-rolling-data',
  GET_ROLLING_LAST_UPDATE: '/get-rolling-last-update',
  GET_DEMAND_DATA: '/get_demand_data',
  GET_MONTHLY_DEMAND_DATA: '/get_monthly_demand_data',
  
  // Mini Tables
  GET_ALL_TABLE_DATA: '/get_all_table_data',
  GET_ORDER_SUMMARY: '/get_order_summary',
  GET_SMP_DATA: '/get_smp_data',
  GET_PFC_DATA: '/get_pfc_data',
  GET_SFC_DATA: '/get_sfc_data',
  
  // Forecasting
  FORECAST_PERFORMANCE_DATA: '/forecast-performance-data',
};

