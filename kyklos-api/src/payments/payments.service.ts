import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const MidtransClient = require('midtrans-client');

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  private async getSnap(communityId: string) {
    const cfg = await this.prisma.paymentConfig.findUnique({ where: { communityId } });
    if (!cfg || cfg.method !== 'gateway' || cfg.gatewayProvider !== 'midtrans') {
      throw new BadRequestException('Midtrans not configured for this community');
    }
    if (!cfg.gatewayCredentials) throw new BadRequestException('Missing gateway credentials');
    const creds = JSON.parse(cfg.gatewayCredentials);
    return { snap: new MidtransClient.Snap({ isProduction: false, serverKey: creds.serverKey, clientKey: creds.clientKey }), clientKey: creds.clientKey };
  }

  async createTransaction(contributionId: string, userId: string) {
    this.logger.log(`Midtrans Snap: creating token for contribution=${contributionId} user=${userId}`);
    const contribution = await this.prisma.contribution.findUnique({
      where: { id: contributionId },
      include: { member: { select: { name: true, email: true } }, schedule: { select: { title: true } } },
    });
    if (!contribution) throw new BadRequestException('Contribution not found');
    if (contribution.memberId !== userId) throw new BadRequestException('Not your contribution');
    if (contribution.status === 'paid') throw new BadRequestException('Already paid');

    const { snap, clientKey } = await this.getSnap(contribution.communityId);
    const orderId = `kyklos-${contributionId}-${Date.now()}`;

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: Number(contribution.amount) },
      customer_details: { first_name: contribution.member.name ?? 'Member', email: contribution.member.email },
      item_details: [{ id: contributionId, name: contribution.schedule?.title ?? 'Iuran Komunitas', price: Number(contribution.amount), quantity: 1 }],
    };

    const token = await snap.createTransactionToken(parameter);
    this.logger.log(`Snap token created: orderId=${orderId} contribution=${contributionId}`);

    await this.prisma.contribution.update({ where: { id: contributionId }, data: { status: 'pending_verify' } });
    return { token, clientKey };
  }

  async handleNotification(body: any) {
    this.logger.log(`Midtrans webhook received: order_id=${body?.order_id} status=${body?.transaction_status}`);

    const cfg = await this.prisma.paymentConfig.findFirst({ where: { method: 'gateway', gatewayProvider: 'midtrans' } });
    if (!cfg?.gatewayCredentials) {
      this.logger.warn('Webhook received but no Midtrans config found');
      return;
    }

    const creds = JSON.parse(cfg.gatewayCredentials);
    const core = new MidtransClient.CoreApi({ isProduction: false, serverKey: creds.serverKey });

    let status: any;
    try {
      status = await core.transaction.notification(body);
    } catch (err) {
      this.logger.error(`Midtrans notification verification failed: ${err}`);
      return;
    }

    this.logger.log(`Midtrans notification verified: order_id=${status.order_id} status=${status.transaction_status}`);

    if (status.transaction_status === 'settlement' || status.transaction_status === 'capture') {
      const orderId = status.order_id as string;
      const withoutPrefix = orderId.replace(/^kyklos-/, '');
      const contributionId = withoutPrefix.replace(/-\d+$/, '');

      this.logger.log(`Processing settlement for contribution=${contributionId}`);

      const contribution = await this.prisma.contribution.findUnique({
        where: { id: contributionId },
        include: { schedule: true },
      });

      if (!contribution) {
        this.logger.warn(`Contribution not found for order_id=${orderId}`);
        return;
      }
      if (contribution.status === 'paid') {
        this.logger.warn(`Contribution ${contributionId} already paid — skipping`);
        return;
      }

      const pocketId = contribution.schedule?.pocketId;
      if (!pocketId) {
        this.logger.error(`No pocket linked to contribution ${contributionId}`);
        return;
      }

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

      this.logger.log(`Payment settled: contribution=${contributionId} → transaction=${txn.id} pocket=${pocketId}`);
    } else {
      this.logger.debug(`Midtrans status ${status.transaction_status} — no action taken`);
    }
  }

  async getPaymentConfig(communityId: string) {
    const cfg = await this.prisma.paymentConfig.findUnique({ where: { communityId } });
    if (!cfg) return null;
    const { gatewayCredentials: _, ...safe } = cfg;
    return safe;
  }

  async updatePaymentConfig(communityId: string, data: {
    method?: 'manual_transfer' | 'gateway';
    bankName?: string; accountNumber?: string; accountHolder?: string;
    gatewayProvider?: 'midtrans' | 'xendit';
    serverKey?: string; clientKey?: string;
  }) {
    this.logger.log(`Updating payment config for community ${communityId}: method=${data.method}`);
    const { serverKey, clientKey, ...rest } = data;
    const gatewayCredentials = serverKey ? JSON.stringify({ serverKey, clientKey }) : undefined;
    return this.prisma.paymentConfig.upsert({
      where: { communityId },
      create: { communityId, ...rest, ...(gatewayCredentials ? { gatewayCredentials } : {}) },
      update: { ...rest, ...(gatewayCredentials ? { gatewayCredentials } : {}) },
    });
  }
}
