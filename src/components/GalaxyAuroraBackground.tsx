import React, { useEffect, useRef } from 'react';

interface StarPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
  layer: 1 | 2 | 3;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
  color: string;
}

export const GalaxyAuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with lerping for smooth parallax
    const targetMouse = { x: width / 2, y: height / 2 };
    const currentMouse = { x: width / 2, y: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // 3 Layers of Star Points (Pure, clean natural starlight tones)
    let stars: StarPoint[] = [];
    const starColors = ['#ffffff', '#ffffff', '#f8fafc', '#f1f5f9', '#fefce8', '#e2e8f0'];

    const initStars = () => {
      stars = [];

      // Layer 1: Deep Universe (Distant Micro Stars) - Count: ~180
      const countL1 = Math.floor((width * height) / 7500);
      for (let i = 0; i < countL1; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const baseAlpha = 0.2 + Math.random() * 0.45;
        stars.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 0.5 + Math.random() * 0.6,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: 0.008 + Math.random() * 0.02,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.03,
          vy: (Math.random() - 0.5) * 0.03,
          layer: 1
        });
      }

      // Layer 2: Mid-field Stardust & Galaxy Stars - Count: ~90
      const countL2 = Math.floor((width * height) / 14000);
      for (let i = 0; i < countL2; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const baseAlpha = 0.4 + Math.random() * 0.45;
        stars.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 1.1 + Math.random() * 0.8,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: 0.015 + Math.random() * 0.03,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.06,
          layer: 2
        });
      }

      // Layer 3: Foreground Radiant Aurora Sparkles - Count: ~35
      const countL3 = Math.floor((width * height) / 32000);
      for (let i = 0; i < countL3; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const baseAlpha = 0.6 + Math.random() * 0.35;
        stars.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 1.8 + Math.random() * 1.2,
          color: '#ffffff',
          alpha: baseAlpha,
          baseAlpha,
          twinkleSpeed: 0.02 + Math.random() * 0.04,
          twinkleOffset: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          layer: 3
        });
      }
    };

    initStars();

    // Occasional subtle Shooting Star
    let shootingStar: ShootingStar = {
      x: 0,
      y: 0,
      length: 0,
      speed: 0,
      angle: 0,
      opacity: 0,
      active: false,
      color: '#ffffff'
    };

    let nextShootingStarTime = Date.now() + 4000 + Math.random() * 6000;

    const spawnShootingStar = () => {
      shootingStar = {
        x: Math.random() * (width * 0.8),
        y: Math.random() * (height * 0.4),
        length: 70 + Math.random() * 60,
        speed: 9 + Math.random() * 7,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        opacity: 0.9,
        active: true,
        color: ['#a78bfa', '#38bdf8', '#34d399', '#fef08a'][Math.floor(Math.random() * 4)]
      };
      nextShootingStarTime = Date.now() + 8000 + Math.random() * 12000;
    };

    // Time tracking for animation
    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth mouse lerp for natural parallax dampening
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.04;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.04;

      const normMouseX = (currentMouse.x - width / 2) / (width / 2);
      const normMouseY = (currentMouse.y - height / 2) / (height / 2);

      ctx.clearRect(0, 0, width, height);

      // 1. ORGANIC AURORA GALAXY NEBULA BLOBS (Subtle background glow drifting)
      const auroraTime = time * 0.35;
      
      // Blob 1: Cosmic Violet Nebula (Top Left to Center)
      const a1X = width * 0.25 + Math.sin(auroraTime) * 100;
      const a1Y = height * 0.2 + Math.cos(auroraTime * 0.8) * 80;
      const g1 = ctx.createRadialGradient(a1X, a1Y, 10, a1X, a1Y, Math.max(width, height) * 0.45);
      g1.addColorStop(0, 'rgba(112, 26, 117, 0.16)'); // Deep Fuchsia/Violet
      g1.addColorStop(0.5, 'rgba(67, 24, 255, 0.08)');
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Blob 2: Aurora Teal / Emerald Veil (Bottom Right to Center)
      const a2X = width * 0.75 + Math.cos(auroraTime * 0.9) * 120;
      const a2Y = height * 0.65 + Math.sin(auroraTime * 0.7) * 90;
      const g2 = ctx.createRadialGradient(a2X, a2Y, 10, a2X, a2Y, Math.max(width, height) * 0.5);
      g2.addColorStop(0, 'rgba(13, 148, 136, 0.15)'); // Emerald/Teal Aurora
      g2.addColorStop(0.5, 'rgba(16, 185, 129, 0.06)');
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Blob 3: Deep Stellar Cyan & Indigo (Top Right Pulsing)
      const a3X = width * 0.8 + Math.sin(auroraTime * 0.6) * 80;
      const a3Y = height * 0.25 + Math.cos(auroraTime * 0.5) * 70;
      const g3 = ctx.createRadialGradient(a3X, a3Y, 10, a3X, a3Y, Math.max(width, height) * 0.4);
      g3.addColorStop(0, 'rgba(30, 58, 138, 0.18)'); // Stellar Blue
      g3.addColorStop(0.6, 'rgba(59, 130, 246, 0.05)');
      g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, width, height);

      // Blob 4: Mysterious Astral Amber Core (Lower Left Drift)
      const a4X = width * 0.2 + Math.cos(auroraTime * 0.5) * 90;
      const a4Y = height * 0.8 + Math.sin(auroraTime * 0.6) * 80;
      const g4 = ctx.createRadialGradient(a4X, a4Y, 10, a4X, a4Y, Math.max(width, height) * 0.38);
      g4.addColorStop(0, 'rgba(217, 119, 6, 0.08)'); // Subtle Solar/Stellar Gold
      g4.addColorStop(0.5, 'rgba(180, 83, 9, 0.03)');
      g4.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, width, height);

      // 2. RENDER 3 PARALLAX LAYERS OF STARS
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Drift
        star.baseX += star.vx;
        star.baseY += star.vy;

        // Wrap around viewport edges
        if (star.baseX < -20) star.baseX = width + 20;
        if (star.baseX > width + 20) star.baseX = -20;
        if (star.baseY < -20) star.baseY = height + 20;
        if (star.baseY > height + 20) star.baseY = -20;

        // Parallax multipliers according to depth layer
        // Layer 1 (Distant): 8px max parallax offset
        // Layer 2 (Midfield): 24px max parallax offset
        // Layer 3 (Foreground): 48px max parallax offset
        const parallaxFactor = star.layer === 1 ? 8 : star.layer === 2 ? 24 : 48;
        const drawX = star.baseX - normMouseX * parallaxFactor;
        const drawY = star.baseY - normMouseY * parallaxFactor;

        // Subtle Twinkling
        const twinkle = Math.sin(time * 60 * star.twinkleSpeed + star.twinkleOffset);
        const currentAlpha = Math.max(0.1, Math.min(1, star.baseAlpha + twinkle * 0.28));

        ctx.globalAlpha = currentAlpha;

        if (star.layer === 3) {
          // Layer 3: Render star with a soft glowing halo
          const halo = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, star.size * 3.5);
          halo.addColorStop(0, star.color);
          halo.addColorStop(0.3, star.color);
          halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size * 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (star.layer === 2) {
          // Layer 2: Medium glowing star
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Layer 1: Crisp distant micro point
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. SHOOTING STAR LOGIC & RENDER
      if (Date.now() > nextShootingStarTime && !shootingStar.active) {
        spawnShootingStar();
      }

      if (shootingStar.active) {
        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
        shootingStar.opacity -= 0.016;

        if (shootingStar.opacity <= 0 || shootingStar.x > width + 100 || shootingStar.y > height + 100) {
          shootingStar.active = false;
        } else {
          ctx.save();
          ctx.globalAlpha = shootingStar.opacity;
          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
          const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;
          const grad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.8, shootingStar.color);
          grad.addColorStop(1, '#ffffff');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();

          // Head spark
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(shootingStar.x, shootingStar.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Multi-Color Aurora Shifting Gradient Background */}
      <div 
        className="absolute inset-0 bg-[#02000c] transition-colors duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 90% 80% at 50% -20%, rgba(88, 28, 135, 0.28), transparent 70%),
            radial-gradient(ellipse 70% 60% at 85% 60%, rgba(13, 148, 136, 0.22), transparent 70%),
            radial-gradient(ellipse 80% 70% at 15% 75%, rgba(67, 56, 202, 0.24), transparent 70%),
            radial-gradient(ellipse 60% 50% at 50% 110%, rgba(112, 26, 117, 0.20), transparent 70%),
            linear-gradient(180deg, #02000d 0%, #050218 50%, #030010 100%)
          `
        }}
      />

      {/* Animated Subtle Shifting Aurora Glow Waves */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen animate-pulse pointer-events-none"
        style={{
          animationDuration: '14s',
          background: 'radial-gradient(circle at 40% 30%, rgba(56, 189, 248, 0.12) 0%, transparent 60%)'
        }}
      />
      <div 
        className="absolute inset-0 opacity-30 mix-blend-color-dodge animate-pulse pointer-events-none"
        style={{
          animationDuration: '18s',
          animationDelay: '4s',
          background: 'radial-gradient(circle at 70% 70%, rgba(52, 211, 153, 0.14) 0%, transparent 65%)'
        }}
      />

      {/* Parallax Starfield & Galaxy Points Canvas (3 Layers) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
