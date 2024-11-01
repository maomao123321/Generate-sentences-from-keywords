import axios from 'axios';

export const textToSpeech = async (text, apiKey, options = {}) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!text || typeof text !== 'string') {
    throw new Error('Valid text input is required');
  }

  const {
    model = 'tts-1',
    voice = 'alloy',
    speed = 1.0,
  } = options;

  // Validate parameters
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const validModels = ['tts-1', 'tts-1-hd'];
  
  if (!validModels.includes(model)) {
    throw new Error(`Invalid model. Must be one of: ${validModels.join(', ')}`);
  }
  
  if (!validVoices.includes(voice)) {
    throw new Error(`Invalid voice. Must be one of: ${validVoices.join(', ')}`);
  }

  // Log request details for debugging
  console.log('Attempting TTS request with:', {
    model,
    voice,
    speed,
    textLength: text.length,
    apiKeyPrefix: apiKey.substring(0, 5) + '...'
  });

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/audio/speech',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model,
        input: text,
        voice,
        speed
      },
      responseType: 'arraybuffer'
    });

    console.log('Response received:', {
      status: response.status,
      contentType: response.headers['content-type'],
      dataSize: response.data.byteLength
    });

    // Create audio context with fallback
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Handle the audio playback
    const audioBuffer = await audioContext.decodeAudioData(response.data);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    return {
      play: () => {
        try {
          source.start(0);
        } catch (error) {
          console.error('Error playing audio:', error);
          throw new Error(`Failed to play audio: ${error.message}`);
        }
      },
      stop: () => {
        try {
          source.stop();
        } catch (error) {
          console.error('Error stopping audio:', error);
          throw new Error(`Failed to stop audio: ${error.message}`);
        }
      },
      source,
      audioBuffer
    };
  } catch (error) {
    console.error('Full error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: {
          ...error.config?.headers,
          'Authorization': 'Bearer [REDACTED]' // Don't log the actual token
        }
      }
    });

    if (error.response?.status === 401) {
      throw new Error(
        'OpenAI API authentication failed. Please check:\n' +
        '1. API key is correct and not expired\n' +
        '2. API key has access to the Text-to-Speech API\n' +
        '3. Billing is properly set up in your OpenAI account'
      );
    }
    
    let errorMessage;
    if (error.response?.data instanceof ArrayBuffer) {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(error.response.data);
        const jsonError = JSON.parse(text);
        errorMessage = jsonError.error?.message || text;
      } catch (e) {
        errorMessage = 'Unable to decode error response';
      }
    } else {
      errorMessage = error.message;
    }
    
    throw new Error(`OpenAI TTS request failed: ${errorMessage}`);
  }
};
