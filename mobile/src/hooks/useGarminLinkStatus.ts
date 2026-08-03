import { useEffect, useState } from 'react';

import { type GarminLinkStatus, garminService } from '../services/garminService';

export const garminBadgeLabel = (status: GarminLinkStatus): string => {
  switch (status) {
    case 'demo':
      return 'Demo';
    case 'connected':
      return 'Connesso';
    case 'needs_reconnect':
      return 'Ricollega';
    default:
      return '';
  }
};

/** Legge lo stato link Garmin (token locale + flag DB). */
export const useGarminLinkStatus = (
  userId: string | undefined,
  dbFlag: boolean | null | undefined,
  refreshKey?: unknown,
): GarminLinkStatus => {
  const [status, setStatus] = useState<GarminLinkStatus>('disconnected');

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      const next = await garminService.getLinkStatus(userId, dbFlag);
      if (!cancelled) setStatus(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, dbFlag, refreshKey]);

  if (!userId) return 'disconnected';
  return status;
};
