import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLogExercise } from '../../hooks/useLogExercise';
import { soundService } from '../../services/soundService';
import { LogExerciseModal } from './LogExerciseModal';

// Mock del hook useLogExercise
vi.mock('../../hooks/useLogExercise');
vi.mock('../../services/soundService');
vi.mock('../../lib/exerciseAssets', () => ({
  getExerciseGuide: () => ['Tip 1', 'Tip 2'],
}));
vi.mock('../../lib/utils', () => ({
  calculateE1RM: (w: number, r: number) => Math.round(w * (1 + r / 30)),
}));
vi.mock('../ui/BarbellVisualizer', () => ({
  BarbellVisualizer: () => <div data-testid="barbell-visualizer" />,
}));

describe('LogExerciseModal', () => {
  const mockProps = {
    user: { id: 'user-1' },
    selectedEx: {
      id: 'ex-1',
      name: 'Panca Piana',
      target_sets: 3,
      target_reps: 10,
      muscle_group: 'Petto',
    } as any,
    activeSession: 'session-1',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const mockHookValue = {
    currentExLogs: [],
    personalRecord: null,
    lastSessionLog: null,
    weight: '60',
    setWeight: vi.fn(),
    reps: '10',
    setReps: vi.fn(),
    rpe: '8',
    setRpe: vi.fn(),
    setType: 'S',
    setSetType: vi.fn(),
    showPlateCalc: false,
    setShowPlateCalc: vi.fn(),
    isSubmitting: false,
    showGuide: false,
    setShowGuide: vi.fn(),
    imgSrc: 'test.jpg',
    setImageErrorExName: vi.fn(),
    handleSaveLog: vi.fn(),
    handleDeleteLog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLogExercise).mockReturnValue(mockHookValue as any);
  });

  it('renders modal with basic information', () => {
    render(<LogExerciseModal {...mockProps} />);
    expect(screen.getByText('Panca Piana')).toBeInTheDocument();
    expect(screen.getByText(/Target: 3 serie da 10/i)).toBeInTheDocument();
  });

  it('toggles guide visibility', () => {
    render(<LogExerciseModal {...mockProps} />);
    const guideBtn = screen.getByText(/Foto & Guida Esecuzione/i);
    fireEvent.click(guideBtn);
    expect(mockHookValue.setShowGuide).toHaveBeenCalled();
    expect(soundService.playClick).toHaveBeenCalled();
  });

  it('handles image error', () => {
    vi.mocked(useLogExercise).mockReturnValue({
      ...mockHookValue,
      showGuide: true,
    } as any);
    render(<LogExerciseModal {...mockProps} />);

    const img = screen.getByAltText('Panca Piana');
    fireEvent.error(img);
    expect(mockHookValue.setImageErrorExName).toHaveBeenCalledWith('Panca Piana');
  });

  it('renders existing logs', () => {
    vi.mocked(useLogExercise).mockReturnValue({
      ...mockHookValue,
      currentExLogs: [
        { id: 'l1', weight: 60, reps: 10, rpe: 8, set_type: 'S' },
        { id: 'l2', weight: 65, reps: 8, rpe: 9, set_type: 'F' },
        { id: 'l3', weight: 30, reps: 15, rpe: 6, set_type: 'W' },
        { id: 'l4', weight: 50, reps: 10, rpe: 7, set_type: '' }, // tests idx + 1
      ],
    } as any);

    render(<LogExerciseModal {...mockProps} />);
    expect(screen.getByText('60 kg')).toBeInTheDocument();
    expect(screen.getByText('65 kg')).toBeInTheDocument();
    expect(screen.getByText('30 kg')).toBeInTheDocument();
    expect(screen.getByText('50 kg')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // idx + 1
  });

  it('handles input changes', () => {
    render(<LogExerciseModal {...mockProps} />);

    const weightInput = screen.getByLabelText(/Peso \(kg\)/i);
    fireEvent.change(weightInput, { target: { value: '70' } });
    expect(mockHookValue.setWeight).toHaveBeenCalledWith('70');

    const repsInput = screen.getByLabelText(/Ripetizioni/i);
    fireEvent.change(repsInput, { target: { value: '12' } });
    expect(mockHookValue.setReps).toHaveBeenCalledWith('12');

    const rpeInput = screen.getByLabelText(/Sforzo \(RPE 1-10\)/i);
    fireEvent.change(rpeInput, { target: { value: '9' } });
    expect(mockHookValue.setRpe).toHaveBeenCalledWith('9');
  });

  it('handles close button', () => {
    render(<LogExerciseModal {...mockProps} />);

    const xBtn = document.querySelector('.close-btn');
    fireEvent.click(xBtn!);

    expect(mockProps.onClose).toHaveBeenCalled();
    expect(soundService.playClick).toHaveBeenCalled();
  });

  it('toggles plate calculator', () => {
    render(<LogExerciseModal {...mockProps} />);
    const plateBtn = screen.getByText(/DISCHI/i);
    fireEvent.click(plateBtn);
    expect(mockHookValue.setShowPlateCalc).toHaveBeenCalled();
  });

  it('handles saving a log', () => {
    render(<LogExerciseModal {...mockProps} />);
    const saveBtn = screen.getByText(/Salva Set/i);
    fireEvent.click(saveBtn);
    expect(mockHookValue.handleSaveLog).toHaveBeenCalled();
  });

  it('handles deleting a log', () => {
    vi.mocked(useLogExercise).mockReturnValue({
      ...mockHookValue,
      currentExLogs: [{ id: 'l1', weight: 60, reps: 10, rpe: 8, set_type: 'S' }],
    } as any);

    render(<LogExerciseModal {...mockProps} />);
    const deleteBtn = screen.getByTestId('delete-log-btn');
    fireEvent.click(deleteBtn);
    expect(mockHookValue.handleDeleteLog).toHaveBeenCalledWith('l1');
  });

  it('changes set type', () => {
    render(<LogExerciseModal {...mockProps} />);
    const warmupBtn = screen.getByText('Warmup');
    fireEvent.click(warmupBtn);
    expect(mockHookValue.setSetType).toHaveBeenCalledWith('W');
  });

  it('renders PR and Last session info if available', () => {
    vi.mocked(useLogExercise).mockReturnValue({
      ...mockHookValue,
      personalRecord: { weight: 100, reps: 1 },
      lastSessionLog: { weight: 90, reps: 3 },
    } as any);

    render(<LogExerciseModal {...mockProps} />);
    expect(screen.getByText(/PR: 100kg x 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Last: 90kg x 3/i)).toBeInTheDocument();
  });
});
