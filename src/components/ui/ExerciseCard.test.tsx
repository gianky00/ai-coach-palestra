import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Exercise } from '../../types';
import { ExerciseCard } from './ExerciseCard';

describe('ExerciseCard Snapshot', () => {
  it('should match snapshot', () => {
    const mockExercise: Exercise = {
      id: '1',
      name: 'Panca Piana',
      muscle_group: 'Petto',
      target_sets: 3,
      target_reps: '10',
      sets_done: 0,
      notes: '',
      training_day: 'GIOVEDI',
    };

    const { asFragment } = render(<ExerciseCard ex={mockExercise} onLog={() => {}} index={0} />);

    expect(asFragment()).toMatchSnapshot();
  });
});
