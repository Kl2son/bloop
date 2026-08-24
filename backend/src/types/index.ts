export interface Beat {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  audioUrl: string;
  /** Путь объекта в Supabase Storage (для удаления) */
  audioPath?: string;
  coverPath?: string;
  price: number;
  mood?: string;
  /** Теги для ИИ-подбора: Sad, Melodic, Dark, Drill и т.д. */
  tags?: string[];
  bpm?: number;
  key?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
