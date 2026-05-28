import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            background: '#000',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <AlertTriangle
            size={64}
            color="var(--accent, #ff4d4d)"
            style={{ marginBottom: '24px' }}
          />
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Oops! Qualcosa è andato storto.
          </h1>
          <p style={{ color: '#aaa', marginBottom: '32px', maxWidth: '400px' }}>
            L'applicazione ha riscontrato un errore imprevisto. Prova a ricaricare la pagina.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent, #ff4d4d)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={20} /> Ricarica App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
