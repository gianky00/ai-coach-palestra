import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates supabase client without errors', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    
    const { supabase } = await import('./supabase');
    expect(supabase).toBeDefined();
    
    vi.unstubAllEnvs();
  });

  it('warns if credentials are missing', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    
    await import('./supabase');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Mancano le credenziali Supabase nel file .env');
    
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});
