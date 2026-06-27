import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  list(communityId: string) {
    return this.prisma.event.findMany({
      where: { communityId },
      include: { _count: { select: { rsvps: true } } },
      orderBy: { eventDate: 'asc' },
    });
  }

  create(communityId: string, createdById: string, data: any) {
    return this.prisma.event.create({ data: { communityId, createdById, ...data } });
  }

  async rsvp(eventId: string, memberId: string, status: 'yes' | 'no' | 'maybe') {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    return this.prisma.rsvp.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId, communityId: event!.communityId, status },
      update: { status },
    });
  }
}
