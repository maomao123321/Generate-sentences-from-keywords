import { Configuration, OpenAIApi } from 'openai';
import React, { useState } from 'react';
import './App.css';
// import { ReactComponent as SpeechIcon } from './speech-icon.svg'; // Import a speech icon SVG

function App() {
  const [keywords, setKeywords] = useState({ keyword1: '', keyword2: '', keyword3: '' });
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

    console.log('test');

    try {
      const prompt = `Let's play a game where I give you keywords and you use all of them to generate three simple sentences with each fewer than 11 words : ${keywords.keyword1}, ${keywords.keyword2}, ${keywords.keyword3}, ${keywords.keyword4}. Split sentences with &&.`;
      
      console.log('prompt', prompt);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ "role": "user", "content": prompt }],
      });

      const reply = completion.data.choices[0].message.content;
      console.log('reply', reply)
      setSentences(reply.split('&&').map(sentence => sentence.trim()));
    } catch (err) {
      console.error(err);
    }
  };

  // Placeholder functions for text-to-speech
  const textToSpeech = (text) => {
    console.log("Text-to-Speech for:", text);
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
        <input type="text" name="keyword4" placeholder="when" value={keywords.keyword4} onChange={handleKeywordChange} />
        <button onClick={handleGenerateSentences}>Generate </button>
      </div>

      <div className="main-content">
        <div className="sentences-list">
          {sentences.map((sentence, index) => (
            <div key={index} className="sentence-option">
              <span onClick={() => setSelectedSentence(sentence)}>{sentence}</span>
              {/* <SpeechIcon onClick={() => textToSpeech(sentence)} className="speech-icon" /> */}
            </div>
          ))}
        </div>
        {selectedSentence &&
        <div className="selected-sentence-box" style={{fontSize: "30px"}}>
          <p>{selectedSentence}</p>
          {/* {selectedSentence && <SpeechIcon onClick={() => textToSpeech(selectedSentence)} className="speech-icon" />} */}
        </div>}
      </div>
    </div>
  );
}

export default App;

