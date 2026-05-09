import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 400;
const CANVAS_H = 580;
const ROAD_L = 50;
const ROAD_R = 350;
const ROAD_W = ROAD_R - ROAD_L;        // 300
const LANE_COUNT = 3;
const LANE_W = ROAD_W / LANE_COUNT;    // 100
const LANE_CENTERS = [
  ROAD_L + LANE_W * 0.5,  // 100
  ROAD_L + LANE_W * 1.5,  // 200
  ROAD_L + LANE_W * 2.5,  // 300
];

const CAR_W = 38;
const CAR_H = 64;
const PLAYER_Y = 470;
const INIT_SPEED = 3.5;
const MAX_SPEED = 12;
const BASE_SPAWN = 85;   // frames between spawns (decreases with speed)

const TRAFFIC_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const rr = (ctx, x, y, w, h, r = 6) => {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  else { ctx.beginPath(); ctx.rect(x, y, w, h); }
};

const drawPlayerCar = (ctx, x, y) => {
  const hw = CAR_W / 2, hh = CAR_H / 2;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y + hh, hw * 0.85, 5, 0, 0, Math.PI * 2); ctx.fill();
  // body
  ctx.fillStyle = '#22c55e';
  rr(ctx, x - hw, y - hh, CAR_W, CAR_H, 8); ctx.fill();
  // roof stripe
  ctx.fillStyle = '#16a34a';
  rr(ctx, x - hw + 6, y - hh + 14, CAR_W - 12, CAR_H - 30, 4); ctx.fill();
  // front windshield
  ctx.fillStyle = 'rgba(186,230,253,0.92)';
  ctx.fillRect(x - hw + 7, y - hh + 8, CAR_W - 14, 16);
  // rear window
  ctx.fillStyle = 'rgba(186,230,253,0.65)';
  ctx.fillRect(x - hw + 7, y + hh - 26, CAR_W - 14, 14);
  // headlights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - hw + 4, y - hh + 2, 10, 5);
  ctx.fillRect(x + hw - 14, y - hh + 2, 10, 5);
  // taillights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - hw + 4, y + hh - 7, 10, 5);
  ctx.fillRect(x + hw - 14, y + hh - 7, 10, 5);
  // wheels
  ctx.fillStyle = '#111827';
  ctx.fillRect(x - hw - 5, y - hh + 10, 9, 15);
  ctx.fillRect(x + hw - 4, y - hh + 10, 9, 15);
  ctx.fillRect(x - hw - 5, y + hh - 25, 9, 15);
  ctx.fillRect(x + hw - 4, y + hh - 25, 9, 15);
};

const drawTrafficCar = (ctx, x, y, color) => {
  const hw = CAR_W / 2, hh = CAR_H / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(x, y + hh, hw * 0.85, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x - hw, y - hh, CAR_W, CAR_H, 8); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  rr(ctx, x - hw + 6, y - hh + 14, CAR_W - 12, CAR_H - 30, 4); ctx.fill();
  // windshield (bottom — car faces down toward player)
  ctx.fillStyle = 'rgba(186,230,253,0.92)';
  ctx.fillRect(x - hw + 7, y + hh - 26, CAR_W - 14, 16);
  // headlights at bottom
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - hw + 4, y + hh - 7, 10, 5);
  ctx.fillRect(x + hw - 14, y + hh - 7, 10, 5);
  ctx.fillStyle = '#111827';
  ctx.fillRect(x - hw - 5, y - hh + 10, 9, 15);
  ctx.fillRect(x + hw - 4, y - hh + 10, 9, 15);
  ctx.fillRect(x - hw - 5, y + hh - 25, 9, 15);
  ctx.fillRect(x + hw - 4, y + hh - 25, 9, 15);
};

const drawBg = (ctx, dashOffset) => {
  // grass
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(0, 0, ROAD_L - 2, CANVAS_H);
  ctx.fillRect(ROAD_R + 2, 0, CANVAS_W - ROAD_R - 2, CANVAS_H);

  // road surface
  const roadGrad = ctx.createLinearGradient(ROAD_L, 0, ROAD_R, 0);
  roadGrad.addColorStop(0, '#374151');
  roadGrad.addColorStop(0.5, '#4b5563');
  roadGrad.addColorStop(1, '#374151');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(ROAD_L, 0, ROAD_W, CANVAS_H);

  // yellow edge lines
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(ROAD_L, 0, 4, CANVAS_H);
  ctx.fillRect(ROAD_R - 4, 0, 4, CANVAS_H);

  // white dashed lane dividers
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    const lx = ROAD_L + LANE_W * lane - 2;
    for (let i = -1; i < Math.ceil(CANVAS_H / 56) + 1; i++) {
      const dy = ((i * 56 + dashOffset) % (CANVAS_H + 56) + CANVAS_H + 56) % (CANVAS_H + 56) - 28;
      ctx.fillRect(lx, dy, 4, 34);
    }
  }

  // grass edge marks
  ctx.fillStyle = '#16a34a';
  for (let y = 0; y < CANVAS_H; y += 80) {
    const dy = (y + dashOffset * 0.3) % CANVAS_H;
    ctx.fillRect(2, dy, ROAD_L - 6, 6);
    ctx.fillRect(ROAD_R + 4, dy, CANVAS_W - ROAD_R - 6, 6);
  }
};

const CarRacing = ({ onGameStateChange }) => {
  const canvasRef = useRef(null);
  const cbRef = useRef(onGameStateChange);
  useEffect(() => { cbRef.current = onGameStateChange; }, [onGameStateChange]);

  const stateRef = useRef({
    phase: 'idle',   // idle | playing | dead
    playerX: LANE_CENTERS[1],
    targetLane: 1,
    traffic: [],
    frame: 0,
    score: 0,
    speed: INIT_SPEED,
    dashOffset: 0,
    animId: null,
    laneChangeCooldown: 0,
  });

  const [display, setDisplay] = useState({ score: 0, phase: 'idle' });

  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'idle' || s.phase === 'dead') {
      s.playerX = LANE_CENTERS[1];
      s.targetLane = 1;
      s.traffic = [];
      s.frame = 0;
      s.score = 0;
      s.speed = INIT_SPEED;
      s.dashOffset = 0;
      s.laneChangeCooldown = 0;
      s.phase = 'playing';
      setDisplay({ score: 0, phase: 'playing' });
      cbRef.current?.(true);
    }
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const s = stateRef.current;

      // Smooth player X interpolation
      const targetX = LANE_CENTERS[s.targetLane];
      s.playerX += (targetX - s.playerX) * 0.15;

      drawBg(ctx, s.dashOffset);

      if (s.phase === 'playing') {
        s.frame++;
        s.speed = Math.min(MAX_SPEED, INIT_SPEED + s.frame * 0.004);
        s.dashOffset += s.speed * 1.5;
        s.score = Math.floor(s.frame / 6);
        if (s.laneChangeCooldown > 0) s.laneChangeCooldown--;

        // Spawn traffic (interval shrinks as speed increases)
        const spawnInterval = Math.max(28, BASE_SPAWN - Math.floor(s.frame / 80));
        if (s.frame % spawnInterval === 0) {
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
          // Avoid spawning directly on top of player at start
          s.traffic.push({ x: LANE_CENTERS[lane], y: -CAR_H / 2, color });
        }

        // Move traffic downward
        s.traffic.forEach(t => { t.y += s.speed; });
        s.traffic = s.traffic.filter(t => t.y < CANVAS_H + CAR_H);

        // Collision (AABB)
        const px = s.playerX, py = PLAYER_Y;
        const hit = s.traffic.some(t =>
          Math.abs(t.x - px) < CAR_W - 6 && Math.abs(t.y - py) < CAR_H - 10
        );
        if (hit) {
          s.phase = 'dead';
          setDisplay(d => ({ ...d, phase: 'dead' }));
          cbRef.current?.(false);
        } else {
          setDisplay({ score: s.score, phase: 'playing' });
        }
      }

      // Draw traffic
      s.traffic.forEach(t => drawTrafficCar(ctx, t.x, t.y, t.color));
      // Draw player
      drawPlayerCar(ctx, s.playerX, PLAYER_Y);

      // HUD
      if (s.phase === 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        rr(ctx, ROAD_L + 6, 10, 110, 32, 6); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${s.score}`, ROAD_L + 16, 31);

        const pct = (s.speed - INIT_SPEED) / (MAX_SPEED - INIT_SPEED);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        rr(ctx, ROAD_R - 116, 10, 110, 32, 6); ctx.fill();
        ctx.fillStyle = `hsl(${Math.round(120 - pct * 120)}, 85%, 65%)`;
        ctx.textAlign = 'right';
        ctx.fillText(`Speed: ${s.speed.toFixed(1)}`, ROAD_R - 10, 31);
        ctx.textAlign = 'center';
      }

      // Idle overlay
      if (s.phase === 'idle') {
        ctx.fillStyle = 'rgba(0,0,0,0.52)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚗 Car Racing', CANVAS_W / 2, CANVAS_H / 2 - 52);
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#d1fae5';
        ctx.fillText('← → Arrow Keys or A / D to switch lanes', CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.fillText('Dodge the traffic cars!', CANVAS_W / 2, CANVAS_H / 2 + 18);
        ctx.fillStyle = '#22c55e';
        rr(ctx, CANVAS_W / 2 - 70, CANVAS_H / 2 + 44, 140, 44, 10); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('START', CANVAS_W / 2, CANVAS_H / 2 + 71);
      }

      // Dead overlay
      if (s.phase === 'dead') {
        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥 CRASH!', CANVAS_W / 2, CANVAS_H / 2 - 44);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 2);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('Click or press Space to try again', CANVAS_W / 2, CANVAS_H / 2 + 36);
        ctx.fillStyle = '#22c55e';
        rr(ctx, CANVAS_W / 2 - 70, CANVAS_H / 2 + 58, 140, 44, 10); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('RESTART', CANVAS_W / 2, CANVAS_H / 2 + 85);
      }

      s.animId = requestAnimationFrame(loop);
    };

    stateRef.current.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(stateRef.current.animId);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      if (e.code === 'Space') { e.preventDefault(); startGame(); return; }
      if (s.phase !== 'playing') return;
      if (s.laneChangeCooldown > 0) return;
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && s.targetLane > 0) {
        s.targetLane--;
        s.laneChangeCooldown = 12;
      }
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && s.targetLane < LANE_COUNT - 1) {
        s.targetLane++;
        s.laneChangeCooldown = 12;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame]);

  // Touch / click controls on canvas
  const handleCanvasClick = useCallback((e) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') { startGame(); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    if (cx < CANVAS_W / 3 && s.targetLane > 0) { s.targetLane--; s.laneChangeCooldown = 12; }
    else if (cx > (CANVAS_W * 2) / 3 && s.targetLane < LANE_COUNT - 1) { s.targetLane++; s.laneChangeCooldown = 12; }
  }, [startGame]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        className="rounded-2xl shadow-xl cursor-pointer select-none touch-none block max-w-full"
      />
      {display.phase === 'playing' && (
        <p className="text-xs text-gray-400 text-center">
          Tap left/right side of canvas on mobile · Arrow keys or A/D on desktop
        </p>
      )}
    </div>
  );
};

export default CarRacing;
