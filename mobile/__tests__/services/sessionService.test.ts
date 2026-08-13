import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../src/lib/supabase';
import { sessionService } from '../../src/services/sessionService';

describe('sessionService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchSessionsWithStats', async () => {
    const api: any = { select: vi.fn(), order: vi.fn() };
    api.select.mockReturnValue(api);
    api.order.mockResolvedValue({ data: [{ id: '1' }], error: null });
    // Actually the code awaits supabase.from().select().order() which returns the promise from order
    // Looking at sessionService - it destructures { data: sessions } from the await of the whole chain
    // So the final thenable must resolve to { data }
    api.order.mockReturnValue(Promise.resolve({ data: [{ id: '1' }], error: null }));
    vi.mocked(supabase.from).mockReturnValue(api);

    const data = await sessionService.fetchSessionsWithStats();
    expect(data).toEqual([{ id: '1' }]);
  });

  it('deleteSession / fetchSessionDetails', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'eq', 'order', 'delete']) api[m] = vi.fn(self);
    api.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    api.order.mockResolvedValue({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(api);

    await sessionService.deleteSession('s1');
    await sessionService.fetchSessionDetails('s1');
    expect(api.eq).toHaveBeenCalledWith('session_id', 's1');
  });

  it('fetchActiveSession', async () => {
    const api: any = {};
    const self = () => api;
    for (const m of ['select', 'is', 'gte', 'order', 'limit']) api[m] = vi.fn(self);
    api.maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'a' }, error: null });
    api.limit.mockReturnValue({ maybeSingle: api.maybeSingle });
    vi.mocked(supabase.from).mockReturnValue(api);

    const result = await sessionService.fetchActiveSession();
    expect(api.is).toHaveBeenCalledWith('end_time', null);
    expect(result.data?.id).toBe('a');
  });
});
