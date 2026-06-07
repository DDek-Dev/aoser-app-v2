import axios from "axios";
import { EventEmitter } from "eventemitter3";
import { logError, logEvent, perfInstance } from 'utils/firebase';
import { httpMetric } from '@react-native-firebase/perf';

interface ApiEvents {
  'network_error': () => void;
  [key: string | symbol]: any;
}

export const apiEvents = new EventEmitter<ApiEvents>();

const EXPO_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const networkCheck = axios.create({ baseURL: EXPO_URL, timeout: 10000 });

// ✅ Valid HTTP methods for Firebase Perf
const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'] as const;
type HttpMethod = typeof VALID_METHODS[number];

const toHttpMethod = (method?: string): HttpMethod => {
  const upper = method?.toUpperCase() ?? 'GET';
  return VALID_METHODS.includes(upper as HttpMethod) ? (upper as HttpMethod) : 'GET';
};

// ✅ Request interceptor — start perf metric
networkCheck.interceptors.request.use(async config => {
  try {
    if (perfInstance && config.url) {
      const metric = httpMetric(perfInstance, config.url, toHttpMethod(config.method));
      await metric.start();
      (config as any)._perfMetric = metric;
    }
  } catch (e) {
    // Don't block request if perf fails
  }
  return config;
});

// ✅ Response interceptor — stop perf + log errors
networkCheck.interceptors.response.use(
  async response => {
    try {
      const metric = (response.config as any)._perfMetric;
      if (metric) {
        metric.setHttpResponseCode(response.status);
        await metric.stop();
      }
    } catch (e) {
      // Don't block response if perf fails
    }
    return response;
  },
  async error => {
    // ✅ Stop perf metric on error
    try {
      const metric = (error.config as any)?._perfMetric;
      if (metric) {
        metric.setHttpResponseCode(error.response?.status ?? 0);
        await metric.stop();
      }
    } catch (e) {
      // Don't block error handling if perf fails
    }

    // ✅ Network / timeout error
    if (!error.response || error.code === 'ECONNABORTED') {
      apiEvents.emit('network_error');
      logError(new Error(error.message), `Network Error: ${error.config?.url}`);
      logEvent('api_error', {
        endpoint: error.config?.url ?? 'unknown',
        error_code: error.code ?? 'unknown',
        error_message: error.message,
        type: 'network',
      });
    }

    // ✅ Server error (4xx, 5xx)
    if (error.response) {
      logError(new Error(error.message), `API Error ${error.response.status}: ${error.config?.url}`);
      logEvent('api_error', {
        endpoint: error.config?.url ?? 'unknown',
        status_code: error.response.status,
        error_message: error.message,
        type: 'server',
      });
    }

    return Promise.reject(error);
  }
);

export default networkCheck;