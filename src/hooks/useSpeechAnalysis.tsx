
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
  const lastAudioLevelRef = useRef<number>(0);
  const audioThresholdCrossingsRef = useRef<number>(0);
  const lastThresholdCrossingRef = useRef<number | null>(null);
  const fftSize = 256;

  // Improved word detection based on audio patterns
  const updateWordCount = useCallback((audioLevel: number) => {
    const threshold = 0.05; // Adjust this threshold based on testing
    const minWordSpacing = 200; // Minimum milliseconds between words
    const now = Date.now();
    
    // When audio goes from below threshold to above threshold
    if (audioLevel > threshold && lastAudioLevelRef.current <= threshold) {
      audioThresholdCrossingsRef.current += 1;
      
      // If we've crossed the threshold multiple times with spacing, count it as a word
      if (lastThresholdCrossingRef.current && 
          (now - lastThresholdCrossingRef.current) > minWordSpacing) {
        wordCountRef.current += 1;
      }
      
      lastThresholdCrossingRef.current = now;
    }
    
    // For longer continuous speech, estimate words based on time
    if (audioLevel > threshold) {
      // If we've been speaking continuously for a while (1 second), estimate a word
      if (silenceStartRef.current === null) {
        // First loud audio after silence
        silenceStartRef.current = now;
      } else if ((now - silenceStartRef.current) > 1000) {
        // We've been talking for 1 second, estimate a word
        wordCountRef.current += 1;
        silenceStartRef.current = now; // Reset the counter
      }
    } else {
      // Reset silence tracking when quiet
      silenceStartRef.current = null;
    }
    
    lastAudioLevelRef.current = audioLevel;
    
    // Artificial minimum to avoid 0 WPM when clearly speaking
    if (recordingTime > 3000 && audioThresholdCrossingsRef.current > 5 && wordCountRef.current === 0) {
      wordCountRef.current = 1;
    }
  }, [recordingTime]);

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
      // Calculate WPM - add a small offset to ensure we don't divide by zero
      const seconds = recordingTime > 0 ? recordingTime / 1000 : 0.1;
      const newWPM = calculateWPM(wordCountRef.current, seconds);
      setWordsPerMinute(newWPM);
      
      // Analyze speech rate
      const newSpeechRate = analyzeSpeechRate(newWPM);
      setSpeechRate(newSpeechRate);
      
      // Log for debugging
      if (recordingTime % 1000 < 100) { // Log roughly every second
        console.log(`Words: ${wordCountRef.current}, Time: ${seconds.toFixed(1)}s, WPM: ${newWPM}`);
      }
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
      lastAudioLevelRef.current = 0;
      audioThresholdCrossingsRef.current = 0;
      lastThresholdCrossingRef.current = null;
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
