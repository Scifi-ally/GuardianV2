import express from "express";
import cors from "cors";
import {
  handleNewsAnalysis,
  handleNewsMonitoring,
} from "./routes/news-analysis";
import {
  handleRouteAnalysis,
  handleLocationSafety,
  handleRealTimeMonitoring,
} from "./routes/enhanced-navigation";

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

  // News analysis routes for AI-powered safety scoring
  app.post("/api/news-analysis", handleNewsAnalysis);
  app.get("/api/news-monitoring", handleNewsMonitoring);

  // Enhanced navigation routes for smart navigation features
  app.post("/api/route-analysis", handleRouteAnalysis);
  app.post("/api/location-safety", handleLocationSafety);
  app.post("/api/real-time-monitoring", handleRealTimeMonitoring);

  return app;
}
