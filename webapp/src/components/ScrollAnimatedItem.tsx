import React, { useRef, ReactNode } from 'react';
import { motion, useInView } from 'motion/react';

interface ScrollAnimatedItemProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const ScrollAnimatedItem: React.FC<ScrollAnimatedItemProps> = ({
  children,
  delay = 0,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={inView ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
