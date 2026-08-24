import { Router } from 'express';
import type { RequestHandler } from 'express';
import {
  deleteBeat,
  getBeatById,
  getBeats,
  uploadBeat,
} from '../controllers/beats.controller';
import { beatUpload } from '../middleware/upload';

const router = Router();

router.get('/', getBeats);

/**
 * /upload объявляем ДО /:id, иначе Express примет "upload" как id.
 * Multer приводим к RequestHandler — иначе TS путает оверлоады Router
 * (ошибки про несовместимость name/path / PathParams).
 */
const uploadMiddleware: RequestHandler = (req, res, next) => {
  // any: типы Multer и Express Router иногда конфликтуют на оверлоадах
  (beatUpload as any)(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      res.status(400).json({ success: false, message });
      return;
    }
    next();
  });
};

router.post('/upload', uploadMiddleware, uploadBeat);
router.get('/:id', getBeatById);
router.delete('/:id', deleteBeat);

export default router;
