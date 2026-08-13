import { describe, expect, it } from 'vitest';

import {
  AUTHORIZE_URL,
  clientIdKey,
  GARMIN_DEMO_TOKEN,
  PKCE_STATE_KEY,
  PKCE_VERIFIER_KEY,
  REDIRECT_URI,
  tokenKey,
} from '../../src/services/garmin/constants';

describe('garmin constants', () => {
  it('espone URL e chiavi', () => {
    expect(PKCE_VERIFIER_KEY).toContain('pkce');
    expect(PKCE_STATE_KEY).toContain('state');
    expect(REDIRECT_URI).toContain('kinefit://');
    expect(AUTHORIZE_URL).toContain('garmin');
    expect(GARMIN_DEMO_TOKEN).toBeTruthy();
    expect(tokenKey('u1')).toBe('garmin_access_token:u1');
    expect(clientIdKey('u1')).toBe('garmin_client_id:u1');
  });
});
