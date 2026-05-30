import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { profileService } from '../../services/profileService';
import { useAuth } from '../auth/AuthProvider';
import { ProfileView } from './ProfileView';

// Mock
vi.mock('../auth/AuthProvider');
vi.mock('../../services/profileService');
vi.mock('react-hot-toast');
vi.mock('../modals/ReleaseNotesModal', () => ({
  ReleaseNotesModal: ({ onClose }: any) => (
    <div data-testid="release-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { APP_VERSION: '2.0.2' } } });

describe('ProfileView', () => {
  const mockUser = { id: 'user-123' };
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser, signOut: mockSignOut } as any);
    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue([]);
    vi.mocked(profileService.fetchUserSettings).mockResolvedValue(null);
  });

  it('renders correctly and loads data', async () => {
    const mockWeight = [{ weight: 80, created_at: '2026-05-28T10:00:00Z' }];
    const mockSettings = { recovery_timer: 120, bar_weight: 15 };

    vi.mocked(profileService.fetchWeightHistory).mockResolvedValue(mockWeight);
    vi.mocked(profileService.fetchUserSettings).mockResolvedValue(mockSettings as any);

    render(<ProfileView />);

    await waitFor(() => expect(screen.getByDisplayValue('80')).toBeInTheDocument());
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
  });

  it('handles save profile correctly', async () => {
    vi.mocked(profileService.saveWeight).mockResolvedValue({ error: null } as any);
    vi.mocked(profileService.saveSettings).mockResolvedValue({ error: null } as any);

    render(<ProfileView />);

    await waitFor(() => expect(screen.queryByText(/Salvataggio.../i)).not.toBeInTheDocument());

    const weightInput = screen.getByLabelText(/Peso Attuale/i);
    fireEvent.change(weightInput, { target: { value: '85' } });

    const saveBtn = screen.getByRole('button', { name: /Salva Tutte le Modifiche/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(profileService.saveWeight).toHaveBeenCalledWith(mockUser.id, 85);
      expect(profileService.saveSettings).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Profilo aggiornato!');
    });
  });

  it('handles sign out', () => {
    render(<ProfileView />);
    const logoutBtn = screen.getByText(/Esci dall'Account/i);
    fireEvent.click(logoutBtn);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows release notes modal', async () => {
    render(<ProfileView />);
    const versionText = screen.getByText(/Visualizza Note di Rilascio/i);
    fireEvent.click(versionText);
    expect(screen.getByTestId('release-modal')).toBeInTheDocument();
  });
});
