import db from '../../db/connection.js';

// ============================================
// OBTENER PARTIDOS Y PREDICCIONES DE UN GRUPO
// ============================================
export const getGroupPredictions = async (req, res) => {
  try {
    const { groupName } = req.params;
    const userId = req.user.id;

    const groupResult = await db.query('SELECT id, name FROM groups_table WHERE name = $1', [groupName]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    const group = groupResult.rows[0];

    const teamsResult = await db.query(
      'SELECT id, name, country_code, flag_url, matches_played, wins, draws, losses, goals_for, goals_against, points FROM teams WHERE group_id = $1 ORDER BY name',
      [group.id]
    );

    const matchesResult = await db.query(
      `SELECT m.id, m.match_date, m.matchday, m.is_featured, m.status,
              t1.id as team1_id, t1.name as team1_name, t1.country_code as team1_code,
              t2.id as team2_id, t2.name as team2_name, t2.country_code as team2_code
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.group_id = $1
       ORDER BY m.match_date`,
      [group.id]
    );

    const matchIds = matchesResult.rows.map(m => m.id);
    let predictions = [];
    
    if (matchIds.length > 0) {
      const predictionsResult = await db.query(
        `SELECT id, match_id, team1_score, team2_score, is_joker_used, can_edit, editable_reason
         FROM predictions 
         WHERE user_id = $1 AND match_id = ANY($2::int[])`,
        [userId, matchIds]
      );
      predictions = predictionsResult.rows;
    }

    const jokersResult = await db.query('SELECT * FROM user_jokers WHERE user_id = $1', [userId]);
    const jokers = {
      leave_one: jokersResult.rows.find(j => j.joker_type === 'leave_one') || { is_used: false },
      edit_one: jokersResult.rows.find(j => j.joker_type === 'edit_one') || { is_used: false }
    };

    const matchesByDate = {};
    for (const match of matchesResult.rows) {
      const dateKey = new Date(match.match_date).toISOString().split('T')[0];
      if (!matchesByDate[dateKey]) {
        matchesByDate[dateKey] = { date: match.match_date, matches: [] };
      }
      
      const prediction = predictions.find(p => p.match_id === match.id);
      
      matchesByDate[dateKey].matches.push({
        id: match.id,
        team1: { id: match.team1_id, name: match.team1_name, code: match.team1_code },
        team2: { id: match.team2_id, name: match.team2_name, code: match.team2_code },
        is_featured: match.is_featured,
        status: match.status,
        prediction: prediction ? {
          id: prediction.id,
          score1: prediction.team1_score,
          score2: prediction.team2_score,
          is_joker_used: prediction.is_joker_used,
          can_edit: prediction.can_edit,
          editable_reason: prediction.editable_reason
        } : null
      });
    }

    res.json({
      group: { id: group.id, name: group.name },
      teams: teamsResult.rows,
      matchDates: Object.values(matchesByDate).sort((a, b) => new Date(a.date) - new Date(b.date)),
      jokers,
      predictions
    });

  } catch (error) {
    console.error('Error obteniendo predicciones:', error);
    res.status(500).json({ error: 'Error al obtener predicciones' });
  }
};

// ============================================
// GUARDAR PREDICCIONES DE UN GRUPO
// ============================================
export const saveGroupPredictions = async (req, res) => {
  const client = await db.connect();
  
  try {
    const { groupName } = req.params;
    const { predictions: predictionsData } = req.body;
    const userId = req.user.id;

    if (!predictionsData || !Array.isArray(predictionsData) || predictionsData.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos una predicción' });
    }

    const groupResult = await client.query('SELECT id FROM groups_table WHERE name = $1', [groupName]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    const groupId = groupResult.rows[0].id;

    const matchIds = predictionsData.map(p => p.match_id);
    const matchesResult = await client.query(
      'SELECT id, is_featured FROM matches WHERE id = ANY($1::int[]) AND group_id = $2',
      [matchIds, groupId]
    );

    if (matchesResult.rows.length !== predictionsData.length) {
      return res.status(400).json({ error: 'Algunos partidos no pertenecen a este grupo' });
    }

    const existingPredictions = await client.query(
      `SELECT p.id, p.match_id, p.can_edit, p.is_joker_used, p.editable_reason, m.is_featured
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = $1 AND m.group_id = $2`,
      [userId, groupId]
    );

    const jokers = await client.query('SELECT * FROM user_jokers WHERE user_id = $1', [userId]);
    const leaveOneJoker = jokers.rows.find(j => j.joker_type === 'leave_one');
    const editOneJoker = jokers.rows.find(j => j.joker_type === 'edit_one');

    await client.query('BEGIN');

    for (const pred of predictionsData) {
      const match = matchesResult.rows.find(m => m.id === pred.match_id);
      const existing = existingPredictions.rows.find(p => p.match_id === pred.match_id);

      if (existing && !existing.can_edit) {
        if (editOneJoker && !editOneJoker.is_used && pred.team1_score !== '' && pred.team2_score !== '') {
          await client.query(
            `UPDATE predictions SET team1_score = $1, team2_score = $2, is_joker_used = TRUE, 
             can_edit = FALSE, editable_reason = 'joker', updated_at = NOW() WHERE id = $3`,
            [parseInt(pred.team1_score), parseInt(pred.team2_score), existing.id]
          );
          await client.query("UPDATE user_jokers SET is_used = TRUE, used_on_match_id = $1 WHERE id = $2", [pred.match_id, editOneJoker.id]);
          continue;
        }
        return res.status(400).json({ error: `La predicción del partido ${pred.match_id} ya fue guardada y no se puede editar` });
      }

      const isEmpty = pred.team1_score === '' || pred.team2_score === '';
      let isJoker = false;

      if (isEmpty) {
        if (match.is_featured) {
          return res.status(400).json({ error: 'No puedes dejar vacío un partido destacado' });
        }
        if (!leaveOneJoker || leaveOneJoker.is_used) {
          return res.status(400).json({ error: 'Ya has usado tu comodín para dejar un resultado vacío' });
        }
        isJoker = true;
      }

      if (existing) {
        if (isEmpty) {
          await client.query(
            `UPDATE predictions SET team1_score = NULL, team2_score = NULL, is_joker_used = TRUE,
             can_edit = TRUE, editable_reason = 'joker', updated_at = NOW() WHERE id = $1`,
            [existing.id]
          );
        } else {
          await client.query(
            `UPDATE predictions SET team1_score = $1, team2_score = $2, can_edit = FALSE, 
             editable_reason = 'initial', updated_at = NOW() WHERE id = $3`,
            [parseInt(pred.team1_score), parseInt(pred.team2_score), existing.id]
          );
        }
      } else {
        if (isEmpty) {
          await client.query(
            `INSERT INTO predictions (user_id, match_id, team1_score, team2_score, is_joker_used, can_edit, editable_reason)
             VALUES ($1, $2, NULL, NULL, TRUE, TRUE, 'joker')`,
            [userId, pred.match_id]
          );
        } else {
          await client.query(
            `INSERT INTO predictions (user_id, match_id, team1_score, team2_score, can_edit, editable_reason)
             VALUES ($1, $2, $3, $4, FALSE, 'initial')`,
            [userId, pred.match_id, parseInt(pred.team1_score), parseInt(pred.team2_score)]
          );
        }
      }

      if (isJoker && leaveOneJoker && !leaveOneJoker.is_used) {
        await client.query("UPDATE user_jokers SET is_used = TRUE, used_on_match_id = $1 WHERE id = $2", [pred.match_id, leaveOneJoker.id]);
      }
    }

    await client.query('COMMIT');

    const updatedPredictions = await client.query(
      `SELECT p.id, p.match_id, p.team1_score, p.team2_score, p.is_joker_used, p.can_edit, p.editable_reason
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = $1 AND m.group_id = $2`,
      [userId, groupId]
    );

    const updatedJokers = await client.query('SELECT * FROM user_jokers WHERE user_id = $1', [userId]);

    res.json({
      message: 'Predicciones guardadas exitosamente',
      predictions: updatedPredictions.rows,
      jokers: {
        leave_one: updatedJokers.rows.find(j => j.joker_type === 'leave_one') || { is_used: false },
        edit_one: updatedJokers.rows.find(j => j.joker_type === 'edit_one') || { is_used: false }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error guardando predicciones:', error);
    res.status(500).json({ error: 'Error al guardar predicciones' });
  } finally {
    client.release();
  }
};

// ============================================
// OBTENER COMODINES DEL USUARIO
// ============================================
export const getJokers = async (req, res) => {
  try {
    const userId = req.user.id;
    const jokersResult = await db.query('SELECT * FROM user_jokers WHERE user_id = $1', [userId]);

    res.json({
      leave_one: jokersResult.rows.find(j => j.joker_type === 'leave_one') || { is_used: false },
      edit_one: jokersResult.rows.find(j => j.joker_type === 'edit_one') || { is_used: false }
    });
  } catch (error) {
    console.error('Error obteniendo comodines:', error);
    res.status(500).json({ error: 'Error al obtener comodines' });
  }
};