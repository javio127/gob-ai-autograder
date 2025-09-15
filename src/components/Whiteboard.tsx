"use client";
import { useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

type WhiteboardProps = {
  width?: number;
  height?: number;
  onSaved?: (publicUrl: string) => void;
  assignmentId: string;
  studentId: string;
  problemId: string;
};

export default function Whiteboard({ width = 800, height = 500, onSaved, assignmentId, studentId, problemId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctxRef.current = ctx;
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#111827';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as any).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function start(e: any) {
    setIsDrawing(true);
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: any) {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = ctxRef.current!;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function end() {
    setIsDrawing(false);
  }

  async function handleSave() {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const filePath = `${assignmentId}/${studentId}/${problemId}-${Date.now()}.png`;
    setSaving(true);
    try {
      const { data, error } = await supabaseClient.storage.from('submission-images').upload(filePath, decodeBase64(base64), {
        contentType: 'image/png',
        upsert: false,
      });
      if (error) throw error;
      const { data: pub } = supabaseClient.storage.from('submission-images').getPublicUrl(filePath);
      onSaved?.(pub.publicUrl);
    } catch (e) {
      console.error(e);
      alert('Image upload failed. Please retry.');
    } finally {
      setSaving(false);
    }
  }

  function decodeBase64(b64: string) {
    const byteChars = atob(b64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    return new Uint8Array(byteNumbers);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`rounded border px-3 py-1 ${tool === 'pen' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setTool('pen')}>Pen</button>
        <button className={`rounded border px-3 py-1 ${tool === 'eraser' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setTool('eraser')}>Eraser</button>
        <button disabled={saving} className="rounded bg-emerald-600 px-3 py-1 text-white disabled:opacity-50" onClick={handleSave}>{saving ? 'Saving…' : 'Save PNG'}</button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border bg-white touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  );
}


