import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(communityId: string) {
    const [pockets, recentTxns, contributions, members] = await Promise.all([
      this.prisma.pocket.findMany({ where: { communityId } }),
      this.prisma.transaction.findMany({
        where: { communityId },
        include: { member: { select: { id: true, name: true } }, pocket: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.contribution.findMany({
        where: { communityId },
        include: { member: { select: { id: true, name: true, email: true } }, schedule: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membership.findMany({
        where: { communityId, status: 'active' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const totalBalance = pockets.reduce((sum, p) => sum + p.balance, BigInt(0));

    return {
      totalBalance: totalBalance.toString(),
      pockets: pockets.map(p => ({ ...p, balance: p.balance.toString() })),
      recentTransactions: recentTxns.map(t => ({ ...t, amount: t.amount.toString() })),
      contributions: contributions.map(c => ({ ...c, amount: c.amount.toString() })),
      members,
    };
  }
}
