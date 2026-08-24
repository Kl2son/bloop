export interface Beat {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  audioUrl: string;
  price: number;
  mood?: string;
  bpm?: number;
  key?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export type NavItem = {
  id: string;
  label: string;
};
