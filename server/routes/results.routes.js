import { Router } from 'express';
import { getResultsByDate, getMatchdaysSummary } from '../controllers/results.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.use(authenticateUser);

// GET /api/results/matchday/:matchday - Obtener resultados de una fecha específica
router.get('/matchday/:matchday', getResultsByDate);

// GET /api/results/summary - Obtener resumen de todas las fechas
router.get('/summary', getMatchdaysSummary);

export default router;