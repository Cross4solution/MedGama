// Uygulama genelinde kullanılacak sabitler

export const ROUTES = Object.freeze({
  HOME: '/',
  HOME_V2: '/home-v2',
  EXPLORE: '/explore',
});

export const API = Object.freeze({
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
});
