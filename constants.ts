
export enum ThemeType {
  MORNING_GLOW = 'MORNING_GLOW',
  DEEP_SPACE = 'DEEP_SPACE',
  NEON_FOREST = 'NEON_FOREST',
}

export interface ThemeColors {
  skyGradient: [string, string];
  ground: string;
  water: string;
  waterReflection: string;
  plantBase: string;
  plantHighlight: string;
  orb: string;
  portal: string;
  text: string;
  uiBg: string;
}

export const THEMES: Record<ThemeType, ThemeColors> = {
  [ThemeType.MORNING_GLOW]: {
    skyGradient: ['#FF9A9E', '#FECFEF'],
    ground: '#F6D365',
    water: '#A1C4FD',
    waterReflection: '#FFFFFF',
    plantBase: '#84FAB0',
    plantHighlight: '#8FD3F4',
    orb: '#FFFFFF',
    portal: '#FFD1FF',
    text: '#4A4A4A',
    uiBg: 'rgba(255, 255, 255, 0.3)',
  },
  [ThemeType.DEEP_SPACE]: {
    skyGradient: ['#0f0c29', '#302b63'],
    ground: '#24243e',
    water: '#000428',
    waterReflection: '#004e92',
    plantBase: '#7F00FF',
    plantHighlight: '#E100FF',
    orb: '#00d2ff',
    portal: '#00F260',
    text: '#E0E0E0',
    uiBg: 'rgba(0, 0, 0, 0.5)',
  },
  [ThemeType.NEON_FOREST]: {
    skyGradient: ['#11998e', '#38ef7d'],
    ground: '#051937',
    water: '#A8EB12',
    waterReflection: '#F3F9A7',
    plantBase: '#FF0099',
    plantHighlight: '#493240',
    orb: '#FFDD00',
    portal: '#00F260',
    text: '#FFFFFF',
    uiBg: 'rgba(0, 20, 40, 0.6)',
  },
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'ORB' | 'SPARKLE' | 'PORTAL_DUST' | 'EXPLOSION' | 'TRAIL';
}

export interface Plant {
  x: number;
  y: number;
  height: number;
  maxHeight: number;
  width: number;
  growth: number; // 0 to 1
  growthSpeed: number;
  swayOffset: number;
  swaySpeed: number;
  color: string;
  type: 'GRASS' | 'TREE' | 'ALIEN_FLOWER';
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  strength: number;
  life: number;
}
