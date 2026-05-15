import { prisma } from '@/lib/prisma';

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images: { url: string }[];
  genres: string[];
  popularity: number;
}

export async function getSpotifyAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'spotify' },
  });
  if (!account?.access_token) return null;

  // Refresh if expired (expires_at is a Unix timestamp in seconds)
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) return null;

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refresh_token,
      }),
    });

    const refreshed = await res.json();
    if (refreshed.error) return null;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: refreshed.access_token,
        expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
        ...(refreshed.refresh_token && { refresh_token: refreshed.refresh_token }),
      },
    });

    return refreshed.access_token as string;
  }

  return account.access_token;
}

export async function fetchTopArtists(accessToken: string): Promise<SpotifyArtist[]> {
  const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.items as SpotifyArtist[];
}
