import type { GarminLinkStatus } from '../services/garminService';

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
