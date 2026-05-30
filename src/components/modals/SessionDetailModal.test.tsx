import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionService } from '../../services/sessionService';
import { SessionDetailModal } from './SessionDetailModal';

vi.mock('../../services/sessionService');

describe('SessionDetailModal Component', () => {
  const mockProps = {
    sessionId: 'session-123',
    sessionDate: '28 mag',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(sessionService.fetchSessionDetails).mockReturnValue(new Promise(() => {}));

    render(<SessionDetailModal {...mockProps} />);

    expect(screen.getByText('Allenamento')).toBeInTheDocument();
    expect(screen.getByText('28 mag')).toBeInTheDocument();
    expect(screen.getByText('Analisi sessione...')).toBeInTheDocument();
  });

  it('renders session details after loading', async () => {
    const mockDetails = [
      { exercises: { name: 'Panca Piana' }, weight: 100, reps: 10, rpe: 8 },
      { exercises: { name: 'Squat' }, weight: 120, reps: 5, rpe: 9 },
    ];
    vi.mocked(sessionService.fetchSessionDetails).mockResolvedValue({ data: mockDetails } as any);

    render(<SessionDetailModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Analisi sessione...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Panca Piana')).toBeInTheDocument();
    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes('100kg x 10') ?? false).length,
    ).toBeGreaterThan(0);

    expect(screen.getByText('Squat')).toBeInTheDocument();
    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes('120kg x 5') ?? false).length,
    ).toBeGreaterThan(0);
  });

  it('handles empty exercise name gracefully', async () => {
    const mockDetails = [{ exercises: null, weight: 50, reps: 10, rpe: 5 }];
    vi.mocked(sessionService.fetchSessionDetails).mockResolvedValue({ data: mockDetails } as any);

    render(<SessionDetailModal {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Sconosciuto')).toBeInTheDocument();
    });
  });
});
