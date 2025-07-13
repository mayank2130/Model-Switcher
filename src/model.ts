import { InferenceClient } from "@huggingface/inference";

export interface ModelStats {
    requests: number;
    success: number;
    errors: number;
    avg_latency: number;
    total_tokens: number;
  }
  
interface ModelConfig {
  name: string;
  url: string;
  headers: {
    Authorization: string;
    "Content-Type": string;
  };
}

interface ModelOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

interface ModelResponse {
  text: string;
  input_tokens: number | null;
  output_tokens: number | null;
}

interface ModelResult {
  model: string;
  modelName: string;
  prompt: string;
  response: string | null;
  error?: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  status: 'success' | 'error';
}

const MODELS: Record<string, ModelConfig> = {
  "kimi-k2": {
    name: "Kimi-K2-Instruct",
    url: "",
    headers: {
      Authorization: `Bearer ${process.env["HF_TOKEN"]}`,
      "Content-Type": "application/json",
    },
  },
  "mistral-7b": {
    name: "Mistral-7B-Instruct-v0.3",
    url: "",
    headers: {
      Authorization: `Bearer ${process.env["HF_TOKEN"]}`,
      "Content-Type": "application/json",
    },
  },
};

class ModelService {
  private hfClient: InferenceClient;

  constructor() {
    this.hfClient = new InferenceClient(process.env["HF_TOKEN"]);
  }

  async callModel(modelKey: string, prompt: string, options: ModelOptions = {}): Promise<ModelResult> {
    const model = MODELS[modelKey];
    if (!model) {
      throw new Error(`Model '${modelKey}' not found`);
    }

    const startTime = Date.now();
    
    try {
      let response: ModelResponse;
      
      switch (modelKey) {
        case 'kimi-k2':
          response = await this.callKimiModel(model, prompt, options);
          break;
        case 'mistral-7b':
          response = await this.callMistralModel(model, prompt, options);
          break;
        default:
          throw new Error(`Unsupported model: ${modelKey}`);
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        model: modelKey,
        modelName: model.name,
        prompt,
        response: response.text,
        latency_ms: latency,
        input_tokens: response.input_tokens || 0,
        output_tokens: response.output_tokens || 0,
        total_tokens: (response.input_tokens || 0) + (response.output_tokens || 0),
        status: 'success'
      };

    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        model: modelKey,
        modelName: model.name,
        prompt,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency_ms: latency,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        status: 'error'
      };
    }
  }

  async callKimiModel(model: ModelConfig, prompt: string, options: ModelOptions): Promise<ModelResponse> {
    const jsonPrompt = `Please respond to the following request in valid JSON format:

${prompt}

Response (JSON only):`;

    try {
      const chatCompletion = await this.hfClient.chatCompletion({
        provider: "novita",
        model: "moonshotai/Kimi-K2-Instruct",
        messages: [
          {
            role: "user",
            content: jsonPrompt,
          },
        ],
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
      });

      const message = chatCompletion.choices[0]?.message;
      if (!message?.content) {
        throw new Error('No response content from model');
      }

      return {
        text: message.content,
        input_tokens: chatCompletion.usage?.prompt_tokens || null,
        output_tokens: chatCompletion.usage?.completion_tokens || null
      };
    } catch (error) {
      throw new Error(`Hugging Face SDK error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async callMistralModel(model: ModelConfig, prompt: string, options: ModelOptions): Promise<ModelResponse> {
    const jsonPrompt = `Please respond to the following request in valid JSON format:

${prompt}

Response (JSON only):`;

    try {
      const chatCompletion = await this.hfClient.chatCompletion({
        provider: "novita",
        model: "mistralai/Mistral-7B-Instruct-v0.3",
        messages: [
          {
            role: "user",
            content: jsonPrompt,
          },
        ],
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
      });

      const message = chatCompletion.choices[0]?.message;
      if (!message?.content) {
        throw new Error('No response content from model');
      }

      return {
        text: message.content,
        input_tokens: chatCompletion.usage?.prompt_tokens || null,
        output_tokens: chatCompletion.usage?.completion_tokens || null
      };
    } catch (error) {
      throw new Error(`Hugging Face SDK error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ModelService;
export { ModelConfig, ModelOptions, ModelResponse, ModelResult };