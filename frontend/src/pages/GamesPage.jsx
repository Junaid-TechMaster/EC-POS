import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Clock, Wallet, Trophy, Info, Play, Square, ArrowLeft } from 'lucide-react';
import axios from '../utils/api';
import FlappyBird from './games/FlappyBird';
import CarRacing from './games/CarRacing';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const REWARD_MINUTES = 60;
const REWARD_AMOUNT  = 10;

const GamesPage = () => {
  const { user } = useContext(AuthContext);
  const { format } = useCurrency();

  const [activeGame, setActiveGame] = useState(null);   // null | 'flappy' | 'racing'
  const [isGameRunning, setIsGameRunning] = useState(false); // true only while actively playing
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [rewardEarned, setRewardEarned] = useState(0);
  const [rewardMsg, setRewardMsg] = useState('');
  const [walletBalance, setWalletBalance] = useState(null);

  const timerRef = useRef(null);
  const rewardRef = useRef(0);

  // ── Timer: only ticks when the user is actively playing (not idle/dead/selecting) ──
  useEffect(() => {
    if (isGameRunning) {
      timerRef.current = setInterval(() => {
        setActiveSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGameRunning]);

  // ── Reward check: every full REWARD_MINUTES of active playtime ──
  useEffect(() => {
    const minutesPlayed = Math.floor(activeSeconds / 60);
    const newRewards = Math.floor(minutesPlayed / REWARD_MINUTES);
    if (newRewards > rewardRef.current && user) {
      const gained = (newRewards - rewardRef.current) * REWARD_AMOUNT;
      rewardRef.current = newRewards;
      setRewardEarned((r) => r + gained);
      axios
        .post('/api/users/wallet/topup', { amount: gained }, { withCredentials: true })
        .then(({ data }) => {
          setWalletBalance(data.walletBalance);
          setRewardMsg(`+${format(gained)} added to your wallet!`);
          setTimeout(() => setRewardMsg(''), 4000);
        })
        .catch(() => {});
    }
  }, [activeSeconds, user, format]);

  // ── Called by game components when gameplay starts or stops ──
  const handleGameStateChange = useCallback((running) => {
    setIsGameRunning(running);
  }, []);

  const stopGame = useCallback(() => {
    setActiveGame(null);
    setIsGameRunning(false);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = Math.min(
    100,
    ((activeSeconds % (REWARD_MINUTES * 60)) / (REWARD_MINUTES * 60)) * 100
  );

  const gameLabel = activeGame === 'flappy' ? 'Flappy Bird' : activeGame === 'racing' ? 'Car Racing' : '';

  return (
    <div className="w-full pb-16">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 mt-4 mb-2 transition-colors">
        <ArrowLeft size={15} /> Back to Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 mb-2">
          <Gamepad2 className="text-green-600" size={32} /> Games & Earn
        </h1>
        <p className="text-gray-500">
          Play for <strong>60 active minutes</strong> and earn <strong>{format(REWARD_AMOUNT)}</strong> in your wallet.
          Timer only runs while you&apos;re actually playing — it pauses on idle &amp; game-over screens.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock size={16} className={isGameRunning ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
            <p className="text-xs text-gray-500">Active Play Time</p>
          </div>
          <p className="text-xl font-extrabold text-gray-900 font-mono">{formatTime(activeSeconds)}</p>
          {isGameRunning && (
            <p className="text-[10px] text-green-500 font-semibold mt-0.5">● RUNNING</p>
          )}
          {!isGameRunning && activeGame && (
            <p className="text-[10px] text-amber-500 font-semibold mt-0.5">⏸ PAUSED</p>
          )}
          {!activeGame && (
            <p className="text-[10px] text-gray-400 mt-0.5">Not playing</p>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
          <Trophy size={20} className="text-yellow-500 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Rewards Earned</p>
          <p className="text-xl font-extrabold text-gray-900">{format(rewardEarned)}</p>
        </div>

        <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Wallet size={12} /> Next reward at 60 active min
            </span>
            <span>{Math.floor(activeSeconds / 60)} / {REWARD_MINUTES} min</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reward toast */}
      {rewardMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl font-semibold text-sm z-50 animate-bounce">
          {rewardMsg}
        </div>
      )}

      {/* Wallet balance */}
      {walletBalance !== null && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-6 text-sm text-green-700 font-medium text-center">
          Wallet balance: <strong>{format(walletBalance)}</strong>
        </div>
      )}

      {/* Login notice */}
      {!user && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 flex items-center gap-3 text-yellow-800 text-sm">
          <Info size={18} className="flex-shrink-0" />
          <span>Log in for rewards to be credited automatically. Your play time still counts.</span>
        </div>
      )}

      {/* Game Selector */}
      {!activeGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => { setActiveGame('flappy'); setIsGameRunning(false); }}
            className="bg-white border-2 border-gray-100 hover:border-green-400 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all shadow-sm hover:shadow-md group"
          >
            <span className="text-6xl group-hover:scale-110 transition-transform">🐦</span>
            <div className="text-center">
              <p className="text-xl font-extrabold text-gray-900">Flappy Bird</p>
              <p className="text-sm text-gray-500 mt-1">Tap / Space to fly through pipes</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Play size={11} /> Play & Earn
            </span>
          </button>

          <button
            onClick={() => { setActiveGame('racing'); setIsGameRunning(false); }}
            className="bg-white border-2 border-gray-100 hover:border-green-400 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all shadow-sm hover:shadow-md group"
          >
            <span className="text-6xl group-hover:scale-110 transition-transform">🚗</span>
            <div className="text-center">
              <p className="text-xl font-extrabold text-gray-900">Car Racing</p>
              <p className="text-sm text-gray-500 mt-1">Arrow keys / A·D to dodge traffic</p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Play size={11} /> Play & Earn
            </span>
          </button>
        </div>
      )}

      {/* Active Game */}
      {activeGame && (
        <div className="flex flex-col items-center gap-5">
          {/* Game bar */}
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
            <span className="text-sm font-medium text-gray-500">
              {activeGame === 'flappy' ? '🐦' : '🚗'}{' '}
              <strong className="text-gray-900">{gameLabel}</strong>
            </span>

            <span className={`flex items-center gap-1 text-sm font-mono px-3 py-1 rounded-full border ${
              isGameRunning
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-amber-600 bg-amber-50 border-amber-200'
            }`}>
              <Clock size={13} />
              {formatTime(activeSeconds)}
              {isGameRunning ? ' ●' : ' ⏸'}
            </span>

            <button
              onClick={stopGame}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all"
            >
              <Square size={12} /> Exit
            </button>
          </div>

          {activeGame === 'flappy' && (
            <FlappyBird onGameStateChange={handleGameStateChange} />
          )}
          {activeGame === 'racing' && (
            <CarRacing onGameStateChange={handleGameStateChange} />
          )}
        </div>
      )}
    </div>
  );
};

export default GamesPage;
