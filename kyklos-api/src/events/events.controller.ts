import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EventsController {
  constructor(private svc: EventsService) {}

  @Get('communities/:communityId/events')
  @UseGuards(MembershipGuard)
  list(@Param('communityId') communityId: string) {
    return this.svc.list(communityId);
  }

  @Post('communities/:communityId/events')
  @UseGuards(AdminGuard)
  create(@Param('communityId') communityId: string, @Request() req: any, @Body() body: any) {
    return this.svc.create(communityId, req.user.id, body);
  }

  @Post('events/:id/rsvp')
  rsvp(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.svc.rsvp(id, req.user.id, body.status);
  }
}
