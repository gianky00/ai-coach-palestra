import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseChain } from '../helpers/supabaseMock';

const { supabaseFrom } = vi.hoisted(() => ({ supabaseFrom: vi.fn() }));

vi.mock('../../src/lib/supabase', () => ({
  supabase: { from: supabaseFrom },
}));

import { exerciseService } from '../../src/services/exerciseService';

describe('exerciseService full coverage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetchTodayExercises / fetchExercisesByDay', async () => {
    const chain = createSupabaseChain({ data: [], error: null });
    chain.order.mockResolvedValue({ data: [], error: null });
    supabaseFrom.mockReturnValue(chain);
    await exerciseService.fetchTodayExercises('u1');
    expect(supabaseFrom).toHaveBeenCalledWith('exercises');
    await exerciseService.fetchExercisesByDay('u1', 'LUNEDI');
    expect(chain.eq).toHaveBeenCalledWith('training_day', 'LUNEDI');
  });

  it('addExercise / update / delete', async () => {
    const chain = createSupabaseChain({ error: null });
    supabaseFrom.mockReturnValue(chain);
    await exerciseService.addExercise('u1', 'Squat', 'Gambe');
    expect(chain.insert).toHaveBeenCalled();
    await exerciseService.updateExercise('e1', { name: 'Squat 2' });
    expect(chain.update).toHaveBeenCalled();
    await exerciseService.deleteExercise('e1');
    expect(chain.delete).toHaveBeenCalled();
  });

  it('reorderExercise scambia indici', async () => {
    const updates: { id: string; order_index: number }[] = [];
    const chain = createSupabaseChain({ error: null });
    chain.order.mockResolvedValue({
      data: [
        { id: 'a', order_index: 0 },
        { id: 'b', order_index: 1 },
      ],
      error: null,
    });
    chain.update.mockImplementation((payload: { order_index: number }) => ({
      eq: vi.fn(async (_k: string, id: string) => {
        updates.push({ id, order_index: payload.order_index });
        return { error: null };
      }),
    }));
    supabaseFrom.mockReturnValue(chain);

    const result = await exerciseService.reorderExercise('a', 'u1', 'LUNEDI', 'down');
    expect(result.error).toBeNull();
    expect(updates).toHaveLength(2);
  });

  it('reorderExercise errore se id assente', async () => {
    const chain = createSupabaseChain({ error: null });
    chain.order.mockResolvedValue({
      data: [{ id: 'a', order_index: 0 }],
      error: null,
    });
    supabaseFrom.mockReturnValue(chain);
    const result = await exerciseService.reorderExercise('missing', 'u1', 'LUNEDI', 'up');
    expect(result.error).toBeInstanceOf(Error);
  });

  it('reorderExercises ok', async () => {
    const chain = createSupabaseChain({ error: null });
    supabaseFrom.mockReturnValue(chain);
    const result = await exerciseService.reorderExercises(['a', 'b']);
    expect(result.error).toBeNull();
  });

  it('fetchExercisesByIds dedupe + empty short-circuit', async () => {
    const empty = await exerciseService.fetchExercisesByIds([]);
    expect(empty.data).toEqual([]);
    expect(supabaseFrom).not.toHaveBeenCalled();

    const chain = createSupabaseChain({
      data: [{ id: 'e1', name: 'Panca', muscle_group: 'Petto' }],
      error: null,
    });
    supabaseFrom.mockReturnValue(chain);
    await exerciseService.fetchExercisesByIds(['e1', 'e1', '']);
    expect(supabaseFrom).toHaveBeenCalledWith('exercises');
    expect(chain.in).toHaveBeenCalledWith('id', ['e1']);
  });
});
