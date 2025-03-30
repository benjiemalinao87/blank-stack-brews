export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  badge: string;
  category: string;
  progress: number;
  total: number;
  isCompleted: boolean;
}

export interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  achievements: Achievement[];
}

export interface LeaderboardEntry {
  agentId: string;
  agentName: string;
  avatar: string;
  metrics: {
    value: number;
    change: number;
    rank: number;
  };
  details: {
    [key: string]: number | string;
  };
}

export interface LeaderboardCategory {
  id: string;
  title: string;
  metrics: string[];
  icon: string;
  entries: LeaderboardEntry[];
  timeframe: 'daily' | 'weekly' | 'monthly';
}

export interface SkillTreeNode {
  id: string;
  level: number;
  name: string;
  description: string;
  bonus: string;
  requiredPoints: number;
  isUnlocked: boolean;
  dependencies: string[];
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: SkillTreeNode[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  timeFrame: {
    start: string;
    end: string;
  };
  goal: {
    type: string;
    target: number;
    current: number;
  };
  rewards: {
    xp: number;
    points: number;
    bonus?: {
      type: string;
      multiplier: number;
    };
  };
  status: 'available' | 'inProgress' | 'completed' | 'expired';
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // in seconds
  effect: {
    type: string;
    multiplier: number;
    target: string;
  };
  cost: number;
  isActive: boolean;
  endTime?: number;
}

export interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  goal: {
    type: string;
    target: number;
    current: number;
  };
  rewards: {
    team: {
      points: number;
      bonuses: string[];
    };
    individual: {
      points: number;
      bonuses: string[];
    };
  };
  participants: {
    agentId: string;
    contribution: number;
  }[];
  startTime: number;
  endTime: number;
  status: 'upcoming' | 'active' | 'completed';
}

export interface AgentStats {
  totalPoints: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  achievements: {
    total: number;
    completed: number;
  };
  skillPoints: number;
  activeBuffs: PowerUp[];
  questProgress: {
    daily: number;
    weekly: number;
  };
  metrics: {
    responseTime: number;
    conversionRate: number;
    customerSatisfaction: number;
    callsHandled: number;
  };
} 