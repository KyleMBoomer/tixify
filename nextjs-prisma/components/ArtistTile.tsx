'use client';

// Rough draft. One tile, two render paths driven by isPremium:
//   premium → button that triggers the Web Playback SDK via usePlayer()
//   free/open → external link to Spotify (existing behavior)
//
// usePlayer() requires <SpotifyPlayerProvider> as an ancestor — the
// dashboard only mounts that provider when the user is premium, so
// the hook is only invoked from PremiumTile (which only renders in
// the premium branch). LinkTile never calls the hook.

import Image from 'next/image';
import { usePlayer } from './SpotifyPlayer';

type Artist = {
  id: string; // Spotify artist ID — used to build the spotify:artist:<id> URI
  name: string;
  spotifyUrl: string | null;
  imageUrl: string | null;
  genres: string[];
};

type Props = {
  artist: Artist;
  ranking: number | null;
  isPremium: boolean;
};

export function ArtistTile({ artist, ranking, isPremium }: Props) {
  return (
    <li className="flex flex-col gap-2">
      {isPremium ? <PremiumTile artist={artist} /> : <LinkTile artist={artist} />}
      <div>
        <p className="font-semibold text-black dark:text-white truncate">
          {ranking != null ? `${ranking}. ` : ''}{artist.name}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          {artist.genres.slice(0, 2).join(', ') || '—'}
        </p>
      </div>
    </li>
  );
}

function PremiumTile({ artist }: { artist: Artist }) {
  const { play, isReady } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => play(`spotify:artist:${artist.id}`)}
      disabled={!isReady}
      aria-label={`Play ${artist.name}`}
      className="block text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Cover artist={artist} />
    </button>
  );
}

function LinkTile({ artist }: { artist: Artist }) {
  return (
    <a
      href={artist.spotifyUrl ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      <Cover artist={artist} />
    </a>
  );
}

function Cover({ artist }: { artist: Artist }) {
  if (!artist.imageUrl) {
    return <div className="aspect-square w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />;
  }
  return (
    <Image
      src={artist.imageUrl}
      alt={artist.name}
      width={300}
      height={300}
      className="aspect-square w-full rounded-lg object-cover"
    />
  );
}
