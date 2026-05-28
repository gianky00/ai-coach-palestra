import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('WorkoutSummaryModal Component', () => {
  const mockProps = {
    summary: {
      totalVolume: 5000,
      setsDone: 20,
      durationMins: 60,
      prsCount: 3,
    },
    onClose: vi.fn(),
  };

  it('renders summary values correctly', () => {
    render(<WorkoutSummaryModal {...mockProps} />);

    // Check main title
    expect(screen.getByText('Ottimo Lavoro!')).toBeInTheDocument();

    // Check values using a custom matcher to handle nested elements and locales
    expect(
      screen.getAllByText(
        (_, el) => el?.textContent?.replace(/[,.]/g, '').includes('5000 kg') ?? false,
      ).length,
    ).toBeGreaterThan(0); // Volume
    expect(screen.getAllByText('20').length).toBeGreaterThan(0); // Sets
    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes('60 min') ?? false).length,
    ).toBeGreaterThan(0); // Duration
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // PRs
  });

  it('handles close interaction', () => {
    render(<WorkoutSummaryModal {...mockProps} />);

    const closeBtn = screen.getByText('Chiudi');
    fireEvent.click(closeBtn);

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });
});
