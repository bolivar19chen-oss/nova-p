import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Postgres (Neon) pool. One pool for the whole process, reused across
// requests -- never open a connection per request.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface Appointment {
  id: string;
  userId: string;
  petId: string;
  date: string;
  time: string;
  type: string;
  veterinarian: string;
  notes: string;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  userId: string;
  petId: string;
  name: string;
  date: string;
  nextDue: string;
  veterinarian: string;
  createdAt: string;
}

export interface LostPetAlert {
  id: string;
  userId: string;
  petName: string;
  date: string;
  location: string;
  description: string;
  contact: string;
  city: string;
  createdAt: string;
}

export interface AnonymousReport {
  id: string;
  category: string;
  description: string;
  location: string;
  city: string;
  createdAt: string;
}

export interface User {
  id: string;
  ownerName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  // Full pet + owner profile, so a real login can restore the dashboard
  // exactly as it was (species, breed, vaccines notes, etc.)
  profile?: Record<string, unknown>;
}

// ---- row (snake_case) -> app object (camelCase) mappers ----
export function rowToUser(row: any): User {
  return {
    id: row.id,
    ownerName: row.owner_name,
    email: row.email,
    passwordHash: row.password_hash,
    profile: row.profile || {},
    createdAt: toIso(row.created_at),
  };
}

export function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    date: row.date,
    time: row.time,
    type: row.type,
    veterinarian: row.veterinarian,
    notes: row.notes,
    createdAt: toIso(row.created_at),
  };
}

export function rowToVaccine(row: any): Vaccine {
  return {
    id: row.id,
    userId: row.user_id,
    petId: row.pet_id,
    name: row.name,
    date: row.date,
    nextDue: row.next_due,
    veterinarian: row.veterinarian,
    createdAt: toIso(row.created_at),
  };
}

export function rowToAlert(row: any): LostPetAlert {
  return {
    id: row.id,
    userId: row.user_id,
    petName: row.pet_name,
    date: row.date,
    location: row.location,
    description: row.description,
    contact: row.contact,
    city: row.city,
    createdAt: toIso(row.created_at),
  };
}

export function rowToAnonymousReport(row: any): AnonymousReport {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    location: row.location,
    city: row.city,
    createdAt: toIso(row.created_at),
  };
}

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

// ---- schema + one-time migration from the old data.json ----
export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      owner_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      pet_id TEXT,
      date TEXT,
      time TEXT,
      type TEXT,
      veterinarian TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);

    CREATE TABLE IF NOT EXISTS vaccines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      pet_id TEXT,
      name TEXT,
      date TEXT,
      next_due TEXT,
      veterinarian TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_vaccines_user_id ON vaccines(user_id);

    CREATE TABLE IF NOT EXISTS lost_pet_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      pet_name TEXT,
      date TEXT,
      location TEXT,
      description TEXT,
      contact TEXT,
      city TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_lost_pet_alerts_user_id ON lost_pet_alerts(user_id);

    CREATE TABLE IF NOT EXISTS anonymous_reports (
      id TEXT PRIMARY KEY,
      category TEXT,
      description TEXT,
      location TEXT,
      city TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await migrateFromJsonIfEmpty();
}

// One-time migration: if data.json has real users and the users table is
// still empty, copy everything over. Safe to run on every boot -- once
// users has rows, this is a no-op.
async function migrateFromJsonIfEmpty() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) return;

  if (!fs.existsSync(DB_PATH)) {
    console.log("[db] no hay data.json, nada que migrar.");
    return;
  }
  const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  if (!raw.users || raw.users.length === 0) {
    console.log("[db] data.json sin usuarios, nada que migrar.");
    return;
  }

  console.log(`[db] migrando ${raw.users.length} usuario(s) desde data.json a Postgres...`);
  for (const u of raw.users) {
    await pool.query(
      `INSERT INTO users (id, owner_name, email, password_hash, profile, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [u.id, u.ownerName, u.email, u.passwordHash, JSON.stringify(u.profile || {}), u.createdAt]
    );
  }
  for (const a of raw.appointments || []) {
    await pool.query(
      `INSERT INTO appointments (id, user_id, pet_id, date, time, type, veterinarian, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [a.id, a.userId, a.petId || null, a.date, a.time, a.type, a.veterinarian, a.notes, a.createdAt]
    );
  }
  for (const v of raw.vaccines || []) {
    await pool.query(
      `INSERT INTO vaccines (id, user_id, pet_id, name, date, next_due, veterinarian, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [v.id, v.userId, v.petId || null, v.name, v.date, v.nextDue, v.veterinarian, v.createdAt]
    );
  }
  for (const al of raw.alerts || []) {
    await pool.query(
      `INSERT INTO lost_pet_alerts (id, user_id, pet_name, date, location, description, contact, city, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [al.id, al.userId, al.petName, al.date, al.location, al.description, al.contact, al.city, al.createdAt]
    );
  }
  for (const r of raw.anonymousReports || []) {
    await pool.query(
      `INSERT INTO anonymous_reports (id, category, description, location, city, created_at)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
      [r.id, r.category, r.description, r.location, r.city, r.createdAt]
    );
  }
  console.log("[db] migracion completa.");
}

// ---- Everything below is UNCHANGED legacy JSON storage. Only the two
// community features not covered by this migration (posts, live
// tracking) still use it. NOTE: this still resets on Vercel's ephemeral
// disk -- out of scope per the migration request, which listed only
// users/appointments/vaccines/lost_pet_alerts/anonymous_reports. ----
const DB_PATH = path.join(__dirname, "data.json");

export interface CommunityComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  city: string;
  petName?: string;
  text: string;
  emoji: string;
  likes: string[]; // list of user ids/names who liked
  comments: CommunityComment[];
  createdAt: string;
}

export interface TrackingRoute {
  petId: string;
  walkerName: string;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  startedAt: string; // ISO timestamp, used to compute live progress
  durationSeconds: number;
  live?: { lat: number; lng: number; updatedAt: string } | null; // set once a real device reports a position
}

interface DBShape {
  posts: CommunityPost[];
  trackingRoutes: TrackingRoute[];
}

function defaultDB(): DBShape {
  return { posts: [], trackingRoutes: [] };
}

function readDB(): DBShape {
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

function writeDB(data: DBShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export const db = {
  get: readDB,
  save: writeDB,
};
