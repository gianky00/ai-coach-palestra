import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exerciseService } from '../services/exerciseService';
import { AddExerciseModal } from './AddExerciseModal';

vi.mock('../services/exerciseService', () => ({
  exerciseService: {
    addExercise: vi.fn(),
  },
}));

describe('AddExerciseModal Component', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render correctly', () => {
    render(<AddExerciseModal userId="user-1" onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText(/Nuovo Esercizio/i)).toBeInTheDocument();
  });

  it('should call addExercise and onSuccess when submitted', async () => {
    vi.mocked(exerciseService.addExercise).mockResolvedValue({ error: null } as unknown as Awaited<
      ReturnType<typeof exerciseService.addExercise>
    >);

    render(<AddExerciseModal userId="user-1" onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText(/Es. Panca Piana/i), {
      target: { value: 'Squat' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Es. Petto/i), { target: { value: 'Gambe' } });
    fireEvent.click(screen.getByText(/Salva nel Catalogo/i));

    await waitFor(() => {
      expect(exerciseService.addExercise).toHaveBeenCalledWith('user-1', 'Squat', 'Gambe');
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should show error if name is missing', async () => {
    render(<AddExerciseModal userId="user-1" onClose={onClose} onSuccess={onSuccess} />);
    fireEvent.click(screen.getByText(/Salva nel Catalogo/i));

    // Toast error would be shown (we can't easily test toast here without mocking react-hot-toast)
    expect(exerciseService.addExercise).not.toHaveBeenCalled();
  });
});
