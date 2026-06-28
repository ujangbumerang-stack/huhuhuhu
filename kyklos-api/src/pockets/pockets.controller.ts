import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PocketsService } from './pockets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('pockets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PocketsController {
  constructor(private svc: PocketsService, private prisma: PrismaService) {}

  @Get('communities/:communityId/pockets')
  @UseGuards(MembershipGuard)
  list(@Param('communityId') communityId: string) {
    return this.svc.list(communityId);
  }

  @ApiBody({ schema: { type: 'object', example: { name: 'Kas Liburan', description: 'Untuk jalan-jalan akhir tahun', type: 'KAS' } } })
  @Post('communities/:communityId/pockets')
  @UseGuards(AdminGuard)
  create(@Param('communityId') communityId: string, @Body() body: any) {
    return this.svc.create(communityId, body);
  }

  @Get('pockets/:id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active') return null;
    return pocket;
  }

  @Delete('pockets/:id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.role !== 'admin') throw new Error('Admin access required');
    return this.svc.delete(id);
  }

  @Get('pockets/:id/transactions')
  async getTransactions(@Param('id') id: string, @Request() req: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active') return [];
    return this.svc.getTransactions(id);
  }

  @ApiBody({ schema: { type: 'object', example: { amount: 50000, type: 'in', description: 'Nabung' } } })
  @Post('pockets/:id/transactions')
  async recordTransaction(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active' || m.role !== 'admin') throw new Error('Admin access required');
    return this.svc.recordTransaction(id, req.user.id, body);
  }

  @ApiBody({ schema: { type: 'object', example: { amount: 100000, note: 'Tarik dana', bankName: 'BCA', accountNumber: '123456', accountHolder: 'Fadel' } } })
  @Post('pockets/:id/withdraw')
  async withdraw(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active' || m.role !== 'admin') throw new Error('Admin access required');
    return this.svc.requestWithdrawal(id, req.user.id, body);
  }

  @Get('communities/:communityId/withdrawals')
  @UseGuards(AdminGuard)
  getWithdrawals(@Param('communityId') communityId: string) {
    return this.svc.getPendingWithdrawals(communityId);
  }

  @Post('communities/:communityId/withdrawals/:id/approve')
  @UseGuards(AdminGuard)
  approveWithdrawal(@Param('communityId') communityId: string, @Param('id') id: string, @Request() req: any) {
    return this.svc.approveWithdrawal(communityId, id, req.user.id);
  }
}
