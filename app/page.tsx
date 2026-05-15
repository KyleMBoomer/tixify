import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white">
          Tixify
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Discover live events for the artists you love.
        </p>
        <form
          action={async () => {
            'use server';
            const url = await signIn('spotify', {
              redirectTo: '/dashboard',
              redirect: false,
            });
            console.log('[signIn] returned URL:', url);
            redirect(url as unknown as string);
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
          >
            Sign in with Spotify
          </button>
        </form>
      </main>
    </div>
  );
}
