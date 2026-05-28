import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing Component', () => {
  it('renders correctly with single ring', () => {
    const { container } = render(<ProgressRing progress={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();

    const circles = container.querySelectorAll('.progress-ring-circle');
    expect(circles.length).toBe(1);
  });

  it('renders correctly with multiple rings', () => {
    const { container } = render(
      <ProgressRing progress={50} progressMiddle={30} progressInner={20} />,
    );
    expect(screen.getByText('50%')).toBeInTheDocument();

    const circles = container.querySelectorAll('.progress-ring-circle');
    expect(circles.length).toBe(3);
  });

  it('handles over 100% progress', () => {
    render(<ProgressRing progress={150} />);
    expect(screen.getByText('150%')).toBeInTheDocument();
  });
});
