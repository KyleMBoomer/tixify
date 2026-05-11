import Image from 'next/image';
import { auth, signOut } from '@/auth';
import { prisma } from '@/lib/prisma';
import { syncUserTopArtists } from '@/lib/spotify';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  let artists = await prisma.userArtist.findMany({
    where: { userId: session.user.id },
    include: { artist: true },
    orderBy: { ranking: 'asc' },
  });

  let syncError: string | null = null;
  if (artists.length === 0) {
    try {
      artists = await syncUserTopArtists(session.user.id);
    } catch (err) {
      syncError = err instanceof Error ? err.message : 'Failed to load artists';
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-8 py-4">
        <div className="flex items-center gap-3">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? 'Profile'}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-black dark:text-white">
              {session.user.name ?? session.user.email}
            </p>
            <p className="text-xs text-zinc-500">{session.user.email}</p>
          </div>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Your Top Artists
          </h2>
          <form
            action={async () => {
              'use server';
              const s = await auth();
              if (s?.user?.id) await syncUserTopArtists(s.user.id);
              revalidatePath('/dashboard');
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Refresh from Spotify
            </button>
          </form>
        </div>

        {syncError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            {syncError}
          </p>
        )}

        {artists.length === 0 && !syncError && (
          <p className="text-zinc-500">
            No artists yet. Click &quot;Refresh from Spotify&quot; to load your top artists.
          </p>
        )}

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {artists.map((ua) => (
            <li key={ua.artist.id} className="flex flex-col gap-2">
              <a
                href={ua.artist.spotifyUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {ua.artist.imageUrl ? (
                  <Image
                    src={ua.artist.imageUrl}
                    alt={ua.artist.name}
                    width={300}
                    height={300}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                )}
              </a>
              <div>
                <p className="font-semibold text-black dark:text-white truncate">
                  {ua.ranking}. {ua.artist.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {ua.artist.genres.slice(0, 2).join(', ') || '—'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
