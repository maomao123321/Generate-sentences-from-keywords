// textToSpeech.js
import axios from 'axios';

const ELEVENLABS_API_KEY = 'sk_15c564e8b4ca67777776bef6317cc48562d4a8d1c0f46320';

export const textToSpeech = async (text) => {
  try {
    console.log('Sending request to ElevenLabs API');
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    );
    console.log('Received response from ElevenLabs API');

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(response.data);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (error) {
    console.error('Error in text-to-speech:', error.response?.data || error.message);
    console.error('Error details:', error.response?.headers, error.response?.status);
    throw error;
  }
};