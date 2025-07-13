const request = require('supertest');
const app = require('../dist/server');

describe('Multi-Model LLM Service', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /models', () => {
    it('should return available models', async () => {
      const response = await request(app)
        .get('/models')
        .expect(200);
      
      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });
  });

  describe('POST /generate', () => {
    it('should return error for missing prompt', async () => {
      const response = await request(app)
        .post('/generate')
        .send({})
        .expect(400);
      
      expect(response.body.error).toBe('Prompt is required');
    });

    it('should return error for invalid model', async () => {
      const response = await request(app)
        .post('/generate')
        .send({ prompt: 'Test prompt', model: 'invalid-model' })
        .expect(400);
      
      expect(response.body.error).toContain('not found');
      expect(response.body.available_models).toBeDefined();
    });

    it('should accept valid request structure', async () => {
      const response = await request(app)
        .post('/generate')
        .send({ 
          prompt: 'Hello, world!',
          model: 'kimi-k2',
          options: { max_tokens: 50 }
        });
      
      // Should either succeed or fail gracefully with API error
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.response).toBeDefined();
        expect(response.body.model).toBe('kimi-k2');
        expect(response.body.latency_ms).toBeDefined();
        expect(response.body.tokens).toBeDefined();
      }
    }, 50000);
  });

  describe('GET /logs', () => {
    it('should return logs array', async () => {
      const response = await request(app)
        .get('/logs')
        .expect(200);
      
      expect(response.body.logs).toBeDefined();
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  describe('GET /stats', () => {
    it('should return statistics', async () => {
      const response = await request(app)
        .get('/stats')
        .expect(200);
      
      expect(response.body.total_requests).toBeDefined();
      expect(response.body.by_model).toBeDefined();
      expect(response.body.average_latency).toBeDefined();
      expect(response.body.total_tokens).toBeDefined();
    });
  });
}); 