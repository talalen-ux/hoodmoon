"use client";

import { useEffect, useRef } from "react";

type Particle = {
  orbit: number; // orbit radius as fraction of max radius
  angle: number;
  speed: number;
  size: number;
  alpha: number;
  drift: number; // radial wobble phase
};

/**
 * Canvas background: glowing green particles on concentric orbital
 * paths around an off-screen focal point — moon-and-market motion
 * without rockets. Parallax follows the pointer softly. Static
 * rendering when the user prefers reduced motion.
 */
export function OrbitalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let time = 0;

    // Pointer parallax, smoothed.
    let targetX = 0;
    let targetY = 0;
    let px = 0;
    let py = 0;

    const ORBITS = 5;
    const particles: Particle[] = [];
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    for (let o = 0; o < ORBITS; o++) {
      const orbit = 0.35 + (o / (ORBITS - 1)) * 0.65;
      const count = 10 + o * 6;
      for (let i = 0; i < count; i++) {
        particles.push({
          orbit,
          angle: rand(0, Math.PI * 2),
          speed: rand(0.02, 0.05) / (0.5 + orbit),
          size: rand(0.8, 2.2),
          alpha: rand(0.25, 0.85),
          drift: rand(0, Math.PI * 2),
        });
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointer = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 24;
      targetY = (e.clientY / window.innerHeight - 0.5) * 24;
    };

    const draw = (dt: number) => {
      time += dt;
      px += (targetX - px) * 0.04;
      py += (targetY - py) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Focal point sits below the fold, slightly right — orbits arc
      // across the hero like a rising horizon.
      const cx = width * 0.5 + px;
      const cy = height * 1.25 + py;
      const maxR = Math.max(width, height) * 0.95;

      // Orbit rings — barely-there hairlines.
      for (let o = 0; o < ORBITS; o++) {
        const r = maxR * (0.35 + (o / (ORBITS - 1)) * 0.65);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.028 - o * 0.003})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Particles.
      for (const p of particles) {
        p.angle += p.speed * dt;
        const wobble = Math.sin(time * 0.4 + p.drift) * 6;
        const r = maxR * p.orbit + wobble;
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;

        const pulse = 0.7 + 0.3 * Math.sin(time * 0.8 + p.drift * 3);
        const alpha = p.alpha * pulse;

        // Soft glow halo.
        const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * 7);
        glow.addColorStop(0, `rgba(57,255,99,${alpha * 0.35})`);
        glow.addColorStop(1, "rgba(57,255,99,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 7, 0, Math.PI * 2);
        ctx.fill();

        // Core.
        ctx.fillStyle = `rgba(190,255,205,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      draw(0);
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      let last = performance.now();
      const loop = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        draw(dt);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
