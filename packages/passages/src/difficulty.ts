export function difficultyForWpm(wpm: number): [number, number] {
  if (wpm < 35) return [1, 4];
  if (wpm < 55) return [2, 6];
  if (wpm < 75) return [3, 8];
  if (wpm < 95) return [4, 9];
  return [5, 10];
}
