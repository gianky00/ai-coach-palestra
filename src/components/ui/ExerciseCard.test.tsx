import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ExerciseCard } from './ExerciseCard';
import React from 'react';
import type { Exercise } from '../../types';

describe('ExerciseCard Snapshot', () => {
  it('should match snapshot', () => {
    const mockExercise: Exercise = {
      id: '1',
      name: 'Panca Piana',
      muscle_group: 'Petto',
      image_url: 'panca_piana.jpg',
      category: 'Forza',
      target_sets: 3,
      target_reps: '10',
      sets_done: 0,
      notes: ''
    };

    const { asFragment } = render(
      <ExerciseCard 
        ex={mockExercise} 
        onLog={() => {}} 
        index={0}
      />
    );
    
    expect(asFragment()).toMatchSnapshot();
  });
});
