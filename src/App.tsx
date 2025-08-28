// @ts-nocheck
import React, { useState } from 'react';
import type { Step, GameMode } from './types.js';
import { generateLadder } from './logic/generator.js';
import { useMode } from './hooks/useMode.js';
import './App.css';

function App() {
  const { mode, setMode } = useMode();
  const [steps, setSteps] = useState<Step[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const startGame = () => {
    const newSteps = generateLadder(mode);
    setSteps(newSteps);
    setIsPlaying(true);
    setIsFinished(false);
  };

  const resetGame = () => {
    setSteps([]);
    setIsPlaying(false);
    setIsFinished(false);
  };

  const finishGame = () => {
    setIsPlaying(false);
    setIsFinished(true);
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].userAnswer = value;
    
    // Check if answer is correct
    const numericAnswer = parseFloat(value);
    if (!isNaN(numericAnswer) && numericAnswer === newSteps[index].answer) {
      newSteps[index].isCorrect = true;
    } else if (value.trim() === '') {
      newSteps[index].isCorrect = null;
    } else {
      newSteps[index].isCorrect = false;
    }
    
    setSteps(newSteps);
  };

  const getScore = () => {
    const correct = steps.filter(step => step.isCorrect === true).length;
    return { correct, total: steps.length };
  };

  const score = getScore();

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>MicroMath</h1>
      
      {/* Mode Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMode('normal')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 16px',
            backgroundColor: mode === 'normal' ? '#007bff' : '#f8f9fa',
            color: mode === 'normal' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          Normal (5 steps)
        </button>
        <button 
          onClick={() => setMode('hard')}
          style={{ 
            padding: '8px 16px',
            backgroundColor: mode === 'hard' ? '#007bff' : '#f8f9fa',
            color: mode === 'hard' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          Hard (10 steps)
        </button>
      </div>

      {/* Game Controls */}
      <div style={{ marginBottom: '20px' }}>
        {!isPlaying && !isFinished && (
          <button 
            onClick={startGame}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start {mode === 'normal' ? 'Normal' : 'Hard'} Mode
          </button>
        )}
        
        {isPlaying && (
          <button 
            onClick={finishGame}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Finish Game
          </button>
        )}
        
        {(isPlaying || isFinished) && (
          <button 
            onClick={resetGame}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Score Display */}
      {isFinished && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>Final Score: {score.correct}/{score.total}</h3>
          <p>{score.correct === score.total ? '🎉 Perfect!' : `You got ${score.correct} out of ${score.total} correct!`}</p>
        </div>
      )}

      {/* Game Steps */}
      {steps.length > 0 && (
        <div>
          <h3>Solve the ladder:</h3>
          {steps.map((step, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '18px'
              }}
            >
              <span style={{ marginRight: '10px', minWidth: '200px' }}>
                {step.prompt}
              </span>
              <input
                type="text"
                value={step.userAnswer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={isFinished}
                style={{
                  padding: '5px 10px',
                  fontSize: '16px',
                  width: '80px',
                  marginRight: '10px',
                  textAlign: 'center'
                }}
                placeholder="?"
              />
              <span style={{ fontSize: '20px', minWidth: '30px' }}>
                {step.isCorrect === true && '✅'}
                {step.isCorrect === false && '❌'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {!isPlaying && !isFinished && steps.length === 0 && (
        <div style={{ marginTop: '40px', color: '#6c757d' }}>
          <p>Choose your mode and click Start to begin!</p>
          <p><strong>Normal:</strong> 5 steps with +, −, ×, ÷</p>
          <p><strong>Hard:</strong> 10 steps with +, −, ×, ÷, ^ and parentheses</p>
        </div>
      )}
    </div>
  );
}

export default App;