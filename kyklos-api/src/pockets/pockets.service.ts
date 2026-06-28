import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PocketsService {
  private readonly logger = new Logger(PocketsService.name);

  constructor(private prisma: PrismaService) {}

  list(communityId: string) {
    this.logger.debug(`Listing pockets for community ${communityId}`);
    return this.prisma.pocket.findMany({ where: { communityId }, orderBy: { createdAt: 'asc' } });
  }

  create(communityId: string, data: { name: string; description?: string; type: any }) {
    this.logger.log(`Creating pocket "${data.name}" (Type: ${data.type}) in community ${communityId}`);
    return this.prisma.pocket.create({ data: { communityId, ...data } });
  }

  async findOne(id: string) {
    const p = await this.prisma.pocket.findUnique({ where: { id } });
    if (!p) {
      this.logger.warn(`Pocket not found: ${id}`);
      throw new NotFoundException('Pocket not found');
    }
    return p;
  }

  async delete(id: string) {
    const pocket = await this.findOne(id);
    if (pocket.balance > BigInt(0)) {
      this.logger.warn(`Delete pocket ${id} rejected — has balance ${pocket.balance}`);
      throw new ForbiddenException('Saldo kas harus Rp 0 (dicairkan) terlebih dahulu sebelum bisa dihapus');
    }
    this.logger.log(`Deleting pocket ${id} (Balance 0)`);
    return this.prisma.pocket.delete({ where: { id } });
  }

  getTransactions(pocketId: string) {
    this.logger.debug(`Fetching transactions for pocket ${pocketId}`);
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
    this.logger.log(`Recording transaction: pocket=${pocketId} amount=${data.amount} dir=${data.direction} by=${createdById}`);
    
    const balanceChange = data.direction === 'in' ? BigInt(data.amount) : -BigInt(data.amount);

    const [txn] = await this.prisma.$transaction([
      this.prisma.transaction.create({
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
      }),
      this.prisma.pocket.update({
        where: { id: pocketId },
        data: {
          balance: {
            increment: balanceChange
          }
        }
      })
    ]);

    return txn;
  }

  async requestWithdrawal(pocketId: string, createdById: string, data: { amount: number; bankName: string; accountNumber: string; accountHolder: string }) {
    const pocket = await this.findOne(pocketId);
    if (pocket.balance < BigInt(data.amount)) throw new BadRequestException('Saldo tidak mencukupi');

    this.logger.log(`[SIMULATION] Requesting withdrawal of ${data.amount} to ${data.bankName}...`);
    
    const wr = await this.prisma.withdrawalRequest.create({
      data: {
        communityId: pocket.communityId,
        pocketId: pocket.id,
        userId: createdById,
        amount: BigInt(data.amount),
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        status: 'pending',
      }
    });

    // 2. MOCK: Call Midtrans IRIS API
    await new Promise(resolve => setTimeout(resolve, 2000)); // simulate network delay

    // 3. Mark as transferred & deduct balance via transaction
    await this.prisma.withdrawalRequest.update({ where: { id: wr.id }, data: { status: 'transferred', processedAt: new Date() } });
    
    const txn = await this.recordTransaction(pocketId, createdById, {
      amount: data.amount,
      direction: 'out',
      category: 'withdrawal',
      note: `Pencairan dana ke ${data.bankName} - ${data.accountNumber} A/N ${data.accountHolder}`
    });

    return { message: 'Withdrawal successful', withdrawalId: wr.id, transactionId: txn.id };
  }

  getPendingWithdrawals(communityId: string) {
    this.logger.debug(`Fetching pending withdrawals for community ${communityId}`);
    return this.prisma.withdrawalRequest.findMany({
      where: { communityId, status: 'pending' },
      include: {
        user: { select: { id: true, name: true } },
        pocket: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveWithdrawal(communityId: string, id: string, adminId: string) {
    const wr = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!wr) throw new NotFoundException('Withdrawal request not found');
    if (wr.communityId !== communityId) throw new ForbiddenException('Withdrawal does not belong to this community');
    if (wr.status !== 'pending') throw new BadRequestException('Withdrawal is not pending');
    if (!wr.pocketId) throw new BadRequestException('Withdrawal is not associated with a pocket');

    const pocketId = wr.pocketId;
    const pocket = await this.findOne(pocketId);
    if (pocket.balance < wr.amount) {
      throw new BadRequestException('Saldo dompet tidak mencukupi untuk pencairan ini');
    }

    this.logger.log(`Approving withdrawal ${id} by admin ${adminId}`);

    // Update status
    await this.prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'approved', processedAt: new Date() },
    });

    // Record out transaction (this will trigger trigger_update_pocket_balance in postgres)
    const txn = await this.recordTransaction(pocketId, adminId, {
      amount: Number(wr.amount),
      direction: 'out',
      category: 'withdrawal',
      note: wr.note || `Pencairan dana ke ${wr.bankName}`,
      memberId: wr.userId,
    });

    return { message: 'Withdrawal approved', transactionId: txn.id };
  }
}
