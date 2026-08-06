import { apiClient } from './apiClient';
import { ApiSuccessResponse, Lookups } from '../types';

/** Sports, formats, age categories, match categories, cricket match types — one call. */
export const lookupService = {
  async fetchAll() {
    const { data } = await apiClient.get<ApiSuccessResponse<Lookups>>('/lookups');
    return data.data;
  },
};
