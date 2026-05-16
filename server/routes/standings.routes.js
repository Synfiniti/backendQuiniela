import { Router } from 'express';
import { getGlobalStandings, getUserRank, getGroupStats, getUserPredictions } from '../controllers/standings.controller.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Rutas públicas (cualquier usuario autenticado)
router.get('/', authenticateUser, getGlobalStandings);
router.get('/my-rank', authenticateUser, getUserRank);

// Rutas solo admin
router.get('/groups', authenticateUser, requireAdmin, getGroupStats);
router.get('/user/:userId/predictions', authenticateUser, requireAdmin, getUserPredictions);

export default router;