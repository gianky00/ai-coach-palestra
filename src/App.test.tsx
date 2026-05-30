import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { useAuth } from './components';
import { useTimer } from './hooks/useTimer';
import { useWorkoutData } from './hooks/useWorkoutData';
import { useStore } from './store/useStore';

vi.mock('./components', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    useAuth: vi.fn(),
    Auth: () => <div data-testid="auth-view" />,
    AuthProvider: ({ children }: any) => <>{children}</>,
    OggiView: ({ setShowAddEx, setSelectedEx }: any) => (
      <div data-testid="oggi-view">
        <button data-testid="open-add-ex" onClick={() => setShowAddEx(true)}>
          Open Add Ex
        </button>
        <button data-testid="open-log-ex" onClick={() => setSelectedEx({ id: 'ex-1' })}>
          Open Log Ex
        </button>
      </div>
    ),
    HistoryView: () => <div data-testid="history-view" />,
    AnalyticsView: () => <div data-testid="analytics-view" />,
    ProfileView: () => <div data-testid="profile-view" />,
    TimerView: () => <div data-testid="timer-view" />,
    AddExerciseModal: ({ onClose, onSuccess }: any) => (
      <div data-testid="add-exercise-modal">
        <button onClick={onClose}>Close Add</button>
        <button onClick={onSuccess}>Success Add</button>
      </div>
    ),
    LogExerciseModal: ({ onClose, onSuccess }: any) => (
      <div data-testid="log-exercise-modal">
        <button onClick={onClose}>Close Log</button>
        <button onClick={() => onSuccess(60)}>Success Log with Timer</button>
        <button onClick={() => onSuccess()}>Success Log no Timer</button>
      </div>
    ),
    WorkoutSummaryModal: () => <div data-testid="summary-modal" />,
  };
});

vi.mock('./hooks/useWorkoutData');
vi.mock('./hooks/useTimer');
vi.mock('./store/useStore');
vi.mock('react-hot-toast');

describe('App Root Component', () => {
  const mockFetchData = vi.fn();
  const mockStartTimer = vi.fn();

  const mockUseWorkoutData = {
    user: { id: 'u1' },
    exercises: [],
    loading: false,
    totalVolume: 100,
    activeSession: null,
    startWorkout: vi.fn(),
    endWorkout: vi.fn(),
    fetchData: mockFetchData,
    progresso: 50,
    setProgress: 50,
    volumeProgress: 20,
  };

  const mockUseTimer = {
    timer: 0,
    setTimer: vi.fn(),
    timerActive: false,
    setTimerActive: vi.fn(),
    startTimer: mockStartTimer,
  };

  const mockUseStore = {
    offlineQueueCount: 0,
    showSummary: false,
    setShowSummary: vi.fn(),
    lastWorkoutSummary: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWorkoutData).mockReturnValue(mockUseWorkoutData as any);
    vi.mocked(useTimer).mockReturnValue(mockUseTimer as any);
    vi.mocked(useStore).mockReturnValue(mockUseStore as any);
  });

  it('renders auth view when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false } as any);
    render(<App />);
    expect(screen.getByTestId('auth-view')).toBeInTheDocument();
  });

  it('renders loading spinner when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: true } as any);
    const { container } = render(<App />);
    expect(container.querySelector('.loader-overlay')).toBeInTheDocument();
  });

  it('renders main app when authenticated (OggiView is default)', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('oggi-view')).toBeInTheDocument());
    expect(screen.getByText('Oggi')).toBeInTheDocument();
  });

  it('shows sync indicator when queue count > 0', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    vi.mocked(useStore).mockReturnValue({ ...mockUseStore, offlineQueueCount: 3 } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('3 IN CODA')).toBeInTheDocument();
    });
  });

  it('shows timer overlay when timer is active', async () => {
    const mockSetTimerActive = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    vi.mocked(useTimer).mockReturnValue({
      ...mockUseTimer,
      timerActive: true,
      timer: 65,
      setTimerActive: mockSetTimerActive,
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('RECUPERO')).toBeInTheDocument();
    });

    // Click on timer overlay to close it
    const overlay = screen.getByText('RECUPERO').closest('.timer-overlay');
    fireEvent.click(overlay!);
    expect(mockSetTimerActive).toHaveBeenCalledWith(false);
  });

  it('shows workout summary modal', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    vi.mocked(useStore).mockReturnValue({
      ...mockUseStore,
      showSummary: true,
      lastWorkoutSummary: { totalVolume: 100 },
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-modal')).toBeInTheDocument();
    });
  });

  it('opens and interacts with AddExerciseModal', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('oggi-view')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('open-add-ex'));

    await waitFor(() => {
      expect(screen.getByTestId('add-exercise-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Success Add'));
    expect(mockFetchData).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Close Add'));
    await waitFor(() => {
      expect(screen.queryByTestId('add-exercise-modal')).not.toBeInTheDocument();
    });
  });

  it('opens and interacts with LogExerciseModal', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: mockUseWorkoutData.user },
      loading: false,
    } as any);
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('oggi-view')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('open-log-ex'));

    await waitFor(() => {
      expect(screen.getByTestId('log-exercise-modal')).toBeInTheDocument();
    });

    // Log success with timer
    fireEvent.click(screen.getByText('Success Log with Timer'));
    expect(mockFetchData).toHaveBeenCalled();
    expect(mockStartTimer).toHaveBeenCalledWith(60);

    // Log success without timer
    fireEvent.click(screen.getByText('Success Log no Timer'));
    expect(mockFetchData).toHaveBeenCalledTimes(2);

    // Close modal
    fireEvent.click(screen.getByText('Close Log'));
    await waitFor(() => {
      expect(screen.queryByTestId('log-exercise-modal')).not.toBeInTheDocument();
    });
  });
});
