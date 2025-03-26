
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  analyzeSpeechRate, 
  calculateRMS, 
  calculateWPM,
  getFrequencyData,
  getWaveformData
} from '../utils/audioProcessing';

type SpeechRate = 'slow' | 'normal' | 'fast';

interface SpeechAnalysisResult {
  isRecording: boolean;
  speechRate: SpeechRate;
  audioLevel: number;
  wordsPerMinute: number;
  frequencyData: Uint8Array | null;
  waveformData: Uint8Array | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  recordedAudio: Blob | null;
  recordingTime: number;
}

const useSpeechAnalysis = (): SpeechAnalysisResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechRate, setSpeechRate] = useState<SpeechRate>('normal');
  const [audioLevel, setAudioLevel] = useState(0);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [waveformData, setWaveformData] = useState<Uint8Array | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timeIntervalRef = useRef<number | null>(null);
  const wordCountRef = useRef<number>(0);
  const silenceStartRef = useRef<number | null>(null);
  const fftSize = 256;

  // Update word count based on detected speech patterns
  const updateWordCount = useCallback((audioLevel: number) => {
    // Simple word detection based on audio level changes
    // This is a very basic approximation - in a real app, you'd use speech recognition
    if (audioLevel > 0.1) {
      if (silenceStartRef.current !== null) {
        // Count a word when transitioning from silence to sound
        wordCountRef.current += 1;
        silenceStartRef.current = null;
      }
    } else if (silenceStartRef.current === null) {
      silenceStartRef.current = Date.now();
    }
  }, []);

  // Process audio data for visualization and analysis
  const processAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const freqDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const waveDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    getFrequencyData(analyserRef.current, freqDataArray);
    getWaveformData(analyserRef.current, waveDataArray);
    
    // Calculate audio level from frequency data
    const newAudioLevel = calculateRMS(new Float32Array(freqDataArray));
    setAudioLevel(newAudioLevel);
    
    // Update analysis data
    setFrequencyData(freqDataArray);
    setWaveformData(waveDataArray);
    
    // Update word count based on audio level
    updateWordCount(newAudioLevel);
    
    if (isRecording) {
      // Calculate WPM
      const seconds = recordingTime > 0 ? recordingTime : 0.1; // Avoid division by zero
      const newWPM = calculateWPM(wordCountRef.current, seconds / 1000);
      setWordsPerMinute(newWPM);
      
      // Analyze speech rate
      const newSpeechRate = analyzeSpeechRate(newWPM);
      setSpeechRate(newSpeechRate);
    }
  }, [isRecording, recordingTime, updateWordCount]);

  // Start recording function
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Reset state
      setIsRecording(true);
      setRecordingTime(0);
      wordCountRef.current = 0;
      silenceStartRef.current = null;
      audioChunksRef.current = [];
      
      // Set up audio context and analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = fftSize;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorderRef.current.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
      });
      
      mediaRecorderRef.current.start();
      
      // Set up visualization loop
      const visualize = () => {
        if (isRecording) {
          processAudio();
          requestAnimationFrame(visualize);
        }
      };
      
      visualize();
      
      // Start timer
      const startTime = Date.now();
      timeIntervalRef.current = window.setInterval(() => {
        const newTime = Date.now() - startTime;
        setRecordingTime(newTime);
      }, 100);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      
      // Stop and release streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
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
  };
};

export default useSpeechAnalysis;
