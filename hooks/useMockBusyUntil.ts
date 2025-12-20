import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export const useMockBusyUntil = () => {
  const [busyUntil, setBusyUntil] = useState<Date | null>(null);

  useEffect(() => {
    // ⏳ Simulate delay
    const timeout = setTimeout(() => {
      // 🟡 Example: simulate a busyUntil date in the past (yesterday)
      const mockDate = dayjs().subtract(1, 'day').toDate();

      // 🟢 Or simulate a future date like:
      // const mockDate = dayjs().add(2, 'day').toDate();

      setBusyUntil(mockDate);
    }, 500); // Simulate 0.5s fetch delay

    return () => clearTimeout(timeout);
  }, []);

  return busyUntil;
};
