import { Request, Response } from 'express';

/**
 * Stub: semantic search of beats by artist lyrics.
 * Future: compare lyrics semantics with beat mood descriptions.
 */
export const searchByLyrics = (_req: Request, res: Response): void => {
  res.status(501).json({
    success: false,
    message: 'AI search by lyrics is not implemented yet',
  });
};
