### Installation

1. **Clone the repo**
```bash
git clone <your-repo-url>
cd assignment
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment**
Create a `.env` file in the root:
```env
PORT=3000
HF_TOKEN=your_hugging_face_token_here
```

4. **Build and run**
```bash
npm run build
npm start
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 🧪 Testing

Run the test suite:
```bash
npm run build
npm test
```

The tests cover:
- Health check endpoint
- Models listing
- Request validation
- Response generation
- Logging functionality
- Statistics tracking

## 🤖 Available Models

- **Kimi-K2-Instruct** - Moonshot AI's conversational model
- **Mistral-7B-Instruct-v0.3** - Mistral AI's instruction-following model

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Frontend interface |
| GET | `/health` | Health check |
| GET | `/models` | List available models |
| POST | `/generate` | Generate AI response |
| GET | `/logs` | Request history |
| GET | `/stats` | Usage statistics |

### Example API Usage

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short poem about coding",
    "model": "kimi-k2",
    "options": {
      "temperature": 0.7,
      "max_tokens": 150
    }
  }'
```

## 📊 Data & Logging

Requests are automatically logged to `requests.json` with:
- Prompt and response
- Latency metrics
- Token usage
- Model information
- Timestamp and unique ID

### Environment Setup
Make sure to set your `HF_TOKEN` in production environment.

## 📝 License

MIT License - see LICENSE file for details.
