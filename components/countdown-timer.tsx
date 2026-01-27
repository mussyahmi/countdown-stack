"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  function calculateTimeLeft(): TimeLeft {
    const difference = targetDate.getTime() - Date.now();
    const isPast = difference < 0;
    const absDifference = Math.abs(difference);

    return {
      days: Math.floor(absDifference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((absDifference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((absDifference / 1000 / 60) % 60),
      seconds: Math.floor((absDifference / 1000) % 60),
      isPast,
    };
  }

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // 🚨 Prevent SSR hydration mismatch
  if (!mounted || !timeLeft) {
    return null;
  }

  return (
    <div className="space-y-2">
      {timeLeft.isPast ? (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Event passed</p>
          <p className="text-lg font-semibold">
            {formatDistanceToNow(targetDate, { addSuffix: true })}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <div key={unit} className="bg-muted rounded-lg p-3">
                <div className="text-2xl font-bold">{timeLeft[unit]}</div>
                <div className="text-xs text-muted-foreground">
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </div>
              </div>
            ))}
          </div>

          {/* Locale-safe AFTER hydration */}
          <p className="text-sm text-muted-foreground text-center">
            {targetDate.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </div>
  );
}
