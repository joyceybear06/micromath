// @ts-nocheck
// Timer utility functions

export const GAME_DURATION_SECONDS = 60;

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getTimeColor(timeRemaining: number): string {
  if (timeRemaining <= 10) return '#dc3545'; // red
  if (timeRemaining <= 30) return '#ffc107'; // yellow
  return '#28a745'; // green
}