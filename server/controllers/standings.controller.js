import db from '../../db/connection.js';

// ============================================
// OBTENER TABLA DE POSICIONES GLOBAL
// ============================================
export const getGlobalStandings = async (req, res) => {
  try {
    // Obtener todos los usuarios (user + admin) con sus puntos
    const result = await db.query(
      `SELECT 
        id,
        nickname,
        country,
        avatar_url,
        role,
        total_points,
        exact_picks,
        partial_picks,
        perfect_featured_picks,
        top_scorer_guess,
        RANK() OVER (ORDER BY total_points DESC, exact_picks DESC, perfect_featured_picks DESC) as rank
       FROM profiles
       ORDER BY total_points DESC, exact_picks DESC, perfect_featured_picks DESC`
    );

    // Obtener estadísticas globales
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_participants,
        COALESCE(SUM(total_points), 0) as total_points_awarded,
        COALESCE(MAX(total_points), 0) as highest_score
       FROM profiles`
    );

    const stats = statsResult.rows[0];

    // Obtener total de partidos finalizados
    const matchesResult = await db.query(
      `SELECT COUNT(*) as finished_matches FROM matches WHERE status = 'finished'`
    );

    // Obtener total de partidos
    const totalMatchesResult = await db.query(
      `SELECT COUNT(*) as total_matches FROM matches`
    );

    res.json({
      standings: result.rows,
      stats: {
        totalParticipants: parseInt(stats.total_participants),
        totalPointsAwarded: parseInt(stats.total_points_awarded),
        highestScore: parseInt(stats.highest_score),
        finishedMatches: parseInt(matchesResult.rows[0].finished_matches),
        totalMatches: parseInt(totalMatchesResult.rows[0].total_matches)
      }
    });

  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    res.status(500).json({ error: 'Error al obtener posiciones' });
  }
};

// ============================================
// OBTENER POSICIÓN DE UN USUARIO ESPECÍFICO
// ============================================
export const getUserRank = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT 
        nickname,
        role,
        total_points,
        exact_picks,
        partial_picks,
        perfect_featured_picks,
        RANK() OVER (ORDER BY total_points DESC, exact_picks DESC, perfect_featured_picks DESC) as rank
       FROM profiles
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const total = await db.query(
      `SELECT COUNT(*) as total FROM profiles`
    );

    res.json({
      ...result.rows[0],
      totalParticipants: parseInt(total.rows[0].total)
    });

  } catch (error) {
    console.error('Error obteniendo rank:', error);
    res.status(500).json({ error: 'Error al obtener posición' });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DE GRUPOS (ADMIN)
// ============================================
export const getGroupStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        g.name as group_name,
        t.name as team_name,
        t.country_code,
        t.matches_played,
        t.wins,
        t.draws,
        t.losses,
        t.goals_for,
        t.goals_against,
        t.points
       FROM teams t
       JOIN groups_table g ON t.group_id = g.id
       ORDER BY g.name, t.points DESC, (t.goals_for - t.goals_against) DESC`
    );

    // Agrupar por grupo
    const groups = {};
    result.rows.forEach(row => {
      if (!groups[row.group_name]) {
        groups[row.group_name] = {
          name: row.group_name,
          teams: []
        };
      }
      groups[row.group_name].teams.push({
        name: row.team_name,
        code: row.country_code,
        pj: row.matches_played,
        g: row.wins,
        e: row.draws,
        p: row.losses,
        gf: row.goals_for,
        gc: row.goals_against,
        dg: row.goals_for - row.goals_against,
        pts: row.points
      });
    });

    res.json({ groups: Object.values(groups) });

  } catch (error) {
    console.error('Error obteniendo estadísticas de grupos:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getUserPredictions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const userResult = await db.query(
      'SELECT id, nickname, total_points, exact_picks, partial_picks FROM profiles WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Obtener todas las predicciones del usuario con datos del partido
    const predictionsResult = await db.query(
      `SELECT 
        p.id as prediction_id,
        p.team1_score as pred_score1,
        p.team2_score as pred_score2,
        p.points_earned,
        p.is_joker_used,
        p.can_edit,
        p.editable_reason,
        p.created_at as predicted_at,
        m.id as match_id,
        m.match_date,
        m.matchday,
        m.is_featured,
        m.status,
        m.team1_score as real_score1,
        m.team2_score as real_score2,
        g.name as group_name,
        t1.name as team1_name,
        t1.country_code as team1_code,
        t2.name as team2_name,
        t2.country_code as team2_code
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       JOIN groups_table g ON m.group_id = g.id
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE p.user_id = $1
       ORDER BY m.match_date`,
      [userId]
    );

    // Agrupar por ronda
    const byRound = {};
    predictionsResult.rows.forEach(p => {
      if (!byRound[p.matchday]) {
        byRound[p.matchday] = {
          matchday: p.matchday,
          predictions: []
        };
      }
      byRound[p.matchday].predictions.push({
        id: p.prediction_id,
        match: {
          id: p.match_id,
          date: p.match_date,
          group: p.group_name,
          is_featured: p.is_featured,
          status: p.status,
          team1: { name: p.team1_name, code: p.team1_code },
          team2: { name: p.team2_name, code: p.team2_code },
          realScore: p.status === 'finished' ? { team1: p.real_score1, team2: p.real_score2 } : null
        },
        prediction: {
          score1: p.pred_score1,
          score2: p.pred_score2,
          points_earned: p.points_earned,
          is_joker_used: p.is_joker_used,
          can_edit: p.can_edit
        },
        predicted_at: p.predicted_at
      });
    });

    res.json({
      user,
      rounds: Object.values(byRound).sort((a, b) => a.matchday - b.matchday)
    });

  } catch (error) {
    console.error('Error obteniendo predicciones del usuario:', error);
    res.status(500).json({ error: 'Error al obtener predicciones' });
  }
};