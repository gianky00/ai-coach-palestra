import { requireEnv } from './http.ts';

export const GARMIN_TOKEN_URL = 'https://diauth.garmin.com/di-oauth2-service/oauth/token';
export const GARMIN_USER_ID_URL = 'https://apis.garmin.com/wellness-api/rest/user/id';
export const GARMIN_DEREGISTER_URL = 'https://apis.garmin.com/wellness-api/rest/user/registration';
export const GARMIN_ACTIVITIES_URL = 'https://apis.garmin.com/wellness-api/rest/activities';

export type GarminTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in?: number;
};

export async function garminTokenRequest(
  params: Record<string, string>,
): Promise<GarminTokenResponse> {
  const clientId = requireEnv('GARMIN_CLIENT_ID');
  const clientSecret = requireEnv('GARMIN_CLIENT_SECRET');

  const body = new URLSearchParams({
    ...params,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(GARMIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Garmin token error ${res.status}: ${text}`);
  }
  return JSON.parse(text) as GarminTokenResponse;
}

export async function fetchGarminUserId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(GARMIN_USER_ID_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.userId ?? data?.user_id ?? null;
  } catch {
    return null;
  }
}
