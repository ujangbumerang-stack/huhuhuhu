import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArisanService {
  constructor(private prisma: PrismaService) {}

  getParticipants(pocketId: string) {
    return this.prisma.arisanParticipant.findMany({
      where: { pocketId },
      include: { member: { select: { id: true, name: true, email: true } } },
    });
  }

  addParticipant(pocketId: string, communityId: string, memberId: string) {
    return this.prisma.arisanParticipant.create({ data: { pocketId, communityId, memberId } });
  }

  getPeriods(pocketId: string) {
    return this.prisma.arisanPeriod.findMany({
      where: { pocketId },
      include: { recipient: { select: { id: true, name: true } } },
      orderBy: { roundNo: 'asc' },
    });
  }

  async draw(pocketId: string, communityId: string) {
    const participants = await this.prisma.arisanParticipant.findMany({ where: { pocketId } });
    const eligible = participants.filter(p => !p.hasReceived);
    if (eligible.length === 0) throw new BadRequestException('All participants have received');

    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    const lastPeriod = await this.prisma.arisanPeriod.findFirst({ where: { pocketId }, orderBy: { roundNo: 'desc' } });
    const nextRound = (lastPeriod?.roundNo ?? 0) + 1;

    const period = await this.prisma.arisanPeriod.create({
      data: { pocketId, communityId, roundNo: nextRound, recipientMemberId: winner.memberId, status: 'drawn', periodDate: new Date() },
    });
    await this.prisma.arisanParticipant.update({ where: { id: winner.id }, data: { hasReceived: true } });

    return period;
  }
}
