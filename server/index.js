import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import predictionsRoutes from "./routes/predictions.routes.js";
import resultsRoutes from "./routes/results.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import standingsRoutes from "./routes/standings.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS para producción
const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:4173",
  "https://quiniela2026.codigofocus.com",
  process.env.FRONTEND_URL, 
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ Origen bloqueado por CORS:", origin);
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "⚽ QuinielaPro 2026 API running",
    timestamp: new Date().toISOString(),
  });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/standings", standingsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`\n⚽ QuinielaPro 2026 API`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
});
