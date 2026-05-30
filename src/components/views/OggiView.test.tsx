import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Exercise } from '../../types';
import { OggiView } from './OggiView';

// Mock dei componenti interni per isolare la View
vi.mock('../ui/ExerciseCard', () => ({
  ExerciseCard: ({ ex, onLog }: any) => (
    <div data-testid="exercise-card">
      {ex.name}
      <button onClick={onLog}>Log</button>
    </div>
  ),
}));

vi.mock('../ui/MuscleHeatmap', () => ({
  MuscleHeatmap: () => <div data-testid="muscle-heatmap" />,
}));

vi.mock('../ui/ProgressRing', () => ({
  ProgressRing: () => <div data-testid="progress-ring" />,
}));

vi.mock('../ui/Skeleton', () => ({
  ExerciseCardSkeleton: () => <div data-testid="skeleton" />,
}));

const mockExercises: Exercise[] = [
  { id: '1', name: 'Bench Press', muscle_group: 'Chest', notes: 'Gym' } as any,
  { id: '2', name: 'Compex Ex', muscle_group: 'Legs', notes: 'COMPEX' } as any,
];

describe('OggiView', () => {
  const defaultProps = {
    exercises: [],
    loading: false,
    totalVolume: 1000,
    progresso: 50,
    activeSession: null,
    startWorkout: vi.fn(),
    endWorkout: vi.fn(),
    setShowAddEx: vi.fn(),
    setSelectedEx: vi.fn(),
  };

  it('renders loading state correctly', () => {
    render(<OggiView {...defaultProps} loading={true} />);
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
  });

  it('renders empty state when no exercises are present', () => {
    render(<OggiView {...defaultProps} exercises={[]} />);
    expect(screen.getByText(/Nessun esercizio pianificato/i)).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Aggiungi/i });
    fireEvent.click(addBtn);
    expect(defaultProps.setShowAddEx).toHaveBeenCalledWith(true);
  });

  it('renders gym and compex exercises separately', () => {
    render(<OggiView {...defaultProps} exercises={mockExercises} />);

    expect(screen.getByText('Palestra')).toBeInTheDocument();
    expect(screen.getByText('Compex')).toBeInTheDocument();
    expect(screen.getAllByTestId('exercise-card')).toHaveLength(2);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Compex Ex')).toBeInTheDocument();
  });

  it('handles start workout interaction', () => {
    render(<OggiView {...defaultProps} exercises={mockExercises} />);
    const startBtn = screen.getByRole('button', { name: /START/i });
    fireEvent.click(startBtn);
    expect(defaultProps.startWorkout).toHaveBeenCalled();
  });

  it('handles end workout interaction when session is active', () => {
    render(<OggiView {...defaultProps} exercises={mockExercises} activeSession="session-123" />);
    const stopBtn = screen.getByRole('button', { name: /STOP/i });
    fireEvent.click(stopBtn);
    expect(defaultProps.endWorkout).toHaveBeenCalled();
  });

  it('shows nudge message when not in active session', () => {
    render(<OggiView {...defaultProps} exercises={mockExercises} />);
    expect(screen.getByText(/Pronti per la sessione?/i)).toBeInTheDocument();
  });

  it('calls setSelectedEx when logging an exercise', () => {
    render(<OggiView {...defaultProps} exercises={[mockExercises[0]]} />);
    const logBtn = screen.getByRole('button', { name: /Log/i });
    fireEvent.click(logBtn);
    expect(defaultProps.setSelectedEx).toHaveBeenCalledWith(mockExercises[0]);
  });
});
