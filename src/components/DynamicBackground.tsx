import React, { useEffect, useRef } from 'react';

export interface DynamicBackgroundProps {
  style?: string;
  speed?: string;
  accentColor?: string;
}

export const ParticleCanvas: React.FC<{ speedMultiplier?: number; color?: string }> = ({
  speedMultiplier = 1,
  color = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particleCount = Math.min(60, Math.floor(width / 30));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4 * speedMultiplier,
      vy: (Math.random() - 0.5) * 0.4 * speedMultiplier,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [speedMultiplier, color]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
};

export const RetroGrid: React.FC<{ color?: string }> = ({ color = 'rgba(245, 158, 11, 0.05)' }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
  );
};

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  style = 'subtle-motion',
  speed = 'medium',
  accentColor = '#f59e0b',
}) => {
  const speedVal = speed === 'slow' ? 0.5 : speed === 'fast' ? 1.8 : 1;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-neutral-950">
      {/* Subtle ambient lighting gradients */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-15 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <RetroGrid color="rgba(255, 255, 255, 0.02)" />

      {style !== 'static' && (
        <ParticleCanvas speedMultiplier={speedVal} color={accentColor} />
      )}
    </div>
  );
};
