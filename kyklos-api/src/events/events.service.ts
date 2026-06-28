import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EVENT_INCLUDE = {
  community: { select: { id: true, name: true, slug: true, themeColor: true, logoUrl: true } },
  _count: { select: { rsvps: true, joinRequests: true } },
};

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private prisma: PrismaService) {}

  // ── PUBLIC ─────────────────────────────────────────────────────

  listPublic() {
    this.logger.debug('Listing public events');
    return this.prisma.event.findMany({
      where: { isPublic: true },
      include: EVENT_INCLUDE,
      orderBy: { eventDate: 'asc' },
    });
  }

  async getPublic(id: string) {
    const ev = await this.prisma.event.findUnique({ where: { id }, include: EVENT_INCLUDE });
    if (!ev) throw new NotFoundException('Event not found');
    return ev;
  }

  // ── COMMUNITY MEMBER ───────────────────────────────────────────

  list(communityId: string) {
    this.logger.debug(`Listing events for community ${communityId}`);
    return this.prisma.event.findMany({
      where: { communityId },
      include: { _count: { select: { rsvps: true } } },
      orderBy: { eventDate: 'asc' },
    });
  }

  create(communityId: string, createdById: string, data: any) {
    this.logger.log(`Creating event "${data.title}" in community ${communityId}`);
    const { price, ...rest } = data;
    return this.prisma.event.create({
      data: {
        communityId, createdById, ...rest,
        price: price != null ? BigInt(price) : null,
      },
    });
  }

  update(id: string, data: any) {
    this.logger.log(`Updating event ${id}`);
    const { price, ...rest } = data;
    return this.prisma.event.update({
      where: { id },
      data: { ...rest, ...(price != null ? { price: BigInt(price) } : {}) },
    });
  }

  async delete(id: string) {
    this.logger.log(`Deleting event ${id}`);
    await this.prisma.rsvp.deleteMany({ where: { eventId: id } });
    await this.prisma.eventJoinRequest.deleteMany({ where: { eventId: id } });
    return this.prisma.event.delete({ where: { id } });
  }

  async getRsvps(eventId: string) {
    this.logger.debug(`Fetching RSVPs for event ${eventId}`);
    const rsvps = await this.prisma.rsvp.findMany({
      where: { eventId },
      include: { member: { select: { id: true, name: true } } },
    });
    const tally = { yes: 0, no: 0, maybe: 0 };
    for (const r of rsvps) tally[r.status as keyof typeof tally]++;
    return { rsvps, tally };
  }

  async rsvp(eventId: string, memberId: string, status: 'yes' | 'no' | 'maybe') {
    this.logger.log(`RSVP: event=${eventId} member=${memberId} status=${status}`);
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    return this.prisma.rsvp.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      create: { eventId, memberId, communityId: event!.communityId, status },
      update: { status },
    });
  }

  // ── JOIN REQUESTS ──────────────────────────────────────────────

  async requestJoin(eventId: string, userId: string) {
    this.logger.log(`Join request: event=${eventId} user=${userId}`);
    const ev = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundException('Event not found');
    if (!ev.isPublic) throw new BadRequestException('Event tidak publik');

    // Already a member?
    const alreadyMember = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: ev.communityId, userId } },
    });
    if (alreadyMember?.status === 'active') throw new BadRequestException('Kamu sudah menjadi anggota komunitas ini');

    return this.prisma.eventJoinRequest.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, communityId: ev.communityId, status: 'pending' },
      update: { status: 'pending' },
      include: { event: { select: { title: true } } },
    });
  }

  getJoinRequests(communityId: string) {
    this.logger.debug(`Getting join requests for community ${communityId}`);
    return this.prisma.eventJoinRequest.findMany({
      where: { communityId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        event: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyJoinRequest(eventId: string, userId: string) {
    return this.prisma.eventJoinRequest.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  async processJoinRequest(requestId: string, action: 'accepted' | 'rejected', adminId: string) {
    this.logger.log(`Processing join request ${requestId}: ${action} by admin=${adminId}`);
    const req = await this.prisma.eventJoinRequest.findUnique({
      where: { id: requestId },
      include: { event: true },
    });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new BadRequestException('Sudah diproses');

    // Validate admin
    const adminMembership = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: req.communityId, userId: adminId } },
    });
    if (!adminMembership || adminMembership.role !== 'admin') throw new BadRequestException('Admin access required');

    await this.prisma.eventJoinRequest.update({ where: { id: requestId }, data: { status: action } });

    // If accepted → add to community as member
    if (action === 'accepted') {
      await this.prisma.membership.upsert({
        where: { communityId_userId: { communityId: req.communityId, userId: req.userId } },
        create: { communityId: req.communityId, userId: req.userId, role: 'member', status: 'active' },
        update: { status: 'active' },
      });
      this.logger.log(`User ${req.userId} accepted → added to community ${req.communityId}`);
    }

    return { ok: true };
  }
}
