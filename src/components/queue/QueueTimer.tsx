"use client";

import { useEffect, useState } from "react";

interface QueueTimerProps {
  startTime: string | null;
}

export default function QueueTimer({ startTime }: QueueTimerProps) {
  const [elapsed, setElapsed] = useState("00m 00s");

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <p className="text-lg font-bold">{elapsed}</p>;
}
