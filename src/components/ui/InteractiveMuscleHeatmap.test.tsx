import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InteractiveMuscleHeatmap } from './InteractiveMuscleHeatmap';
import { soundService } from '../../services/soundService';

vi.mock('../../services/soundService', () => ({
  soundService: {
    playClick: vi.fn(),
  },
}));

describe('InteractiveMuscleHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = [
    { group: 'Petto', volume: 1000, intensity: 0.8 },
    { group: 'Dorso', volume: 800, intensity: 0.6 },
    { group: 'Gambe', volume: 1200, intensity: 1.0 },
    { group: 'Spalle', volume: 500, intensity: 0.4 },
    { group: 'Braccia', volume: 300, intensity: 0.2 },
    { group: 'Core', volume: 100, intensity: 0.1 },
  ];

  it('renders correctly with no hover initially', () => {
    render(<InteractiveMuscleHeatmap data={mockData} />);
    expect(
      screen.getByText('Passa il mouse o tocca un muscolo per i dettagli'),
    ).toBeInTheDocument();

    // Check elements exist
    expect(screen.getByText('Anteriore')).toBeInTheDocument();
    expect(screen.getByText('Posteriore')).toBeInTheDocument();
  });

  it('maps muscle groups and handles hover events', () => {
    const { container } = render(<InteractiveMuscleHeatmap data={mockData} />);

    // Find a group element (e.g. Petto paths)
    // In our SVG, petto has 2 paths. The group <g> wraps them.
    // They are nested inside the container. We can search for <g> elements.
    const gs = container.querySelectorAll('g');
    expect(gs.length).toBeGreaterThan(0);

    // Trigger mouse enter on the first <g> (Spalle)
    fireEvent.mouseEnter(gs[0]);

    expect(soundService.playClick).toHaveBeenCalled();
    expect(screen.getByText('Spalle')).toBeInTheDocument();
    expect(screen.getByText('500 kg')).toBeInTheDocument();
    expect(screen.getByText('(40% volume max)')).toBeInTheDocument();

    // Trigger mouse leave
    fireEvent.mouseLeave(gs[0]);
    expect(
      screen.getByText('Passa il mouse o tocca un muscolo per i dettagli'),
    ).toBeInTheDocument();
  });

  it('handles mappings correctly including synonyms', () => {
    // If the data has "Schiena", it should map to Dorso visually.
    const customData = [
      { group: 'Pettorali', volume: 1000, intensity: 0.8 }, // includes petto
      { group: 'Schiena', volume: 800, intensity: 0.6 },
      { group: 'Quadricipiti', volume: 1200, intensity: 1.0 }, // includes quad
      { group: 'Deltoidi', volume: 500, intensity: 0.4 }, // includes delto
      { group: 'Tricipiti', volume: 300, intensity: 0.2 }, // includes trici
      { group: 'Addominali', volume: 100, intensity: 0.1 }, // includes addo
    ];

    const { container } = render(<InteractiveMuscleHeatmap data={customData} />);

    const gs = container.querySelectorAll('g');

    // Let's hover over "Petto" path (index 1 in the anteriore SVG usually)
    fireEvent.mouseEnter(gs[1]);
    // It should find "Petto" as the group name and 1000 kg since it mapped correctly
    expect(screen.getByText('Petto')).toBeInTheDocument();
    expect(screen.getByText(/1[.,\s]?000\s*kg/i)).toBeInTheDocument();

    // Leave
    fireEvent.mouseLeave(gs[1]);

    // Test Dorso mapping (Schiena)
    fireEvent.mouseEnter(gs[6]); // Dorso
    expect(screen.getByText('Dorso')).toBeInTheDocument();
    expect(screen.getByText(/800\s*kg/i)).toBeInTheDocument();
  });

  it('returns default zero data if muscle group not found', () => {
    const { container } = render(<InteractiveMuscleHeatmap data={[]} />);
    const gs = container.querySelectorAll('g');

    // Hover over Petto
    fireEvent.mouseEnter(gs[1]);
    expect(screen.getByText('Petto')).toBeInTheDocument();
    expect(screen.getByText('0 kg')).toBeInTheDocument();
  });
});
