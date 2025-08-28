// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import type { Step, GameMode } from './types.js';
import { generateLadder } from './logic/generator.js';
import { useMode } from './hooks/useMode.js';
import { GAME_DURATION_SECONDS, formatTime, getTimeColor } from './utils/timer.js';
import './App.css';

function App() {
  const { mode, setMode } = useMode();
  const [steps, setSteps] = useState<Step[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION_SECONDS);
  

  // Auto-finish when timer reaches 0
  const finishGame = useCallback(() => {
    setIsPlaying(false);
    setIsFinished(true);
  }, []);

  // Timer effect - simplified and more reliable
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer reached 0 - auto finish
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, finishGame]);

  const startGame = () => {
    const newSteps = generateLadder(mode);
    setSteps(newSteps);
    setIsPlaying(true);
    setIsFinished(false);
    setTimeRemaining(GAME_DURATION_SECONDS);
  };

  const resetGame = () => {
    setSteps([]);
    setIsPlaying(false);
    setIsFinished(false);
    setTimeRemaining(GAME_DURATION_SECONDS);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
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
      
      {/* Timer Display */}
      {(isPlaying || isFinished) && (
        <div style={{ 
          marginBottom: '20px', 
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: getTimeColor(timeRemaining)
        }}>
          ⏱️ {formatTime(timeRemaining)}
          {timeRemaining === 0 && <span style={{ color: '#dc3545' }}> - TIME UP!</span>}
        </div>
      )}
      
      {/* Mode Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setMode('normal')}
          disabled={isPlaying}
          style={{ 
            marginRight: '10px', 
            padding: '8px 16px',
            backgroundColor: mode === 'normal' ? '#007bff' : '#f8f9fa',
            color: mode === 'normal' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1
          }}
        >
          Normal (5 steps)
        </button>
        <button 
          onClick={() => setMode('hard')}
          disabled={isPlaying}
          style={{ 
            padding: '8px 16px',
            backgroundColor: mode === 'hard' ? '#007bff' : '#f8f9fa',
            color: mode === 'hard' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1
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
            Start {mode === 'normal' ? 'Normal' : 'Hard'} Mode (60s)
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
            Finish Early
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
          backgroundColor: timeRemaining === 0 ? '#fff3cd' : '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>Final Score: {score.correct}/{score.total}</h3>
          <p>
            {timeRemaining === 0 && '⏰ Time ran out! '}
            {score.correct === score.total ? '🎉 Perfect!' : `You got ${score.correct} out of ${score.total} correct!`}
          </p>
          <p style={{ fontSize: '14px', color: '#6c757d' }}>
            {timeRemaining > 0 ? `Finished with ${formatTime(timeRemaining)} remaining` : 'Game completed at time limit'}
          </p>
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
                  textAlign: 'center',
                  opacity: isFinished ? 0.7 : 1
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
          <p>Choose your mode and click Start to begin the 60-second challenge!</p>
          <p><strong>Normal:</strong> 5 steps with +, −, ×, ÷</p>
          <p><strong>Hard:</strong> 10 steps with +, −, ×, ÷, ^ and parentheses</p>
          <p>⏰ <strong>You have 60 seconds to complete as many as possible!</strong></p>
        </div>
      )}
    </div>
  );
}

export default App;