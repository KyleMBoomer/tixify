import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { fetchSpotifyProfile, getSpotifyAccessToken } from '@/lib/spotify';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      spotifyId: true,
      location: true,
      latitude: true,
      longitude: true,
      radius: true,
      createdAt: true,
      artists: {
        include: { artist: true },
        orderBy: { ranking: 'asc' },
      },
    },
  });

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  // Spotify subscription tier — drives whether the dashboard can use
  // the Web Playback SDK (`premium`) or has to fall back to external links.
  let product: SpotifyProfile['product'] | null = null;
  const accessToken = await getSpotifyAccessToken(session.user.id);
  if (accessToken) {
    try {
      const profile = await fetchSpotifyProfile(accessToken);
      product = profile.product;
    } catch (err) {
      console.error('[user/me] failed to fetch Spotify profile', err);
    }
  }

  return Response.json({ ...user, product });
}

type SpotifyProfile = Awaited<ReturnType<typeof fetchSpotifyProfile>>;
