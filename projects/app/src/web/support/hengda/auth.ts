import { loginOut } from './api';

export const tokenKey = 'hengda_token';

export const clearToken = () => {
  console.log('AAA >> clearToken, typeof window', typeof window);
  try {
    const token = getToken();
    console.log('AAA >> clearToken, token', token);
    localStorage.removeItem(tokenKey);
    if (token) {
      return loginOut(token);
    }
    return null;
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

export const teacherWuPage: { [key: string]: boolean } = {
  '/teacher': true,
  '/teacher/login': true,
  '/teacher/wu': true
};

export function getPathBeforeQuery(lastRoute: string) {
  // 使用正则表达式匹配 '?' 之前的部分
  const match = lastRoute.match(/^[^?]*/);
  // 返回匹配到的部分
  return (match && match[0]) || lastRoute;
}
