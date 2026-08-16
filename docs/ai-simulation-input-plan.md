# NEURON — AI-Powered Natural Language Simulation Control
## Implementation Plan

---

## 1. Current Architecture

### Simulation Domains & Engines

There are **6 scientific domains**: `physics`, `biology`, `anatomy`, `mathematics`, `quantum`, `space` (matching `ScientificDomain` in `components/simulation-runner/simulation.types.ts:11`).

There are **17 canvas-backed interactive simulations** (listed in `components/simulations/constants.ts:5-12`):

| Domain | Simulations | Engine Case Name |
|--------|------------|-----------------|
| physics | relativity, motion, gravity, pendulum, thermodynamics, optics, wave_interference, electrostatics | `SimulationEngine.updatePhysics()` switch |
| biology | bacteria, virus, immune, genetics, photosynthesis, enzymes, osmosis, ecosystem |  |
| anatomy | heart, neural, blood, nephron, pulmonary, muscle, endocrine, bone |  |
| mathematics | functions, probability, graph, chaos, fractal, fourier, calculus, fibonacci |  |
| quantum | wave, uncertainty, tunneling, spin, entanglement, hydrogen, harmonic, superposition |  |
| space | orbit, blackhole, stellar, cosmology, nebula, tides, magnetosphere, pulsar |  |

There are **additional conceptual (non-canvas) simulations** rendered by `ConceptualTelemetryHUD` — any simulation ID not in `INTERACTIVE_SIM_IDS`.

### Simulation Engine

The engine is **entirely client-side** (`components/simulation-runner/simulation-engine.ts`, 1,176 lines):
- `SimulationEngine` class — pure JS/TS, no code execution, uses `<canvas>` 2D context
- Lifecycle: `start()`, `stop()`, `resetTime()`, `destroy()`, `updateParameter()`
- Telemetry: emits `TelemetrySnapshot` every 100ms (`TELEMETRY_SYNC_INTERVAL_MS` in `engine-constants.ts:6`)
- `stateSnapshot` is a `Record<string, unknown>` that the engine writes to each tick
- Parameters: `Record<string, number>` — passed into constructor from `defaultParams`

### Simulation Configuration

There are **two parallel configuration sources** (a known divergence):

1. **Client-side (live)**: `LOCAL_FALLBACK_CONFIG` in `components/simulation-runner/simulation-runner.tsx:65-598` — a complete hardcoded `Record<ScientificDomain, SimulationDomainConfig>` with all 17 simulations, their `defaultParams`, and `paramsList` (key, label, min, max, step).

2. **Server-side (orphaned)**: `SimulationConfig` Mongoose model (`src/database/models/simulation-config.ts`) defines `ISubSimulation` with the same fields (`id`, `name`, `desc`, `equation`, `defaultParams`, `paramsList: IParamsList[]`). However, **no API route serves `/api/simulations/config`** — the directory `app/api/simulations/config/` exists but is empty. The client `fetchSimulationConfig()` in `components/simulations/simulation-config-client.ts:21` calls `/api/simulations/config` which 404s, triggering the `LOCAL_FALLBACK_CONFIG`.

### API Routes — Simulations

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/simulations/config` | GET | **Missing route file** — client silently falls back to `LOCAL_FALLBACK_CONFIG` |
| `/api/simulations/interpret` | POST | Streams AI telemetry analysis (`app/api/simulations/interpret/route.ts`, 1,115 lines). Sends `domain`, `simulationId`, `parameters`, `stateSnapshot`, `userQuestion` → streams back `[EXPLANATION]`, `[KEY INSIGHTS]`, `[CONCEPTS]`, `[RECOMMENDED ACTIONS]`, `[METADATA]`. Saves to `SimulationRun` model. Has a large inline `generateLocalSimulationFallback()` (lines 16–817) covering all 6 domains with 25+ simulation cases. |
| `/api/simulations/history` | GET | Fetches `SimulationRun` history with ETag caching (62 lines) |

### API Routes — Spark AI

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/spark/chat` | POST | Streaming AI mentor conversation. 3-tier hybrid: LLM provider → MongoDB knowledge → offline concept graph fallback (249 lines) |
| `/api/spark/sessions` | POST | Create Spark session via `SparkAIService.createSession()` (44 lines) |
| `/api/spark/context` | GET | Aggregate learning context (43 lines) |
| `/api/spark/history` | GET | Fetch session history (47 lines) |

### AI Infrastructure

```
LLMProviderFactory (provider.factory.ts:11)
├── getProvider() → OpenRouterProvider | OpenAIProvider
├── streamCompletion(messages, options) → ReadableStream
└── generateCompletion(messages, options) → string
```

- Config in `src/config/env.ts:43-49`: `config.ai.openRouterApiKey`, `config.ai.openaiApiKey`, `config.ai.openRouterModel`, `config.ai.openaiModel`, `config.ai.activeProvider`
- `OpenRouterProvider` uses `https://openrouter.ai/api/v1/chat/completions` with model `google/gemma-4-26b-a4b-it:free`
- `OpenAIProvider` uses `https://api.openai.com/v1/chat/completions` with model `gpt-4-turbo`

**Spark AI architecture pattern** (the model for simulation AI):
1. `SparkService.prepareLLMRequest()` — aggregates context via `SparkContext`, retrieves knowledge via `SparkRetrieval`, builds prompt via `PromptBuilder`
2. `LLMProviderFactory.getProvider().streamCompletion()` — streams response
3. On timeout/failure → `SparkService.generateLocalFallback()` → `SparkFallback.generateExplanation()` (offline concept graph with 6 hardcoded concepts)
4. `SparkService.saveAssistantResponse()` — post-processes via `ResponseParser`, registers discoveries, awards XP

### Persistence

- **`SimulationRun`** (`src/database/models/simulation-run.ts:8`) — stores completed simulation runs with parameters, state snapshot, AI interpretation, and timestamp. Indexed by `userId + domain + timestamp`.
- **`SimulationConfig`** (`src/database/models/simulation-config.ts:20`) — Mongoose model for simulation definitions, but **not served by any API route**
- **`SimulationHistory`** (`src/database/models/simulation-history.ts`) — per-user simulation attempt history with scores, used by the explore page
- **`SparkSession`** (`src/database/models/spark-session.ts`) — Spark AI conversation sessions with messages, context, and insights

### Security & Auth

- `requireAuth(handler)` — validates JWT from `Authorization` header or `neuron_session` cookie (`src/middleware/auth.ts:69`)
- `requireCsrfProtection(handler)` — validates CSRF token from `x-csrf-token` header + `neuron_csrf` cookie (`src/lib/security/csrf.ts:46`)
- `requireSimulationCsrfProtection(handler)` — wraps `requireCsrfProtection` for simulation mutation endpoints (`src/lib/security/simulation-security.ts:7`)
- `validateSimulationRun(data, schema)` — Zod-based validation (`src/lib/security/validation.ts:41`) using `SimulationRunCreateSchema` which validates `simulationId`, `domain`, `parameters` (Record<string, number>), `stateSnapshot`, `userQuestion`
- `withErrorHandling`, `withRateLimit` middleware wrappers also exist

### Key Types

**`IParamsList`** (`src/database/models/simulation-config.ts:3`): `{ key: string; label: string; min: number; max: number; step: number }`

**`ISubSimulation`** (`src/database/models/simulation-config.ts:11`): `{ id: string; name: string; desc: string; equation: string; defaultParams: Record<string, number>; paramsList: IParamsList[] }`

**`ISimulationConfig`** (`src/database/models/simulation-config.ts:20`): `{ domainKey: string; name: string; colorClass; glowClass; accentHex; simulations: ISubSimulation[] }`

**`Simulation`** interface (`components/simulation-runner/simulation.types.ts:27`): Same shape as `ISubSimulation` plus client-side extensions

**`InteractiveSimulationConfig`** (`simulation.types.ts:140`): `{ domain: ScientificDomain; simulationId: string; parameters: Record<string, number>; stateSnapshot?: Record<string, unknown> }` — used for telemetry interpretation

### Response Format Convention

Both Spark (`prompt.builder.ts`) and Interpret route use the same structured format:
```markdown
[EXPLANATION]
...explanation...

---

[KEY INSIGHTS] / [KEY POINTS]
- point 1
...

---

[CONCEPTS]
- concept 1
...

---

[RECOMMENDED ACTIONS] / [FOLLOW UPS]
- action 1
...

---

[METADATA]
{ "domain": "...", ... }
```

### What Does NOT Exist

- **No simulation registry API** — `/api/simulations/config` directory exists but has no `route.ts`. The `SimulationConfig` Mongoose model is never queried by any route
- **No server-side simulation execution** — the engine is purely client-side canvas rendering
- **No AI-to-parameter conversion** — current AI (`interpret` route) only explains existing parameters; it does not convert natural language to `SimulationConfig`
- **No existing AI schema for simulation parameter extraction**
- **No `prompt-registry` or prompt templates** for simulation AI (unlike Spark's `PromptBuilder`)

---

## 2. Proposed Architecture

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│                    SIMULATION REGISTRY                  │
│  Single source of truth: /lib/simulation/registry.ts   │
│    Defines: simulationId, domain, params, ranges        │
│    Used by: AI interpretation, traditional UI,          │
│             validation, config API                       │
└─────────────┬───────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
┌────────────┐    ┌──────────────────────────┐
│ Traditional  │  │  AI Interpretation Layer  │
│ UI (sliders) │  │  /api/simulations/interpret-to-config│
│              │  │  Uses LLMProvider + Zod   │
└──────┬───────┘  └──────────┬───────────────┘
       │                     │
       └──────────┬──────────┘
                  ▼
       ┌──────────────────────┐
       │ Validation Pipeline   │
       │ 1. Zod schema         │
       │ 2. Registry bounds    │
       │ 3. Unit conversion    │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │ Simulation Engine     │
       │ (client-side canvas)  │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │ AI Result Analysis    │
       │ /api/simulations/     │
       │   interpret (reuse)   │
       └──────────────────────┘
```

### New File: Simulation Registry (`src/lib/simulation/registry.ts`)

This is the **single source of truth** for all simulation metadata. It consolidates:
- The hardcoded `LOCAL_FALLBACK_CONFIG` from `simulation-runner.tsx`
- The Mongoose `SimulationConfig` model shape
- The client-side `Simulation` interface
- The `IParamsList` type

The registry will be an **in-memory TypeScript module** (no DB dependency), exported as a `Map<string, SimulationDefinition>` keyed by `${domain}:${simulationId}`.

```typescript
// src/lib/simulation/registry.types.ts
export interface SimulationParameter {
  key: string;
  label: string;
  description?: string;
  unit?: string;
  type: 'number' | 'integer';
  min: number;
  max: number;
  step: number;
  default: number;
  required: boolean;
}

export interface SimulationDefinition {
  id: string;
  name: string;
  description: string;
  domain: ScientificDomain;
  equation: string;
  parameters: SimulationParameter[];
  // Convenience: map of key → { min, max, step, default }
  paramMap: Record<string, { min: number; max: number; step: number; default: number }>;
}
```

```typescript
// src/lib/simulation/registry.ts
// Exports: SIMULATION_REGISTRY (Map), getSimulation(id, domain), 
//          getAllSimulations(), getParamsForSim(id, domain)
```

This registry will be **generated from the `LOCAL_FALLBACK_CONFIG`** currently in `simulation-runner.tsx`. The existing client fallback config (lines 65-598) will be refactored to import from this shared registry, eliminating the duplication.

### New API: Natural Language → SimulationConfig

**Endpoint**: `POST /api/simulations/natural-language`

**Purpose**: Convert a natural language description into a validated `SimulationConfig`, or request missing parameters.

**Request**:
```json
{
  "text": "Simulate a projectile with a mass of 5kg, velocity of 20m/s, and angle of 45 degrees.",
  "domainHint": "physics"  // optional, helps narrow simulation match
}
```

**Response (success — all required params provided)**:
```json
{
  "status": "ready",
  "simulationId": "motion",
  "domain": "physics",
  "parameters": { "force": 15, "mass": 5, "friction": 0.2 }
}
```

**Response (needs input — required params missing)**:
```json
{
  "status": "needs_input",
  "simulationId": "motion",
  "domain": "physics",
  "missingParameters": ["angle"],
  "availableParameters": [
    { "key": "angle", "label": "Launch Angle", "min": 0, "max": 90, "step": 1, "unit": "degrees" }
  ]
}
```

**Response (unsupported request)**:
```json
{
  "status": "unsupported",
  "message": "No simulation matched your request. Available domains: physics, biology, ..."
}
```

**Flow**:
1. Client sends natural language text
2. Server sends a system prompt to the LLM containing the full simulation registry (all simulation IDs, names, descriptions, and parameter schemas)
3. LLM responds with JSON: `{ simulationId, domain, parameters }`
4. Server validates with Zod against the specific simulation's parameter schema (from registry)
5. Server validates every parameter is within registry-defined `min`/`max` bounds
6. Server checks all `required` parameters are present
7. Server returns "ready" or "needs_input"

**Zod Schema** (in `src/lib/simulation/schemas.ts`):
```typescript
// Dynamic: built per-simulation from the registry
function buildParamSchema(sim: SimulationDefinition): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const p of sim.parameters) {
    let s = z.number();
    if (p.type === 'integer') s = s.int();
    s = s.min(p.min).max(p.max);
    shape[p.key] = p.required ? s : s.optional();
  }
  return z.object(shape);
}
```

### AI Prompt Design for NL → Config

The system prompt will include the full registry as structured context:

```
You are an educational simulation assistant. Your job is to map natural language
descriptions of scientific experiments to structured simulation configurations.

Available simulations:
1. physics → motion: "Newtonian Motion Sandbox"
   Description: Examine inertia, applied forces, and friction...
   Equation: a = (F - μmg)/m
   Parameters:
     - force: Thrust Force (N), type: number, min: 0, max: 50, step: 1, default: 15, required: true
     - mass: Inertial Mass (kg), type: number, min: 1, max: 20, step: 0.5, default: 5, required: true
     - friction: Friction Coefficient (μ), type: number, min: 0, max: 0.8, step: 0.05, default: 0.2, required: true

... [all 17 simulations]

Instructions:
- Match the user's request to exactly ONE simulation from the list above.
- If no simulation matches, return: {"matched": false}
- If a simulation matches, return ONLY valid JSON:
  {"matched": true, "domain": "...", "simulationId": "...", "parameters": {"key": value, ...}}
- Only include parameters the user explicitly mentioned.
- Do NOT invent values for parameters not mentioned.
- Round all numeric values to reasonable precision.
- If you cannot confidently match, return {"matched": false}
```

The AI must **never** execute code, modify state, or bypass validation — it only produces a JSON proposal that goes through the full validation pipeline server-side.

### Reuse of Existing AI Infrastructure

The new `/api/simulations/natural-language` endpoint will reuse:
- `LLMProviderFactory.getProvider()` — same provider abstraction as Spark chat and interpret
- `config.ai.*` — same config layer
- `requireAuth`, `withErrorHandling`, `withRateLimit` — same middleware chain
- Zod — already a dependency, already used in `src/validations/schemas.ts` and `src/lib/security/validation.ts`
- `ApiResponseHandler` — standard response format
- `logger` — standard logging

The offline fallback (when AI fails) will return `"status": "unsupported"` with a human-readable message, consistent with the existing pattern of graceful degradation.

---

## 3. File Impact

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/simulation/registry.types.ts` | `SimulationParameter`, `SimulationDefinition` types |
| `src/lib/simulation/registry.ts` | Full simulation registry (extracted from `LOCAL_FALLBACK_CONFIG`) + lookup functions |
| `src/lib/simulation/schemas.ts` | Zod schemas for NL→Config response validation (dynamic per simulation) |
| `src/lib/simulation/nl-interpreter.service.ts` | Server-side service: builds prompt from registry, calls LLM, validates output, returns result |
| `src/lib/simulation/fallback-interpreter.ts` | Offline fallback: keyword-based simulation matching (mirrors `SparkFallback` pattern) |
| `src/validations/SimulationConfigSchema.ts` | Zod schema for NL interpretation request/response |
| `app/api/simulations/natural-language/route.ts` | API route for NL → SimulationConfig conversion |
| `components/simulation-runner/natural-language-input.tsx` | React component: text input → AI interpretation → parameter review UI |

### Files to Modify

| File | Changes |
|------|---------|
| `components/simulation-runner/simulation-runner.tsx` | Replace `LOCAL_FALLBACK_CONFIG` with import from registry; add `aiMode` state for NL input flow; wire NL input into the AI drawer |
| `components/simulations/simulation-config-client.ts` | Optionally fetch from `/api/simulations/config` (if that route is later added), fallback to registry import instead of inline duplicate |
| `src/lib/ai/llm.ts` | Add `generateCompletion` usage (already has it in `LLMService` but unused — wire it or use `LLMProviderFactory.generateCompletion` directly) |
| `src/middleware/auth.ts` | Export `RouteHandler` type if needed by new service (or import from `csrf.ts` which already exports it) |

### Files NOT to Touch

| File | Reason |
|------|--------|
| `components/simulation-runner/simulation-engine.ts` | Client-side canvas engine — no changes needed |
| `app/api/simulations/interpret/route.ts` | Existing AI result analysis — reuse as-is for the "explain results" flow |
| `app/api/simulations/history/route.ts` | Existing history API — no changes needed |
| `src/modules/spark/*` | Spark AI mentor system — separate concern, no changes needed |
| `src/database/models/simulation-config.ts` | Mongoose model — keep as-is (could later sync from registry) |
| `src/lib/security/validation.ts` | Already has `SimulationRunCreateSchema` — no changes needed |
| `src/config/env.ts` | AI config already exists — no changes needed |

---

## 4. Data Flow

### Natural Language Input Flow

```text
┌─────────────┐
│ User types: │
│ "Simulate a │
│ projectile   │
│ at 20 m/s,   │
│ 45°"        │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/simulations/              │
│ natural-language                    │
│                                     │
│ 1. Zod-validate request body       │
│ 2. Resolve domain/sim from hint    │
│ 3. Build LLM system prompt from    │
│    SIMULATION_REGISTRY (all sims)  │
│ 4. Call LLMProviderFactory         │
│    .getProvider()                 │
│    .generateCompletion()          │
│ 5. Zod-validate LLM JSON output   │
│ 6. Registry bounds validation     │
│ 7. Check required params          │
├─────────────────────────────────────┤
│ Response:                           │
│ {                                   │
│  "status": "ready",                │
│  "simulationId": "motion",         │
│  "domain": "physics",              │
│  "parameters": {                   │
│    "force": 15,                    │
│    "mass": 5,                     │
│    "friction": 0.2                 │
│  }                                 │
│ }                                   │
└──────┬────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Client receives config              │
│ - Sets activeDomain/activeSimId    │
│ - Sets localParams                 │
│ - Instantiates SimulationEngine    │
│   with these parameters            │
└──────┬────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ SimulationEngine runs               │
│ (same canvas rendering as now)      │
│ Emits TelemetrySnapshot             │
│ via onStateSync callback            │
└──────┬────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Optional: User clicks "Explain"     │
│ → POST /api/simulations/interpret   │
│ (existing endpoint, unchanged)      │
│ Saves SimulationRun to MongoDB      │
└─────────────────────────────────────┘
```

### Existing Traditional Input Flow (unchanged)

```text
User → sidebar click → SimulationRunner
  → loads LOCAL_FALLBACK_CONFIG (now from registry)
  → SimulationEngine(canvas, domain, simId, defaultParams, onStateSync)
  → telemetry → onStateSync → setTelemetrySnap
  → AI drawer → POST /api/simulations/interpret → save SimulationRun
```

---

## 5. API/Data Contracts

### POST /api/simulations/natural-language

**Request Schema (Zod)**:
```typescript
const NlInterpretationRequestSchema = z.object({
  text: z.string().min(1, 'Request text is required').max(500, 'Text too long'),
  domainHint: z.enum(['physics', 'biology', 'anatomy', 'mathematics', 'quantum', 'space']).optional(),
});
```

**Response Contract**:
```typescript
// status: "ready" — all required params present, validation passed
{
  status: "ready";
  simulationId: string;
  domain: string;
  parameters: Record<string, number>;
}

// status: "needs_input" — simulation matched, but required params missing
{
  status: "needs_input";
  simulationId: string;
  domain: string;
  missingParameters: string[];          // required param keys not provided
  availableParameters: SimulationParameterSpec[];  
  providedParameters: Record<string, number>;
}

// status: "unsupported" — no simulation matched
{
  status: "unsupported";
  message: string;
  suggestions: string[];               // e.g. ["Try describing a motion, gravity, or pendulum experiment"]
}
```

**Validation Pipeline** (inside the route handler):

1. **Request validation**: Zod schema for `text` + optional `domainHint`
2. **LLM prompt construction**: Build system prompt from `SIMULATION_REGISTRY`
3. **LLM call**: `LLMProviderFactory.getProvider().generateCompletion()` (non-streaming — we need the full JSON)
4. **LLM output parse**: Extract JSON from response (strip markdown fences)
5. **Zod validation of LLM output**: Validate against a schema matching `{ matched: boolean, domain?: string, simulationId?: string, parameters?: Record<string, number> }`
6. **Registry validation**: Look up simulation in `SIMULATION_REGISTRY`; verify every parameter value is within `min`/`max` bounds from the registry
7. **Required param check**: Compare `parameters` keys against registry `required` params; compute `missingParameters`
8. **Unit sanitization**: Ensure all values are numbers (no strings, no objects)

**Authentication**: `requireAuth` (JWT or `neuron_session` cookie)

**Rate limiting**: `withRateLimit` — default 100 requests/minute

**Error handling**: `withErrorHandling` — wraps in try/catch, returns structured `ApiResponse`

**Timeout**: 10-second server-side timeout for the LLM call (via `AbortSignal`)

**Fallback**: If LLM provider unavailable → use `fallback-interpreter.ts` keyword matching

### SimulationConfig Type (shared)

This is NOT a new database model — it's a transient request-response contract:

```typescript
// src/lib/simulation/types.ts
export interface SimulationConfig {
  simulationId: string;
  domain: ScientificDomain;
  parameters: Record<string, number>;
}

export interface SimulationParameterSpec {
  key: string;
  label: string;
  description?: string;
  unit?: string;
  type: 'number' | 'integer';
  min: number;
  max: number;
  step: number;
  default: number;
  required: boolean;
}
```

### SimulationRun Persistence (no changes)

Existing `SimulationRun` model (`src/database/models/simulation-run.ts:8`) already stores `{ simulationId, userId, domain, parameters, stateSnapshot, aiInterpretation, timestamp }`. No new DB model needed — the `parameters` from the NL→Config flow flow directly into the existing `SimulationRun` when the user later clicks "Explain Results."

---

## 6. UX Flow

### Phase 4 Frontend: Natural Language Input Component

This lives inside the existing `SimulationRunner` AI drawer ("Spark Analyst"), adding a toggleable mode.

#### State additions to `simulation-runner.tsx`:

```typescript
// New state for NL mode
const [nlMode, setNlMode] = useState<'traditional' | 'natural-language'>('traditional');
const [nlInput, setNlInput] = useState('');
const [nlResult, setNlResult] = useState<NlInterpretationResult | null>(null);
const [nlLoading, setNlLoading] = useState(false);
const [nlError, setNlError] = useState<string | null>(null);
```

#### UI states within the AI drawer:

1. **Traditional mode** (default, existing behavior): Show the "Telemetry Assessment" button that calls `/api/simulations/interpret`.

2. **NL mode toggle**: A small segmented control or toggle button: "Telemetry Assessment" ↔ "Describe Experiment"

3. **NL input state**:
   - Textarea for the natural language description
   - "Interpret" button (disabled while loading)
   - Shows loading spinner while AI processes

4. **NL result — status: "ready"**:
   - Show: "Matched: **{simulationName}** ({domain})"
   - Show parameter cards with values, min/max sliders for editing
   - "Apply & Run" button → sets activeDomain, activeSimId, localParams → closes drawer → engine auto-starts
   - "Adjust" button → back to editing

5. **NL result — status: "needs_input"**:
   - Show: "Matched: **{simulationName}**"
   - Show provided parameters (readonly)
   - Show parameter controls for missing params (slider/number input from registry spec)
   - "Apply with Defaults" button → fills missing with `default` from registry
   - "Add More" button → back to text input

6. **NL result — status: "unsupported"**:
   - Show: "I couldn't match a simulation to that description."
   - Show suggestions (e.g., "Try: 'gravity', 'pendulum', 'orbit'")
   - "Back to text" button → return to input

7. **Error states**: Inline error messages, retry button, fallback to traditional mode

#### User Flow:

```
1. User opens AI drawer
   ↓
2. Toggles to "Describe Experiment" mode
   ↓
3. Types: "Simulate a projectile with mass 5kg at 20m/s, 45 degrees"
   ↓
4. Clicks "Interpret"
   ↓ [Loading state: "AI analyzing..."]
   ↓
5a. [MATCHED - all params present]
    → Shows parameter preview cards
    → User clicks "Apply & Run"
    → Drawer closes, engine starts with those params
    ↓
    → User can click "Spark AI" → "Telemetry Assessment" for explanation

   OR

5b. [MATCHED - needs angle]
    → Shows "mass = 5kg" card, "velocity = 20" card
    → Shows "angle" slider (0-90, step 1)
    → User adjusts angle to 45
    → Clicks "Apply & Run"
    ↓
    → User can click "Telemetry Assessment" for explanation
```

---

## 7. Security Considerations

### AI Output is Untrusted — Full Validation Pipeline

```
AI JSON Output
    ↓
[1] JSON.parse safety (try/catch)
    ↓
[2] Zod schema: matched, domain, simulationId, parameters
    - domain must match ScientificDomain enum
    - simulationId must be a string matching /^[a-z_]+$/
    - parameters values must be finite numbers
    ↓
[3] Registry validation
    - Look up simulationId + domain in SIMULATION_REGISTRY
    - Reject if not found (prevents hallucinated simulation IDs)
    - Verify each parameter key exists in registry paramMap
    - Verify each value is within [min, max] from registry
    - Verify each value is a multiple of `step` (within tolerance)
    ↓
[4] Required param check
    - Any param with required=true must be present
    ↓
[5] Unit/type normalization
    - Convert all values to numbers (parseFloat)
    - Round to step granularity
    - Clamp to min/max
```

### Attack Vectors & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Prompt injection** in NL text | System prompt explicitly tells LLM to only return JSON, ignore embedded instructions. Server-side Zod validation rejects any extra fields. |
| **Hallucinated simulation IDs** | Registry lookup rejects any simulationId not in the known set |
| **Out-of-range parameters** | Registry min/max enforcement on every parameter |
| **Non-numeric parameter values** | Zod `z.number()` validation + parseFloat fallback |
| **Missing required parameters** | Required param check before returning "ready" status |
| **Rate abuse** | `withRateLimit` middleware (100 req/min default, IP + user ID keyed) |
| **LLM timeout** | 10s AbortSignal timeout → fallback keyword matching |
| **LLM provider failure** | `fallback-interpreter.ts` — keyword-based matching using domain terms from registry |
| **Large payloads** | Zod `text` max 500 chars, parameters limited to known set from registry |
| **CSRF** | POST endpoint requires CSRF token (via `requireSimulationCsrfProtection`) |
| **Auth required** | `requireAuth` — must be authenticated via JWT or cookie |

### What AI Cannot Access

The LLM is **stateless and isolated**:
- No filesystem access
- No shell execution
- No database tools (MongoDB is accessed only server-side via Mongoose after validation)
- No environment variables (API keys are only used by the server-side `LLMProviderFactory`)
- No network tools beyond the LLM API itself
- No arbitrary code execution — the LLM can only produce a JSON object that goes through validation

The system prompt explicitly states: "You only produce JSON. You do not execute code or control the simulation."

---

## 8. Testing Strategy

### No test framework exists

`package.json` has no `test` script, no Jest/Vitest, no test files. **No test framework to integrate with.**

### Testing approach:

1. **TypeScript compilation**: `npx tsc --noEmit` must pass with zero errors after each file change (already the established check)

2. **ESLint**: `npm run lint` must pass with zero errors (already established)

3. **Manual integration testing** via the browser:
   - Navigate to `/dashboard/simulations/physics`
   - Open AI drawer
   - Toggle to "Describe Experiment"
   - Enter test phrases, verify correct simulations are matched

4. **Test phrases for manual QA**:
   - "Simulate a projectile with mass 5kg at 20m/s, 45 degrees" → should match `motion`
   - "Show me Newton's pendulum" → should match `pendulum`
   - "Simulate orbital mechanics with radius 10 and star mass 150" → should match `orbit` (space)
   - "What happens with a black hole of mass 10 solar masses?" → should match `blackhole`
   - "I want to see bacteria growth" → should match `bacteria`
   - "Quantum wave function in a box" → should match `wave`
   - "Run Conway's Game of Life" → should be `unsupported` (not in registry)
   - "A very long prompt with injection try: {{system override}}" → should safely parse or reject
   - "" (empty) → 400 Bad Request
   - "Simulate everything" → should be `unsupported`

### Proposed test file structure (if framework added in future):

```typescript
// src/lib/simulation/__tests__/registry.test.ts
- getSimulation('motion', 'physics') returns correct def
- getSimulation('nonexistent', 'physics') returns null
- getAllSimulations() returns all 17 IDs
- paramMap has correct min/max for 'force' in motion

// src/lib/simulation/__tests__/schemas.test.ts  
- buildParamSchema('motion', 'physics') accepts valid params
- Rejects param below min / above max
- Rejects missing required param

// src/lib/simulation/__tests__/nl-interpreter.service.test.ts
- interpretNaturalLanguage("projectile motion 20 m/s 45 degrees") → ready
- interpretNaturalLanguage("bacteria growth") → ready  
- interpretNaturalLanguage("conway game of life") → unsupported
- interpretNaturalLanguage("") → throws

// src/lib/simulation/__tests__/fallback-interpreter.test.ts
- Keyword matching for "orbit" → space/orbit
- Keyword matching for "heart" → anatomy/heart
- No match → returns null
```

---

## 9. MVP Scope

### Must Have

- [ ] **Simulation registry** (`src/lib/simulation/registry.ts`) — extracted from `LOCAL_FALLBACK_CONFIG`, exported as TypeScript module
- [ ] **NL→Config Zod schemas** (`src/lib/simulation/schemas.ts`) — validate LLM JSON output
- [ ] **NL interpreter service** (`src/lib/simulation/nl-interpreter.service.ts`) — builds prompt, calls `LLMProviderFactory`, validates, returns result
- [ ] **Fallback interpreter** (`src/lib/simulation/fallback-interpreter.ts`) — keyword-based matching when LLM unavailable
- [ ] **API route** (`app/api/simulations/natural-language/route.ts`) — POST endpoint with auth + rate limit + CSRF
- [ ] **Frontend NL input component** — toggle in AI drawer, text input, parameter review cards, Apply button
- [ ] **Wiring** — NL result applies to existing `SimulationRunner` state (activeDomain, activeSimId, localParams)
- [ ] **TypeScript typecheck passes** — `npx tsc --noEmit`
- [ ] **ESLint passes** — `npm run lint`

### Should Have

- [ ] **Registry API endpoint** (`app/api/simulations/config/route.ts`) — serve registry as JSON, enabling `simulation-config-client.ts` to actually fetch from server instead of always falling back
- [ ] **Persist NL-created configs** — when "Explain Results" is called on an AI-configured simulation, the simulation run is already persisted via the existing `/api/simulations/interpret` flow
- [ ] **Domain disambiguation hint** — when the same simulation ID exists conceptually across domains, prompt asks user to clarify

### Future

- [ ] **Multi-turn conversational NL input** — if `status: needs_input`, allow user to provide the missing parameter via follow-up text ("and set the angle to 45 degrees") instead of just sliders
- [ ] **NL→Config as a reusable Spark service** — allow the Spark AI mentor to suggest "Would you like me to find a simulation for that?" when a user asks about a concept
- [ ] **Unit conversion layer** — "velocity of 20m/s at 45 degrees" for projectile motion requires deriving simulation-specific parameters from physics formulas
- [ ] **Vector search over registry** — use embeddings to improve simulation matching beyond keyword-based fallback
- [ ] **Simulation registry DB sync** — periodically sync `SimulationConfig` Mongoose model with the TypeScript registry
- [ ] **Test framework** — add Vitest/Jest for unit tests

---

## 10. Exact Implementation Order

| Step | File(s) | What | Dependencies | Risk |
|------|---------|------|--------------|------|
| **1** | `src/lib/simulation/registry.types.ts` | Define `SimulationParameter`, `SimulationDefinition`, `SimulationConfig` types | None | Low — pure types |
| **2** | `src/lib/simulation/registry.ts` | Extract all 17 simulations from `LOCAL_FALLBACK_CONFIG` into typed registry + lookup functions | Step 1 | Medium — must match every param exactly to avoid engine breakage |
| **3** | `src/lib/simulation/schemas.ts` | Zod schemas: NL request, LLM output, per-simulation param validation | Steps 1-2 | Low — schemas only, no runtime calls |
| **4** | `src/lib/simulation/fallback-interpreter.ts` | Keyword-based simulation matching using registry data (mirrors `SparkFallback`) | Steps 1-3 | Low — no network calls, deterministic |
| **5** | `src/lib/simulation/nl-interpreter.service.ts` | Core service: build prompt from registry → call `LLMProviderFactory` → validate → return result | Steps 1-4 | Medium — integrates LLM provider, timeout handling |
| **6** | `app/api/simulations/natural-language/route.ts` | API route: auth → rate limit → CSRF → validate request → call service → return JSON | Steps 1-5 | Medium — security-critical, must validate all inputs |
| **7** | `components/simulation-runner/simulation-runner.tsx` | Refactor: import registry, add NL mode state, integrate NL input component | Steps 1-2, 6 | Medium — modifies 1,197-line component |
| **8** | `components/simulation-runner/natural-language-input.tsx` | New component: text input, AI analysis, param review, Apply button | Steps 2, 6 | Medium — UX polish, new component |
| **9** | `components/simulations/simulation-config-client.ts` | Optional: try fetching `/api/simulations/config`, fall back to registry | Step 2 | Low |
| **10** | `app/api/simulations/config/route.ts` | Optional: serve registry as JSON | Steps 1-2 | Low |
| **11** | **Verification** | `npx tsc --noEmit` + `npm run lint` | All above | — |

### Build order rationale:

1. **Types first** — establishes the contract
2. **Registry** — the backbone, extracted from working code (no behavior change)
3. **Schemas** — validation boundaries, testable independently
4. **Fallback** — gives us offline functionality before touching network code
5. **Service** — business logic, callable from tests and routes
6. **API route** — wires service into HTTP, adds auth/security
7. **Frontend refactor** — update existing component to use shared registry
8. **NL input component** — new UI, depends on registry + API
9-10. **Optional cleanup** — serve registry, enable client fetch
11. **Verify** — typecheck + lint

---

## 11. Definition of Done

### MVP Acceptance Criteria

1. **Registry compiles**: `npx tsc --noEmit` passes with zero errors after creating `src/lib/simulation/registry.ts`

2. **Registry matches**: All 17 simulation IDs from `LOCAL_FALLBACK_CONFIG` are present in the registry, with identical `defaultParams` and `paramsList` (min, max, step)

3. **Registry lookup works**: `getSimulation('motion', 'physics')` returns the correct definition with `paramMap.force = { min: 0, max: 50, step: 1, default: 15 }`

4. **API endpoint exists**: `POST /api/simulations/natural-language` responds to authenticated requests

5. **API validates input**: Empty text returns 400; text >500 chars returns 400

6. **API matches simulations**: 
   - "projectile motion at 20 m/s 45 degrees" → returns `simulationId: "motion"`
   - "black hole with mass 10 solar masses" → returns `simulationId: "blackhole"`
   - "conway's game of life" → returns `status: "unsupported"`

7. **API validates LLM output**: If LLM returns a simulationId not in the registry, the API rejects it and returns `status: "unsupported"` — the unknown ID never reaches the client

8. **API enforces parameter bounds**: If LLM returns `mass: 10000` for the motion simulation (max is 20), the value is clamped to `max: 20`

9. **Frontend NL mode works**: 
   - Toggle button in AI drawer switches between "Telemetry Assessment" and "Describe Experiment"
   - Text input accepts and sends to API
   - Loading state shows spinner
   - Result shows parameter cards
   - "Apply & Run" sets engine params and starts simulation

10. **Traditional input still works**: Without touching NL mode, the existing simulation selector and sliders work identically

11. **Fallback works**: With no `OPENROUTER_API_KEY` or `OPENAI_API_KEY` configured, the keyword-based fallback interpreter still matches simulations

12. **Security holds**:
    - Unauthenticated requests get 401
    - POST without CSRF token gets 403
    - Non-numeric parameter values are rejected by Zod
    - Out-of-range values are clamped to registry bounds

13. **ESLint passes**: `npm run lint` returns zero errors

14. **TypeScript compiles**: `npx tsc --noEmit` returns zero errors

15. **No simulation engine changes**: `simulation-engine.ts` is untouched — same 17 simulations render identically
