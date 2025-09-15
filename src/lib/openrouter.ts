import { z } from 'zod';

const RESPONSES_URL = process.env.OPENAI_API_KEY
  ? 'https://api.openai.com/v1/responses'
  : 'https://openrouter.ai/api/v1/responses';

const GradeSchema = z.object({
  score: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
  score_max: z.literal(1),
  rationale: z.string().min(1)
});

export type GradeResult = z.infer<typeof GradeSchema>;

const RubricSchema = z.object({
  type: z.enum(['vision_numeric', 'vision_one_of', 'vision_text']),
  expected: z
    .object({ value_numeric: z.number(), tolerance: z.number() })
    .optional(),
  acceptable_strings: z.array(z.string()).nullable().optional(),
  instructions: z.string(),
  partial_credit_rules: z.array(z.object({ condition: z.string(), score: z.number() }))
});

export type RubricJson = z.infer<typeof RubricSchema>;

function headers() {
  const isOpenAI = !!process.env.OPENAI_API_KEY;
  const authKey = isOpenAI ? process.env.OPENAI_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!authKey) throw new Error(isOpenAI ? 'Missing OPENAI_API_KEY' : 'Missing OPENROUTER_API_KEY');
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authKey}`,
  };
  if (!isOpenAI) {
    base['HTTP-Referer'] = 'https://goblins-autograder.vercel.app';
    base['X-Title'] = 'Goblins Autograder (Vision-Only)';
  }
  return base;
}

export async function gradeVisionRequest(input: {
  model?: string;
  rubricJson: RubricJson;
  promptText: string;
  imageUrl: string;
  workText?: string | null;
}): Promise<GradeResult> {
  const model = input.model
    || (process.env.OPENAI_API_KEY
          ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o-2024-08-06')
          : (process.env.OPENROUTER_VISION_MODEL || 'meta-llama/llama-3.2-90b-vision-instruct'));

  const system = `You are a strict grader returning only JSON that matches the schema. No prose, no markdown, only JSON.

Final answer detection policy (do not deviate):
- Accept a final answer that is boxed, circled, underlined, or prefixed with keywords like "Final:" or "Ans:".
- If multiple candidates, the one most clearly marked as final wins; otherwise prefer the last line that looks like the final.
- Treat trailing punctuation as insignificant (e.g., 10. == 10). Respect numeric tolerance from the rubric.
- Partial credit comes only from the rubric's partial_credit_rules (use the image to verify those cues).`;

  const typedFinal = extractTypedFinal(input.workText || undefined);
  const userText = [
    'Rubric JSON (strict):',
    JSON.stringify(input.rubricJson),
    '',
    'Problem Prompt:',
    input.promptText,
    '',
    typedFinal ? `Typed final answer (if present): ${typedFinal}` : 'Typed final answer (if present): none',
    '',
    'Grading task: Look at the whiteboard image and apply the rubric strictly. Use the Final answer detection policy above. Return only the Grade JSON.'
  ].join('\n');

  const gradeJsonSchema = {
    name: 'grade_schema',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        score: { enum: [0, 0.5, 1] },
        score_max: { const: 1 },
        rationale: { type: 'string' }
      },
      required: ['score', 'score_max', 'rationale']
    },
    strict: true
  } as const;

  const body = {
    model,
    input: [
      { role: 'system', content: [{ type: 'text', text: system }] },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: input.imageUrl },
          ...(input.workText ? [{ type: 'text', text: `Student optional notes: ${input.workText}` }] : [])
        ]
      }
    ],
    response_format: { type: 'json_schema', json_schema: gradeJsonSchema },
    temperature: 0
  } as any;

  const res = await fetch(RESPONSES_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Responses API error: ${res.status}. ${text}`);
  }
  const json = await res.json();
  const content = extractResponsesApiText(json);

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Try to extract JSON substring
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse JSON grade');
    parsed = JSON.parse(match[0]);
  }
  const result = GradeSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('Invalid Grade JSON from model');
  }
  return result.data;
}

export async function generateRubric(input: {
  promptText: string;
  desiredType: 'vision_numeric' | 'vision_one_of' | 'vision_text';
  model?: string;
}): Promise<RubricJson> {
  const model = input.model
    || (process.env.OPENAI_API_KEY
          ? (process.env.OPENAI_RUBRIC_MODEL || process.env.OPENAI_VISION_MODEL || 'gpt-4o-2024-08-06')
          : (process.env.OPENROUTER_RUBRIC_MODEL || process.env.OPENROUTER_VISION_MODEL || 'meta-llama/llama-3.2-90b-vision-instruct'));

  const system = 'You write compact grading rubrics as strict JSON and nothing else.';
  const user = `Produce a rubric JSON for a vision-graded problem. Follow the provided JSON schema exactly. Constraint: be compact. Desired type: ${input.desiredType}. Problem Prompt: ${input.promptText}`;

  const rubricJsonSchema = {
    name: 'rubric_schema',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { enum: ['vision_numeric', 'vision_one_of', 'vision_text'] },
        expected: {
          anyOf: [
            { type: 'null' },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                value_numeric: { type: 'number' },
                tolerance: { type: 'number' }
              },
              required: ['value_numeric', 'tolerance']
            }
          ]
        },
        acceptable_strings: {
          anyOf: [
            { type: 'null' },
            { type: 'array', items: { type: 'string' } }
          ]
        },
        instructions: { type: 'string' },
        partial_credit_rules: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: { condition: { type: 'string' }, score: { type: 'number' } },
            required: ['condition', 'score']
          }
        }
      },
      required: ['type', 'instructions', 'partial_credit_rules']
    },
    strict: true
  } as const;

  const body = {
    model,
    input: [
      { role: 'system', content: [{ type: 'text', text: system }] },
      { role: 'user', content: [{ type: 'text', text: user }] }
    ],
    response_format: { type: 'json_schema', json_schema: rubricJsonSchema },
    temperature: 0
  } as any;

  const res = await fetch(RESPONSES_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Responses API error: ${res.status}. ${text}`);
  }
  const json = await res.json();
  const content = extractResponsesApiText(json);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse JSON rubric');
    parsed = JSON.parse(match[0]);
  }
  const result = RubricSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('Invalid Rubric JSON from model');
  }
  return result.data;
}

function extractResponsesApiText(json: any): string {
  // Prefer consolidated output_text if available
  if (typeof json.output_text === 'string' && json.output_text.trim().length > 0) return json.output_text;
  // Otherwise extract from output array
  if (Array.isArray(json.output) && json.output.length > 0) {
    const msg = json.output[0];
    const parts = msg?.content || [];
    const texts = parts
      .map((p: any) => p?.text || p?.content || '')
      .filter((t: any) => typeof t === 'string');
    if (texts.length) return texts.join('\n');
  }
  // Fallback for chat-completions-style responses (some providers proxy)
  const legacy = json.choices?.[0]?.message?.content;
  return typeof legacy === 'string' ? legacy : '';
}

function extractTypedFinal(workText?: string) {
  if (!workText) return null;
  const m = workText.match(/Final answer \(typed\):\s*(.+)/i);
  return m ? m[1].trim() : null;
}

export async function generateRubricWithExplanation(input: {
  promptText: string;
  desiredType: 'vision_numeric' | 'vision_one_of' | 'vision_text';
  model?: string;
}): Promise<{ rubric: RubricJson; explanation: string }> {
  const model = input.model || process.env.OPENROUTER_RUBRIC_MODEL || process.env.OPENROUTER_VISION_MODEL || 'meta-llama/llama-3.2-90b-vision-instruct';
  const system = 'You produce a grading rubric and a short explanation for teachers. Return strict JSON only.';
  const user = `For the following student-facing problem, suggest a compact rubric JSON (same schema as before) and a brief explanation (2-4 bullet points) describing how the AI will grade (what evidence it looks for, how partial credit applies). Desired type: ${input.desiredType}. Problem: ${input.promptText}`;

  const schema = {
    name: 'rubric_with_explanation',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        rubric: {
          type: 'object',
          additionalProperties: true
        },
        explanation: { type: 'string' }
      },
      required: ['rubric', 'explanation']
    },
    strict: true
  } as const;

  const body = {
    model,
    input: [
      { role: 'system', content: [{ type: 'text', text: system }] },
      { role: 'user', content: [{ type: 'text', text: user }] }
    ],
    response_format: { type: 'json_schema', json_schema: schema },
    temperature: 0
  } as any;

  const res = await fetch(OPENROUTER_URL, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }
  const json = await res.json();
  const content = extractResponsesApiText(json);
  const parsed = JSON.parse(content);
  const r = RubricSchema.safeParse(parsed.rubric);
  if (!r.success) throw new Error('Invalid rubric from explanation generator');
  return { rubric: r.data, explanation: String(parsed.explanation || '') };
}


