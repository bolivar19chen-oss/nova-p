// server/vercel-entry.ts
import "dotenv/config";
import cors from "cors";
import express from "express";

// server/routes.ts
import { Router } from "express";
import multer from "multer";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";
import { nanoid } from "nanoid";

// server/db.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
function rowToUser(row) {
  return {
    id: row.id,
    ownerName: row.owner_name,
    email: row.email,
    passwordHash: row.password_hash,
    profile: row.profile || {},
    createdAt: toIso(row.created_at)
  };
}
function rowToAppointment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    date: row.date,
    time: row.time,
    type: row.type,
    veterinarian: row.veterinarian,
    notes: row.notes,
    createdAt: toIso(row.created_at)
  };
}
function rowToVaccine(row) {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    name: row.name,
    date: row.date,
    nextDue: row.next_due,
    veterinarian: row.veterinarian,
    createdAt: toIso(row.created_at)
  };
}
function rowToAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    petName: row.pet_name,
    date: row.date,
    location: row.location,
    description: row.description,
    contact: row.contact,
    city: row.city,
    createdAt: toIso(row.created_at)
  };
}
function rowToAnonymousReport(row) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    location: row.location,
    city: row.city,
    createdAt: toIso(row.created_at)
  };
}
function toIso(value) {
  return value instanceof Date ? value.toISOString() : String(value);
}
var DB_PATH = path.join(__dirname, "data.json");
function defaultDB() {
  return { posts: [], trackingRoutes: [] };
}
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(defaultDB());
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return { posts: parsed.posts || [], trackingRoutes: parsed.trackingRoutes || [] };
  } catch {
    return defaultDB();
  }
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}
var db = {
  get: readDB,
  save: writeDB
};

// server/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var DEV_FALLBACK_SECRET = "pet-nova-dev-secret-change-me";
var envSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production") {
  if (!envSecret || envSecret === DEV_FALLBACK_SECRET) {
    throw new Error(
      "JWT_SECRET no est\xE1 definido (o usa el valor de ejemplo del repo). Configur\xE1 una variable de entorno JWT_SECRET real antes de arrancar en producci\xF3n."
    );
  }
} else if (!envSecret) {
  console.warn(
    "[auth] JWT_SECRET no definido - usando secreto de desarrollo. No uses esto en producci\xF3n."
  );
}
var JWT_SECRET = envSecret || DEV_FALLBACK_SECRET;
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}
var MIN_PASSWORD_LENGTH = 8;
var MAX_LOGIN_ATTEMPTS = 5;
var LOGIN_WINDOW_MS = 15 * 60 * 1e3;
var loginAttempts = /* @__PURE__ */ new Map();
function isLoginLocked(key) {
  const rec = loginAttempts.get(key);
  if (!rec || !rec.lockedUntil) return false;
  if (Date.now() >= rec.lockedUntil) {
    loginAttempts.delete(key);
    return false;
  }
  return true;
}
function recordFailedLogin(key) {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || now - rec.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return;
  }
  rec.count++;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.lockedUntil = now + LOGIN_WINDOW_MS;
  }
}
function clearLoginAttempts(key) {
  loginAttempts.delete(key);
}
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}
function attachUser(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.userId = payload.userId;
    } catch {
    }
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: "Debes iniciar sesi\xF3n" });
  next();
}

// server/routes.ts
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var UPLOADS_DIR = path2.join(__dirname2, "uploads");
if (!fs2.existsSync(UPLOADS_DIR)) fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
var upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${nanoid()}${path2.extname(file.originalname)}`)
  }),
  limits: { fileSize: 8 * 1024 * 1024 }
  // 8MB
});
var apiRouter = Router();
apiRouter.use(attachUser);
apiRouter.post("/auth/register", async (req, res) => {
  const { ownerName, email, password, profile } = req.body;
  if (!ownerName || !email || !password) return res.status(400).json({ error: "Faltan campos" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inv\xE1lido" });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contrase\xF1a debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
  }
  const normalizedEmail = email.toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
  }
  const user = {
    id: nanoid(),
    ownerName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    profile: profile || {},
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    await pool.query(
      `INSERT INTO users (id, owner_name, email, password_hash, profile, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.id, user.ownerName, user.email, user.passwordHash, JSON.stringify(user.profile), user.createdAt]
    );
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    throw err;
  }
  const token = signToken(user.id);
  res.status(201).json({ token, user: { id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile } });
});
apiRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inv\xE1lido" });
  const key = email.toLowerCase();
  if (isLoginLocked(key)) {
    return res.status(429).json({ error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos" });
  }
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [key]);
  const user = rows[0] ? rowToUser(rows[0]) : void 0;
  if (!user || !await verifyPassword(password || "", user.passwordHash)) {
    recordFailedLogin(key);
    return res.status(401).json({ error: "Correo o contrase\xF1a incorrectos" });
  }
  clearLoginAttempts(key);
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile } });
});
apiRouter.get("/auth/me", async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: "No autenticado" });
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);
  res.json({ id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile });
});
apiRouter.patch("/auth/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);
  const { ownerName, email, profile } = req.body;
  let newEmail = user.email;
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inv\xE1lido" });
    newEmail = email.toLowerCase();
    const taken = await pool.query("SELECT id FROM users WHERE id != $1 AND email = $2", [user.id, newEmail]);
    if (taken.rows.length > 0) return res.status(409).json({ error: "Ese correo ya est\xE1 en uso" });
  }
  const newOwnerName = ownerName || user.ownerName;
  const newProfile = profile ? { ...user.profile, ...profile } : user.profile;
  await pool.query("UPDATE users SET owner_name = $1, email = $2, profile = $3 WHERE id = $4", [
    newOwnerName,
    newEmail,
    JSON.stringify(newProfile),
    user.id
  ]);
  res.json({ id: user.id, ownerName: newOwnerName, email: newEmail, profile: newProfile });
});
apiRouter.post("/auth/change-password", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Faltan campos" });
  if (newPassword.length < 6) return res.status(400).json({ error: "La nueva contrase\xF1a debe tener al menos 6 caracteres" });
  if (!await verifyPassword(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: "La contrase\xF1a actual no es correcta" });
  }
  const newHash = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
  res.json({ ok: true });
});
apiRouter.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibi\xF3 archivo" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
apiRouter.get("/appointments", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM appointments WHERE user_id = $1 ORDER BY created_at", [req.userId]);
  res.json(rows.map(rowToAppointment));
});
apiRouter.post("/appointments", requireAuth, async (req, res) => {
  const appointment = { ...req.body, id: nanoid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), userId: req.userId };
  await pool.query(
    `INSERT INTO appointments (id, user_id, pet_id, date, time, type, veterinarian, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      appointment.id,
      appointment.userId,
      appointment.petId,
      appointment.date,
      appointment.time,
      appointment.type,
      appointment.veterinarian,
      appointment.notes,
      appointment.createdAt
    ]
  );
  res.status(201).json(appointment);
});
apiRouter.delete("/appointments/:id", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT user_id FROM appointments WHERE id = $1", [req.params.id]);
  if (!rows[0] || rows[0].user_id !== req.userId) {
    return res.status(404).json({ error: "No encontrado" });
  }
  await pool.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
apiRouter.get("/vaccines", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM vaccines WHERE user_id = $1 ORDER BY created_at", [req.userId]);
  res.json(rows.map(rowToVaccine));
});
apiRouter.post("/vaccines", requireAuth, async (req, res) => {
  const vaccine = { ...req.body, id: nanoid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), userId: req.userId };
  await pool.query(
    `INSERT INTO vaccines (id, user_id, pet_id, name, date, next_due, veterinarian, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [vaccine.id, vaccine.userId, vaccine.petId, vaccine.name, vaccine.date, vaccine.nextDue, vaccine.veterinarian, vaccine.createdAt]
  );
  res.status(201).json(vaccine);
});
apiRouter.delete("/vaccines/:id", requireAuth, async (req, res) => {
  const { rows } = await pool.query("SELECT user_id FROM vaccines WHERE id = $1", [req.params.id]);
  if (!rows[0] || rows[0].user_id !== req.userId) {
    return res.status(404).json({ error: "No encontrado" });
  }
  await pool.query("DELETE FROM vaccines WHERE id = $1", [req.params.id]);
  res.status(204).end();
});
apiRouter.get("/alerts", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM lost_pet_alerts ORDER BY created_at DESC");
  res.json(rows.map(rowToAlert));
});
apiRouter.post("/alerts", requireAuth, async (req, res) => {
  const alert = { ...req.body, id: nanoid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), userId: req.userId };
  await pool.query(
    `INSERT INTO lost_pet_alerts (id, user_id, pet_name, date, location, description, contact, city, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [alert.id, alert.userId, alert.petName, alert.date, alert.location, alert.description, alert.contact, alert.city, alert.createdAt]
  );
  res.status(201).json(alert);
});
apiRouter.get("/anonymous-reports", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM anonymous_reports ORDER BY created_at DESC");
  res.json(rows.map(rowToAnonymousReport));
});
apiRouter.post("/anonymous-reports", async (req, res) => {
  const { category, description, location, city } = req.body;
  if (!category || !description) return res.status(400).json({ error: "Faltan campos" });
  const report = {
    id: nanoid(),
    category,
    description,
    location: location || "",
    city: city || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await pool.query(
    `INSERT INTO anonymous_reports (id, category, description, location, city, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [report.id, report.category, report.description, report.location, report.city, report.createdAt]
  );
  res.status(201).json(report);
});
apiRouter.get("/community/posts", (_req, res) => {
  const posts = [...db.get().posts].sort((a, b) => a.createdAt < b.createdAt ? 1 : -1);
  res.json(posts);
});
apiRouter.post("/community/posts", (req, res) => {
  const data = db.get();
  const post = {
    id: nanoid(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    likes: [],
    comments: [],
    ...req.body
  };
  data.posts.push(post);
  db.save(data);
  res.status(201).json(post);
});
apiRouter.post("/community/posts/:id/like", (req, res) => {
  const data = db.get();
  const post = data.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "not found" });
  const user = req.body.user || "anon";
  post.likes = post.likes.includes(user) ? post.likes.filter((u) => u !== user) : [...post.likes, user];
  db.save(data);
  res.json(post);
});
apiRouter.post("/community/posts/:id/comments", (req, res) => {
  const data = db.get();
  const post = data.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "not found" });
  const comment = { id: nanoid(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), author: req.body.author, text: req.body.text };
  post.comments.push(comment);
  db.save(data);
  res.status(201).json(post);
});
apiRouter.post("/tracking/start", (req, res) => {
  const data = db.get();
  const route = {
    petId: req.body.petId,
    walkerName: req.body.walkerName || "Paseador Pet Nova",
    start: req.body.start,
    end: req.body.end,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationSeconds: req.body.durationSeconds || 240,
    live: null
  };
  data.trackingRoutes = data.trackingRoutes.filter((r) => r.petId !== route.petId);
  data.trackingRoutes.push(route);
  db.save(data);
  res.status(201).json(route);
});
apiRouter.post("/tracking/:petId/update", (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat/lng num\xE9ricos requeridos" });
  }
  const data = db.get();
  const route = data.trackingRoutes.find((r) => r.petId === req.params.petId);
  if (!route) return res.status(404).json({ error: "no active route \u2014 llama /tracking/start primero" });
  route.live = { lat, lng, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  db.save(data);
  res.json(route);
});
apiRouter.get("/tracking/:petId", (req, res) => {
  const route = db.get().trackingRoutes.find((r) => r.petId === req.params.petId);
  if (!route) return res.status(404).json({ error: "no active route" });
  if (route.live) {
    return res.json({
      petId: route.petId,
      walkerName: route.walkerName,
      lat: route.live.lat,
      lng: route.live.lng,
      progress: null,
      etaSeconds: null,
      arrived: false,
      source: "live-gps"
    });
  }
  const elapsedSec = (Date.now() - new Date(route.startedAt).getTime()) / 1e3;
  const progress = Math.min(1, Math.max(0, elapsedSec / route.durationSeconds));
  const lat = route.start.lat + (route.end.lat - route.start.lat) * progress;
  const lng = route.start.lng + (route.end.lng - route.start.lng) * progress;
  const etaSeconds = Math.max(0, Math.round(route.durationSeconds - elapsedSec));
  res.json({
    petId: route.petId,
    walkerName: route.walkerName,
    lat,
    lng,
    progress,
    etaSeconds,
    arrived: progress >= 1,
    source: "simulated"
  });
});

// server/vercel-entry.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
