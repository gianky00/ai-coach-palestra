import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HistoryView } from './HistoryView';
import { sessionService } from '../../services/sessionService';

// Mock dei componenti e servizi
vi.mock('../../services/sessionService');
vi.mock('react-hot-toast');
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock('../modals/SessionDetailModal', () => ({
  SessionDetailModal: ({ onClose }: any) => (
    <div data-testid="session-modal">
      Modal
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('HistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const mockSessions = [
    {
      id: '1',
      start_time: '2026-05-28T10:00:00Z',
      end_time: '2026-05-28T11:00:00Z',
      training_logs: [
        { weight: 100, reps: 10 },
        { weight: 120, reps: 5 },
      ],
    },
  ];

  it('renders loading state initially', () => {
    vi.mocked(sessionService.fetchSessionsWithStats).mockReturnValue(new Promise(() => {}));
    render(<HistoryView />);
    expect(screen.getByText(/Caricamento dati.../i)).toBeInTheDocument();
  });

  it('renders history data correctly', async () => {
    vi.mocked(sessionService.fetchSessionsWithStats).mockResolvedValue(mockSessions);
    render(<HistoryView />);

    await waitFor(() => expect(screen.queryByText(/Caricamento dati.../i)).not.toBeInTheDocument());

    expect(screen.getByText('28 mag')).toBeInTheDocument();
    // Volume: (100*10) + (120*5) = 1000 + 600 = 1600
    // Use regex to be flexible with number formatting (1.600 or 1600)
    expect(screen.getByText(/1[.,]?600\s?kg/i)).toBeInTheDocument();
    expect(screen.getByText(/2\s?set registrati/i)).toBeInTheDocument();
  });

  it('opens session detail modal on click', async () => {
    vi.mocked(sessionService.fetchSessionsWithStats).mockResolvedValue(mockSessions);
    render(<HistoryView />);

    await waitFor(() => expect(screen.queryByText(/Caricamento dati.../i)).not.toBeInTheDocument());

    fireEvent.click(screen.getByText('28 mag'));
    expect(screen.getByTestId('session-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('session-modal')).not.toBeInTheDocument();
  });

  it('handles session deletion', async () => {
    vi.mocked(sessionService.fetchSessionsWithStats).mockResolvedValue(mockSessions);
    vi.mocked(sessionService.deleteSession).mockResolvedValue({ error: null } as any);

    render(<HistoryView />);

    await waitFor(() => expect(screen.queryByText(/Caricamento dati.../i)).not.toBeInTheDocument());

    const deleteBtn = screen.getByRole('button', { name: '' }); // Trash2 icon button
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(sessionService.deleteSession).toHaveBeenCalledWith('1');

    await waitFor(() => {
      expect(sessionService.fetchSessionsWithStats).toHaveBeenCalledTimes(2);
    });
  });
});
