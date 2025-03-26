
import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  onStart,
  onStop,
  className
}) => {
  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Pulsing background for recording indicator */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full animate-pulse-ring bg-red-500/20" />
      )}
      
      <button
        onClick={isRecording ? onStop : onStart}
        className={cn(
          'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-lg',
          isRecording ? 
            'bg-red-500 hover:bg-red-600 scale-110 button-glow' : 
            'bg-primary hover:bg-primary/90'
        )}
      >
        {isRecording ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
      
      <span className="mt-3 text-sm font-medium">
        {isRecording ? 'Detener' : 'Grabar'}
      </span>
    </div>
  );
};

export default RecordButton;
