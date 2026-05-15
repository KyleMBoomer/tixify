import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { InterestStatus } from '@/app/generated/prisma';

// POST /api/events/:id/interest  body: { status: "INTERESTED" | "GOING" | "NOT_INTERESTED" }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: eventId } = await params;
  const body = await request.json();
  const status: InterestStatus = body.status ?? 'INTERESTED';

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  const interest = await prisma.eventInterest.upsert({
    where: { userId_eventId: { userId: session.user.id, eventId } },
    update: { status },
    create: { userId: session.user.id, eventId, status },
  });

  return Response.json(interest);
}
