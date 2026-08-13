import React, { createContext, useContext } from 'react';

import type { SmokeMode } from './smokeMode';

const SmokeContext = createContext<SmokeMode>({ kind: 'off' });

export const SmokeProvider: React.FC<{ mode: SmokeMode; children: React.ReactNode }> = ({
  mode,
  children,
}) => <SmokeContext.Provider value={mode}>{children}</SmokeContext.Provider>;

export function useSmokeMode(): SmokeMode {
  return useContext(SmokeContext);
}
