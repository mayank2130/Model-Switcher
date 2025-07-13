import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import ModelService, { ModelStats } from "./model";
import Logger, { LogEntry } from "./logger";

dotenv.config();

const modelService = new ModelService();
const logger = new Logger();

const app = express();
const PORT = process.env["PORT"] || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.static("public"));

const AVAILABLE_MODELS: Record<string, { name: string; description: string }> =
  {
    "kimi-k2": {
      name: "Kimi-K2-Instruct",
      description: "Moonshot AI's Kimi K2 Instruct model",
    },
    "mistral-7b": {
      name: "Mistral-7B-Instruct-v0.3",
      description: "Mistral AI's 7B Instruct model v0.3",
    },
  };

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/models", (req: Request, res: Response) => {
  const modelList = Object.entries(AVAILABLE_MODELS).map(([key, model]) => ({
    key,
    name: model.name,
    description: model.description,
  }));

  res.json({ models: modelList });
});

app.post("/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, model = "kimi-k2", options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!AVAILABLE_MODELS[model]) {
      return res.status(400).json({
        error: `Model '${model}' not found`,
        available_models: Object.keys(AVAILABLE_MODELS),
      });
    }

    const result = await modelService.callModel(model, prompt, options);

    await logger.logRequest(result);

    if (result.status === "error") {
      return res.status(500).json({
        error: result.error,
        model: result.model,
        latency_ms: result.latency_ms,
      });
    }

    return res.json({
      response: result.response,
      model: result.model,
      model_name: result.modelName,
      latency_ms: result.latency_ms,
      tokens: {
        input: result.input_tokens,
        output: result.output_tokens,
        total: result.total_tokens,
      },
    });
  } catch (error) {
    console.error("Error in /generate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/logs", async (req: Request, res: Response) => {
  try {
    const logs = await logger.getLogs();
    res.json({ logs });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

app.get("/stats", async (req: Request, res: Response) => {
  try {
    const logs = await logger.getLogs();

    const stats: {
      total_requests: number;
      by_model: Record<string, ModelStats>;
      average_latency: number;
      total_tokens: number;
    } = {
      total_requests: logs.length,
      by_model: {},
      average_latency: 0,
      total_tokens: 0,
    };

    logs.forEach((log: LogEntry) => {
      if (!stats.by_model[log.model || ""]) {
        stats.by_model[log.model || ""] = {
          requests: 0,
          success: 0,
          errors: 0,
          avg_latency: 0,
          total_tokens: 0,
        };
      }

      const modelKey = log.model || "";
      const modelStats = stats.by_model[modelKey];
      if (modelStats) {
        modelStats.requests++;

        if (log.status === "success") {
          modelStats.success++;
        } else {
          modelStats.errors++;
        }

        modelStats.avg_latency =
          (modelStats.avg_latency * (modelStats.requests - 1) +
            (log.latency_ms || 0)) /
          modelStats.requests;
        modelStats.total_tokens += log.total_tokens || 0;
      }

      stats.total_tokens += log.total_tokens || 0;
    });

    if (logs.length > 0) {
      stats.average_latency =
        logs.reduce(
          (sum: number, log: LogEntry) => sum + (log.latency_ms || 0),
          0
        ) / logs.length;
    }

    res.json(stats);
  } catch (error) {
    console.error("Error generating stats:", error);
    res.status(500).json({ error: "Failed to generate stats" });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Only start the server if this file is run directly (not during testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Multi-Model LLM Service running on port ${PORT}`);
    console.log(`🤖 Models: http://localhost:${PORT}/models`);
  });
}

module.exports = app;