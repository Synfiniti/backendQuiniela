import { Router } from 'express';
import { saveMatchResult, getAllMatches } from '../controllers/admin.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación + admin
router.use(authenticateUser);
router.use(requireAdmin);

// GET /api/admin/matches - Obtener todos los partidos
router.get('/matches', getAllMatches);

// PUT /api/admin/matches/:matchId - Guardar resultado de un partido
router.put('/matches/:matchId', saveMatchResult);

export default router;