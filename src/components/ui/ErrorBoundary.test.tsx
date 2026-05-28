import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// A component that throws an error
const ProblemChild = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error in tests for expected errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Everything is fine</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Everything is fine')).toBeInTheDocument();
  });

  it('catches error and renders error UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Qualcosa è andato storto.')).toBeInTheDocument();
    expect(
      screen.getByText("L'applicazione ha riscontrato un errore imprevisto. Prova a ricaricare la pagina.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ricarica App/i })).toBeInTheDocument();
  });

  it('reloads the window when the reload button is clicked', () => {
    // Mock window.location.reload
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn() };

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /Ricarica App/i });
    fireEvent.click(button);

    expect(window.location.reload).toHaveBeenCalledTimes(1);

    // Restore original
    window.location = originalLocation;
  });
});
