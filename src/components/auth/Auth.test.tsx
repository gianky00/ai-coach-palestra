import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '../../lib/supabase';
import { Auth } from './Auth';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<Auth />);
    expect(screen.getByText('Bentornato, atleta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accedi' })).toBeInTheDocument();
    expect(screen.getByText('Nuovo qui? Registrati')).toBeInTheDocument();
  });

  it('toggles to registration form', () => {
    render(<Auth />);
    const toggleBtn = screen.getByText('Nuovo qui? Registrati');
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Crea un nuovo account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrati' })).toBeInTheDocument();
    expect(screen.getByText('Hai già un account? Accedi')).toBeInTheDocument();
  });

  it('handles login success', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as any);
    render(<Auth />);

    fireEvent.change(screen.getByPlaceholderText('latua@email.it'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('handles registration success', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: {}, error: null } as any);
    render(<Auth />);

    fireEvent.click(screen.getByText('Nuovo qui? Registrati'));

    fireEvent.change(screen.getByPlaceholderText('latua@email.it'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Registrati' }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(
        screen.getByText('Registrazione completata! Controlla la mail per confermare.'),
      ).toBeInTheDocument();
    });
  });

  it('handles auth errors', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error('Invalid credentials'));

    render(<Auth />);

    fireEvent.change(screen.getByPlaceholderText('latua@email.it'), {
      target: { value: 'wrong@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });

    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
