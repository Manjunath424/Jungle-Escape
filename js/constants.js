/**
 * JUNGLE ESCAPE - Game Constants & Configurations
 */

const CONSTANTS = {
  // Lane positions along the X-axis
  LANES: [-3.2, 0, 3.2], // Left, Center, Right
  LANE_LEFT: 0,
  LANE_CENTER: 1,
  LANE_RIGHT: 2,
  LANE_CHANGE_SPEED: 14.0, // Lerp speed for smooth lane shift

  // World & Track Segment dimensions
  CHUNK_LENGTH: 45.0,
  VISIBLE_CHUNKS: 9,
  PATH_WIDTH: 10.4,
  TOTAL_TRACK_AHEAD: 405.0, // 9 * 45

  // Player physics
  PLAYER_RUN_HEIGHT: 1.85,
  PLAYER_SLIDE_HEIGHT: 0.9,
  PLAYER_WIDTH: 1.1,
  PLAYER_DEPTH: 1.1,
  JUMP_VELOCITY: 14.5,
  GRAVITY: 36.0,
  SLIDE_DURATION: 0.85, // seconds

  // Speed and progression
  SPEED_INITIAL: 24.0,
  SPEED_MAX: 52.0,
  SPEED_ACCEL_RATE: 0.30, // speed increase per 100 meters
  SPEED_BOOST_MULTIPLIER: 1.6,

  // Camera settings
  CAM_OFFSET_Y: 3.8,
  CAM_OFFSET_Z: 6.8,
  CAM_LOOK_Y: 1.6,
  CAM_LOOK_Z_AHEAD: -10.0,
  CAM_LERP_SPEED: 8.0,

  // Fog settings
  FOG_COLOR: 0x071b12, // Deep misty emerald jungle
  FOG_NEAR: 45.0,
  FOG_FAR: 320.0,

  // Power-up configurations
  POWERUPS: {
    MAGNET: {
      type: 'magnet',
      duration: 10.0,
      radius: 24.0,
      name: 'Coin Magnet',
      icon: '🧲',
      color: 0xff3b30
    },
    SHIELD: {
      type: 'shield',
      duration: 15.0,
      name: 'Temple Shield',
      icon: '🛡️',
      color: 0x00d4ff
    },
    MULTIPLIER: {
      type: 'multiplier',
      duration: 12.0,
      multiplier: 2,
      name: '2X Gold',
      icon: '✨',
      color: 0xffcc00
    },
    SCORE_BOOST: {
      type: 'score_boost',
      duration: 12.0,
      multiplier: 2,
      name: 'Score Boost',
      icon: '⚡',
      color: 0x34c759
    },
    SPEED_BOOST: {
      type: 'speed_boost',
      duration: 6.0,
      name: 'Artifact Rush',
      icon: '🔥',
      color: 0xff9500
    }
  },

  // Obstacle Types
  OBSTACLES: {
    ROCK: 'rock',                     // 1 lane, dodge
    FALLEN_TRUNK: 'fallen_trunk',     // 1 or 2 lanes, jump
    STONE_BARRIER: 'stone_barrier',   // 1 lane, jump
    WOODEN_BARRICADE: 'wooden_barricade', // 1 lane, jump/dodge
    LOW_BRANCH: 'low_branch',         // 1 or 2 lanes overhead, slide
    HIGH_ARCH_TRAP: 'high_arch_trap', // overhead stone spikes/arch, slide
    GAP_CHASM: 'gap_chasm',           // gap in bridge/path, jump
    STONE_PILLAR: 'stone_pillar',     // broken obelisk, dodge
    SPIKE_TRAP: 'spike_trap',         // ground spikes, jump
  },

  // Scoring
  SCORE_PER_METER: 1,
  SCORE_PER_COIN: 10,

  // LocalStorage keys
  STORAGE_KEYS: {
    BEST_SCORE: 'jungle_escape_best_score',
    LONGEST_DIST: 'jungle_escape_longest_dist',
    TOTAL_COINS: 'jungle_escape_total_coins',
    SETTINGS: 'jungle_escape_settings'
  }
};

// Freeze constants to prevent unintended mutations
Object.freeze(CONSTANTS);
Object.freeze(CONSTANTS.LANES);
Object.freeze(CONSTANTS.POWERUPS);
Object.freeze(CONSTANTS.OBSTACLES);
Object.freeze(CONSTANTS.STORAGE_KEYS);
