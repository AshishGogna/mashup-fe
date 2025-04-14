import axios from 'axios';
import { API_ENDPOINTS } from './config';

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  results: any[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const api = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const response = await axios.post(API_ENDPOINTS.search, params);
    return response.data;
  },

  getTags: async (): Promise<string[]> => {
    const response = await axios.get(API_ENDPOINTS.tags);
    return response.data;
  },

  getActions: async (): Promise<string[]> => {
    const response = await axios.get(API_ENDPOINTS.actions);
    return response.data;
  },
}; 