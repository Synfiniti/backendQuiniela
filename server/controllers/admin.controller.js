import db from '../../db/connection.js';

// ============================================
// CALCULAR PUNTOS Y ACTUALIZAR PERFILES
// ============================================
const calculateAndUpdatePoints = async (client, match) => {
  const { id: matchId, team1_score, team2_score, is_featured } = match;

  // Obtener todas las predicciones para este partido
  const predictions = await client.query(
    'SELECT id, user_id, team1_score, team2_score FROM predictions WHERE match_id = $1',
    [matchId]
  );

  for (const pred of predictions.rows) {
    let points = 0;
    let type = 'wrong';

    if (pred.team1_score !== null && pred.team2_score !== null) {
      const pred1 = parseInt(pred.team1_score);
      const pred2 = parseInt(pred.team2_score);
      const real1 = parseInt(team1_score);
      const real2 = parseInt(team2_score);

      if (!isNaN(pred1) && !isNaN(pred2)) {
        // Marcador exacto
        if (pred1 === real1 && pred2 === real2) {
          points = is_featured ? 4 : 2;
          type = 'perfect';
        } else {
          // Ganador/empate
          const predWinner = pred1 > pred2 ? 'team1' : pred2 > pred1 ? 'team2' : 'draw';
          const realWinner = real1 > real2 ? 'team1' : real2 > real1 ? 'team2' : 'draw';
          if (predWinner === realWinner) {
            points = is_featured ? 2 : 1;
            type = 'partial';
          }
        }
      }
    }

    // Actualizar puntos en la predicción
    await client.query(
      'UPDATE predictions SET points_earned = $1 WHERE id = $2',
      [points, pred.id]
    );

    // Actualizar perfil del usuario
    if (points > 0) {
      if (type === 'perfect') {
        await client.query(
          'UPDATE profiles SET total_points = total_points + $1, exact_picks = exact_picks + 1 WHERE id = $2',
          [points, pred.user_id]
        );
      } else if (type === 'partial') {
        await client.query(
          'UPDATE profiles SET total_points = total_points + $1, partial_picks = partial_picks + 1 WHERE id = $2',
          [points, pred.user_id]
        );
      }
    }
  }

  // Actualizar estadísticas de equipos
  const real1 = parseInt(team1_score);
  const real2 = parseInt(team2_score);

  const matchInfo = await client.query(
    'SELECT team1_id, team2_id FROM matches WHERE id = $1',
    [matchId]
  );

  if (matchInfo.rows.length > 0) {
    const { team1_id, team2_id } = matchInfo.rows[0];

    // Actualizar equipo 1
    await client.query(
      `UPDATE teams SET 
        matches_played = matches_played + 1,
        goals_for = goals_for + $1,
        goals_against = goals_against + $2,
        wins = CASE WHEN $1 > $2 THEN wins + 1 ELSE wins END,
        losses = CASE WHEN $1 < $2 THEN losses + 1 ELSE losses END,
        draws = CASE WHEN $1 = $2 THEN draws + 1 ELSE draws END,
        points = points + CASE WHEN $1 > $2 THEN 3 WHEN $1 = $2 THEN 1 ELSE 0 END
       WHERE id = $3`,
      [real1, real2, team1_id]
    );

    // Actualizar equipo 2
    await client.query(
      `UPDATE teams SET 
        matches_played = matches_played + 1,
        goals_for = goals_for + $1,
        goals_against = goals_against + $2,
        wins = CASE WHEN $1 > $2 THEN wins + 1 ELSE wins END,
        losses = CASE WHEN $1 < $2 THEN losses + 1 ELSE losses END,
        draws = CASE WHEN $1 = $2 THEN draws + 1 ELSE draws END,
        points = points + CASE WHEN $1 > $2 THEN 3 WHEN $1 = $2 THEN 1 ELSE 0 END
       WHERE id = $3`,
      [real2, real1, team2_id]
    );
  }
};

// ============================================
// GUARDAR RESULTADO DE UN PARTIDO
// ============================================
export const saveMatchResult = async (req, res) => {
  const client = await db.connect();

  try {
    const { matchId } = req.params;
    const { team1_score, team2_score } = req.body;

    if (team1_score === undefined || team2_score === undefined || 
        team1_score === '' || team2_score === '') {
      return res.status(400).json({ error: 'Debes ingresar ambos marcadores' });
    }

    const score1 = parseInt(team1_score);
    const score2 = parseInt(team2_score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return res.status(400).json({ error: 'Los marcadores deben ser números válidos' });
    }

    await client.query('BEGIN');

    // ⭐ CORRECCIÓN: No usar updated_at (no existe en la tabla matches)
    const updateResult = await client.query(
      `UPDATE matches SET team1_score = $1, team2_score = $2, status = 'finished' 
       WHERE id = $3 RETURNING *`,
      [score1, score2, matchId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const match = updateResult.rows[0];

    // Calcular puntos para todos los usuarios
    await calculateAndUpdatePoints(client, match);

    await client.query('COMMIT');

    res.json({
      message: 'Resultado guardado exitosamente',
      match: {
        id: match.id,
        team1_score: match.team1_score,
        team2_score: match.team2_score,
        status: match.status
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error guardando resultado:', error);
    res.status(500).json({ error: 'Error al guardar resultado' });
  } finally {
    client.release();
  }
};

// ============================================
// OBTENER TODOS LOS PARTIDOS (ADMIN)
// ============================================
export const getAllMatches = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.id, m.match_date, m.matchday, m.is_featured, m.status,
              m.team1_score, m.team2_score,
              g.name as group_name,
              t1.name as team1_name, t1.country_code as team1_code,
              t2.name as team2_name, t2.country_code as team2_code
       FROM matches m
       JOIN groups_table g ON m.group_id = g.id
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       ORDER BY m.match_date`
    );

    const matches = result.rows.map(m => ({
      id: m.id,
      date: m.match_date,
      matchday: m.matchday,
      is_featured: m.is_featured,
      status: m.status,
      group: m.group_name,
      team1: { name: m.team1_name, code: m.team1_code },
      team2: { name: m.team2_name, code: m.team2_code },
      score: m.status === 'finished' ? { team1: m.team1_score, team2: m.team2_score } : null
    }));

    const byRound = {};
    matches.forEach(m => {
      if (!byRound[m.matchday]) {
        byRound[m.matchday] = { matchday: m.matchday, matches: [] };
      }
      byRound[m.matchday].matches.push(m);
    });

    res.json({
      rounds: Object.values(byRound).sort((a, b) => a.matchday - b.matchday)
    });

  } catch (error) {
    console.error('Error obteniendo partidos:', error);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
};