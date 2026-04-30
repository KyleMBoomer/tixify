// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'test1@example.com',
      name: 'Test User 1',
      spotifyId: 'test_spotify_1',
      location: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'test2@example.com',
      name: 'Test User 2',
      spotifyId: 'test_spotify_2',
      location: 'Los Angeles, CA',
      latitude: 34.0522,
      longitude: -118.2437,
    }
  });

  // Create test artists
  const taylorSwift = await prisma.artist.create({
    data: {
      id: '06HL4z0CvFAxyc27GXpf02',
      name: 'Taylor Swift',
      genres: ['pop', 'country'],
      popularity: 100,
    }
  });

  const weeknd = await prisma.artist.create({
    data: {
      id: '1Xyo4u8uXC1ZmMpatF05PJ',
      name: 'The Weeknd',
      genres: ['pop', 'r&b'],
      popularity: 98,
    }
  });

  // Link users to artists
  await prisma.userArtist.createMany({
    data: [
      { userId: user1.id, artistId: taylorSwift.id, ranking: 1 },
      { userId: user1.id, artistId: weeknd.id, ranking: 2 },
      { userId: user2.id, artistId: taylorSwift.id, ranking: 1 },
    ]
  });

  // Create friendship
  await prisma.friendship.create({
    data: {
      senderId: user1.id,
      receiverId: user2.id,
      status: 'ACCEPTED',
    }
  });

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });