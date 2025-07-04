import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleNewsAnalysis,
  handleNewsMonitoring,
} from "./routes/news-analysis";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // News analysis routes for AI-powered safety scoring
  app.post("/api/news-analysis", handleNewsAnalysis);
  app.get("/api/news-monitoring", handleNewsMonitoring);

  return app;
}
