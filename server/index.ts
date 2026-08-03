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
  app.use(express.json());

  // Real backend API: auth, appointments, vaccines, alerts, community feed
  // and the live pet-tracking simulator all live under /api
  app.use("/api", apiRouter);

  // Uploaded pet photos (persisted to disk, see server/routes.ts)
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
