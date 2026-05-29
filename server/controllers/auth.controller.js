import db from '../../db/connection.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';

// ⭐ Configurar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función helper para generar JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    partitioned: true,
  });
};

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ⭐ Función para enviar email con Resend
const sendResetEmail = async (email, code) => {
  console.log(`\n📧 Enviando código de recuperación a ${email}...`);

  try {
    const { data, error } = await resend.emails.send({
      from: 'QuinielaPro 2026 <onboarding@resend.dev>',
      to: [email],
      subject: 'Código de recuperación - QuinielaPro 2026',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f7f9fc; padding: 40px 20px;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #041534; margin-top: 16px; font-size: 24px;">QuinielaPro 2026</h2>
            </div>
            <h3 style="color: #191c1e; font-size: 20px; margin-bottom: 12px;">Recuperación de contraseña</h3>
            <p style="color: #45464e; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:
            </p>
            <div style="background-color: #041534; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 12px;">${code}</span>
            </div>
            <p style="color: #75777f; font-size: 14px; line-height: 20px; margin-bottom: 8px;">
              ⏰ Este código expirará en <strong>15 minutos</strong>.
            </p>
            <p style="color: #75777f; font-size: 14px; line-height: 20px;">
              🔒 Si no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Error Resend:', error.message);
      return false;
    }

    console.log(`✅ Email enviado a ${email} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.log(`📋 Código (desarrollo): ${code}`);
    }
    return false;
  }
};

// ============================================
// REGISTRO
// ============================================
export const register = async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (nickname.length < 3) {
      return res.status(400).json({ error: 'El apodo debe tener al menos 3 caracteres' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const nicknameCheck = await db.query('SELECT id FROM profiles WHERE nickname = $1', [nickname]);
    if (nicknameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El apodo ya está en uso' });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await db.query("SELECT crypt($1, gen_salt('bf')) as hash", [password]);
    const hash = hashedPassword.rows[0].hash;

    await db.query(`
      INSERT INTO auth.users (id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [userId, email, hash, JSON.stringify({ provider: 'email', providers: ['email'] }), JSON.stringify({ nickname })]);

    await db.query(`
      INSERT INTO profiles (id, nickname, role, total_points, exact_picks, partial_picks, perfect_featured_picks)
      VALUES ($1, $2, 'user', 0, 0, 0, 0)
    `, [userId, nickname]);

    await db.query(`INSERT INTO user_jokers (user_id, joker_type) VALUES ($1, 'leave_one'), ($1, 'edit_one')`, [userId]);

    const token = generateToken(userId, 'user');
    setTokenCookie(res, token);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: { id: userId, nickname, email, role: 'user', total_points: 0 }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// ============================================
// LOGIN
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const userResult = await db.query('SELECT id, email, encrypted_password FROM auth.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];
    const passwordCheck = await db.query('SELECT crypt($1, $2) = $2 AS match', [password, user.encrypted_password]);
    if (!passwordCheck.rows[0].match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const profileResult = await db.query('SELECT * FROM profiles WHERE id = $1', [user.id]);
    const profile = profileResult.rows[0];

    const token = generateToken(user.id, profile.role);
    setTokenCookie(res, token);

    res.json({
      message: 'Login exitoso',
      user: { id: profile.id, nickname: profile.nickname, email: user.email, role: profile.role, total_points: profile.total_points }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// ============================================
// LOGOUT
// ============================================
export const logout = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 0
    });
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

// ============================================
// VERIFICAR TOKEN
// ============================================
export const me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const profileResult = await db.query(
      'SELECT id, nickname, role, total_points, exact_picks, partial_picks, perfect_featured_picks, country, avatar_url FROM profiles WHERE id = $1',
      [decoded.userId]
    );
    if (profileResult.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

    res.json({ user: profileResult.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'El email es requerido' });

    const userResult = await db.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás un código de recuperación' });
    }

    const user = userResult.rows[0];
    const code = generateResetCode();

    await db.query("UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE", [user.id]);
    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '15 minutes')",
      [user.id, code]
    );

    const emailSent = await sendResetEmail(email, code);

    res.json({
      message: 'Si el email existe, recibirás un código de recuperación',
      ...(process.env.NODE_ENV === 'development' && !emailSent && { code })
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email y código son requeridos' });

    const userResult = await db.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const user = userResult.rows[0];
    const tokenResult = await db.query(
      `SELECT * FROM password_reset_tokens 
       WHERE user_id = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    res.json({ message: 'Código válido', verified: true });
  } catch (error) {
    console.error('Error en verify code:', error);
    res.status(500).json({ error: 'Error al verificar el código' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'Todos los campos son requeridos' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const userResult = await db.query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Código inválido o expirado' });

    const user = userResult.rows[0];
    const tokenResult = await db.query(
      `SELECT * FROM password_reset_tokens 
       WHERE user_id = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, code]
    );
    if (tokenResult.rows.length === 0) return res.status(400).json({ error: 'Código inválido o expirado' });

    const hashedPassword = await db.query("SELECT crypt($1, gen_salt('bf')) as hash", [newPassword]);
    const hash = hashedPassword.rows[0].hash;

    await db.query('UPDATE auth.users SET encrypted_password = $1, updated_at = NOW() WHERE id = $2', [hash, user.id]);
    await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenResult.rows[0].id]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};