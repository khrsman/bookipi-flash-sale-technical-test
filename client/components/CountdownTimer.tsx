'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';

interface CountdownTimerProps {
  targetTime: Date | string;
  label: string;
}

const CountdownTimer = ({ targetTime, label }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Initial calculation
    const calculateTimeLeft = () => {
      const now = moment();
      const target = moment(targetTime);
      const diff = target.diff(now);

      if (diff <= 0) {
        setTimeLeft('00:00:00:00');
        return;
      }

      const duration = moment.duration(diff);
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();

    // Update every second
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="text-center my-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-red-600 font-mono">{timeLeft}</p>
    </div>
  );
};

export default CountdownTimer;
