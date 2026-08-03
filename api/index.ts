// Punto de entrada para Vercel.
//
// Vercel es serverless: no hay un proceso que quede escuchando, sino una funcion
// que se invoca por request. Por eso este archivo NO llama a listen(): exporta la
// app de Express y Vercel la envuelve.
//
// server/index.ts sigue existiendo y es el que se usa en local con `pnpm dev:server`.
// Los dos comparten el mismo apiRouter, asi que la logica no se duplica.
import "dotenv/config";
import cors from "cors";
import express from "express";
import { apiRouter } from "../server/routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

export default app;
