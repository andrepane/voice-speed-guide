
// Constants for speech rate analysis
export const SPEECH_RATE = {
  SLOW: 'slow',
  NORMAL: 'normal',
  FAST: 'fast'
};

// Thresholds for words per minute
// These values can be adjusted based on clinical requirements
export const WPM_THRESHOLDS = {
  SLOW: 100, // Less than 100 WPM is considered slow
  FAST: 160  // More than 160 WPM is considered fast
};

// Function to analyze speech rate
export const analyzeSpeechRate = (
  wordsPerMinute: number
): 'slow' | 'normal' | 'fast' => {
  if (wordsPerMinute < WPM_THRESHOLDS.SLOW) {
    return SPEECH_RATE.SLOW;
  } else if (wordsPerMinute > WPM_THRESHOLDS.FAST) {
    return SPEECH_RATE.FAST;
  } else {
    return SPEECH_RATE.NORMAL;
  }
};

// Function to count syllables (simplified version)
// This is a basic approximation - more sophisticated algorithms exist
export const countSyllables = (text: string): number => {
  // Remove non-alphabetic characters and convert to lowercase
  const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
  
  // Count vowel sequences as approximate syllables
  const syllableCount = cleanText.match(/[aeiouy]{1,2}/g)?.length || 0;
  
  return syllableCount;
};

// Calculate words per minute based on word count and duration
export const calculateWPM = (
  wordCount: number,
  durationInSeconds: number
): number => {
  if (durationInSeconds === 0) return 0;
  
  // Calculate WPM
  const rawWPM = (wordCount / durationInSeconds) * 60;
  
  // Set a minimum value of 20 WPM if we have any sound input and some time has passed
  // This helps when the word detection is imperfect but we know someone is speaking
  if (wordCount > 0 && rawWPM < 20) {
    return 20;
  }
  
  return Math.round(rawWPM);
};

// Simple function to detect silence based on audio level
export const isSilence = (audioLevel: number, threshold = 0.05): boolean => {
  return audioLevel < threshold;
};

// Calculate RMS (Root Mean Square) of audio buffer
// This gives us the audio level
export const calculateRMS = (buffer: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
};

// Convert audio buffer to frequency data for visualization
export const getFrequencyData = (
  analyser: AnalyserNode,
  dataArray: Uint8Array
): Uint8Array => {
  analyser.getByteFrequencyData(dataArray);
  return dataArray;
};

// Convert raw audio data to waveform data for visualization
export const getWaveformData = (
  analyser: AnalyserNode, 
  dataArray: Uint8Array
): Uint8Array => {
  analyser.getByteTimeDomainData(dataArray);
  return dataArray;
};
