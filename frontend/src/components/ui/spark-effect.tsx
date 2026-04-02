import { useEffect, useRef } from 'react';

interface SparkEffectProps {
  selector?: string;
  amount?: number;
  speed?: number;
  lifetime?: number;
  direction?: { x: number; y: number };
  size?: [number, number];
  maxopacity?: number;
  color?: string;
  randColor?: boolean;
  acceleration?: [number, number];
}

interface SparkInstance {
  x: number;
  y: number;
  age: number;
  acceleration: number;
  color: string;
  opacity: number;
  go: () => void;
}

export function SparkEffect({
  selector = '#sparks',
  amount = 150,
  speed = 0.04,
  lifetime = 200,
  direction = { x: -0.5, y: 1 },
  size = [3, 3],
  maxopacity = 1.0, // Maximum opacity
  color = '192, 255, 0',
  randColor = false,
  acceleration = [5, 40]
}: SparkEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const OPT = {
      selector,
      amount,
      speed,
      lifetime,
      direction,
      size,
      maxopacity,
      color,
      randColor,
      acceleration
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sparks: SparkInstance[] = [];

    function setCanvasWidth() {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    }

    function rand(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function createSpark(x: number, y: number): SparkInstance {
      const spark: SparkInstance = {
        x,
        y,
        age: 0,
        acceleration: rand(OPT.acceleration[0], OPT.acceleration[1]),
        color: OPT.randColor
          ? `${rand(0, 255)},${rand(0, 255)},${rand(0, 255)}`
          : OPT.color,
        opacity: OPT.maxopacity,
        go: function () {
          this.x += OPT.speed * OPT.direction.x * this.acceleration / 2;
          this.y += OPT.speed * OPT.direction.y * this.acceleration / 2;
          this.opacity = OPT.maxopacity - ++this.age / OPT.lifetime;
        }
      };
      return spark;
    }

    function addSpark() {
      const x = rand(-200, window.innerWidth + 200);
      const y = rand(-200, window.innerHeight + 200);
      sparks.push(createSpark(x, y));
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Neon Glow Effect
      ctx.shadowBlur = 12; // Increased glow intensity
      ctx.shadowColor = `rgba(${OPT.color}, 1.0)`;

      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        if (spark.opacity <= 0) {
          sparks.splice(i, 1);
        } else {
          spark.go();
          ctx.beginPath();
          ctx.fillStyle = `rgba(${spark.color}, ${spark.opacity})`;
          ctx.fillRect(spark.x, spark.y, OPT.size[0], OPT.size[1]);
        }
      }
      // Reset shadows for next frame or other draws
      ctx.shadowBlur = 0;
      animationFrameId = window.requestAnimationFrame(draw);
    }

    let animationFrameId: number;

    const sparkInterval = window.setInterval(() => {
      if (sparks.length < OPT.amount) {
        addSpark();
      }
    }, 1000 / (OPT.amount / 5));

    setCanvasWidth();
    animationFrameId = window.requestAnimationFrame(draw);

    window.addEventListener('resize', setCanvasWidth);

    return () => {
      window.removeEventListener('resize', setCanvasWidth);
      window.clearInterval(sparkInterval);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [selector, amount, speed, lifetime, direction, size, maxopacity, color, randColor, acceleration]);

  return (
    <canvas
      ref={canvasRef}
      id="sparks"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen bg-transparent"
      style={{ opacity: 1.0 }}
    />
  );
}
