// Framer Motion Animation Variants for PaperPanel
// Provides reusable, consistent animations across the application

import { Variants } from 'framer-motion';

/**
 * Container variants for staggered children animations
 * Use with motion.div to animate lists of items
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

/**
 * Item variants for individual items in a container
 * Pairs with containerVariants for staggered entrance
 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.175, 0.885, 0.32, 1.275] // Custom easing for smooth bounce
    }
  }
};

/**
 * Card hover animations
 * Provides subtle lift effect on hover and press feedback
 */
export const cardHoverVariants: Variants = {
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { scale: 0.98 }
};

/**
 * Button animations
 * Standard scale animations for interactive buttons
 */
export const buttonVariants: Variants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: { scale: 0.95 }
};

/**
 * Fade in up animation
 * Smooth entrance from bottom with fade
 */
export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

/**
 * Scale in animation
 * Grows from center with fade
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.175, 0.885, 0.32, 1.275]
    }
  }
};

/**
 * Slide in from left
 * Common for sidebar or modal entrances
 */
export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

/**
 * Slide in from right
 * Useful for notifications or side panels
 */
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

/**
 * Page transition variants
 * For route changes with AnimatePresence
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  in: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  out: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

/**
 * Modal/Dialog backdrop variants
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

/**
 * Modal/Dialog content variants
 */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.175, 0.885, 0.32, 1.275]
    }
  }
};

/**
 * Notification toast variants
 * Slides in from top-right
 */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -50, x: 100 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

/**
 * Stat counter animation
 * For animating numbers counting up
 */
export const counterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

/**
 * List item stagger (faster than container)
 * For quick lists like dropdowns or menus
 */
export const fastStaggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

export const fastStaggerItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  }
};
