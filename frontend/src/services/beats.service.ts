import { apiRequest } from './api';
import type { ApiResponse, Beat } from '../types';

export type UploadBeatPayload = {
  title: string;
  price: number;
  bpm?: number;
  audio: File;
  cover: File;
};

export const beatsService = {
  getAll(): Promise<ApiResponse<Beat[]>> {
    return apiRequest<ApiResponse<Beat[]>>('/api/beats');
  },

  getById(id: string): Promise<ApiResponse<Beat>> {
    return apiRequest<ApiResponse<Beat>>(`/api/beats/${id}`);
  },

  /**
   * Загрузка бита через FormData.
   * Автор не передаём — до авторизации его подставит бэкенд.
   */
  upload(payload: UploadBeatPayload): Promise<ApiResponse<Beat>> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('price', String(payload.price));
    if (payload.bpm !== undefined) {
      formData.append('bpm', String(payload.bpm));
    }
    formData.append('audio', payload.audio);
    formData.append('cover', payload.cover);

    return apiRequest<ApiResponse<Beat>>('/api/beats/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
