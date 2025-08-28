// @ts-nocheck
import type { GameMode, Step, Operator } from '../types.js';
import { randInt, randChoice, randBool, getRandomFactor } from '../utils/rand.js';

const MAX_VALUE = 5000;
const MIN_VALUE = -5000;

function clamp(value: number): number {
  return Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
}

function isValidResult(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_VALUE && value <= MAX_VALUE;
}

function generateBasicStep(currentValue: number, allowedOps: Operator[]): { prompt: string; answer: number } | null {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const op = randChoice(allowedOps);
    let operand: number;
    let result: number;
    
    switch (op) {
      case '+':
        operand = randInt(1, 100);
        result = currentValue + operand;
        break;
        
      case '-':
        operand = randInt(1, 100);
        result = currentValue - operand;
        break;
        
      case '*':
        operand = randInt(2, 12);
        result = currentValue * operand;
        break;
        
      case '/':
        // Safe division: pick a factor of currentValue
        if (currentValue === 0) {
          continue; // Skip division by zero scenarios
        }
        operand = getRandomFactor(Math.abs(currentValue));
        if (operand === 1 && Math.abs(currentValue) > 20) {
          operand = getRandomFactor(Math.abs(currentValue));
        }
        result = currentValue / operand;
        break;
        
      case '^':
        // Only allow small exponents (2-3)
        operand = randChoice([2, 3]);
        if (Math.abs(currentValue) > 20) {
          continue; // Avoid huge numbers
        }
        result = Math.pow(currentValue, operand);
        break;
        
      default:
        continue;
    }
    
    if (isValidResult(result)) {
      const prompt = `${currentValue} ${op} ${operand} = ?`;
      return { prompt, answer: result };
    }
  }
  
  return null; // Failed to generate valid step
}

function generateStepWithParentheses(currentValue: number): { prompt: string; answer: number } | null {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate: currentValue op1 (a op2 b)
    const op1 = randChoice(['+', '-', '*'] as Operator[]);
    const op2 = randChoice(['+', '-', '*'] as Operator[]);
    
    const a = randInt(2, 15);
    const b = randInt(2, 15);
    
    let innerResult: number;
    switch (op2) {
      case '+':
        innerResult = a + b;
        break;
      case '-':
        innerResult = a - b;
        break;
      case '*':
        innerResult = a * b;
        break;
      default:
        continue;
    }
    
    let finalResult: number;
    switch (op1) {
      case '+':
        finalResult = currentValue + innerResult;
        break;
      case '-':
        finalResult = currentValue - innerResult;
        break;
      case '*':
        finalResult = currentValue * innerResult;
        break;
      default:
        continue;
    }
    
    if (isValidResult(finalResult)) {
      const prompt = `${currentValue} ${op1} (${a} ${op2} ${b}) = ?`;
      return { prompt, answer: finalResult };
    }
  }
  
  return null;
}

export function generateLadder(mode: GameMode): Step[] {
  const stepCount = mode === 'normal' ? 5 : 10;
  const allowedOps: Operator[] = mode === 'normal' 
    ? ['+', '-', '*', '/'] 
    : ['+', '-', '*', '/', '^'];
  
  const steps: Step[] = [];
  let currentValue = randInt(10, 50); // Starting value
  
  for (let i = 0; i < stepCount; i++) {
    let stepData: { prompt: string; answer: number } | null = null;
    
    // In hard mode, 30% chance of parentheses (but skip for now if problematic)
    const useParentheses = mode === 'hard' && randBool(0.3) && i > 0;
    
    if (useParentheses) {
      stepData = generateStepWithParentheses(currentValue);
    }
    
    // Fallback to basic step
    if (!stepData) {
      stepData = generateBasicStep(currentValue, allowedOps);
    }
    
    // If still failed, create a simple addition
    if (!stepData) {
      const operand = randInt(1, 20);
      const result = clamp(currentValue + operand);
      stepData = {
        prompt: `${currentValue} + ${operand} = ?`,
        answer: result
      };
    }
    
    steps.push({
      prompt: stepData.prompt,
      answer: stepData.answer,
      userAnswer: '',
      isCorrect: null
    });
    
    currentValue = stepData.answer;
  }
  
  return steps;
}