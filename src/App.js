import { Mic, Stop, VolumeUp, ContentCopy } from '@mui/icons-material';
import { FormControl, FormControlLabel, IconButton, Radio, RadioGroup } from '@mui/material';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';
import React, { useState } from 'react';
import './App.css';

function App() {
  const [keywords, setKeywords] = useState({ keyword1: '', keyword2: '', keyword3: '', keyword4: '' });
  const [sentences, setSentences] = useState([]);
  const [selectedSentence, setSelectedSentence] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('request');
  const [recordingField, setRecordingField] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);

const startSpeechRecognition = async (fieldName) => {
  try {
    if (mediaRecorder) {
      // 如果已经在录音，就停止当前的录音
      mediaRecorder.stop();
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newMediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    setRecordingField(fieldName);
    setMediaRecorder(newMediaRecorder);

    newMediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    newMediaRecorder.onstop = async () => {
      setRecordingField('');
      setMediaRecorder(null);

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        setKeywords(prev => ({ ...prev, [fieldName]: response.data.text }));
      } catch (error) {
        console.error('Error in speech recognition:', error);
      }

      // 停止所有音轨
      stream.getTracks().forEach(track => track.stop());
    };

    newMediaRecorder.start();
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};


  const handleKeywordChange = (event) => {
    setKeywords({ ...keywords, [event.target.name]: event.target.value });
  };

  const handleIntentChange = (event) => {
    setSelectedIntent(event.target.value);
  };

  const handleGenerateSentences = async () => {
    const configuration = new Configuration({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    try {
      let intentPrompt = '';
      let intentExample = ''
      switch(selectedIntent) {
        case 'request':
          intentPrompt = 'Generate sentences in the form of requests or polite commands';
          intentExample = 'Tomorrow, could you buy groceries at the supermarket? ### Mom, please take me to the supermarket for groceries tomorrow. ### Could we go grocery shopping with mom at the supermarket tomorrow?';
          break;
        case 'question':
          intentPrompt = 'Generate sentences in the form of questions';
          intentExample = 'Are you going to the supermarket for groceries tomorrow? ### When will mom take me to buy groceries? ### Where does mom usually buy groceries on Saturdays?';
          break;
        case 'fact':
          intentPrompt = 'Generate sentences stating facts or observations';
          intentExample = 'Mom buys our weekly groceries at the supermarket every Saturday. ### The supermarket near us restocks fresh groceries every morning. ### Tomorrow, mom and I will shop for groceries together.';
          break;
      }

      const prompt = `You are a system that helps people with speech difficulties to communicate on a daily basis. ${intentPrompt} using these keywords: ${keywords.keyword1}, ${keywords.keyword2}, ${keywords.keyword3}, ${keywords.keyword4}. Generate exactly three simple, short and independent sentences, each no more than 10 words long. Separate each sentence with ###. Always provide exactly 3 sentences, no more, no less. These 3 sentences should be highly relevant to daily life situations for people to use.`;

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": prompt }],
      });

      const reply = completion.data.choices[0].message.content;
      let generatedSentences = reply.split('###').map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
      
    // make sure 3 sentences
    while (generatedSentences.length < 3) {
      // if not enough call api again
      const additionalCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": `Generate ${3 - generatedSentences.length} more simple sentence(s) related to ${keywords.keyword1}, ${keywords.keyword2}, ${keywords.keyword3}, ${keywords.keyword4}. Each sentence should be simple and no more than 10 words long.` }],
      });
      const additionalSentences = additionalCompletion.data.choices[0].message.content.split('.').filter(s => s.trim().length > 0);
      generatedSentences = [...generatedSentences, ...additionalSentences];
    }
      // only keep first 3 sentences if more than 3
    setSentences(generatedSentences.slice(0, 3));
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

  const copyToClipboard = (text) =>{
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Generate Sentences from Words</h1>
      </header>
  
      <FormControl component="fieldset">
        <RadioGroup row aria-label="intent" name="intent" value={selectedIntent} onChange={handleIntentChange}>
          <FormControlLabel value="request" control={<Radio />} label="Make Request" />
          <FormControlLabel value="question" control={<Radio />} label="Ask Questions" />
          <FormControlLabel value="fact" control={<Radio />} label="State Facts" />
        </RadioGroup>
      </FormControl>
  
<div className="input-section">
  {['keyword1', 'keyword2', 'keyword3', 'keyword4'].map((field) => (
    <div key={field} className="input-with-mic">
      <input
        type="text"
        name={field}
        placeholder={field === 'keyword1' ? 'Who' : field === 'keyword2' ? 'What' : field === 'keyword3' ? 'Where' : 'When'}
        value={keywords[field]}
        onChange={handleKeywordChange}
      />
      <IconButton 
  onClick={() => startSpeechRecognition(field)}
  style={{ 
    color: recordingField === field ? 'red' : 'inherit',
    backgroundColor: 'transparent'
  }}
>
  {recordingField === field ? <Stop /> : <Mic />}
</IconButton>
    </div>
  ))}
  <button onClick={handleGenerateSentences}>Generate</button>
  <span className="note">click again to generate new</span>
</div>
  
      <div className="main-content">
        <div className="sentences-list">
          {sentences.map((sentence, index) => (
            <div key={index} className="sentence-option" onClick={() => setSelectedSentence(sentence)}>
              <span>{sentence}</span>
              <IconButton onClick={(e) => { e.stopPropagation(); textToSpeech(sentence); }} size="large">
                <VolumeUp />
              </IconButton>
            </div>
          ))}
        </div>
        
        <div className="selected-sentence-box">
          {selectedSentence ? (
            <>
              <span>{selectedSentence}</span>
              <div>
              <IconButton onClick={() => textToSpeech(selectedSentence)}>
                <VolumeUp sx={{fontSize: 40}} />
              </IconButton>
              <IconButton onClick={() => copyToClipboard(selectedSentence)}>
                <ContentCopy sx={{fontSize: 40}}/>
              </IconButton>
              </div>
            </>
          ) : (
            <span className="placeholder">AI generates sentences from your keywords. <br></br><br></br>More words, more accuracy. <br></br><br></br> Click one sentence on left.</span>
          )}
        </div>
      </div>
    </div>
  );
}
export default App;


