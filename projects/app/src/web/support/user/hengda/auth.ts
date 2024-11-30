import { loginOut } from './api';

export const tokenKey = 'hengda_token';

export const clearToken = () => {
  console.log('AAA >> clearToken, typeof window', typeof window);
  try {
    const token = getToken();
    console.log('AAA >> clearToken, token', token);
    localStorage.removeItem(tokenKey);
    return loginOut(token);
  } catch (error) {
    error;
  }
};

export const setToken = (token: string) => {
  console.log('AAA >> setToken, typeof window', typeof window, ', token', token);
  if (typeof window === 'undefined') return '';
  localStorage.setItem(tokenKey, token);
};

export const getToken = () => {
  console.log('AAA >> getToken, typeof window', typeof window);
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(tokenKey) || '';
};
