import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PocketsService {
  constructor(private prisma: PrismaService) {}

  list(communityId: string) {
    return this.prisma.pocket.findMany({ where: { communityId }, orderBy: { createdAt: 'asc' } });
  }

  create(communityId: string, data: { name: string; type?: any }) {
    return this.prisma.pocket.create({ data: { communityId, ...data } });
  }

  async findOne(id: string) {
    const p = await this.prisma.pocket.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Pocket not found');
    return p;
  }

  getTransactions(pocketId: string) {
    return this.prisma.transaction.findMany({
      where: { pocketId },
      include: {
        member: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordTransaction(pocketId: string, createdById: string, data: {
    amount: number; direction: 'in' | 'out'; category?: string; note?: string; memberId?: string; status?: 'confirmed' | 'pending';
  }) {
    const pocket = await this.findOne(pocketId);
    return this.prisma.transaction.create({
      data: {
        pocketId,
        communityId: pocket.communityId,
        createdById,
        amount: BigInt(data.amount),
        direction: data.direction,
        category: data.category,
        note: data.note,
        memberId: data.memberId,
        status: data.status ?? 'confirmed',
      },
    });
  }
}
