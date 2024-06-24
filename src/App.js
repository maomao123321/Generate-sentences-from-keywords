import { Configuration, OpenAIApi } from 'openai';
import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { VolumeUp } from '@mui/icons-material';
import { IconButton } from '@mui/material';

function App() {
  const [keywords, setKeywords] = useState({ keyword1: '', keyword2: '', keyword3: '', keyword4: '' });
  const [sentences, setSentences] = useState([]);
  const [selectedSentence, setSelectedSentence] = useState('');

  const handleKeywordChange = (event) => {
    setKeywords({ ...keywords, [event.target.name]: event.target.value });
  };

  const handleGenerateSentences = async () => {
    const configuration = new Configuration({
      apiKey: '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',
    });
    const openai = new OpenAIApi(configuration);

    try {
      const prompt = `Let's play a game where I give you keywords and you use all of them to generate three simple sentences with each fewer than 11 words : ${keywords.keyword1}, ${keywords.keyword2}, ${keywords.keyword3}, ${keywords.keyword4}. Split sentences with &&.`;

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": prompt }],
      });

      const reply = completion.data.choices[0].message.content;
      setSentences(reply.split('&&').map(sentence => sentence.trim()));
    } catch (err) {
      console.error(err);
    }
  };

  const textToSpeech = async (text) => {
    try {
      const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
        { text },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': 'sk_15c564e8b4ca67777776bef6317cc48562d4a8d1c0f46320',
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(response.data);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Keywords Generation</h1>
      </header>

      <div className="input-section">
        <input type="text" name="keyword1" placeholder="Who" value={keywords.keyword1} onChange={handleKeywordChange} />
        <input type="text" name="keyword2" placeholder="What" value={keywords.keyword2} onChange={handleKeywordChange} />
        <input type="text" name="keyword3" placeholder="Where" value={keywords.keyword3} onChange={handleKeywordChange} />
        <input type="text" name="keyword4" placeholder="When" value={keywords.keyword4} onChange={handleKeywordChange} />
        <button onClick={handleGenerateSentences}>Generate</button>
      </div>

      <div className="main-content">
        <div className="sentences-list">
          {sentences.map((sentence, index) => (
            <div key={index} className="sentence-option">
              <span onClick={() => setSelectedSentence(sentence)}>{sentence}</span>
              <IconButton onClick={() => textToSpeech(sentence)} size="small">
                <VolumeUp />
              </IconButton>
            </div>
          ))}
        </div>
        {selectedSentence &&
        <div className="selected-sentence-box" style={{fontSize: "30px"}}>
          <p>{selectedSentence}</p>
          <IconButton onClick={() => textToSpeech(selectedSentence)} size="small">
            <VolumeUp />
          </IconButton>
        </div>}
      </div>
    </div>
  );
}

export default App;