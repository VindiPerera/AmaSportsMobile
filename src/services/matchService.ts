import { apiClient } from './apiClient';
import { ApiSuccessResponse, MatchStatus, MatchSummary } from '../types';

export const matchService = {
  async fetchAll(status?: MatchStatus) {
    const { data } = await apiClient.get<ApiSuccessResponse<MatchSummary[]>>('/matches', {
      params: status ? { status } : undefined,
    });
    return data.data;
  },

  async fetchOne(id: number) {
    const { data } = await apiClient.get<ApiSuccessResponse<MatchSummary>>(`/matches/${id}`);
    return data.data;
  },
};
