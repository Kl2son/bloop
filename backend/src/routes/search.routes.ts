import { Router } from 'express';
import { searchByLyrics } from '../controllers/search.controller';

const router = Router();

router.post('/by-lyrics', searchByLyrics);

export default router;
