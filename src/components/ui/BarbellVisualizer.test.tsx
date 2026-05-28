import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BarbellVisualizer } from './BarbellVisualizer';
import { soundService } from '../../services/soundService';

vi.mock('../../services/soundService');

describe('BarbellVisualizer Component', () => {
  it('renders correctly with 0 weight on each side', () => {
    render(<BarbellVisualizer totalWeight={20} />);
    expect(screen.getByText(/0 kg/i)).toBeInTheDocument();
    expect(screen.getByText('Nessun disco necessario')).toBeInTheDocument();
  });

  it('renders correctly with 60kg total weight (bar 20kg)', () => {
    render(<BarbellVisualizer totalWeight={60} />);
    expect(screen.getByText(/20 kg/i)).toBeInTheDocument();
    // 20kg button AND 20kg plate list
    expect(screen.getAllByText('20kg').length).toBeGreaterThanOrEqual(1);
  });

  it('renders correctly with complex weight (e.g. 87.5kg) bar 20kg', () => {
    render(<BarbellVisualizer totalWeight={87.5} />);
    expect(screen.getByText(/33[.,]75 kg/i)).toBeInTheDocument();
    expect(screen.getByText('20kg + 10kg + 2.5kg + 1.25kg')).toBeInTheDocument();
  });

  it('handles bar weight toggle', () => {
    render(<BarbellVisualizer totalWeight={50} />);
    expect(screen.getByText(/15 kg/i)).toBeInTheDocument();
    expect(screen.getAllByText('15kg').length).toBeGreaterThanOrEqual(1);

    const btn15 = screen.getByRole('button', { name: '15kg' });
    fireEvent.click(btn15);

    expect(screen.getByText(/17[.,]5 kg/i)).toBeInTheDocument();
    expect(screen.getByText('15kg + 2.5kg')).toBeInTheDocument();
    expect(soundService.playClick).toHaveBeenCalled();
  });
});
