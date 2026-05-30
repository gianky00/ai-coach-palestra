import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { supabase } from '../../lib/supabase';
import { AuthProvider, useAuth } from './AuthProvider';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const TestComponent = () => {
  const { user, loading, signOut } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides auth state and handles sign out', async () => {
    const mockSession = { user: { id: 'test-user-id' } };

    // Setup mocks
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession } });

    let authListener: Function;
    (supabase.auth.onAuthStateChange as any).mockImplementation((listener: Function) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Initial state is loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Wait for effect to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id');

    // Test auth state change
    act(() => {
      authListener!('SIGNED_OUT', null);
    });

    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');

    // Test sign out
    const btn = screen.getByText('Sign Out');
    act(() => {
      btn.click();
    });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('throws an error if useAuth is used outside of AuthProvider', () => {
    // Prevent console.error from polluting test output
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
