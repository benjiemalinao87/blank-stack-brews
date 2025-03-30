import { AnimationProps } from 'framer-motion';

export const achievementUnlockAnimation: AnimationProps = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [-180, 0],
    opacity: 1,
    filter: [
      'brightness(1) blur(0px)',
      'brightness(1.5) blur(10px)',
      'brightness(1) blur(0px)'
    ]
  },
  transition: {
    duration: 1.5,
    times: [0, 0.6, 1],
    ease: "backOut"
  }
};

export const levelUpAnimation: AnimationProps = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.2, 0.9, 1.1, 1],
    opacity: [1, 0.8, 1, 0.9, 1],
    filter: [
      'brightness(1) blur(0px)',
      'brightness(2) blur(4px)',
      'brightness(1) blur(0px)'
    ]
  },
  transition: {
    duration: 2,
    times: [0, 0.2, 0.4, 0.6, 1],
    ease: "easeInOut"
  }
};

export const powerUpActivateAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 0 rgba(66, 153, 225, 0)',
      '0 0 20px rgba(66, 153, 225, 0.5)',
      '0 0 0 rgba(66, 153, 225, 0)',
    ],
  },
  transition: {
    duration: 0.5,
    ease: 'easeInOut',
    times: [0, 0.5, 1],
  },
};

export const leaderboardEntryAnimation: AnimationProps = {
  initial: { x: -50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30
  }
};

export const skillNodeUnlockAnimation: AnimationProps = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: 1,
    boxShadow: [
      '0 0 0 0 rgba(66, 153, 225, 0)',
      '0 0 20px 10px rgba(66, 153, 225, 0.5)',
      '0 0 0 0 rgba(66, 153, 225, 0)'
    ]
  },
  transition: {
    duration: 1.5,
    times: [0, 0.5, 1],
    ease: "easeOut"
  }
};

export const questCompleteAnimation: AnimationProps = {
  initial: { opacity: 1, y: 0 },
  animate: {
    opacity: [1, 0.5, 1],
    y: [0, -20, 0],
    scale: [1, 1.1, 1],
    filter: [
      'brightness(1)',
      'brightness(1.5)',
      'brightness(1)'
    ]
  },
  transition: {
    duration: 1,
    times: [0, 0.5, 1],
    ease: "easeOut"
  }
};

export const progressBarAnimation = {
  initial: { width: '0%' },
  animate: (value: number) => ({
    width: `${value}%`,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  })
};

export const floatingPointsAnimation = {
  initial: { y: 0, opacity: 1 },
  animate: { y: -50, opacity: 0 },
  transition: {
    duration: 1,
    ease: "easeOut"
  }
};

export const badgeShineAnimation = {
  initial: { background: 'linear-gradient(45deg, transparent 0%, transparent 100%)' },
  animate: {
    background: [
      'linear-gradient(45deg, transparent 0%, transparent 45%, rgba(255,255,255,0.8) 50%, transparent 55%, transparent 100%)',
      'linear-gradient(45deg, transparent 0%, transparent 100%)'
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

export const cardHoverAnimation = {
  whileHover: {
    scale: 1.05,
    rotate: [0, -1, 1, -1, 0],
    transition: {
      duration: 0.2
    }
  }
};

export const particleExplosion = {
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: [0, 1.5],
    opacity: [1, 0],
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}; 