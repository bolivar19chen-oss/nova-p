// Carga .env antes que cualquier otro modulo, porque auth.ts valida JWT_SECRET
// al importarse y db.ts necesita DATABASE_URL.
import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./routes";
import { initDB } from "./db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDB();

  const app = express();
  const server = createServer(app);

  app.use(cors());
  // Default express.json() limit is 100kb -- too small for a base64 pet photo
  // (target ~700KB, see server/routes.ts). 2mb leaves headroom and our own
  // check in routes.ts still rejects anything over the real ~700KB limit.
  app.use(express.json({ limit: "2mb" }));

  // Real backend API: auth, appointments, vaccines, alerts, community feed
  // and the live pet-tracking simulator all live under /api
  app.use("/api", apiRouter);

  // Legacy: pet photos used to be written here via multer. Now they're
  // stored as base64 in profile.photo (see server/routes.ts), so this
  // directory is never written to; kept only so old /uploads/* links
  // (if any survived from before the migration) don't 404 the whole route.
  app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
