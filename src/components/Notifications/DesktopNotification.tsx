import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Trophy, Clock, Target, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DesktopNotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'reminder' | 'pomodoro';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  onClick?: () => void;
}

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  achievement: Trophy,
  reminder: Clock,
  pomodoro: Coffee,
  target: Target,
};

const notificationColors = {
  success: 'bg-green-500 border-green-600 text-green-50',
  error: 'bg-red-500 border-red-600 text-red-50',
  warning: 'bg-yellow-500 border-yellow-600 text-yellow-50',
  info: 'bg-blue-500 border-blue-600 text-blue-50',
  achievement: 'bg-purple-500 border-purple-600 text-purple-50',
  reminder: 'bg-orange-500 border-orange-600 text-orange-50',
  pomodoro: 'bg-red-600 border-red-700 text-red-50',
};

export const DesktopNotification: React.FC<DesktopNotificationProps> = ({
  id,
  title,
  message,
  type,
  duration = 5000,
  action,
  onClose,
  onClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = notificationIcons[type] || Info;
  const colorClass = notificationColors[type] || notificationColors.info;

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  const handleClick = useCallback(() => {
    onClick?.();
    handleClose();
  }, [onClick, handleClose]);

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    action?.onClick();
    handleClose();
  }, [action, handleClose]);

  useEffect(() => {
    if (duration === 0) return; // Don't auto-close if duration is 0

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!isHovered) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          handleClose();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, isHovered, handleClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed bottom-4 right-4 z-50 w-80 rounded-lg shadow-2xl border cursor-pointer',
            'backdrop-blur-md bg-white/95 dark:bg-gray-900/95',
            'hover:shadow-3xl transition-all duration-200',
            'border-gray-200 dark:border-gray-700'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          {/* Progress bar */}
          {duration > 0 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
              <motion.div
                className={cn('h-full', colorClass.split(' ')[0])}
                style={{ width: `${progress}%` }}
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                'p-2 rounded-full flex-shrink-0',
                colorClass
              )}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  {title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                  {message}
                </p>

                {/* Action button */}
                {action && (
                  <button
                    onClick={handleActionClick}
                    className={cn(
                      'mt-2 px-3 py-1 text-xs font-medium rounded-full transition-colors',
                      colorClass
                    )}
                  >
                    {action.label}
                  </button>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Subtle glow effect */}
          <div className={cn(
            'absolute inset-0 rounded-lg opacity-20 pointer-events-none',
            colorClass.split(' ')[0]
          )} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
