import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContributionsService {
  constructor(private prisma: PrismaService) {}

  listDues(communityId: string) {
    return this.prisma.duesSchedule.findMany({ where: { communityId }, orderBy: { createdAt: 'desc' } });
  }

  createDues(communityId: string, data: { pocketId: string; title: string; amount: number; period?: string; dueDate?: string }) {
    return this.prisma.duesSchedule.create({
      data: { communityId, pocketId: data.pocketId, title: data.title, amount: BigInt(data.amount), period: data.period ?? 'monthly', dueDate: data.dueDate ? new Date(data.dueDate) : null },
    });
  }

  listContributions(communityId: string) {
    return this.prisma.contribution.findMany({
      where: { communityId },
      include: {
        member: { select: { id: true, name: true, email: true } },
        schedule: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reportPayment(id: string, userId: string, proofUrl?: string) {
    const c = await this.prisma.contribution.findUnique({ where: { id } });
    if (!c || c.memberId !== userId) throw new BadRequestException('Not your contribution');
    if (c.status === 'paid') throw new BadRequestException('Already paid');
    return this.prisma.contribution.update({ where: { id }, data: { status: 'pending_verify', proofUrl } });
  }

  async verifyPayment(id: string, adminId: string) {
    const c = await this.prisma.contribution.findUnique({ where: { id }, include: { schedule: true } });
    if (!c) throw new BadRequestException('Not found');

    // Create transaction (trigger updates pocket balance)
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

    return this.prisma.contribution.update({
      where: { id },
      data: { status: 'paid', paidAt: new Date(), transactionId: txn.id },
    });
  }
}
