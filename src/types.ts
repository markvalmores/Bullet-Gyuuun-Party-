/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'TITLE' | 'AUTH' | 'PROFILE_SETUP' | 'START' | 'PLAYING' | 'RESULTS' | 'SETTINGS';

export interface GameSettings {
  sensitivity: number;
  offset: number; // ms
  speed: number;
  autoFever: boolean;
  deviceType: string;
  os: string;
}

export type FeverType = 'BLUE' | 'RED' | 'VIOLET';

export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string;
  email: string;
  isAdmin?: boolean;
}

export interface Target {
  id: string;
  type: 'BUNNY' | 'MONSTER' | 'WAVE';
  x: number; // 0 to 100 (percentage)
  y: number; // 0 to 100 (percentage)
  spawnTime: number; // ms from start
  hitTime?: number; // ms from start
  status: 'ACTIVE' | 'HIT' | 'MISS';
  lane: number; // 0 (top), 1 (bottom)
  image: string;
}

export interface ScoreBreakdown {
  perfects: number;
  goods: number;
  misses: number;
  maxCombo: number;
  totalScore: number;
}

export interface Character {
  id: string;
  name: string;
  image: string;
  bestScore: number;
  bestCombo: number;
}
