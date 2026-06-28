import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ArisanService } from './arisan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('arisan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pockets/:pocketId/arisan')
export class ArisanController {
  constructor(private svc: ArisanService, private prisma: PrismaService) {}

  @Get('participants')
  participants(@Param('pocketId') pocketId: string) {
    return this.svc.getParticipants(pocketId);
  }

  @ApiBody({ schema: { type: 'object', example: { memberId: 'member_12345' } } })
  @Post('participants')
  async addParticipant(@Param('pocketId') pocketId: string, @Request() req: any, @Body() body: any) {
    const pocket = await this.prisma.pocket.findUnique({ where: { id: pocketId } });
    return this.svc.addParticipant(pocketId, pocket!.communityId, body.memberId);
  }

  @Get('periods')
  periods(@Param('pocketId') pocketId: string) {
    return this.svc.getPeriods(pocketId);
  }

  @Post('draw')
  async draw(@Param('pocketId') pocketId: string, @Request() req: any) {
    const pocket = await this.prisma.pocket.findUnique({ where: { id: pocketId } });
    return this.svc.draw(pocketId, pocket!.communityId, req.user.id);
  }
}


