import React, { useEffect, useState } from 'react';

interface TimerProps {
  initialSeconds: number;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({ initialSeconds, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isDanger = secondsLeft <= 60 && secondsLeft > 0;

  return (
    <div className={`timer-mechanical ${isDanger ? 'timer-mechanical--danger' : ''}`}>
      {formatTime(secondsLeft)}
    </div>
  );
};
