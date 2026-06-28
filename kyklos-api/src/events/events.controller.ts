import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MembershipGuard } from "../auth/membership.guard";
import { AdminGuard } from "../auth/admin.guard";

@ApiTags("events")
@Controller()
export class EventsController {
  constructor(private svc: EventsService) {}

  @Get("events/public")
  listPublic() { return this.svc.listPublic(); }

  @Get("events/public/:id")
  getPublic(@Param("id") id: string) { return this.svc.getPublic(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MembershipGuard)
  @Get("communities/:communityId/events")
  list(@Param("communityId") communityId: string) { return this.svc.list(communityId); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBody({ schema: { type: 'object', example: { title: 'Kopdar Rutin', description: 'Kumpul bulanan', date: '2026-08-01T10:00:00Z', location: 'Cafe A', isOnline: false } } })
  @Post("communities/:communityId/events")
  create(@Param("communityId") communityId: string, @Request() req: any, @Body() body: any) {
    return this.svc.create(communityId, req.user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBody({ schema: { type: 'object', example: { title: 'Kopdar Rutin (Updated)', location: 'Cafe B' } } })
  @Patch("events/:id")
  update(@Param("id") id: string, @Body() body: any) { return this.svc.update(id, body); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete("events/:id")
  @HttpCode(204)
  delete(@Param("id") id: string) { return this.svc.delete(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("events/:id/rsvps")
  getRsvps(@Param("id") id: string) { return this.svc.getRsvps(id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { status: 'going' } } })
  @Post("events/:id/rsvp")
  rsvp(@Param("id") id: string, @Request() req: any, @Body() body: any) {
    return this.svc.rsvp(id, req.user.id, body.status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("events/:id/join")
  requestJoin(@Param("id") id: string, @Request() req: any) { return this.svc.requestJoin(id, req.user.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("events/:id/my-join-request")
  myJoinRequest(@Param("id") id: string, @Request() req: any) { return this.svc.getMyJoinRequest(id, req.user.id); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get("communities/:communityId/join-requests")
  joinRequests(@Param("communityId") communityId: string) { return this.svc.getJoinRequests(communityId); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ schema: { type: 'object', example: { action: 'accepted' } } })
  @Post("join-requests/:id/process")
  processJoin(@Param("id") id: string, @Request() req: any, @Body() body: { action: "accepted" | "rejected" }) {
    return this.svc.processJoinRequest(id, body.action, req.user.id);
  }
}
