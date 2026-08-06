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
  autoSave: boolean;
  deviceType: string;
  os: string;
}

export type FeverType = 'BLUE' | 'RED' | 'VIOLET';

export interface UserProfile {
  uid: string;
  username: string;
  photoURL: string;
  email: string | null;
  isAdmin?: boolean;
  level?: number;
  goldenCarrots: number;
  inventory: UserInventory;
  achievements?: string[];
  createdAt?: string;
  lastLogin?: string;
  dailyStreak?: number;
  claimedToday?: boolean;
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

export type ItemCategory = 'GUN' | 'TARGET' | 'SKILL' | 'CHARACTER' | 'ACCESSORY' | 'GRAND_SKILL';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  price: number;
  image: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'GRAND';
  power?: number; // For skills or guns
  gachaOnly?: boolean;
}

export interface UserInventory {
  items: string[]; // IDs of owned items
  goldenCarrots: number;
  equipped: {
    gun?: string;
    character?: string;
    accessory?: string;
    skills: string[];
  };
}

export interface GachaBanner {
  id: string;
  name: string;
  image: string;
  limitedItem: GameItem;
  rate: number; // 0-100
  cost: number;
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
