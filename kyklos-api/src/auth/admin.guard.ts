import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Verifies the JWT user is an admin of the community
// Supports: req.params.communityId, or looks up communityId from event/pocket by req.params.id
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException();

    // Try direct communityId from params first
    let communityId = req.params.communityId;

    // If not found, try to resolve from event or pocket by :id param
    if (!communityId && req.params.id) {
      const entityId = req.params.id;
      const event = await this.prisma.event.findUnique({ where: { id: entityId }, select: { communityId: true } }).catch(() => null);
      if (event) {
        communityId = event.communityId;
      } else {
        const pocket = await this.prisma.pocket.findUnique({ where: { id: entityId }, select: { communityId: true } }).catch(() => null);
        if (pocket) communityId = pocket.communityId;
      }
    }

    if (!communityId) throw new ForbiddenException('Could not determine community');

    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!m || m.status !== 'active' || m.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    req.membership = m;
    return true;
  }
}
