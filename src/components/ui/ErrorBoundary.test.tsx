import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Normal Content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when a child throws', () => {
    // Suppress console.error for this test to keep logs clean
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Qualcosa è andato storto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ricarica App/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
