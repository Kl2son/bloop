import { apiRequest } from './api';
import type { ApiResponse } from '../types';

export const aiService = {
  /** Generate extra MIDI/audio layers for beatmakers. */
  coCreate(payload: { beatId: string; prompt?: string }): Promise<ApiResponse> {
    return apiRequest<ApiResponse>('/api/ai/co-create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Generate a simple demo sketch for flow testing before purchase. */
  generateDemo(payload: { beatId: string; style?: string }): Promise<ApiResponse> {
    return apiRequest<ApiResponse>('/api/ai/generate-demo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** AI mixing & mastering of an uploaded beat. */
  mastering(payload: { beatId: string }): Promise<ApiResponse> {
    return apiRequest<ApiResponse>('/api/ai/mastering', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
