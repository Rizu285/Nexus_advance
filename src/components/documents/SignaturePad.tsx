import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, disabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  };

  const handlePointerUp = () => {
    if (disabled) return;
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    onClear?.();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <canvas
          ref={canvasRef}
          className="h-40 w-full cursor-crosshair rounded-lg bg-white"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleClear} disabled={disabled && !hasDrawing}>
          Clear
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!hasDrawing || disabled}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};
