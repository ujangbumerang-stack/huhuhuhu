import { Body, Controller, Get, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('wallet')
@Controller()
export class WalletController {
  constructor(private svc: WalletService) {}

  // ── USER ENDPOINTS (require login) ───────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('wallet/balance')
  getBalance(@Request() req: any) {
    return this.svc.getBalance(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('wallet/topups')
  getTopUps(@Request() req: any) {
    return this.svc.getTopUps(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { amount: 100000 } } })
  @Post('wallet/topup')
  createTopUp(@Request() req: any, @Body() body: { amount: number }) {
    return this.svc.createTopUp(req.user.id, body.amount);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('contributions/:id/pay-balance')
  payFromBalance(@Param('id') id: string, @Request() req: any) {
    return this.svc.payFromBalance(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { amount: 50000, bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'Fadel' } } })
  @Post('wallet/withdraw')
  withdraw(@Request() req: any, @Body() body: { amount: number; bankName: string; accountNumber: string; accountHolder: string }) {
    return this.svc.requestWithdrawal(req.user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('wallet/withdrawals')
  getWithdrawals(@Request() req: any) {
    return this.svc.getWithdrawals(req.user.id);
  }

  // ── WEBHOOK (no auth, called by Midtrans) ────────────────────────

  @Post('wallet/topup/notify')
  @HttpCode(200)
  async notify(@Body() body: any) {
    await this.svc.handleTopUpNotification(body);
    return { ok: true };
  }

  // ── SUPER ADMIN (simple: any logged-in admin — for hackathon) ────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/withdrawals')
  adminListWithdrawals(@Query('status') status?: string) {
    return this.svc.getAllWithdrawals(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { action: 'approved', note: 'Oke' } } })
  @Post('admin/withdrawals/:id/process')
  adminProcess(@Param('id') id: string, @Body() body: { action: 'approved' | 'rejected'; note?: string }) {
    return this.svc.processWithdrawal(id, body.action, body.note);
  }
}
