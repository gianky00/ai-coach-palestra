import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, ExerciseCardSkeleton, HeatmapSkeleton } from './Skeleton';

describe('Skeleton Components', () => {
  it('renders Skeleton with default props', () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('skeleton-base');
    expect(div.style.width).toBe('100%');
    expect(div.style.height).toBe('20px');
    expect(div.style.borderRadius).toBe('8px');
  });

  it('renders Skeleton with custom props', () => {
    const { container } = render(
      <Skeleton width="50px" height="30px" borderRadius="4px" className="custom-class" />,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('skeleton-base');
    expect(div).toHaveClass('custom-class');
    expect(div.style.width).toBe('50px');
    expect(div.style.height).toBe('30px');
    expect(div.style.borderRadius).toBe('4px');
  });

  it('renders ExerciseCardSkeleton correctly', () => {
    const { container } = render(<ExerciseCardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('skeleton-card');

    // Test nested skeletons exist
    const nestedSkeletons = card.querySelectorAll('.skeleton-base');
    expect(nestedSkeletons.length).toBeGreaterThan(0);
  });

  it('renders HeatmapSkeleton correctly', () => {
    const { container } = render(<HeatmapSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('heatmap-card');

    // Test nested skeletons
    const nestedSkeletons = card.querySelectorAll('.skeleton-base');
    expect(nestedSkeletons.length).toBeGreaterThan(0);
  });
});
