import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getSpotifyAccessToken, fetchTopArtists } from '@/lib/spotify';

// GET /api/user/artists — sync top artists from Spotify and return them
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getSpotifyAccessToken(session.user.id);
  if (!accessToken) {
    return Response.json({ error: 'Spotify token unavailable' }, { status: 401 });
  }

  const spotifyArtists = await fetchTopArtists(accessToken);

  // Upsert each artist into the DB, then link to this user
  for (let i = 0; i < spotifyArtists.length; i++) {
    const a = spotifyArtists[i];

    await prisma.artist.upsert({
      where: { id: a.id },
      update: {
        name: a.name,
        spotifyUrl: a.external_urls.spotify,
        imageUrl: a.images[0]?.url ?? null,
        genres: a.genres,
        popularity: a.popularity,
      },
      create: {
        id: a.id,
        name: a.name,
        spotifyUrl: a.external_urls.spotify,
        imageUrl: a.images[0]?.url ?? null,
        genres: a.genres,
        popularity: a.popularity,
      },
    });

    await prisma.userArtist.upsert({
      where: { userId_artistId: { userId: session.user.id, artistId: a.id } },
      update: { ranking: i + 1 },
      create: { userId: session.user.id, artistId: a.id, ranking: i + 1 },
    });
  }

  const userArtists = await prisma.userArtist.findMany({
    where: { userId: session.user.id },
    include: { artist: true },
    orderBy: { ranking: 'asc' },
  });

  return Response.json(userArtists);
}
