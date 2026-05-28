import { Loader2, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';

import { supabase } from '../../lib/supabase';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: 'Registrazione completata! Controlla la mail per confermare.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      const err = error as Error;
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div
            className="title"
            style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.05em' }}
          >
            KINE<span className="version">FIT</span>
          </div>
          <p className="subtitle">
            {isRegistering ? 'Crea un nuovo account' : 'Bentornato, atleta'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="latua@email.it"
              required
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? (
              <Loader2 className="spinner" size={20} />
            ) : isRegistering ? (
              'Registrati'
            ) : (
              'Accedi'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="toggle-btn"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {isRegistering ? 'Hai già un account? Accedi' : 'Nuovo qui? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
};
