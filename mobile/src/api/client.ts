import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

api.interceptors.request.use(async config => {
  const url = config.url ?? '';
  // Login endpoints must work without (or with stale) JWT — do not attach Bearer.
  if (
    url.includes('/api/auth/telegram/') ||
    url.includes('/api/login/')
  ) {
    return config;
  }
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  async error => Promise.reject(error),
);
