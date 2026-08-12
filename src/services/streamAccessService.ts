import { apiClient } from './apiClient';
import { ApiSuccessResponse, StreamAccessOrder } from '../types';

export const streamAccessService = {
  /** Starts the $5 "VIP" live-stream unlock for one match — open `approve_url` in an in-app browser. */
  async createOrder(matchId: number) {
    const { data } = await apiClient.post<ApiSuccessResponse<StreamAccessOrder>>(
      `/matches/${matchId}/stream-access/create-order`
    );
    return data.data;
  },
};
