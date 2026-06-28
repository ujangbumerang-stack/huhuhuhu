import { Body, Controller, Get, HttpCode, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('payments')
@Controller()
export class PaymentsController {
  constructor(private svc: PaymentsService) { }

  // Member: get payment config (no credentials exposed)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('communities/:communityId/payment-config')
  getConfig(@Param('communityId') communityId: string) {
    return this.svc.getPaymentConfig(communityId);
  }

  // Admin: update payment config
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBody({ schema: { type: 'object', example: { serverKey: 'MidtransServerKey', clientKey: 'MidtransClientKey' } } })
  @Put('communities/:communityId/payment-config')
  updateConfig(@Param('communityId') communityId: string, @Body() body: any) {
    return this.svc.updatePaymentConfig(communityId, body);
  }

  // Member: create Midtrans Snap token for a contribution
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('contributions/:id/pay')
  pay(@Param('id') id: string, @Request() req: any) {
    return this.svc.createTransaction(id, req.user.id);
  }

  // Midtrans webhook — no auth (Midtrans calls this directly)
  @ApiBody({ schema: { type: 'object', example: { transaction_id: 'abc', transaction_status: 'settlement' } } })
  @Post('payments/midtrans/notify')
  @HttpCode(200)
  async notify(@Body() body: any) {
    await this.svc.handleNotification(body);
    return { ok: true };
  }
}
