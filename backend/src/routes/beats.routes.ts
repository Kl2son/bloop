import { NextFunction, Request, Response, Router } from 'express';
import {
  getBeatById,
  getBeats,
  uploadBeat,
} from '../controllers/beats.controller';
import { beatUpload } from '../middleware/upload';

const router = Router();

router.get('/', getBeats);

/**
 * /upload объявляем ДО /:id, иначе Express примет "upload" как id.
 * beatUpload — Multer: парсит FormData, пишет файлы на диск, затем uploadBeat.
 */
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  beatUpload(req, res, (err: unknown) => {
    // Ошибки Multer (тип файла, размер) отдаём клиенту понятным текстом
    if (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      res.status(400).json({ success: false, message });
      return;
    }
    next();
  });
}, uploadBeat);

router.get('/:id', getBeatById);

export default router;
