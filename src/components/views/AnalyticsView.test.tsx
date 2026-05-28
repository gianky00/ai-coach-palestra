import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnalyticsView } from './AnalyticsView';
import { useAnalytics } from '../../hooks/useAnalytics';

// Mock dell'hook
vi.mock('../../hooks/useAnalytics');

// Mock di recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
}));

describe('AnalyticsView', () => {
  const mockAnalyticsData = {
    loading: false,
    totalSessions: 12,
    totalVolume: 5000,
    totalPRs: 5,
    weightHistory: [{ date: '28 mag', weight: 80 }],
    bodyWeight: '80',
    weightDeltaWeekly: -0.5,
    weightDeltaMonthly: -1.2,
    muscleDistribution: [{ name: 'Petto', value: 10 }],
    exercises: [{ id: '1', name: 'Panca Piana' }],
    selectedExId: '1',
    setSelectedExId: vi.fn(),
    progression: [{ date: '28 mag', e1rm: 100, weight: 80 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useAnalytics).mockReturnValue({ ...mockAnalyticsData, loading: true } as any);
    render(<AnalyticsView />);
    expect(screen.getByText(/Analisi in corso.../i)).toBeInTheDocument();
  });

  it('renders KPI cards correctly', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData as any);
    render(<AnalyticsView />);

    expect(screen.getByText('5.0k kg')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders biometric data correctly', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData as any);
    render(<AnalyticsView />);

    expect(screen.getByText('80 kg')).toBeInTheDocument();
    expect(screen.getByText('-0.5 kg')).toBeInTheDocument();
    expect(screen.getByText('-1.2 kg')).toBeInTheDocument();
  });

  it('renders muscle distribution and progression', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData as any);
    render(<AnalyticsView />);

    expect(screen.getByText('Petto')).toBeInTheDocument();
    expect(screen.getByText('100 kg')).toBeInTheDocument(); // e1RM in progression section
  });

  it('shows empty state when no data', () => {
    vi.mocked(useAnalytics).mockReturnValue({
        ...mockAnalyticsData,
        weightHistory: [],
        muscleDistribution: [],
        progression: []
    } as any);
    render(<AnalyticsView />);

    expect(screen.getByText(/Inserisci le misurazioni del peso/i)).toBeInTheDocument();
    expect(screen.getByText(/Completa gli allenamenti per tracciare il volume/i)).toBeInTheDocument();
  });
});
