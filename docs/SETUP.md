# Setup

## 1. Install
```bash
npm install
cp .env.example .env
cp config/profile.example.json config/profile.json
```

## 2. Configure your profile
Edit `config/profile.json`:
- `skills` — what you actually do well
- `minBudgetUsd` — your floor
- `preferredKeywords` / `avoidKeywords` — steer the scorer
- `sources` — add any public RSS or JSON job feed

## 3. (Recommended) Use your local Ollama
In `.env`:
```
LLM_DEFAULT_PROVIDER=ollama
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:32b
```
Make sure `ollama serve` is running and the model is pulled:
```bash
ollama pull qwen2.5:32b
```

## 4. Verify
```bash
npm run wire    # checks env + config
npm test        # smoke tests (runs in dry-run, no AI needed)
```

## 5. Hunt
```bash
npm run hunt    # one cycle, prints scored gigs
npm start       # REST API on :3000
```

## No AI configured?
Set `LLM_DRY_RUN=true` and everything still runs end-to-end with deterministic stubs. Great for testing the pipeline before wiring a model.
