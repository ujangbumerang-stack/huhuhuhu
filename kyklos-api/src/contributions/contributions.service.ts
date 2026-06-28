import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(private prisma: PrismaService) {}

  listDues(communityId: string) {
    this.logger.debug(`Listing dues for community ${communityId}`);
    return this.prisma.duesSchedule.findMany({ where: { communityId }, orderBy: { createdAt: 'desc' } });
  }

  createDues(communityId: string, data: { pocketId: string; title: string; amount: number; period?: string; dueDate?: string }) {
    this.logger.log(`Creating dues "${data.title}" amount=${data.amount} for community ${communityId}`);
    return this.prisma.duesSchedule.create({
      data: {
        communityId,
        pocketId: data.pocketId,
        title: data.title,
        amount: BigInt(data.amount),
        period: data.period ?? 'monthly',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  listContributions(communityId: string) {
    this.logger.debug(`Listing contributions for community ${communityId}`);
    return this.prisma.contribution.findMany({
      where: { communityId },
      include: {
        member: { select: { id: true, name: true, email: true } },
        schedule: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  myContributions(userId: string, communityId: string) {
    this.logger.debug(`Fetching contributions for user ${userId} in community ${communityId}`);
    return this.prisma.contribution.findMany({
      where: { memberId: userId, communityId },
      include: { schedule: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateContributions(scheduleId: string, adminId: string) {
    this.logger.log(`Generating contributions for schedule ${scheduleId} by admin ${adminId}`);
    const schedule = await this.prisma.duesSchedule.findUnique({ where: { id: scheduleId } });
    if (!schedule) throw new BadRequestException('DuesSchedule not found');

    const adminMembership = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: schedule.communityId, userId: adminId } },
    });
    if (!adminMembership || adminMembership.role !== 'admin') {
      this.logger.warn(`Generate contributions rejected — user ${adminId} is not admin of community ${schedule.communityId}`);
      throw new BadRequestException('Admin access required');
    }

    const members = await this.prisma.membership.findMany({ where: { communityId: schedule.communityId, status: 'active' } });
    const existing = await this.prisma.contribution.findMany({ where: { scheduleId }, select: { memberId: true } });
    const existingIds = new Set(existing.map(e => e.memberId));

    const toCreate = members
      .filter(m => !existingIds.has(m.userId))
      .map(m => ({ communityId: schedule.communityId, scheduleId, memberId: m.userId, amount: schedule.amount, status: 'unpaid' as const }));

    await this.prisma.contribution.createMany({ data: toCreate });
    this.logger.log(`Generated ${toCreate.length} contributions for schedule ${scheduleId} (skipped ${existingIds.size} existing)`);
    return { created: toCreate.length, skipped: existingIds.size };
  }

  async reportPayment(id: string, userId: string, proofUrl?: string) {
    this.logger.log(`Payment reported: contribution=${id} by user=${userId}`);
    const c = await this.prisma.contribution.findUnique({ where: { id } });
    if (!c || c.memberId !== userId) {
      this.logger.warn(`Report payment rejected — contribution ${id} not owned by user ${userId}`);
      throw new BadRequestException('Not your contribution');
    }
    if (c.status === 'paid') throw new BadRequestException('Already paid');
    return this.prisma.contribution.update({ where: { id }, data: { status: 'pending_verify', proofUrl } });
  }

  updateDues(id: string, data: any) {
    this.logger.log(`Updating dues schedule ${id}`);
    const update: any = {};
    if (data.title) update.title = data.title;
    if (data.amount) update.amount = BigInt(data.amount);
    if (data.period) update.period = data.period;
    if (data.dueDate) update.dueDate = new Date(data.dueDate);
    return this.prisma.duesSchedule.update({ where: { id }, data: update });
  }

  async verifyPayment(id: string, adminId: string) {
    this.logger.log(`Verifying payment: contribution=${id} by admin=${adminId}`);
    const c = await this.prisma.contribution.findUnique({ where: { id }, include: { schedule: true } });
    if (!c) throw new BadRequestException('Not found');

    // Security: validate caller is admin of this community
    const adminMembership = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: c.communityId, userId: adminId } },
    });
    if (!adminMembership || adminMembership.role !== 'admin') {
      this.logger.warn(`Verify rejected — user ${adminId} is not admin of community ${c.communityId}`);
      throw new BadRequestException('Admin access required');
    }

    const pocketId = c.schedule?.pocketId;
    if (!pocketId) throw new BadRequestException('No pocket linked');

    const txn = await this.prisma.transaction.create({
      data: {
        communityId: c.communityId,
        pocketId,
        memberId: c.memberId,
        amount: c.amount,
        direction: 'in',
        category: 'dues',
        note: 'Contribution verified',
        status: 'confirmed',
        createdById: adminId,
      },
    });

    this.logger.log(`Payment verified: contribution=${id} → transaction=${txn.id} pocket=${pocketId}`);
    return this.prisma.contribution.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), transactionId: txn.id },
    });
  }

  async simulatePayment(id: string, userId: string) {
    this.logger.log(`[SIMULATION] Simulating payment for contribution=${id} by user=${userId}`);
    const c = await this.prisma.contribution.findUnique({ where: { id }, include: { schedule: true } });
    if (!c || c.memberId !== userId) throw new BadRequestException('Not your contribution');
    if (c.status === 'paid') throw new BadRequestException('Already paid');

    const pocketId = c.schedule?.pocketId;
    if (!pocketId) throw new BadRequestException('No pocket linked to this dues schedule');

    // Create incoming transaction
    const txn = await this.prisma.transaction.create({
      data: {
        communityId: c.communityId,
        pocketId,
        memberId: c.memberId,
        amount: c.amount,
        direction: 'in',
        category: 'dues',
        note: 'Pembayaran tagihan via Simulator',
        status: 'confirmed',
      },
    });

    return this.prisma.contribution.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), transactionId: txn.id },
    });
  }
}
