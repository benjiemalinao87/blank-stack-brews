import { 
  AchievementCategory, 
  SkillTree, 
  PowerUp, 
  LeaderboardCategory 
} from '../types';

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  {
    id: 'communication',
    name: 'Communication Excellence',
    description: 'Master the art of customer communication',
    achievements: [
      {
        id: 'quick_responder_elite',
        title: 'Elite Responder',
        description: 'Maintain < 30 second response time for 100 messages',
        points: 500,
        badge: '⚡️',
        category: 'communication',
        progress: 0,
        total: 100,
        isCompleted: false
      },
      {
        id: 'conversation_master',
        title: 'Conversation Master',
        description: 'Successfully handle 10 concurrent chats',
        points: 300,
        badge: '🎯',
        category: 'communication',
        progress: 0,
        total: 10,
        isCompleted: false
      },
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Handle after-hours inquiries with high satisfaction',
        points: 200,
        badge: '🦉',
        category: 'communication',
        progress: 0,
        total: 5,
        isCompleted: false
      }
    ]
  },
  {
    id: 'sales',
    name: 'Sales Mastery',
    description: 'Excel in converting leads and closing deals',
    achievements: [
      {
        id: 'deal_closer',
        title: 'Deal Closer',
        description: 'Close 5 deals in a single day',
        points: 1000,
        badge: '💎',
        category: 'sales',
        progress: 0,
        total: 5,
        isCompleted: false
      },
      {
        id: 'pipeline_pro',
        title: 'Pipeline Pro',
        description: 'Move 20 leads to qualified stage in a week',
        points: 400,
        badge: '🚀',
        category: 'sales',
        progress: 0,
        total: 20,
        isCompleted: false
      }
    ]
  }
];

export const SKILL_TREES: SkillTree[] = [
  {
    id: 'communication',
    name: 'Communication Master',
    description: 'Enhance your customer communication abilities',
    icon: '💬',
    nodes: [
      {
        id: 'quick_response',
        level: 1,
        name: 'Quick Response',
        description: 'Decrease response time by 10%',
        bonus: '10% faster response time',
        requiredPoints: 100,
        isUnlocked: false,
        dependencies: []
      },
      {
        id: 'multi_chat',
        level: 2,
        name: 'Multi-Chat Pro',
        description: 'Handle an additional concurrent chat',
        bonus: '+1 concurrent chat',
        requiredPoints: 300,
        isUnlocked: false,
        dependencies: ['quick_response']
      }
    ]
  },
  {
    id: 'sales',
    name: 'Sales Expert',
    description: 'Master the art of sales and lead conversion',
    icon: '💰',
    nodes: [
      {
        id: 'lead_qualification',
        level: 1,
        name: 'Lead Qualification',
        description: 'Improve lead qualification speed',
        bonus: '15% faster lead qualification',
        requiredPoints: 200,
        isUnlocked: false,
        dependencies: []
      }
    ]
  }
];

export const POWER_UPS: PowerUp[] = [
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: 'Double points for quick responses',
    icon: '⚡️',
    duration: 1800, // 30 minutes
    effect: {
      type: 'multiplier',
      multiplier: 2,
      target: 'response_points'
    },
    cost: 100,
    isActive: false
  },
  {
    id: 'conversion_multiplier',
    name: 'Conversion Multiplier',
    description: 'Triple points for lead conversions',
    icon: '🎯',
    duration: 3600, // 1 hour
    effect: {
      type: 'multiplier',
      multiplier: 3,
      target: 'conversion_points'
    },
    cost: 300,
    isActive: false
  }
];

export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  {
    id: 'calls_handled',
    title: 'Top Callers',
    metrics: ['Total Calls', 'Success Rate', 'Avg Duration'],
    icon: '📞',
    entries: [],
    timeframe: 'daily'
  },
  {
    id: 'leads_converted',
    title: 'Lead Champions',
    metrics: ['Conversions', 'Value', 'Rate'],
    icon: '🎯',
    entries: [],
    timeframe: 'daily'
  },
  {
    id: 'response_time',
    title: 'Quick Responders',
    metrics: ['Avg Time', 'Volume', 'Quality'],
    icon: '⚡',
    entries: [],
    timeframe: 'daily'
  },
  {
    id: 'customer_satisfaction',
    title: 'Satisfaction Kings',
    metrics: ['CSAT Score', 'Reviews', 'Resolution Rate'],
    icon: '👑',
    entries: [],
    timeframe: 'daily'
  }
];

export const XP_LEVELS = {
  baseXP: 1000,
  multiplier: 1.5,
  maxLevel: 100
};

export const DAILY_BONUS_HOURS = {
  morning: {
    start: 9,
    end: 11,
    multiplier: 2
  },
  afternoon: {
    start: 14,
    end: 16,
    multiplier: 1.5
  }
};

export const ACHIEVEMENT_POINTS = {
  quickResponse: 10,
  conversion: 50,
  callCompleted: 20,
  highCSAT: 30
}; 