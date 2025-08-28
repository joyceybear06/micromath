// @ts-nocheck
// Simple random helpers (non-seeded for now)

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randChoice<T>(array: T[]): T {
  return array[randInt(0, array.length - 1)];
}

export function randBool(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

// Get a random factor of n (for safe division)
export function getRandomFactor(n: number): number {
  const factors: number[] = [];
  const absN = Math.abs(n);
  
  for (let i = 1; i <= absN; i++) {
    if (absN % i === 0) {
      factors.push(i);
    }
  }
  
  return factors.length > 0 ? randChoice(factors) : 1;
}