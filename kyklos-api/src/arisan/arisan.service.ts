import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArisanService {
  private readonly logger = new Logger(ArisanService.name);

  constructor(private prisma: PrismaService) {}

  getParticipants(pocketId: string) {
    this.logger.debug(`Fetching arisan participants for pocket ${pocketId}`);
    return this.prisma.arisanParticipant.findMany({
      where: { pocketId },
      include: { member: { select: { id: true, name: true, email: true } } },
    });
  }

  async addParticipant(pocketId: string, communityId: string, memberId: string) {
    // Fix: cek duplikat sebelum insert
    const existing = await this.prisma.arisanParticipant.findFirst({ where: { pocketId, memberId } });
    if (existing) {
      this.logger.warn(`Arisan participant already exists: member=${memberId} pocket=${pocketId}`);
      throw new BadRequestException('Peserta sudah terdaftar di arisan ini');
    }
    this.logger.log(`Adding arisan participant: member=${memberId} pocket=${pocketId}`);
    return this.prisma.arisanParticipant.create({ data: { pocketId, communityId, memberId } });
  }

  getPeriods(pocketId: string) {
    this.logger.debug(`Fetching arisan periods for pocket ${pocketId}`);
    return this.prisma.arisanPeriod.findMany({
      where: { pocketId },
      include: { recipient: { select: { id: true, name: true } } },
      orderBy: { roundNo: 'asc' },
    });
  }

  async draw(pocketId: string, communityId: string, adminId: string) {
    // Fix: validasi admin adalah member komunitas dengan role admin
    const pocket = await this.prisma.pocket.findUnique({ where: { id: pocketId } });
    if (!pocket) throw new BadRequestException('Pocket not found');

    const adminMembership = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: adminId } },
    });
    if (!adminMembership || adminMembership.role !== 'admin') {
      throw new BadRequestException('Admin access required');
    }

    this.logger.log(`Arisan draw initiated: pocket=${pocketId} community=${communityId}`);
    const participants = await this.prisma.arisanParticipant.findMany({ where: { pocketId } });
    const eligible = participants.filter(p => !p.hasReceived);

    if (eligible.length === 0) {
      this.logger.warn(`Arisan draw failed — all ${participants.length} participants have received`);
      throw new BadRequestException('Semua peserta sudah pernah mendapat giliran');
    }

    // Validate saldo has been collected before drawing
    if (pocket.balance <= BigInt(0)) {
      this.logger.warn(`Arisan draw blocked — pocket ${pocketId} has zero balance`);
      throw new BadRequestException('Saldo arisan masih Rp 0. Kumpulkan iuran dari semua peserta terlebih dahulu sebelum mengocok arisan.');
    }

    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    const lastPeriod = await this.prisma.arisanPeriod.findFirst({ where: { pocketId }, orderBy: { roundNo: 'desc' } });
    const nextRound = (lastPeriod?.roundNo ?? 0) + 1;

    const winnerUser = await this.prisma.user.findUnique({ where: { id: winner.memberId } });
    
    if (pocket.balance > BigInt(0)) {
      await this.prisma.withdrawalRequest.create({
        data: {
          communityId,
          pocketId,
          userId: winner.memberId,
          amount: pocket.balance,
          status: 'pending',
          bankName: 'Uang Tunai / Bebas',
          accountNumber: '-',
          accountHolder: winnerUser?.name || 'Pemenang',
          note: `Pemenang Arisan: ${winnerUser?.name || 'Pemenang'} (Otomatis dibuat oleh sistem)`
        }
      });
    }

    const period = await this.prisma.arisanPeriod.create({
      data: { pocketId, communityId, roundNo: nextRound, recipientMemberId: winner.memberId, status: 'drawn', periodDate: new Date() },
      include: { recipient: { select: { id: true, name: true } } },
    });
    await this.prisma.arisanParticipant.update({ where: { id: winner.id }, data: { hasReceived: true } });

    this.logger.log(`Arisan draw result: round=${nextRound} winner=${winner.memberId} pocket=${pocketId}`);
    return period;
  }
}
