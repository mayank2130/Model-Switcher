import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface LogEntry {
  id: string;
  timestamp: string;
  model?: string;
  modelName?: string;
  prompt?: string;
  response?: string | null;
  error?: string;
  latency_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  status?: 'success' | 'error';
}

type LogData = Omit<LogEntry, 'id' | 'timestamp'>;

class Logger {
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(__dirname, '../')
  }

  async logRequest(data: LogData): Promise<LogEntry> {
    const timestamp = new Date().toISOString();
    
    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: timestamp,
      ...data
    };
    
    await this.appendToFile('requests.json', logEntry);
    
    return logEntry;
  }

  async appendToFile(filename: string, data: LogEntry): Promise<void> {
    const filepath = path.join(this.logsDir, filename);
    
    let existingData: LogEntry[] = [];
    try {
      const fileContent = await fs.readFile(filepath, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      existingData = [];
    }
    
    existingData.push(data);
    
    try {
      await fs.writeFile(filepath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      throw error;
    }
  }

  async readJsonFile(filepath: string): Promise<LogEntry[]> {
    try {
      const fileData = await fs.readFile(filepath, 'utf8');
      const parsedData = JSON.parse(fileData);
      return parsedData;
    } catch (error) {
      return [];
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    const filePath = path.join(this.logsDir, 'requests.json');
    const logs = await this.readJsonFile(filePath);
    return logs;
  }
}

export default Logger;
export { LogData, LogEntry };
