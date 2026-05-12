import NextAuth, { type NextAuthConfig } from 'next-auth';

import { PrismaAdapter } from '@auth/prisma-adapter';
import Spotify from 'next-auth/providers/spotify';
import { prisma } from '@/lib/prisma';
import { syncUserProduct } from '@/lib/spotify';

console.log('[auth] process.env.AUTH_URL:', process.env.AUTH_URL);
console.log('[auth] process.env.NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Temporary: intercept Spotify requests to log redirect_uri at both steps
if (process.env.NODE_ENV === 'development') {
  const orig = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.startsWith('https://accounts.spotify.com/')) {
      const body = init?.body
        ? init.body.toString()
        : input instanceof Request
        ? await input.clone().text()
        : '';
      console.log('[spotify fetch]', url);
      if (body) console.log('[spotify fetch body]', body);
    }
    return orig(input, init);
  };
}

export const authConfig: NextAuthConfig = {
  useSecureCookies: false,
  adapter: PrismaAdapter(prisma),
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: 'https://accounts.spotify.com/authorize?scope=user-top-read+user-read-email+user-read-private+streaming+user-read-playback-state+user-modify-playback-state',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Fires after the Account row is inserted on first OAuth link.
    // The access_token is on disk at this point, so syncUserProduct
    // can fetch /v1/me and cache `product` once for the lifetime of
    // the account. Errors here must not block sign-in.
    async linkAccount({ user, account }) {
      if (account.provider !== 'spotify' || !user.id) return;
      try {
        await syncUserProduct(user.id);
      } catch (err) {
        console.error('[auth] syncUserProduct on linkAccount failed', err);
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
