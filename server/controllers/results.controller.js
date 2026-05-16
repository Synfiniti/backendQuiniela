import db from '../../db/connection.js';

// ============================================
// CALCULAR PUNTOS DE UNA PREDICCIÓN
// ============================================
const calculatePoints = (prediction, realScore, isFeatured) => {
  if (!prediction || prediction.team1_score === null || prediction.team2_score === null) {
    return 0;
  }

  const pred1 = parseInt(prediction.team1_score);
  const pred2 = parseInt(prediction.team2_score);
  const real1 = parseInt(realScore.team1);
  const real2 = parseInt(realScore.team2);

  if (isNaN(pred1) || isNaN(pred2) || isNaN(real1) || isNaN(real2)) {
    return 0;
  }

  // Acertar el marcador exacto
  if (pred1 === real1 && pred2 === real2) {
    return isFeatured ? 4 : 2;
  }

  // Acertar el ganador o empate
  const predWinner = pred1 > pred2 ? 'team1' : pred2 > pred1 ? 'team2' : 'draw';
  const realWinner = real1 > real2 ? 'team1' : real2 > real1 ? 'team2' : 'draw';

  if (predWinner === realWinner) {
    return isFeatured ? 2 : 1;
  }

  return 0;
};

// ============================================
// OBTENER TIPO DE ACIERTO
// ============================================
const getMatchType = (prediction, realScore) => {
  if (!prediction || prediction.team1_score === null || prediction.team2_score === null) {
    return 'pending';
  }

  const pred1 = parseInt(prediction.team1_score);
  const pred2 = parseInt(prediction.team2_score);
  const real1 = parseInt(realScore.team1);
  const real2 = parseInt(realScore.team2);

  if (isNaN(pred1) || isNaN(pred2) || isNaN(real1) || isNaN(real2)) {
    return 'pending';
  }

  if (pred1 === real1 && pred2 === real2) return 'perfect';

  const predWinner = pred1 > pred2 ? 'team1' : pred2 > pred1 ? 'team2' : 'draw';
  const realWinner = real1 > real2 ? 'team1' : real2 > real1 ? 'team2' : 'draw';

  if (predWinner === realWinner) return 'partial';
  return 'wrong';
};

// ============================================
// OBTENER PARTIDOS POR MATCHDAY (TODOS)
// ============================================
export const getResultsByDate = async (req, res) => {
  try {
    const { matchday } = req.params;
    const userId = req.user.id;

    // ⭐ Obtener TODOS los partidos de ese matchday (no solo finished)
    const matchesResult = await db.query(
      `SELECT m.id, m.match_date, m.matchday, m.is_featured, m.status,
              m.team1_score, m.team2_score,
              g.name as group_name, g.id as group_id,
              t1.id as team1_id, t1.name as team1_name, t1.country_code as team1_code,
              t2.id as team2_id, t2.name as team2_name, t2.country_code as team2_code
       FROM matches m
       JOIN groups_table g ON m.group_id = g.id
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.matchday = $1
       ORDER BY m.match_date`,
      [matchday]
    );

    if (matchesResult.rows.length === 0) {
      return res.json({
        matchday: parseInt(matchday),
        date: null,
        points: 0,
        totalAccumulated: 0,
        matches: []
      });
    }

    const matchIds = matchesResult.rows.map(m => m.id);

    // Obtener predicciones del usuario para estos partidos
    const predictionsResult = await db.query(
      `SELECT id, match_id, team1_score, team2_score, points_earned, is_joker_used
       FROM predictions 
       WHERE user_id = $1 AND match_id = ANY($2::int[])`,
      [userId, matchIds]
    );

    // Obtener puntos totales acumulados del perfil
    const profileResult = await db.query(
      'SELECT total_points FROM profiles WHERE id = $1',
      [userId]
    );
    const totalAccumulated = profileResult.rows[0]?.total_points || 0;

    // Construir respuesta
    let datePoints = 0;
    const matches = matchesResult.rows.map(match => {
      const prediction = predictionsResult.rows.find(p => p.match_id === match.id);
      const isFinished = match.status === 'finished' && match.team1_score !== null && match.team2_score !== null;
      
      let pointsEarned = 0;
      let matchType = 'pending';

      if (isFinished && prediction) {
        pointsEarned = prediction.points_earned || calculatePoints(prediction, { team1: match.team1_score, team2: match.team2_score }, match.is_featured);
        matchType = getMatchType(prediction, { team1: match.team1_score, team2: match.team2_score });
      }
      
      datePoints += pointsEarned;

      return {
        id: match.id,
        team1: { id: match.team1_id, name: match.team1_name, code: match.team1_code },
        team2: { id: match.team2_id, name: match.team2_name, code: match.team2_code },
        group: match.group_name,
        is_featured: match.is_featured,
        status: match.status,
        isFinished,
        realScore: isFinished ? { team1: match.team1_score, team2: match.team2_score } : null,
        prediction: prediction ? {
          id: prediction.id,
          score1: prediction.team1_score,
          score2: prediction.team2_score,
          is_joker_used: prediction.is_joker_used
        } : null,
        points: pointsEarned,
        type: matchType
      };
    });

    const matchDate = matchesResult.rows[0].match_date;

    res.json({
      matchday: parseInt(matchday),
      date: matchDate,
      points: datePoints,
      totalAccumulated: totalAccumulated,
      matches
    });

  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
};

// ============================================
// OBTENER RESUMEN DE MATCHDAYS DISPONIBLES
// ============================================
export const getMatchdaysSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // ⭐ Obtener TODOS los matchdays (no solo los finalizados)
    const matchdaysResult = await db.query(
      `SELECT DISTINCT m.matchday, MIN(m.match_date) as date, COUNT(*) as total_matches,
              COUNT(CASE WHEN m.status = 'finished' THEN 1 END) as finished_matches
       FROM matches m
       GROUP BY m.matchday
       ORDER BY m.matchday`
    );

    const matchdays = [];
    for (const md of matchdaysResult.rows) {
      const pointsResult = await db.query(
        `SELECT COALESCE(SUM(p.points_earned), 0) as points
         FROM predictions p
         JOIN matches m ON p.match_id = m.id
         WHERE p.user_id = $1 AND m.matchday = $2 AND m.status = 'finished'`,
        [userId, md.matchday]
      );

      matchdays.push({
        matchday: md.matchday,
        date: md.date,
        totalMatches: parseInt(md.total_matches),
        finishedMatches: parseInt(md.finished_matches),
        points: parseInt(pointsResult.rows[0].points)
      });
    }

    const profileResult = await db.query('SELECT total_points FROM profiles WHERE id = $1', [userId]);

    res.json({
      matchdays,
      totalAccumulated: profileResult.rows[0]?.total_points || 0
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};