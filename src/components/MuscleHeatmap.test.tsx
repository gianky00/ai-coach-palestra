import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logService } from '../services/logService';
import { MuscleHeatmap } from './MuscleHeatmap';

vi.mock('../services/logService', () => ({
  logService: {
    fetchWeeklyVolumeByMuscle: vi.fn(),
  },
}));

describe('MuscleHeatmap Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loader initially', () => {
    vi.mocked(logService.fetchWeeklyVolumeByMuscle).mockReturnValue(new Promise(() => {}));
    render(<MuscleHeatmap />);
    expect(document.querySelector('.skeleton-base')).toBeInTheDocument();
  });

  it('should render data correctly when fetched', async () => {
    const mockData = [
      { weight: 100, reps: 10, exercises: { muscle_group: 'Petto' } },
      { weight: 50, reps: 10, exercises: { muscle_group: 'Bicipiti' } },
    ];

    vi.mocked(logService.fetchWeeklyVolumeByMuscle).mockResolvedValue({
      data: mockData,
    } as unknown as Awaited<ReturnType<typeof logService.fetchWeeklyVolumeByMuscle>>);

    render(<MuscleHeatmap />);

    await waitFor(() => {
      expect(screen.getByText(/Heatmap Settimanale/i)).toBeInTheDocument();
    });

    // Cambia la vista in Griglia per asseverare i dati specifici
    const gridButton = screen.getByText('Griglia');
    fireEvent.click(gridButton);

    await waitFor(() => {
      expect(screen.getByText('Petto')).toBeInTheDocument();
      expect(screen.getByText('Bicipiti')).toBeInTheDocument();
      // Using a more flexible matcher since text is split by tags
      expect(screen.getByText((content) => content.includes('1000'))).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('500'))).toBeInTheDocument();
    });
  });

  it('should show empty state if no data', async () => {
    vi.mocked(logService.fetchWeeklyVolumeByMuscle).mockResolvedValue({
      data: [],
    } as unknown as Awaited<ReturnType<typeof logService.fetchWeeklyVolumeByMuscle>>);

    render(<MuscleHeatmap />);

    await waitFor(() => {
      expect(screen.getByText(/Nessun dato negli ultimi 7 giorni/i)).toBeInTheDocument();
    });
  });
});
