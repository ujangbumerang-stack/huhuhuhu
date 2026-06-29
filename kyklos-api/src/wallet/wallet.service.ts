import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const MidtransClient = require('midtrans-client');

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  // Ambil atau buat balance user
  async getBalance(userId: string) {
    const b = await this.prisma.userBalance.upsert({
      where: { userId },
      create: { userId, balance: 0n },
      update: {},
    });
    return { balance: b.balance.toString() };
  }

  // Riwayat top up user
  getTopUps(userId: string) {
    return this.prisma.topUp.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // Buat TopUp langsung sukses — simulasi bank asli tanpa Midtrans
  async createTopUp(userId: string, amount: number) {
    if (amount < 10000) throw new BadRequestException('Minimal top up Rp10.000');

    const orderId = `topup-${userId.slice(0, 8)}-${Date.now()}`;

    const [topUp] = await this.prisma.$transaction([
      this.prisma.topUp.create({
        data: { userId, amount: BigInt(amount), orderId, snapToken: '', status: 'paid' },
      }),
      this.prisma.userBalance.upsert({
        where: { userId },
        create: { userId, balance: BigInt(amount) },
        update: { balance: { increment: BigInt(amount) } },
      }),
    ]);

    this.logger.log(`TopUp success (Simulated): user=${userId} amount=${amount} orderId=${orderId}`);
    return { token: null, clientKey: null, topUpId: topUp.id };
  }

  // Webhook Midtrans untuk top up
  async handleTopUpNotification(body: any) {
    this.logger.log(`TopUp webhook: order_id=${body?.order_id} status=${body?.transaction_status}`);

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) { this.logger.warn('No MIDTRANS_SERVER_KEY'); return; }

    const core = new MidtransClient.CoreApi({ isProduction: false, serverKey });
    let status: any;
    try { status = await core.transaction.notification(body); }
    catch (err) { this.logger.error(`TopUp notification verify failed: ${err}`); return; }

    if (status.transaction_status !== 'settlement' && status.transaction_status !== 'capture') {
      this.logger.debug(`TopUp status ${status.transaction_status} — no action`);
      return;
    }

    const topUp = await this.prisma.topUp.findUnique({ where: { orderId: status.order_id } });
    if (!topUp) { this.logger.warn(`TopUp not found: ${status.order_id}`); return; }
    if (topUp.status === 'paid') { this.logger.warn(`TopUp ${topUp.id} already paid`); return; }

    // Credit balance user (atomic)
    await this.prisma.$transaction([
      this.prisma.topUp.update({ where: { id: topUp.id }, data: { status: 'paid' } }),
      this.prisma.userBalance.upsert({
        where: { userId: topUp.userId },
        create: { userId: topUp.userId, balance: topUp.amount },
        update: { balance: { increment: topUp.amount } },
      }),
    ]);

    this.logger.log(`TopUp settled: user=${topUp.userId} amount=${topUp.amount} → balance credited`);
  }

  // Bayar iuran dari saldo pribadi
  async payFromBalance(contributionId: string, userId: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id: contributionId },
      include: { schedule: true },
    });
    if (!contribution) throw new BadRequestException('Contribution not found');
    if (contribution.memberId !== userId) throw new BadRequestException('Bukan iuranmu');
    if (contribution.status === 'paid') throw new BadRequestException('Sudah lunas');

    const balance = await this.prisma.userBalance.findUnique({ where: { userId } });
    if (!balance || balance.balance < contribution.amount) {
      throw new BadRequestException('Saldo tidak cukup. Silakan top up terlebih dahulu.');
    }

    const pocketId = contribution.schedule?.pocketId;
    if (!pocketId) throw new BadRequestException('Iuran tidak terhubung ke kas');

    // Atomic: debit balance + buat transaksi + mark paid + increment pocket balance
    const [, , txn] = await this.prisma.$transaction([
      this.prisma.userBalance.update({
        where: { userId },
        data: { balance: { decrement: contribution.amount } },
      }),
      this.prisma.contribution.update({
        where: { id: contributionId },
        data: { status: 'paid', paidAt: new Date() },
      }),
      this.prisma.transaction.create({
        data: {
          communityId: contribution.communityId,
          pocketId,
          memberId: userId,
          amount: contribution.amount,
          direction: 'in',
          category: 'dues',
          note: 'Dibayar dari saldo Kyklos',
          status: 'confirmed',
        },
      }),
      this.prisma.pocket.update({
        where: { id: pocketId },
        data: { balance: { increment: contribution.amount } },
      })
    ]);

    // Link transaction ke contribution
    await this.prisma.contribution.update({ where: { id: contributionId }, data: { transactionId: txn.id } });

    this.logger.log(`Pay from balance: contribution=${contributionId} user=${userId} amount=${contribution.amount} → pocket=${pocketId}`);
    return { ok: true };
  }

  // Request penarikan saldo
  async requestWithdrawal(userId: string, data: {
    amount: number; bankName: string; accountNumber: string; accountHolder: string;
  }) {
    if (data.amount < 10000) throw new BadRequestException('Minimal tarik Rp10.000');

    const balance = await this.prisma.userBalance.findUnique({ where: { userId } });
    if (!balance || balance.balance < BigInt(data.amount)) {
      throw new BadRequestException('Saldo tidak cukup');
    }

    // Hold saldo (debit dulu, refund kalau ditolak)
    const [withdrawal] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.create({
        data: { userId, amount: BigInt(data.amount), bankName: data.bankName, accountNumber: data.accountNumber, accountHolder: data.accountHolder },
      }),
      this.prisma.userBalance.update({
        where: { userId },
        data: { balance: { decrement: BigInt(data.amount) } },
      }),
    ]);

    this.logger.log(`Withdrawal requested: user=${userId} amount=${data.amount} bank=${data.bankName}`);
    return withdrawal;
  }

  // Riwayat withdrawal user
  getWithdrawals(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: list semua pending withdrawal
  getAllWithdrawals(status?: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status: status as any } : {},
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: approve atau reject withdrawal
  async processWithdrawal(id: string, action: 'approved' | 'rejected', note?: string) {
    const wr = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!wr) throw new BadRequestException('Withdrawal not found');
    if (wr.status !== 'pending') throw new BadRequestException('Sudah diproses');

    if (action === 'rejected') {
      // Refund saldo
      await this.prisma.$transaction([
        this.prisma.withdrawalRequest.update({ where: { id }, data: { status: 'rejected', note, processedAt: new Date() } }),
        this.prisma.userBalance.update({ where: { userId: wr.userId }, data: { balance: { increment: wr.amount } } }),
      ]);
      this.logger.log(`Withdrawal rejected: id=${id} user=${wr.userId} → saldo refunded`);
    } else {
      await this.prisma.withdrawalRequest.update({ where: { id }, data: { status: 'transferred', note, processedAt: new Date() } });
      this.logger.log(`Withdrawal approved/transferred: id=${id} user=${wr.userId} amount=${wr.amount}`);
    }

    return { ok: true };
  }
}
