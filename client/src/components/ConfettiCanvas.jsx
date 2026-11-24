import React, { useEffect, useRef } from 'react';

const CONFETTI_COLORS = [
  '#F59E0B', // Amber Gold
  '#EF4444', // Ruby Red
  '#10B981', // Emerald Green
  '#3B82F6', // Sapphire Blue
  '#8B5CF6', // Royal Purple
  '#EC4899', // Hot Pink
  '#F97316', // Orange
  '#FBBF24', // Yellow
  '#06B6D4'  // Cyan
];

/**
 * ConfettiCanvas: Celebratory 2D Canvas Particle Engine
 *
 * Props:
 * - trigger: boolean (starts the particle blast when true)
 * - duration: number (total duration in ms, default 5000)
 * - particleCount: number (total particles, default 160)
 * - colors: string[] (custom color palette, optional)
 * - fullscreen: boolean (fixed overlay vs container absolute, default true)
 * - className: string (additional CSS classes)
 * - onComplete: () => void (optional callback on completion)
 */
export function ConfettiCanvas({
  trigger = false,
  duration = 5000,
  particleCount = 160,
  colors = CONFETTI_COLORS,
  fullscreen = true,
  className = '',
  onComplete
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!trigger) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High-DPI screens
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    // Initialize particles: Twin-cannon launch from bottom corners
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const isLeftCannon = i % 2 === 0;
      const startX = isLeftCannon ? width * 0.15 : width * 0.85;
      const startY = height * 0.95;

      const angle = isLeftCannon
        ? (Math.PI / 4) + (Math.random() - 0.5) * 0.5   // shoots ~45 deg to right
        : (3 * Math.PI / 4) + (Math.random() - 0.5) * 0.5; // shoots ~135 deg to left

      const velocity = Math.random() * 14 + 18;

      particles.push({
        x: startX,
        y: startY,
        w: Math.random() * 7 + 7,
        h: Math.random() * 9 + 9,
        vx: Math.cos(angle) * velocity,
        vy: -Math.sin(angle) * velocity,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.982,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.08 + 0.04,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.3 ? 'rect' : 'circle',
        opacity: 1
      });
    }

    particlesRef.current = particles;
    const startTime = performance.now();

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const curWidth = canvas.getBoundingClientRect().width;
      const curHeight = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, curWidth, curHeight);

      // Fade-out starts at 70% of duration
      const globalFade = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

      let activeCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx + Math.cos(p.wobble) * 1.5;
        p.y += p.vy;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;
        p.opacity = globalFade;

        if (p.opacity > 0.01 && p.y < curHeight + 40) {
          activeCount++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          // 3D paper flutter simulation via X-scale cosine oscillation
          ctx.scale(Math.cos(p.wobble), 1);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();
        }
      }

      if (progress < 1 && activeCount > 0) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, curWidth, curHeight);
        animFrameRef.current = null;
        if (onComplete) onComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [trigger, duration, particleCount, colors, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${
        fullscreen ? 'fixed inset-0 z-50 w-full h-full' : 'absolute inset-0 z-20 w-full h-full'
      } ${className}`}
    />
  );
}

export default ConfettiCanvas;
