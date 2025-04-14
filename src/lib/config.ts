export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  search: `${API_BASE_URL}/api/search`,
  tags: `${API_BASE_URL}/api/tags`,
  actions: `${API_BASE_URL}/api/actions`,
};

export const APP_CONFIG = {
  name: 'Mashup',
  description: 'Video content search and discovery',
  defaultPageSize: 10,
}; 