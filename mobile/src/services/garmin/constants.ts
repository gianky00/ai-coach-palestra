export const LEGACY_TOKEN_KEY = 'garmin_access_token';
export const LEGACY_CLIENT_ID_KEY = 'garmin_client_id';
export const GARMIN_DEMO_TOKEN = 'kinefit_garmin_demo';
export const PKCE_VERIFIER_KEY = 'garmin_pkce_verifier';
export const PKCE_STATE_KEY = 'garmin_pkce_state';
export const REDIRECT_URI = 'kinefit://garmin-callback';
export const AUTHORIZE_URL = 'https://connect.garmin.com/oauth2Confirm';

export type GarminLinkStatus = 'disconnected' | 'demo' | 'connected' | 'needs_reconnect';

export const tokenKey = (userId: string) => `garmin_access_token:${userId}`;
export const clientIdKey = (userId: string) => `garmin_client_id:${userId}`;
