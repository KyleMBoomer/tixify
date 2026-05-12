import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // `product` is cached on the User row (populated by the linkAccount
  // event in auth.ts, refreshed by the dashboard's "Refresh from
  // Spotify" action). Reading it here is a single Postgres query and
  // costs zero Spotify API calls.
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
      product: true,
      createdAt: true,
      artists: {
        include: { artist: true },
        orderBy: { ranking: 'asc' },
      },
    },
  });

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  return Response.json(user);
}
