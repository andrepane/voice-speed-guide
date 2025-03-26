
import React from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-4xl font-light mb-3">
            Análisis de Velocidad del Habla
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Herramienta para pacientes con tartamudez que analiza la velocidad del habla en tiempo real
          </p>
        </header>

        <VoiceRecorder className="mb-12" />

        <footer className="text-center text-sm text-muted-foreground mt-8 animate-fade-in">
          <p>Para uso clínico y terapéutico</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
