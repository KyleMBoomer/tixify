import { auth } from '@/auth';
import { getSpotifyAccessToken } from '@/lib/spotify';

// Hands the signed-in user's current Spotify access token to the
// browser so the Web Playback SDK can call back into getOAuthToken.
// The token already belongs to the user (granted via OAuth), so this
// is not an escalation — but it should only ever be reachable to
// the session owner.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getSpotifyAccessToken(session.user.id);
  if (!accessToken) {
    return Response.json({ error: 'No Spotify token on file' }, { status: 404 });
  }

  return Response.json({ accessToken });
}
