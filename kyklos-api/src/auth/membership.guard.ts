import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Verifies the JWT user is an active member of :communityId
@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const communityId = req.params.communityId || req.params.id;
    const userId = req.user?.id;

    if (!communityId || !userId) throw new ForbiddenException();

    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!m || m.status !== 'active') throw new ForbiddenException('Not a member of this community');

    req.membership = m;
    return true;
  }
}
