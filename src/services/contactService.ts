import { apiClient } from './apiClient';
import { ApiSuccessResponse, ContactMessagePayload } from '../types';

export const contactService = {
  async submit(payload: ContactMessagePayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<null>>('/contact', payload);
    return data.message;
  },
};
