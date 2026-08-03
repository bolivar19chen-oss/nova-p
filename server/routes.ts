import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import {
  db,
  pool,
  TrackingRoute,
  User,
  Appointment,
  Vaccine,
  LostPetAlert,
  AnonymousReport,
  rowToUser,
  rowToAppointment,
  rowToVaccine,
  rowToAlert,
  rowToAnonymousReport,
} from "./db";
import {
  hashPassword,
  verifyPassword,
  signToken,
  attachUser,
  requireAuth,
  AuthedRequest,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  isLoginLocked,
  recordFailedLogin,
  clearLoginAttempts,
} from "./auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// En serverless (Vercel) el disco es de solo lectura salvo /tmp, asi que crear
// la carpeta junto al codigo revienta el modulo entero al importarse y tumba
// TODA la API, no solo las subidas. Por eso: /tmp en Vercel, y el mkdir va
// envuelto para que un disco de solo lectura nunca impida arrancar.
//
// OJO: /tmp es efimero en serverless. Las fotos subidas en produccion
// desaparecen entre invocaciones. La solucion real es almacenamiento de
// objetos (Vercel Blob o S3); esto solo evita que el arranque falle.
const UPLOADS_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");

try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.warn("[uploads] no se pudo crear el directorio, las subidas quedaran deshabilitadas:", err);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${nanoid()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

export const apiRouter = Router();
apiRouter.use(attachUser);

// ---------- Auth ----------
apiRouter.post("/auth/register", async (req, res) => {
  const { ownerName, email, password, profile } = req.body;
  if (!ownerName || !email || !password) return res.status(400).json({ error: "Faltan campos" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inválido" });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
  }
  const normalizedEmail = email.toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
  }
  const user: User = {
    id: nanoid(),
    ownerName,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    profile: profile || {},
    createdAt: new Date().toISOString(),
  };
  try {
    await pool.query(
      `INSERT INTO users (id, owner_name, email, password_hash, profile, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.id, user.ownerName, user.email, user.passwordHash, JSON.stringify(user.profile), user.createdAt]
    );
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    throw err;
  }
  const token = signToken(user.id);
  res.status(201).json({ token, user: { id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile } });
});

apiRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inválido" });
  const key = email.toLowerCase();
  if (isLoginLocked(key)) {
    return res.status(429).json({ error: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos" });
  }
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [key]);
  const user = rows[0] ? rowToUser(rows[0]) : undefined;
  if (!user || !(await verifyPassword(password || "", user.passwordHash))) {
    recordFailedLogin(key);
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }
  clearLoginAttempts(key);
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile } });
});

apiRouter.get("/auth/me", async (req: AuthedRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "No autenticado" });
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);
  res.json({ id: user.id, ownerName: user.ownerName, email: user.email, profile: user.profile });
});

// Update the logged-in user's account name/email and/or pet profile fields.
apiRouter.patch("/auth/me", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);

  const { ownerName, email, profile } = req.body as { ownerName?: string; email?: string; profile?: Record<string, unknown> };

  let newEmail = user.email;
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    if (!isValidEmail(email)) return res.status(400).json({ error: "Correo inválido" });
    newEmail = email.toLowerCase();
    const taken = await pool.query("SELECT id FROM users WHERE id != $1 AND email = $2", [user.id, newEmail]);
    if (taken.rows.length > 0) return res.status(409).json({ error: "Ese correo ya está en uso" });
  }
  const newOwnerName = ownerName || user.ownerName;
  const newProfile = profile ? { ...user.profile, ...profile } : user.profile;

  await pool.query("UPDATE users SET owner_name = $1, email = $2, profile = $3 WHERE id = $4", [
    newOwnerName,
    newEmail,
    JSON.stringify(newProfile),
    user.id,
  ]);
  res.json({ id: user.id, ownerName: newOwnerName, email: newEmail, profile: newProfile });
});

// Change the logged-in user's password (requires the current one).
apiRouter.post("/auth/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado" });
  const user = rowToUser(rows[0]);

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Faltan campos" });
  if (newPassword.length < 6) return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "La contraseña actual no es correcta" });
  }
  const newHash = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
  res.json({ ok: true });
});

// ---------- Photo upload (real files persisted to disk) ----------
apiRouter.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- Appointments (private to the owning user) ----------
apiRouter.get("/appointments", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT * FROM appointments WHERE user_id = $1 ORDER BY created_at", [req.userId]);
  res.json(rows.map(rowToAppointment));
});

apiRouter.post("/appointments", requireAuth, async (req: AuthedRequest, res) => {
  const appointment: Appointment = { ...req.body, id: nanoid(), createdAt: new Date().toISOString(), userId: req.userId! };
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
      appointment.createdAt,
    ]
  );
  res.status(201).json(appointment);
});

apiRouter.delete("/appointments/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT user_id FROM appointments WHERE id = $1", [req.params.id]);
  // 404 (not 403) whether the id doesn't exist or belongs to someone else,
  // so a caller can't use the status code to probe which ids exist.
  if (!rows[0] || rows[0].user_id !== req.userId) {
    return res.status(404).json({ error: "No encontrado" });
  }
  await pool.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

// ---------- Vaccines (private to the owning user) ----------
apiRouter.get("/vaccines", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT * FROM vaccines WHERE user_id = $1 ORDER BY created_at", [req.userId]);
  res.json(rows.map(rowToVaccine));
});

apiRouter.post("/vaccines", requireAuth, async (req: AuthedRequest, res) => {
  const vaccine: Vaccine = { ...req.body, id: nanoid(), createdAt: new Date().toISOString(), userId: req.userId! };
  await pool.query(
    `INSERT INTO vaccines (id, user_id, pet_id, name, date, next_due, veterinarian, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [vaccine.id, vaccine.userId, vaccine.petId, vaccine.name, vaccine.date, vaccine.nextDue, vaccine.veterinarian, vaccine.createdAt]
  );
  res.status(201).json(vaccine);
});

apiRouter.delete("/vaccines/:id", requireAuth, async (req: AuthedRequest, res) => {
  const { rows } = await pool.query("SELECT user_id FROM vaccines WHERE id = $1", [req.params.id]);
  if (!rows[0] || rows[0].user_id !== req.userId) {
    return res.status(404).json({ error: "No encontrado" });
  }
  await pool.query("DELETE FROM vaccines WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

// ---------- Lost pet alerts ----------
// Community feature by design: anyone can browse alerts (GET stays public,
// no requireAuth), but only the authenticated creator can post as
// themselves or later manage their own alert.
apiRouter.get("/alerts", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM lost_pet_alerts ORDER BY created_at DESC");
  res.json(rows.map(rowToAlert));
});

apiRouter.post("/alerts", requireAuth, async (req: AuthedRequest, res) => {
  const alert: LostPetAlert = { ...req.body, id: nanoid(), createdAt: new Date().toISOString(), userId: req.userId! };
  await pool.query(
    `INSERT INTO lost_pet_alerts (id, user_id, pet_name, date, location, description, contact, city, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [alert.id, alert.userId, alert.petName, alert.date, alert.location, alert.description, alert.contact, alert.city, alert.createdAt]
  );
  res.status(201).json(alert);
});

// ---------- Anonymous reports (no auth by design) ----------
apiRouter.get("/anonymous-reports", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM anonymous_reports ORDER BY created_at DESC");
  res.json(rows.map(rowToAnonymousReport));
});

apiRouter.post("/anonymous-reports", async (req, res) => {
  const { category, description, location, city } = req.body;
  if (!category || !description) return res.status(400).json({ error: "Faltan campos" });
  const report: AnonymousReport = {
    id: nanoid(),
    category,
    description,
    location: location || "",
    city: city || "",
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO anonymous_reports (id, category, description, location, city, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [report.id, report.category, report.description, report.location, report.city, report.createdAt]
  );
  res.status(201).json(report);
});

// ---------- Community feed ----------
apiRouter.get("/community/posts", (_req, res) => {
  const posts = [...db.get().posts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(posts);
});

apiRouter.post("/community/posts", (req, res) => {
  const data = db.get();
  const post = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    ...req.body,
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
  const comment = { id: nanoid(), createdAt: new Date().toISOString(), author: req.body.author, text: req.body.text };
  post.comments.push(comment);
  db.save(data);
  res.status(201).json(post);
});

// ---------- Pet Map: live "buddy on the way" tracking ----------
// No physical GPS device is attached yet, so position is computed live
// on the server from elapsed time along a start->end route. Swap the
// math below for real device coordinates once a mobile GPS feed exists.
apiRouter.post("/tracking/start", (req, res) => {
  const data = db.get();
  const route: TrackingRoute = {
    petId: req.body.petId,
    walkerName: req.body.walkerName || "Paseador Pet Nova",
    start: req.body.start,
    end: req.body.end,
    startedAt: new Date().toISOString(),
    durationSeconds: req.body.durationSeconds || 240,
    live: null,
  };
  data.trackingRoutes = data.trackingRoutes.filter((r) => r.petId !== route.petId);
  data.trackingRoutes.push(route);
  db.save(data);
  res.status(201).json(route);
});

// Real GPS devices/apps call this with the actual coordinates. Once a
// "live" reading exists for a pet, GET /tracking/:petId returns it
// instead of the simulated position — no other change needed.
apiRouter.post("/tracking/:petId/update", (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat/lng numéricos requeridos" });
  }
  const data = db.get();
  const route = data.trackingRoutes.find((r) => r.petId === req.params.petId);
  if (!route) return res.status(404).json({ error: "no active route — llama /tracking/start primero" });
  route.live = { lat, lng, updatedAt: new Date().toISOString() };
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
      source: "live-gps",
    });
  }

  const elapsedSec = (Date.now() - new Date(route.startedAt).getTime()) / 1000;
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
    source: "simulated",
  });
});
