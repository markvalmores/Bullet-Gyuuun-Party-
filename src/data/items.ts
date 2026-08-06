import { GameItem, GachaBanner } from '../types';

export const SHOP_ITEMS: GameItem[] = [
  {
    id: 'gun_laser_1',
    name: 'Neon Laser Blaster',
    description: 'A high-tech laser gun with neon effects.',
    category: 'GUN',
    price: 500,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=laser',
    rarity: 'RARE'
  },
  {
    id: 'target_pizza_pro',
    name: 'Golden Pizza Target',
    description: 'A shiny pizza target that gives bonus score.',
    category: 'TARGET',
    price: 300,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=pizza',
    rarity: 'RARE'
  },
  {
    id: 'skill_fever_boost',
    name: 'Mega Fever',
    description: 'Increases fever duration by 2 seconds.',
    category: 'SKILL',
    price: 1000,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=skill',
    rarity: 'EPIC',
    power: 2
  },
  {
    id: 'char_vampire',
    name: 'Vampire Usagyuuun',
    description: 'Limited edition vampire character!',
    category: 'CHARACTER',
    price: 5000,
    image: '/src/assets/images/vampire_usagyuuun_character_1785977897434.jpg',
    rarity: 'LEGENDARY'
  },
  {
    id: 'acc_top_hat',
    name: 'Fancy Top Hat',
    description: 'A very dapper accessory for your Gyuuun.',
    category: 'ACCESSORY',
    price: 1500,
    image: 'https://api.dicebear.com/7.x/shapes/svg?seed=hat',
    rarity: 'EPIC'
  },
  {
    id: 'grand_violet_overlord',
    name: 'Overlord Pulse',
    description: 'Release a massive violet shockwave that hits all targets.',
    category: 'GRAND_SKILL',
    price: 0,
    image: '/src/assets/images/violet_grand_skill_icon_1785978291539.jpg',
    rarity: 'GRAND',
    power: 100,
    gachaOnly: true
  }
];

export const GACHA_BANNERS: GachaBanner[] = [
  {
    id: 'banner_vampire',
    name: 'Night of the Vampire',
    image: '/src/assets/images/vampire_gacha_banner_1785977918891.jpg',
    limitedItem: SHOP_ITEMS.find(i => i.id === 'char_vampire')!,
    rate: 19,
    cost: 200
  },
  {
    id: 'banner_overlord',
    name: 'Blood of the Overlord',
    image: '/src/assets/images/overlord_vampire_banner_1785978304322.jpg',
    limitedItem: SHOP_ITEMS.find(i => i.id === 'grand_violet_overlord')!,
    rate: 5, // Much rarer for a Grand Skill
    cost: 500
  }
];
