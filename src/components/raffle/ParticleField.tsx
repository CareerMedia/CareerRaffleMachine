import { useEffect, useRef } from 'react';
import './ParticleField.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  shape: 'rect' | 'ribbon';
  opacity: number;
  gravity: number;
}

const COLORS = [
  '#D22030',
  '#7B3FE4',
  '#F5C842',
  '#3B8CFF',
  '#FAF8F6',
  '#4A1F8C',
];

interface ParticleFieldProps {
  active: boolean;
  count?: number;
  className?: string;
}

export function ParticleField({ active, count = 120, className = '' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: -20 - Math.random() * canvas.offsetHeight * 0.3,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: Math.random() * 10 + 4,
      height: Math.random() * 6 + 3,
      shape: Math.random() > 0.5 ? 'rect' : 'ribbon',
      opacity: 1,
      gravity: 0.08 + Math.random() * 0.06,
    }));

    let frame = 0;
    const maxFrames = 300;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      let alive = 0;
      for (const p of particlesRef.current) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (frame > maxFrames * 0.6) {
          p.opacity -= 0.008;
        }

        if (p.opacity <= 0 || p.y > canvas.offsetHeight + 40) continue;
        alive++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);

        if (p.shape === 'ribbon') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height * 3);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }
        ctx.restore();
      }

      frame++;
      if (alive > 0 && frame < maxFrames) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [active, count]);

  if (!active) return null;

  return <canvas ref={canvasRef} className={`particle-field ${className}`.trim()} aria-hidden="true" />;
}
