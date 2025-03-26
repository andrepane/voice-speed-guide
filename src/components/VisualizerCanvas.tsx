
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VisualizerCanvasProps {
  frequencyData: Uint8Array | null;
  waveformData: Uint8Array | null;
  isRecording: boolean;
  audioLevel: number;
  speechRate: 'slow' | 'normal' | 'fast';
  className?: string;
}

const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  frequencyData,
  waveformData,
  isRecording,
  audioLevel,
  speechRate,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color mapping for different speech rates
  const rateColors = {
    slow: '#3B82F6', // Blue
    normal: '#10B981', // Green
    fast: '#EF4444' // Red
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isRecording || !frequencyData || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Determine current color based on speech rate
    const currentColor = rateColors[speechRate];

    // Draw waveform visualization
    ctx.lineWidth = 2;
    ctx.strokeStyle = currentColor;
    ctx.beginPath();

    const sliceWidth = width / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i++) {
      const v = waveformData[i] / 128.0;
      const y = v * (height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw frequency bars on top
    const barWidth = width / frequencyData.length;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * height / 2;
      
      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, `${currentColor}99`);
      gradient.addColorStop(1, `${currentColor}22`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
    
    // Add glow effect when audio level is high
    if (audioLevel > 0.1) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = currentColor;
    } else {
      ctx.shadowBlur = 0;
    }
    
  }, [frequencyData, waveformData, isRecording, audioLevel, speechRate]);

  return (
    <div className={cn('w-full h-32 rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm', className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full h-full"
      />
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center text-foreground/50">
          Visualización de audio
        </div>
      )}
    </div>
  );
};

export default VisualizerCanvas;
