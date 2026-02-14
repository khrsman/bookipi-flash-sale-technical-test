'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';

interface CountdownTimerProps {
  targetTime: Date | string;
  label: string;
}

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = ({ targetTime, label }: CountdownTimerProps) => {
  const [timeUnits, setTimeUnits] = useState<TimeUnits>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Initial calculation
    const calculateTimeLeft = () => {
      const now = moment();
      const target = moment(targetTime);
      const diff = target.diff(now);

      if (diff <= 0) {
        setIsExpired(true);
        setTimeUnits({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const duration = moment.duration(diff);
      setTimeUnits({
        days: Math.floor(duration.asDays()),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds(),
      });
      setIsExpired(false);
    };

    calculateTimeLeft();

    // Update every second
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [targetTime]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gray-800 text-white rounded-lg sm:rounded-xl p-2 sm:p-3 min-w-[50px] sm:min-w-[65px] shadow-lg sm:shadow-xl border border-gray-700 sm:border-2">
        <div className="text-xl sm:text-2xl md:text-3xl font-black font-mono tabular-nums">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mt-1 sm:mt-2 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );

  return (
    <div className="text-center py-2 sm:py-4">
      <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-4 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex justify-center gap-1 sm:gap-2 md:gap-3">
        <TimeBox value={timeUnits.days} label="Days" />
        <div className="flex items-center pb-4 sm:pb-6">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400">:</span>
        </div>
        <TimeBox value={timeUnits.hours} label="Hours" />
        <div className="flex items-center pb-4 sm:pb-6">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400">:</span>
        </div>
        <TimeBox value={timeUnits.minutes} label="Mins" />
        <div className="flex items-center pb-4 sm:pb-6">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400">:</span>
        </div>
        <TimeBox value={timeUnits.seconds} label="Secs" />
      </div>
      {isExpired && (
        <p className="mt-2 sm:mt-4 text-sm sm:text-base text-red-600 font-semibold animate-pulse">
          Time's up!
        </p>
      )}
    </div>
  );
};

export default CountdownTimer;
