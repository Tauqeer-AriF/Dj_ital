import React, { useEffect, useRef, useState } from 'react';

export type RevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'scale-up'
  | 'fade'
  | 'zoom-in';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number; // in ms
  duration?: number; // in ms
  threshold?: number;
  rootMargin?: string;
  className?: string;
  once?: boolean;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

/**
 * ScrollReveal component - Elegantly reveals elements as they enter the viewport.
 * Uses performant IntersectionObserver with custom cubic-bezier easing.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  className = '',
  once = true,
  style = {},
  as: Component = 'div',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, reveal immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    // Check if prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold, rootMargin, once]);

  // Determine variant-specific initial transforms
  const getTransformStyle = () => {
    if (isVisible) return 'none';
    switch (variant) {
      case 'fade-up':
        return 'translateY(36px)';
      case 'fade-down':
        return 'translateY(-36px)';
      case 'fade-left':
        return 'translateX(40px)';
      case 'fade-right':
        return 'translateX(-40px)';
      case 'scale-up':
      case 'zoom-in':
        return 'scale(0.94) translateY(20px)';
      case 'fade':
      default:
        return 'none';
    }
  };

  const dynamicStyles: React.CSSProperties = {
    ...style,
    opacity: isVisible ? 1 : 0,
    transform: getTransformStyle(),
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <Component
      ref={elementRef}
      className={`scroll-reveal ${isVisible ? 'scroll-reveal-visible' : 'scroll-reveal-hidden'} ${className}`}
      style={dynamicStyles}
    >
      {children}
    </Component>
  );
};

/**
 * Custom hook to detect when an element scrolls into view
 */
export function useInView(options: { threshold?: number; rootMargin?: string; once?: boolean } = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', once = true } = options;
  const [inView, setInView] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold, rootMargin, once]);

  return [ref, inView] as const;
}
