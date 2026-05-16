import { Router } from 'express';
import { getGroupPredictions, saveGroupPredictions, getJokers } from '../controllers/predictions.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateUser);

// GET /api/predictions/group/:groupName - Obtener partidos y predicciones de un grupo
router.get('/group/:groupName', getGroupPredictions);

// POST /api/predictions/group/:groupName - Guardar predicciones de un grupo
router.post('/group/:groupName', saveGroupPredictions);

// GET /api/predictions/jokers - Obtener estado de comodines
router.get('/jokers', getJokers);

export default router;