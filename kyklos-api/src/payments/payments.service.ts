import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// ponytail: require() because midtrans-client has no proper ESM export
const MidtransClient = require('midtrans-client');

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async getSnap(communityId: string) {
    const cfg = await this.prisma.paymentConfig.findUnique({ where: { communityId } });
    if (!cfg || cfg.method !== 'gateway' || cfg.gatewayProvider !== 'midtrans') {
      throw new BadRequestException('Midtrans not configured for this community');
    }
    if (!cfg.gatewayCredentials) throw new BadRequestException('Missing gateway credentials');

    const creds = JSON.parse(cfg.gatewayCredentials);
    return new MidtransClient.Snap({
      isProduction: false, // sandbox always
      serverKey: creds.serverKey,
      clientKey: creds.clientKey,
    });
  }

  async createTransaction(contributionId: string, userId: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id: contributionId },
      include: { member: { select: { name: true, email: true } }, schedule: { select: { title: true } } },
    });
    if (!contribution) throw new BadRequestException('Contribution not found');
    if (contribution.memberId !== userId) throw new BadRequestException('Not your contribution');
    if (contribution.status === 'paid') throw new BadRequestException('Already paid');

    const snap = await this.getSnap(contribution.communityId);

    const parameter = {
      transaction_details: {
        order_id: `kyklos-${contributionId}-${Date.now()}`,
        gross_amount: Number(contribution.amount),
      },
      customer_details: {
        first_name: contribution.member.name ?? 'Member',
        email: contribution.member.email,
      },
      item_details: [{
        id: contributionId,
        name: contribution.schedule?.title ?? 'Iuran Komunitas',
        price: Number(contribution.amount),
        quantity: 1,
      }],
    };

    const token = await snap.createTransactionToken(parameter);

    // Mark pending_verify while awaiting Midtrans callback
    await this.prisma.contribution.update({
      where: { id: contributionId },
      data: { status: 'pending_verify' },
    });

    return { token, clientKey: JSON.parse((await this.prisma.paymentConfig.findUnique({ where: { communityId: contribution.communityId } }))!.gatewayCredentials!).clientKey };
  }

  async handleNotification(body: any) {
    // Midtrans sends webhook; we verify and mark paid
    const cfg = await this.prisma.paymentConfig.findFirst({ where: { method: 'gateway', gatewayProvider: 'midtrans' } });
    if (!cfg?.gatewayCredentials) return;

    const creds = JSON.parse(cfg.gatewayCredentials);
    const core = new MidtransClient.CoreApi({ isProduction: false, serverKey: creds.serverKey });
    const status = await core.transaction.notification(body);

    if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
      // order_id format: kyklos-{contributionId}-{timestamp}
      const parts = (status.order_id as string).split('-');
      const contributionId = parts[1];

      const contribution = await this.prisma.contribution.findUnique({
        where: { id: contributionId },
        include: { schedule: true },
      });
      if (!contribution || contribution.status === 'paid') return;

      const pocketId = contribution.schedule?.pocketId;
      if (!pocketId) return;

      const txn = await this.prisma.transaction.create({
        data: {
          communityId: contribution.communityId,
          pocketId,
          memberId: contribution.memberId,
          amount: contribution.amount,
          direction: 'in',
          category: 'dues',
          note: 'Dibayar via Midtrans',
          status: 'confirmed',
        },
      });

      await this.prisma.contribution.update({
        where: { id: contributionId },
        data: { status: 'paid', paidAt: new Date(), transactionId: txn.id },
      });
    }
  }

  async getPaymentConfig(communityId: string) {
    const cfg = await this.prisma.paymentConfig.findUnique({ where: { communityId } });
    if (!cfg) return null;
    // Never expose gatewayCredentials
    const { gatewayCredentials: _, ...safe } = cfg;
    return safe;
  }

  async updatePaymentConfig(communityId: string, data: {
    method?: 'manual_transfer' | 'gateway';
    bankName?: string; accountNumber?: string; accountHolder?: string;
    gatewayProvider?: 'midtrans' | 'xendit';
    serverKey?: string; clientKey?: string;
  }) {
    const { serverKey, clientKey, ...rest } = data;
    const gatewayCredentials = serverKey ? JSON.stringify({ serverKey, clientKey }) : undefined;

    return this.prisma.paymentConfig.upsert({
      where: { communityId },
      create: { communityId, ...rest, ...(gatewayCredentials ? { gatewayCredentials } : {}) },
      update: { ...rest, ...(gatewayCredentials ? { gatewayCredentials } : {}) },
    });
  }
}
