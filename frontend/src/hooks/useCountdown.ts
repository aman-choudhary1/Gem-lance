import { useState, useEffect } from 'react';
import { getRemainingTime } from '../utils/formatters';

export function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState(() => getRemainingTime(endTime));

  useEffect(() => {
    // Immediate calculation
    setRemaining(getRemainingTime(endTime));

    const interval = setInterval(() => {
      const updated = getRemainingTime(endTime);
      setRemaining(updated);
      if (updated.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return remaining;
}
