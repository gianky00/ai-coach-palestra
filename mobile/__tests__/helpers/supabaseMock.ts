import { vi } from 'vitest';

type SupabaseResult = { data?: unknown; error: { message?: string; code?: string } | null };

export const createSupabaseChain = (result: SupabaseResult = { error: null }) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const handler = () => chain;

  for (const method of [
    'select',
    'insert',
    'upsert',
    'update',
    'delete',
    'eq',
    'in',
    'is',
    'gte',
    'lte',
    'lt',
    'order',
    'limit',
    'maybeSingle',
  ]) {
    chain[method] = vi.fn(handler);
  }

  chain.maybeSingle.mockResolvedValue(result);
  chain.single = vi.fn().mockResolvedValue(result);

  const terminal = vi.fn().mockResolvedValue(result);
  chain.eq.mockReturnValue({ ...chain, then: terminal });
  chain.in.mockResolvedValue(result);
  chain.is.mockReturnValue({ ...chain, gte: vi.fn().mockResolvedValue(result) });
  chain.upsert.mockResolvedValue(result);
  chain.insert.mockResolvedValue(result);
  chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue(result) });
  chain.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue(result) });
  chain.select.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);

  return chain;
};

export const createSupabaseMock = () => {
  const from = vi.fn();
  return { from };
};
