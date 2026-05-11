import { auth } from '@/auth';
import { syncUserTopArtists } from '@/lib/spotify';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userArtists = await syncUserTopArtists(session.user.id);
    return Response.json(userArtists);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 502 });
  }
}
