import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { searchEventsByArtist, normalizeEvent } from '@/lib/ticketmaster';

// GET /api/events?city=Los+Angeles&artistId=<spotifyId>
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') ?? undefined;
  const artistId = searchParams.get('artistId') ?? undefined;

  // Determine which artists to search for
  let artistIds: string[] = [];
  let artistNames: string[] = [];

  if (artistId) {
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (artist) {
      artistIds = [artist.id];
      artistNames = [artist.name];
    }
  } else {
    // Default: search for all of the user's top artists
    const userArtists = await prisma.userArtist.findMany({
      where: { userId: session.user.id },
      include: { artist: true },
      orderBy: { ranking: 'asc' },
      take: 5,
    });
    artistIds = userArtists.map((ua) => ua.artistId);
    artistNames = userArtists.map((ua) => ua.artist.name);
  }

  if (artistNames.length === 0) {
    return Response.json({ events: [] });
  }

  // Fetch from Ticketmaster and upsert events
  const allEvents = await Promise.all(
    artistNames.map((name, i) =>
      searchEventsByArtist(name, city).then((events) =>
        events.map((e) => normalizeEvent(e, [artistIds[i]]))
      )
    )
  );

  const events = allEvents.flat();

  // Upsert into DB so we can attach interests/notifications later
  await Promise.all(
    events.map((e) =>
      prisma.event.upsert({
        where: { id: e.id },
        update: e,
        create: e,
      })
    )
  );

  return Response.json({ events });
}
