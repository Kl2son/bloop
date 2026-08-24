import { Router } from 'express';
import { coCreate, generateDemo, mastering } from '../controllers/ai.controller';

const router = Router();

router.post('/co-create', coCreate);
router.post('/generate-demo', generateDemo);
router.post('/mastering', mastering);

export default router;
