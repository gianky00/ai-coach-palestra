import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { useStore } from '../../store/useStore';
import { indexedDbService } from '../../lib/indexedDb';
import * as offlineSync from '../../lib/offlineSync';

// Mock dependecies
vi.mock('../../store/useStore');
vi.mock('../../lib/indexedDb');
vi.mock('../../lib/offlineSync', () => ({
  getOfflineQueueCount: vi.fn(),
}));
vi.mock('../../config/changelog.json', () => ({
  default: [
    {
      version: '2.0.0',
      date: '2023-10-27',
      notes: ['Test note 1', 'Test note 2'],
    },
  ],
}));

describe('ReleaseNotesModal', () => {
  const setOfflineQueueCountMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as unknown as any).mockReturnValue({
      setOfflineQueueCount: setOfflineQueueCountMock,
    });
    // @ts-ignore
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('renders modal with basic information', async () => {
    (offlineSync.getOfflineQueueCount as any).mockResolvedValue(0);

    render(<ReleaseNotesModal onClose={vi.fn()} />);

    expect(screen.getByText('Note di Rilascio')).toBeInTheDocument();
    
    // Check if version is displayed (should fallback to 2.0.0 or from process.env)
    expect(screen.getByText('Versione')).toBeInTheDocument();
    
    // Check changelog entries
    expect(screen.getByText('Test note 1')).toBeInTheDocument();
    expect(screen.getByText('Test note 2')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Coda Offline: 0 set')).toBeInTheDocument();
    });
  });

  it('shows clear queue button when queueCount > 0 and clears queue on click', async () => {
    (offlineSync.getOfflineQueueCount as any).mockResolvedValue(5);
    (indexedDbService.clearLogs as any).mockResolvedValue(undefined);
    (indexedDbService.clearOfflineSessions as any).mockResolvedValue(undefined);

    render(<ReleaseNotesModal onClose={vi.fn()} />);

    // Wait for the queue count to be updated
    await waitFor(() => {
      expect(screen.getByText('Coda Offline: 5 set')).toBeInTheDocument();
    });

    const svuotaBtn = screen.getByText('Svuota');
    expect(svuotaBtn).toBeInTheDocument();

    fireEvent.click(svuotaBtn);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(indexedDbService.clearLogs).toHaveBeenCalledTimes(1);
      expect(indexedDbService.clearOfflineSessions).toHaveBeenCalledTimes(1);
      expect(setOfflineQueueCountMock).toHaveBeenCalledWith(0);
      expect(screen.getByText('Coda Offline: 0 set')).toBeInTheDocument();
    });
  });

  it('calls onClose when close buttons are clicked', async () => {
    (offlineSync.getOfflineQueueCount as any).mockResolvedValue(0);
    const onCloseMock = vi.fn();

    render(<ReleaseNotesModal onClose={onCloseMock} />);

    // Bottom close button
    const closeBtn = screen.getByText('Chiudi Finestra');
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
