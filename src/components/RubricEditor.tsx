"use client";
import { useMemo, useState } from 'react';

type Rubric = any;

export default function RubricEditor({
  problemId,
  initial,
  onChange,
}: {
  problemId: string;
  initial: Rubric | null;
  onChange: (r: Rubric) => void;
}) {
  const [type, setType] = useState<'vision_numeric' | 'vision_one_of' | 'vision_text'>(initial?.type || 'vision_numeric');
  const [numeric, setNumeric] = useState({ value: initial?.expected?.value_numeric ?? 0, tol: initial?.expected?.tolerance ?? 0 });
  const [numericText, setNumericText] = useState<string>(String(initial?.expected?.value_numeric ?? 0));
  const [tolText, setTolText] = useState<string>(String(initial?.expected?.tolerance ?? 0));
  const [oneOf, setOneOf] = useState<string>((initial?.acceptable_strings || []).join(', '));
  const [text, setText] = useState<string>(initial?.instructions || '');
  const [rules, setRules] = useState<{ condition: string; score: number }[]>(initial?.partial_credit_rules || []);
  const preview = useMemo(() => buildRubric(type, numeric, oneOf, text, rules), [type, numeric, oneOf, text, rules]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="text-gray-600">Rubric style:</label>
        <select className="rounded border p-1" value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="vision_numeric">Numeric answer</option>
          <option value="vision_one_of">Exact word/phrase</option>
          <option value="vision_text">Short explanation</option>
        </select>
      </div>

      {type === 'vision_numeric' && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label>Correct answer (numeric)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g., 25 or 1e6"
            className="w-36 rounded border p-1"
            value={numericText}
            onChange={(e) => {
              const v = e.target.value;
              setNumericText(v);
              const parsed = Number(v);
              if (!isNaN(parsed)) setNumeric(prev => ({ ...prev, value: parsed }));
            }}
            onBlur={() => {
              const parsed = Number(numericText);
              if (!isNaN(parsed)) setNumeric(prev => ({ ...prev, value: parsed }));
              else setNumericText(String(numeric.value));
            }}
          />
          <label>Tolerance</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g., 0.01"
            className="w-28 rounded border p-1"
            value={tolText}
            onChange={(e) => {
              const v = e.target.value;
              setTolText(v);
              const parsed = Number(v);
              if (!isNaN(parsed)) setNumeric(prev => ({ ...prev, tol: parsed }));
            }}
            onBlur={() => {
              const parsed = Number(tolText);
              if (!isNaN(parsed)) setNumeric(prev => ({ ...prev, tol: parsed }));
              else setTolText(String(numeric.tol));
            }}
          />
        </div>
      )}

      {type === 'vision_one_of' && (
        <div className="text-sm">
          <label className="block">Accepted answers (comma‑separated)</label>
          <input className="mt-1 w-full rounded border p-2" value={oneOf} onChange={(e) => setOneOf(e.target.value)} placeholder="triangle, right triangle" />
        </div>
      )}

      {type === 'vision_text' && (
        <div className="text-sm">
          <label className="block">What to look for (keywords, units, structure)</label>
          <textarea className="mt-1 w-full rounded border p-2" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      )}

      <div className="text-sm">
        <div className="mb-1">Partial credit</div>
        {rules.map((r, idx) => (
          <div key={idx} className="mb-2 flex items-center gap-2">
            <input className="flex-1 rounded border p-1" value={r.condition} onChange={(e) => setRules(rs => rs.map((x,i) => i===idx?{...x, condition: e.target.value}:x))} placeholder="correct steps but arithmetic slip" />
            <input type="number" step="0.1" className="w-24 rounded border p-1" value={r.score} onChange={(e) => setRules(rs => rs.map((x,i)=> i===idx?{...x, score: Number(e.target.value)}:x))} />
            <button className="btn-secondary" onClick={() => setRules(rs => rs.filter((_,i)=>i!==idx))}>Remove</button>
          </div>
        ))}
        <button className="btn-secondary" onClick={() => setRules(rs => [...rs, { condition: 'correct steps but arithmetic slip', score: 0.5 }])}>Add rule</button>
      </div>

      <div className="rounded border bg-gray-50 p-2 text-xs text-gray-700">
        Preview (stored as JSON, no need to edit):
        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
      </div>

      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => onChange(preview)}>Save rubric</button>
      </div>
    </div>
  );
}

function buildRubric(
  type: 'vision_numeric' | 'vision_one_of' | 'vision_text',
  numeric: { value: number; tol: number },
  oneOf: string,
  text: string,
  rules: { condition: string; score: number }[],
) {
  const base: any = { type, instructions: '', partial_credit_rules: rules };
  if (type === 'vision_numeric') {
    base.expected = { value_numeric: Number(numeric.value), tolerance: Number(numeric.tol) };
    base.instructions = 'Check the final numeric answer within tolerance.';
    base.acceptable_strings = null;
  } else if (type === 'vision_one_of') {
    base.acceptable_strings = oneOf.split(',').map(s => s.trim()).filter(Boolean);
    base.instructions = 'Look for the exact term or phrase.';
    base.expected = null;
  } else {
    base.instructions = text || 'Check for correct reasoning and key terms.';
    base.expected = null;
    base.acceptable_strings = null;
  }
  return base;
}


