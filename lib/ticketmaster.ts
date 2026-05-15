export interface TMEvent {
  id: string;
  name: string;
  dates: { start: { dateTime?: string; localDate: string } };
  _embedded?: {
    venues?: {
      name: string;
      city: { name: string };
      state?: { name: string };
      country: { name: string };
      location?: { latitude: string; longitude: string };
    }[];
    attractions?: { id: string; name: string }[];
  };
  url: string;
  images?: { url: string; width: number; height: number }[];
  priceRanges?: { min: number; max: number; currency: string }[];
}

export async function searchEventsByArtist(
  artistName: string,
  city?: string
): Promise<TMEvent[]> {
  const params = new URLSearchParams({
    apikey: process.env.TICKETMASTER_API_KEY!,
    keyword: artistName,
    classificationName: 'Music',
    size: '20',
    sort: 'date,asc',
  });
  if (city) params.set('city', city);

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
  );
  const data = await res.json();

  if (data.fault) throw new Error(data.fault.faultstring);
  return (data._embedded?.events ?? []) as TMEvent[];
}

export function normalizeEvent(event: TMEvent, artistIds: string[]) {
  const venue = event._embedded?.venues?.[0];
  const price = event.priceRanges?.[0];
  const image = event.images?.sort((a, b) => b.width - a.width)[0];

  return {
    id: event.id,
    name: event.name,
    date: new Date(event.dates.start.dateTime ?? event.dates.start.localDate),
    venue: venue?.name ?? 'TBD',
    city: venue?.city.name ?? 'TBD',
    state: venue?.state?.name,
    country: venue?.country.name ?? 'TBD',
    latitude: venue?.location ? parseFloat(venue.location.latitude) : null,
    longitude: venue?.location ? parseFloat(venue.location.longitude) : null,
    ticketmasterUrl: event.url,
    imageUrl: image?.url ?? null,
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    currency: price?.currency ?? null,
    artistIds,
  };
}
