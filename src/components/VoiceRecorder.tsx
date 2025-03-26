
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import useSpeechAnalysis from '@/hooks/useSpeechAnalysis';
import RecordButton from './RecordButton';
import SpeedIndicator from './SpeedIndicator';
import VisualizerCanvas from './VisualizerCanvas';
import { Clock, Play, RotateCcw } from 'lucide-react';

interface VoiceRecorderProps {
  className?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ className }) => {
  const [showRecording, setShowRecording] = useState(false);
  const {
    isRecording,
    speechRate,
    audioLevel,
    wordsPerMinute,
    frequencyData,
    waveformData,
    startRecording,
    stopRecording,
    recordedAudio,
    recordingTime
  } = useSpeechAnalysis();

  // Format recording time (mm:ss)
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Reset recording state
  const resetRecording = () => {
    setShowRecording(false);
  };

  // Handle recording completion
  const handleStopRecording = () => {
    stopRecording();
    if (recordingTime > 0) {
      setShowRecording(true);
    }
  };

  // Play recorded audio
  const playRecording = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
        {/* Main content */}
        <div className="flex flex-col items-center space-y-8 relative">
          {/* Title */}
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-medium text-foreground mb-2">
              Analizador de Velocidad del Habla
            </h2>
            <p className="text-muted-foreground">
              Graba tu voz para obtener retroalimentación en tiempo real
            </p>
          </div>

          {/* Visualizer */}
          <div className="w-full relative">
            <VisualizerCanvas
              frequencyData={frequencyData}
              waveformData={waveformData}
              isRecording={isRecording}
              audioLevel={audioLevel}
              speechRate={speechRate}
              className="relative z-10"
            />
          </div>

          {/* Speed indicator (visible during recording) */}
          {isRecording && (
            <SpeedIndicator 
              rate={speechRate} 
              wpm={wordsPerMinute} 
              className="w-full animate-scale-in"
            />
          )}

          {/* Recording controls */}
          <div className="flex items-center justify-center w-full">
            {/* Timer display */}
            {isRecording && (
              <div className="flex items-center mr-8 animate-fade-in">
                <Clock className="w-5 h-5 mr-2" />
                <span className="text-lg font-semibold">{formatTime(recordingTime)}</span>
              </div>
            )}
            
            {/* Record button */}
            <RecordButton
              isRecording={isRecording}
              onStart={startRecording}
              onStop={handleStopRecording}
            />
          </div>
        </div>

        {/* Recording playback overlay */}
        {showRecording && recordedAudio && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in p-8">
            <h3 className="text-2xl font-medium mb-6">Grabación Completada</h3>
            
            <SpeedIndicator 
              rate={speechRate} 
              wpm={wordsPerMinute} 
              className="w-full mb-8 animate-scale-in"
            />
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={playRecording}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Play className="w-5 h-5" />
              </button>
              
              <button 
                onClick={resetRecording}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              Duración: {formatTime(recordingTime)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
