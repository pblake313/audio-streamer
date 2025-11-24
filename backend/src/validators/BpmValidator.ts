
export function isValidBpm(bpm: number): boolean {
    return typeof bpm === 'number' && bpm >= 1 && bpm <= 200;
}
  