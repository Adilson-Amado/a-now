import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FocusFullscreenProps {
  isActive: boolean;
  secondsLeft: number;
  plannedMinutes: number;
  onExit: () => void;
  onStopMission: () => void;
  taskTitle?: string;
}

const MOTIVATIONAL_QUOTES = [
  'Cada segundo de foco constroi seu futuro.',
  'Voce esta mais perto da sua meta agora.',
  'A disciplina de hoje e a liberdade de amanha.',
  'Concentre-se: este e o seu momento.',
  'Grandes resultados vem de blocos de foco consistentes.',
];

export default function FocusFullscreen({
  isActive,
  secondsLeft,
  plannedMinutes,
  onExit,
  onStopMission,
  taskTitle,
}: FocusFullscreenProps) {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isActive) return;

    const rotateCheck = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    const interval = window.setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 8000);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onStopMission();
      }
    };

    rotateCheck();
    window.addEventListener('resize', rotateCheck);
    window.addEventListener('orientationchange', rotateCheck);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', rotateCheck);
      window.removeEventListener('orientationchange', rotateCheck);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isActive, onStopMission]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = useMemo(
    () => ((plannedMinutes * 60 - secondsLeft) / (plannedMinutes * 60)) * 100,
    [plannedMinutes, secondsLeft]
  );

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onStopMission}
            className="absolute right-4 top-4 z-20 h-8 w-8 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>

          {isMobile && isPortrait && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-white">
              <RotateCcw className="h-8 w-8 animate-pulse" />
              <p className="text-lg font-semibold">Gire o telemovel para horizontal</p>
              <p className="text-sm text-white/70">
                O modo missao esta otimizado para paisagem para melhor experiencia de foco.
              </p>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={onExit}>
                Continuar sem fullscreen
              </Button>
            </div>
          )}

          <div className={cn('z-10 w-full max-w-6xl px-6 text-center text-white md:px-10', isMobile && 'px-4')}>
            {taskTitle && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.75, y: 0 }}
                className="mb-8 text-sm md:text-lg text-white/70"
              >
                {taskTitle}
              </motion.p>
            )}

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 130, damping: 20 }}
              className="mb-8"
            >
              <div className="font-bold tabular-nums tracking-tight text-[20vw] leading-none sm:text-[14vw] md:text-[8rem] lg:text-[10rem]">
                {formatTime(secondsLeft)}
              </div>
            </motion.div>

            <div className="mx-auto mb-10 h-1 w-full max-w-2xl overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full rounded-full bg-white/70"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
              />
            </div>

            <motion.p
              key={currentQuote}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.9, y: 0 }}
              className="mx-auto max-w-3xl text-base font-light text-white/80 sm:text-lg md:text-2xl"
            >
              {MOTIVATIONAL_QUOTES[currentQuote]}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
