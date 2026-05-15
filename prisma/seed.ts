import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Users
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      name: 'Test User 1',
      spotifyId: 'test_spotify_1',
      location: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      name: 'Test User 2',
      spotifyId: 'test_spotify_2',
      location: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  });

  // Artists
  const taylorSwift = await prisma.artist.upsert({
    where: { id: '06HL4z0CvFAxyc27GXpf02' },
    update: {},
    create: {
      id: '06HL4z0CvFAxyc27GXpf02',
      name: 'Taylor Swift',
      spotifyUrl: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02',
      genres: ['pop', 'country pop'],
      popularity: 100,
    },
  });

  const weeknd = await prisma.artist.upsert({
    where: { id: '1Xyo4u8uXC1ZmMpatF05PJ' },
    update: {},
    create: {
      id: '1Xyo4u8uXC1ZmMpatF05PJ',
      name: 'The Weeknd',
      spotifyUrl: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ',
      genres: ['pop', 'r&b'],
      popularity: 98,
    },
  });

  // User–Artist links
  await prisma.userArtist.upsert({
    where: { userId_artistId: { userId: user1.id, artistId: taylorSwift.id } },
    update: {},
    create: { userId: user1.id, artistId: taylorSwift.id, ranking: 1 },
  });
  await prisma.userArtist.upsert({
    where: { userId_artistId: { userId: user1.id, artistId: weeknd.id } },
    update: {},
    create: { userId: user1.id, artistId: weeknd.id, ranking: 2 },
  });
  await prisma.userArtist.upsert({
    where: { userId_artistId: { userId: user2.id, artistId: taylorSwift.id } },
    update: {},
    create: { userId: user2.id, artistId: taylorSwift.id, ranking: 1 },
  });

  // Friendship
  await prisma.friendship.upsert({
    where: { senderId_receiverId: { senderId: user1.id, receiverId: user2.id } },
    update: {},
    create: { senderId: user1.id, receiverId: user2.id, status: 'ACCEPTED' },
  });

  // Events (Ticketmaster-style IDs)
  const event1 = await prisma.event.upsert({
    where: { id: 'Z7r9jZ1AdJ1uA' },
    update: {},
    create: {
      id: 'Z7r9jZ1AdJ1uA',
      name: 'Taylor Swift | The Eras Tour',
      date: new Date('2026-08-15T19:30:00'),
      venue: 'SoFi Stadium',
      city: 'Inglewood',
      state: 'California',
      country: 'United States',
      latitude: 33.9535,
      longitude: -118.3392,
      ticketmasterUrl: 'https://www.ticketmaster.com/event/Z7r9jZ1AdJ1uA',
      imageUrl: 'https://s1.ticketm.net/dam/a/eras-tour.jpg',
      priceMin: 49.0,
      priceMax: 899.0,
      currency: 'USD',
      artistIds: ['06HL4z0CvFAxyc27GXpf02'],
      artists: { connect: { id: '06HL4z0CvFAxyc27GXpf02' } },
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 'Z7r9jZ1AdK2vB' },
    update: {},
    create: {
      id: 'Z7r9jZ1AdK2vB',
      name: 'The Weeknd: After Hours Til Dawn',
      date: new Date('2026-09-20T20:00:00'),
      venue: 'Crypto.com Arena',
      city: 'Los Angeles',
      state: 'California',
      country: 'United States',
      latitude: 34.0430,
      longitude: -118.2673,
      ticketmasterUrl: 'https://www.ticketmaster.com/event/Z7r9jZ1AdK2vB',
      imageUrl: 'https://s1.ticketm.net/dam/a/weeknd-tour.jpg',
      priceMin: 75.0,
      priceMax: 500.0,
      currency: 'USD',
      artistIds: ['1Xyo4u8uXC1ZmMpatF05PJ'],
      artists: { connect: { id: '1Xyo4u8uXC1ZmMpatF05PJ' } },
    },
  });

  // Event interests
  await prisma.eventInterest.upsert({
    where: { userId_eventId: { userId: user1.id, eventId: event1.id } },
    update: {},
    create: { userId: user1.id, eventId: event1.id, status: 'GOING' },
  });
  await prisma.eventInterest.upsert({
    where: { userId_eventId: { userId: user2.id, eventId: event1.id } },
    update: {},
    create: { userId: user2.id, eventId: event1.id, status: 'INTERESTED' },
  });
  await prisma.eventInterest.upsert({
    where: { userId_eventId: { userId: user1.id, eventId: event2.id } },
    update: {},
    create: { userId: user1.id, eventId: event2.id, status: 'INTERESTED' },
  });

  // Notification — user1 is notified that user2 is also interested in event1
  await prisma.notification.upsert({
    where: { id: 'seed-notif-1' },
    update: {},
    create: {
      id: 'seed-notif-1',
      userId: user1.id,
      eventId: event1.id,
      friendIds: [user2.id],
      message: `${user2.name} is also interested in Taylor Swift | The Eras Tour!`,
      isRead: false,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
