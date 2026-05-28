import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TimerView } from './TimerView';
import { toast } from 'react-hot-toast';
import { playTimerEndSound } from '../../lib/audio';

// Mock
vi.mock('react-hot-toast');
vi.mock('../../lib/audio', () => ({
  playTimerEndSound: vi.fn(),
}));

describe('TimerView', () => {
  const mockProps = {
    onTimerChange: vi.fn(),
    onTimerActiveChange: vi.fn(),
    externalTimer: 0,
    externalTimerActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in ready state', () => {
    render(<TimerView {...mockProps} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText(/Pronto/i)).toBeInTheDocument();
  });

  it('renders active timer correctly', () => {
    render(<TimerView {...mockProps} externalTimer={45} externalTimerActive={true} />);
    expect(screen.getByText('0:45')).toBeInTheDocument();
    expect(screen.getByText(/Recupero in corso.../i)).toBeInTheDocument();
  });

  it('handles quick select', () => {
    render(<TimerView {...mockProps} />);
    const btn60 = screen.getByText('60s');
    fireEvent.click(btn60);
    expect(mockProps.onTimerChange).toHaveBeenCalledWith(60);
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  it('handles timer toggle (start)', () => {
    render(<TimerView {...mockProps} />);
    const toggleBtn = screen.getByTestId('toggle-timer-btn');
    fireEvent.click(toggleBtn);
    expect(mockProps.onTimerChange).toHaveBeenCalled();
    expect(mockProps.onTimerActiveChange).toHaveBeenCalledWith(true);
  });

  it('handles timer toggle (pause)', () => {
    render(<TimerView {...mockProps} externalTimerActive={true} />);
    const toggleBtn = screen.getByTestId('toggle-timer-btn');
    fireEvent.click(toggleBtn);
    expect(mockProps.onTimerActiveChange).toHaveBeenCalledWith(false);
  });

  it('handles reset', () => {
    render(<TimerView {...mockProps} />);
    const resetBtn = screen.getByTestId('reset-timer-btn');
    fireEvent.click(resetBtn);
    expect(mockProps.onTimerActiveChange).toHaveBeenCalledWith(false);
    expect(mockProps.onTimerChange).toHaveBeenCalled();
  });

  it('adjusts time with plus/minus buttons', () => {
    render(<TimerView {...mockProps} />);
    const minusBtn = screen.getByTestId('minus-timer-btn');
    const plusBtn = screen.getByTestId('plus-timer-btn');
    
    fireEvent.click(plusBtn);
    expect(screen.getByText('1:40')).toBeInTheDocument();
    
    fireEvent.click(minusBtn);
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('handles adjust time with plus/minus when not active but has onTimerChange', () => {
    render(<TimerView {...mockProps} externalTimerActive={false} />);
    const plusBtn = screen.getByTestId('plus-timer-btn');
    fireEvent.click(plusBtn);
    expect(mockProps.onTimerChange).toHaveBeenCalledWith(100);
  });

  it('triggers sound and notification when timer reaches 1', () => {
    // Mock navigator.vibrate
    const vibrateMock = vi.fn();
    // @ts-ignore
    navigator.vibrate = vibrateMock;

    const { rerender } = render(<TimerView {...mockProps} externalTimer={5} externalTimerActive={true} />);
    
    rerender(<TimerView {...mockProps} externalTimer={1} externalTimerActive={true} />);
    
    expect(vibrateMock).toHaveBeenCalledWith([200, 100, 200]);
    expect(playTimerEndSound).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Recupero Completato'), expect.anything());
  });

  it('handles test sound button click', () => {
    render(<TimerView {...mockProps} />);
    const testSoundBtn = screen.getByTestId('test-sound-btn');
    fireEvent.click(testSoundBtn);
    expect(toast.success).toHaveBeenCalledWith('Notifica sonora testata');
  });

  it('handles timer toggle when externalTimer > 0 but not active', () => {
    render(<TimerView {...mockProps} externalTimer={45} externalTimerActive={false} />);
    const toggleBtn = screen.getByTestId('toggle-timer-btn');
    fireEvent.click(toggleBtn);
    expect(mockProps.onTimerActiveChange).toHaveBeenCalledWith(true);
  });
});
