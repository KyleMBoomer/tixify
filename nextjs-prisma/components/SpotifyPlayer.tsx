'use client';

// Rough draft of an in-app Spotify player using the Web Playback SDK.
// Still needed for this to actually play audio:
//   1. Add `streaming` to the Spotify OAuth scopes in auth.ts
//      (current: 'user-top-read user-read-email user-read-private')
//   2. Create GET /api/spotify/token that returns the signed-in user's
//      current Spotify access_token (refresh if expired). Re-use the
//      refresh logic in lib/spotify.ts.
//   3. The signed-in user must have Spotify Premium — the SDK silently
//      refuses to play for Free accounts.
//   4. Wrap the dashboard tree in <SpotifyPlayerProvider> and trade
//      the artist tile's <a target="_blank"> for a button that calls
//      usePlayer().play(`spotify:artist:${artist.spotifyId}`).

import Script from 'next/script';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type PlayerState = {
  isReady: boolean;
  isPaused: boolean;
  trackName: string | null;
  artistName: string | null;
  albumImageUrl: string | null;
};

type PlayerContextValue = PlayerState & {
  play: (contextUri: string) => Promise<void>;
  togglePlay: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <SpotifyPlayerProvider>');
  return ctx;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
  }
}

type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  addListener: (event: string, cb: (payload: any) => void) => void;
  removeListener: (event: string) => void;
};

async function fetchAccessToken(): Promise<string> {
  const res = await fetch('/api/spotify/token', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch Spotify access token');
  const { accessToken } = await res.json();
  return accessToken;
}

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const [state, setState] = useState<PlayerState>({
    isReady: false,
    isPaused: true,
    trackName: null,
    artistName: null,
    albumImageUrl: null,
  });

  const initPlayer = useCallback(() => {
    const player = new window.Spotify.Player({
      name: 'Tixify Web Player',
      volume: 0.5,
      getOAuthToken: async (cb) => {
        try {
          const token = await fetchAccessToken();
          tokenRef.current = token;
          cb(token);
        } catch (err) {
          console.error('[SpotifyPlayer] token fetch failed', err);
        }
      },
    });

    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      deviceIdRef.current = device_id;
      setState((s) => ({ ...s, isReady: true }));
    });

    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.warn('[SpotifyPlayer] device went offline', device_id);
      setState((s) => ({ ...s, isReady: false }));
    });

    player.addListener('initialization_error', ({ message }: { message: string }) =>
      console.error('[SpotifyPlayer] init error:', message),
    );
    player.addListener('authentication_error', ({ message }: { message: string }) =>
      console.error('[SpotifyPlayer] auth error:', message),
    );
    player.addListener('account_error', ({ message }: { message: string }) =>
      console.error('[SpotifyPlayer] account error (Premium required?):', message),
    );

    player.addListener('player_state_changed', (s: any) => {
      if (!s) return;
      const track = s.track_window?.current_track;
      setState((prev) => ({
        ...prev,
        isPaused: s.paused,
        trackName: track?.name ?? null,
        artistName: track?.artists?.map((a: any) => a.name).join(', ') ?? null,
        albumImageUrl: track?.album?.images?.[0]?.url ?? null,
      }));
    });

    player.connect();
    playerRef.current = player;
  }, []);

  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [initPlayer]);

  const play = useCallback(async (contextUri: string) => {
    const deviceId = deviceIdRef.current;
    const token = tokenRef.current;
    if (!deviceId || !token) {
      console.warn('[SpotifyPlayer] not ready yet');
      return;
    }
    // Transfer + start playback on this device.
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context_uri: contextUri }),
    });
  }, []);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  return (
    <PlayerContext.Provider value={{ ...state, play, togglePlay }}>
      <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      {children}
      <PlayerBar />
    </PlayerContext.Provider>
  );
}

function PlayerBar() {
  const { isReady, isPaused, trackName, artistName, albumImageUrl, togglePlay } = usePlayer();

  if (!isReady || !trackName) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-3 flex items-center gap-4">
      {albumImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={albumImageUrl} alt="" className="h-12 w-12 rounded" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black dark:text-white truncate">{trackName}</p>
        <p className="text-xs text-zinc-500 truncate">{artistName}</p>
      </div>
      <button
        type="button"
        onClick={togglePlay}
        className="rounded-full bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
      >
        {isPaused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}
