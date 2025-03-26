
import React from 'react';
import { cn } from '@/lib/utils';
import { SPEECH_RATE } from '@/utils/audioProcessing';

interface SpeedIndicatorProps {
  rate: 'slow' | 'normal' | 'fast';
  wpm: number;
  className?: string;
}

const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({ 
  rate, 
  wpm, 
  className 
}) => {
  // Map rate to color and message
  const indicators = {
    [SPEECH_RATE.SLOW]: {
      label: 'Lento',
      description: 'Intenta hablar un poco más rápido',
      className: 'speed-indicator-slow'
    },
    [SPEECH_RATE.NORMAL]: {
      label: 'Normal',
      description: 'Velocidad de habla ideal',
      className: 'speed-indicator-normal'
    },
    [SPEECH_RATE.FAST]: {
      label: 'Rápido',
      description: 'Intenta hablar un poco más despacio',
      className: 'speed-indicator-fast'
    }
  };

  const current = indicators[rate];

  return (
    <div className={cn(
      'flex flex-col items-center p-6 rounded-2xl transition-all duration-500 animate-fade-in-up',
      current.className,
      className
    )}>
      <div className="text-5xl font-light mb-2">{current.label}</div>
      <div className="text-lg opacity-80 mb-4">{current.description}</div>
      <div className="text-2xl font-semibold">
        {wpm} <span className="text-lg font-normal">palabras/min</span>
      </div>
    </div>
  );
};

export default SpeedIndicator;
