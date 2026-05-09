import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 400;
const CANVAS_H = 500;
const BIRD_X = 80;
const BIRD_R = 14;
const GRAVITY = 0.45;
const JUMP = -8;
const PIPE_W = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 2.8;
const PIPE_INTERVAL = 90;

const FlappyBird = ({ onGameStateChange }) => {
  const canvasRef = useRef(null);
  const cbRef = useRef(onGameStateChange);
  useEffect(() => { cbRef.current = onGameStateChange; }, [onGameStateChange]);

  const stateRef = useRef({
    bird: { y: CANVAS_H / 2, vy: 0 },
    pipes: [],
    frame: 0,
    score: 0,
    phase: 'idle', // idle | playing | dead
    animId: null,
  });
  const [display, setDisplay] = useState({ score: 0, phase: 'idle' });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'idle') {
      s.phase = 'playing';
      s.bird.vy = JUMP;
      setDisplay((d) => ({ ...d, phase: 'playing' }));
      cbRef.current?.(true);
    } else if (s.phase === 'playing') {
      s.bird.vy = JUMP;
    } else if (s.phase === 'dead') {
      s.bird = { y: CANVAS_H / 2, vy: 0 };
      s.pipes = [];
      s.frame = 0;
      s.score = 0;
      s.phase = 'idle';
      setDisplay({ score: 0, phase: 'idle' });
      // timer stays off until user taps again to start
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawBird = (y) => {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(BIRD_X, y, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(BIRD_X + 5, y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(BIRD_X + BIRD_R, y);
      ctx.lineTo(BIRD_X + BIRD_R + 10, y + 3);
      ctx.lineTo(BIRD_X + BIRD_R, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawPipes = (pipes) => {
      pipes.forEach(({ x, top }) => {
        const grad = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
        grad.addColorStop(0, '#16a34a');
        grad.addColorStop(1, '#22c55e');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, PIPE_W, top);
        ctx.fillRect(x - 4, top - 24, PIPE_W + 8, 24);
        const bot = top + PIPE_GAP;
        ctx.fillRect(x, bot, PIPE_W, CANVAS_H - bot);
        ctx.fillRect(x - 4, bot, PIPE_W + 8, 24);
      });
    };

    const drawBg = (frame) => {
      const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      sky.addColorStop(0, '#bfdbfe');
      sky.addColorStop(1, '#eff6ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 30);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      [[60, 60], [200, 100], [320, 80]].forEach(([cx, cy]) => {
        const offset = ((cx - frame * 0.3) % (CANVAS_W + 80) + CANVAS_W + 80) % (CANVAS_W + 80) - 40;
        ctx.beginPath();
        ctx.arc(offset, cy, 24, 0, Math.PI * 2);
        ctx.arc(offset + 22, cy - 8, 18, 0, Math.PI * 2);
        ctx.arc(offset + 40, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawBg(s.frame);

      if (s.phase === 'playing') {
        s.frame++;
        s.bird.vy += GRAVITY;
        s.bird.y += s.bird.vy;

        if (s.frame % PIPE_INTERVAL === 0) {
          const top = 60 + Math.random() * (CANVAS_H - PIPE_GAP - 120);
          s.pipes.push({ x: CANVAS_W, top, scored: false });
        }

        s.pipes = s.pipes.filter((p) => p.x > -PIPE_W - 10);
        s.pipes.forEach((p) => {
          p.x -= PIPE_SPEED;
          if (!p.scored && p.x + PIPE_W < BIRD_X) {
            p.scored = true;
            s.score++;
            setDisplay((d) => ({ ...d, score: s.score }));
          }
        });

        const birdY = s.bird.y;
        const hit = s.pipes.some(({ x, top }) => {
          const inX = BIRD_X + BIRD_R > x && BIRD_X - BIRD_R < x + PIPE_W;
          const inY = birdY - BIRD_R < top || birdY + BIRD_R > top + PIPE_GAP;
          return inX && inY;
        });

        if (hit || birdY + BIRD_R > CANVAS_H - 30 || birdY - BIRD_R < 0) {
          s.phase = 'dead';
          setDisplay((d) => ({ ...d, phase: 'dead' }));
          // Timer stops — bird knocked out
          cbRef.current?.(false);
        }
      }

      drawPipes(stateRef.current.pipes);
      drawBird(stateRef.current.bird.y);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stateRef.current.score, CANVAS_W / 2, 44);

      if (stateRef.current.phase === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('Flappy Bird', CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = '16px sans-serif';
        ctx.fillText('Tap / Space / Click to start', CANVAS_W / 2, CANVAS_H / 2 + 20);
      }
      if (stateRef.current.phase === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('Game Over!', CANVAS_W / 2, CANVAS_H / 2 - 24);
        ctx.font = '20px sans-serif';
        ctx.fillText(`Score: ${stateRef.current.score}`, CANVAS_W / 2, CANVAS_H / 2 + 14);
        ctx.font = '15px sans-serif';
        ctx.fillText('Tap to restart', CANVAS_W / 2, CANVAS_H / 2 + 46);
      }

      s.animId = requestAnimationFrame(loop);
    };

    stateRef.current.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(stateRef.current.animId);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={jump}
      className="rounded-2xl shadow-xl cursor-pointer select-none touch-none block max-w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default FlappyBird;
