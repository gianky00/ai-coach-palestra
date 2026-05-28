import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseCard } from './ExerciseCard';
import type { Exercise } from '../../types';

describe('ExerciseCard', () => {
  const mockExercise: Exercise = {
    id: '1',
    user_id: 'user1',
    name: 'Panca Piana',
    muscle_group: 'Petto',
    target_sets: 3,
    target_reps: '10',
    rest_time: 90,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sets_done: 0,
  };

  it('renders exercise information correctly', () => {
    render(<ExerciseCard ex={mockExercise} onLog={vi.fn()} index={0} />);
    
    expect(screen.getByText('Panca Piana')).toBeInTheDocument();
    expect(screen.getByText('Petto')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // sets_done
    expect(screen.getByText('/3')).toBeInTheDocument(); // target_sets
    expect(screen.getByText('10 reps')).toBeInTheDocument(); // target_reps
  });

  it('calls onLog when the log button is clicked', () => {
    const onLogMock = vi.fn();
    render(<ExerciseCard ex={mockExercise} onLog={onLogMock} index={0} />);
    
    // Look for button that acts as log action
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    
    expect(onLogMock).toHaveBeenCalledTimes(1);
  });

  it('renders completed state when sets_done >= target_sets', () => {
    const completedEx = { ...mockExercise, sets_done: 3 };
    render(<ExerciseCard ex={completedEx} onLog={vi.fn()} index={0} />);
    
    // Log button should not be there anymore, replaced by CheckCircle
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    
    // Test completed glow-effect class applied
    const card = screen.getByText('Panca Piana').closest('.ex-card-premium');
    expect(card).toHaveClass('completed');
    expect(card).toHaveClass('glow-effect');
  });
});
