import db from './connection.js';
import { allMatches, groupsData, isFeaturedMatch } from './seedData.js';

const createTables = async () => {
  try {
    console.log('🚀 Iniciando creación de tablas...\n');

    // ============================================
    // ELIMINAR TABLAS EN ORDEN (CASCADE)
    // ============================================
    console.log('🗑️  Eliminando tablas existentes...');
    await db.query('DROP TABLE IF EXISTS password_reset_tokens CASCADE');
    await db.query('DROP TABLE IF EXISTS group_order_predictions CASCADE');
    await db.query('DROP TABLE IF EXISTS top_scorer_predictions CASCADE');
    await db.query('DROP TABLE IF EXISTS user_jokers CASCADE');
    await db.query('DROP TABLE IF EXISTS predictions CASCADE');
    await db.query('DROP TABLE IF EXISTS matches CASCADE');
    await db.query('DROP TABLE IF EXISTS teams CASCADE');
    await db.query('DROP TABLE IF EXISTS groups_table CASCADE');
    await db.query('DROP TABLE IF EXISTS profiles CASCADE');
    await db.query('DELETE FROM auth.users WHERE TRUE');
    console.log('✅ Tablas eliminadas\n');

    // ============================================
    // CREAR TABLAS
    // ============================================

    // 1. profiles
    console.log('Creando profiles...');
    await db.query(`
      CREATE TABLE profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nickname VARCHAR(50) UNIQUE NOT NULL,
        country VARCHAR(50),
        avatar_url TEXT,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        total_points INT DEFAULT 0,
        exact_picks INT DEFAULT 0,
        partial_picks INT DEFAULT 0,
        perfect_featured_picks INT DEFAULT 0,
        top_scorer_guess VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ profiles');

    // 2. groups_table
    console.log('Creando groups_table...');
    await db.query(`
      CREATE TABLE groups_table (
        id SERIAL PRIMARY KEY,
        name CHAR(1) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ groups_table');

    // 3. teams
    console.log('Creando teams...');
    await db.query(`
      CREATE TABLE teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country_code VARCHAR(10),
        flag_url TEXT,
        group_id INT NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
        matches_played INT DEFAULT 0,
        wins INT DEFAULT 0,
        draws INT DEFAULT 0,
        losses INT DEFAULT 0,
        goals_for INT DEFAULT 0,
        goals_against INT DEFAULT 0,
        points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ teams');

    // 4. matches
    console.log('Creando matches...');
    await db.query(`
      CREATE TABLE matches (
        id SERIAL PRIMARY KEY,
        group_id INT NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
        team1_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        team2_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        match_date TIMESTAMP NOT NULL,
        matchday INT NOT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'finished')),
        team1_score INT,
        team2_score INT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ matches');

    // 5. predictions
    console.log('Creando predictions...');
    await db.query(`
      CREATE TABLE predictions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        match_id INT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        team1_score INT,
        team2_score INT,
        points_earned INT DEFAULT 0,
        is_joker_used BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT TRUE,
        editable_reason VARCHAR(50) DEFAULT 'initial' CHECK (editable_reason IN ('initial', 'joker', 'perfect_featured')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, match_id)
      )
    `);
    console.log('✅ predictions');

    // 6. user_jokers
    console.log('Creando user_jokers...');
    await db.query(`
      CREATE TABLE user_jokers (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        joker_type VARCHAR(20) NOT NULL CHECK (joker_type IN ('leave_one', 'edit_one')),
        is_used BOOLEAN DEFAULT FALSE,
        used_on_match_id INT REFERENCES matches(id),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, joker_type)
      )
    `);
    console.log('✅ user_jokers');

    // 7. top_scorer_predictions
    console.log('Creando top_scorer_predictions...');
    await db.query(`
      CREATE TABLE top_scorer_predictions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        player_name VARCHAR(100) NOT NULL,
        points_earned INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ top_scorer_predictions');

    // 8. group_order_predictions
    console.log('Creando group_order_predictions...');
    await db.query(`
      CREATE TABLE group_order_predictions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        group_id INT NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
        first_place INT REFERENCES teams(id),
        second_place INT REFERENCES teams(id),
        third_place INT REFERENCES teams(id),
        fourth_place INT REFERENCES teams(id),
        points_earned INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, group_id)
      )
    `);
    console.log('✅ group_order_predictions');

    // 9. password_reset_tokens
    console.log('Creando password_reset_tokens...');
    await db.query(`
      CREATE TABLE password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        token VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ password_reset_tokens');

    // ============================================
    // RLS DESACTIVADO - Usamos autenticación JWT propia
    // ============================================
    console.log('\nℹ️  RLS desactivado en todas las tablas (autenticación JWT propia)\n');

    // ============================================
    // INSERTAR DATOS INICIALES
    // ============================================
    console.log('📦 Insertando datos iniciales...\n');

    // Insertar grupos
    console.log('Insertando grupos...');
    for (const groupName of Object.keys(groupsData)) {
      await db.query('INSERT INTO groups_table (name) VALUES ($1)', [groupName]);
    }
    console.log('✅ 12 grupos insertados (A-L)');

    // Insertar equipos
    console.log('Insertando equipos...');
    let totalTeams = 0;
    for (const [groupName, teams] of Object.entries(groupsData)) {
      const groupResult = await db.query('SELECT id FROM groups_table WHERE name = $1', [groupName]);
      const groupId = groupResult.rows[0].id;

      for (const team of teams) {
        await db.query(
          'INSERT INTO teams (name, country_code, group_id) VALUES ($1, $2, $3)',
          [team.name, team.code, groupId]
        );
        totalTeams++;
      }
    }
    console.log(`✅ ${totalTeams} equipos insertados`);

    // Insertar partidos
    console.log('Insertando partidos...');
    let totalMatches = 0;
    let featuredCount = 0;

    for (const match of allMatches) {
      const groupResult = await db.query('SELECT id FROM groups_table WHERE name = $1', [match.group]);
      const groupId = groupResult.rows[0].id;

      const team1Result = await db.query('SELECT id FROM teams WHERE name = $1 AND group_id = $2', [match.team1, groupId]);
      const team2Result = await db.query('SELECT id FROM teams WHERE name = $1 AND group_id = $2', [match.team2, groupId]);

      if (team1Result.rows.length > 0 && team2Result.rows.length > 0) {
        const featured = isFeaturedMatch(match.team1, match.team2);
        if (featured) featuredCount++;

        await db.query(
          `INSERT INTO matches (group_id, team1_id, team2_id, match_date, matchday, is_featured) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [groupId, team1Result.rows[0].id, team2Result.rows[0].id, match.date, match.matchday, featured]
        );
        totalMatches++;
      }
    }
    console.log(`✅ ${totalMatches} partidos insertados (${featuredCount} destacados)`);

    // ============================================
    // VERIFICACIÓN
    // ============================================
    console.log('\n📊 Verificación de datos:');
    const groupsCount = await db.query('SELECT COUNT(*) FROM groups_table');
    console.log(`   Grupos: ${groupsCount.rows[0].count}`);

    const teamsCount = await db.query('SELECT COUNT(*) FROM teams');
    console.log(`   Equipos: ${teamsCount.rows[0].count}`);

    const matchesCount = await db.query('SELECT COUNT(*) FROM matches');
    console.log(`   Partidos: ${matchesCount.rows[0].count}`);

    const featuredMatchesCount = await db.query('SELECT COUNT(*) FROM matches WHERE is_featured = TRUE');
    console.log(`   Partidos destacados: ${featuredMatchesCount.rows[0].count}`);

    // Mostrar partidos destacados
    const featuredList = await db.query(`
      SELECT g.name as group_name, m.match_date, m.matchday, t1.name as team1, t2.name as team2
      FROM matches m
      JOIN groups_table g ON m.group_id = g.id
      JOIN teams t1 ON m.team1_id = t1.id
      JOIN teams t2 ON m.team2_id = t2.id
      WHERE m.is_featured = TRUE
      ORDER BY m.match_date
    `);
    console.log('\n📌 Partidos destacados:');
    featuredList.rows.forEach(m => {
      const date = new Date(m.match_date).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });
      console.log(`   Ronda ${m.matchday}: ${m.team1} vs ${m.team2} — ${date}`);
    });

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Detalle:', error.detail || 'No hay más detalles');
  } finally {
    await db.end();
    process.exit();
  }
};

createTables();