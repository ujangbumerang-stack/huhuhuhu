import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  private readonly logger = new Logger(CommunitiesService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; slug?: string; description?: string; logoUrl?: string; themeColor?: string }) {
    this.logger.log(`Creating community "${data.name}" by user ${userId}`);
    const community = await this.prisma.community.create({ data: { ...data, createdById: userId } });
    await this.prisma.membership.create({ data: { communityId: community.id, userId, role: 'admin', status: 'active' } });
    await this.prisma.paymentConfig.create({ data: { communityId: community.id } });
    this.logger.log(`Community created: ${community.id} (${community.slug})`);
    return community;
  }

  findMine(userId: string) {
    this.logger.debug(`Fetching communities for user ${userId}`);
    return this.prisma.community.findMany({
      where: { memberships: { some: { userId, status: 'active' } } },
      include: { _count: { select: { memberships: true } } },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.community.findUnique({
      where: { id },
      include: { 
        paymentConfig: { select: { method: true, bankName: true, accountNumber: true, accountHolder: true, isActive: true } },
        _count: { select: { memberships: { where: { status: 'active' } } } }
      },
    });
    if (!c) {
      this.logger.warn(`Community not found: ${id}`);
      throw new NotFoundException('Community not found');
    }
    return c;
  }

  async findBySlug(slug: string) {
    const c = await this.prisma.community.findUnique({ 
      where: { slug },
      include: {
        _count: { select: { memberships: { where: { status: 'active' } } } }
      }
    });
    if (!c) {
      this.logger.warn(`Community not found by slug: ${slug}`);
      throw new NotFoundException('Community not found');
    }
    return c;
  }

  async update(id: string, data: Partial<{ name: string; description: string; logoUrl: string; themeColor: string }>) {
    this.logger.log(`Updating community ${id}: ${JSON.stringify(Object.keys(data))}`);
    return this.prisma.community.update({ where: { id }, data });
  }

  getMembers(communityId: string) {
    this.logger.debug(`Fetching members for community ${communityId}`);
    return this.prisma.membership.findMany({
      where: { communityId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async addMember(communityId: string, data: { userId?: string; email?: string; role?: 'admin' | 'member' }) {
    let uid = data.userId;
    if (!uid && data.email) {
      const user = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (!user) {
        this.logger.warn(`Add member failed — no user with email: ${data.email}`);
        throw new BadRequestException(`No user found with email ${data.email}`);
      }
      uid = user.id;
    }
    if (!uid) throw new BadRequestException('userId or email required');
    this.logger.log(`Adding user ${uid} to community ${communityId} as ${data.role ?? 'member'}`);
    return this.prisma.membership.upsert({
      where: { communityId_userId: { communityId, userId: uid } },
      create: { communityId, userId: uid, role: data.role ?? 'member', status: 'active' },
      update: { status: 'active', role: data.role ?? 'member' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  removeMember(communityId: string, membershipId: string) {
    this.logger.log(`Removing membership ${membershipId} from community ${communityId}`);
    return this.prisma.membership.update({
      where: { id: membershipId, communityId },
      data: { status: 'inactive' },
    });
  }

  searchUsers(q: string) {
    this.logger.debug(`Searching users: "${q}"`);
    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true, name: true, avatarUrl: true },
      take: 10,
    });
  }

  join(communityId: string, userId: string) {
    this.logger.log(`User ${userId} joining community ${communityId}`);
    return this.prisma.membership.upsert({
      where: { communityId_userId: { communityId, userId } },
      create: { communityId, userId, role: 'member', status: 'active' },
      update: { status: 'active' },
    });
  }

  updateMember(communityId: string, membershipId: string, data: { role?: 'admin' | 'member'; status?: 'active' | 'inactive' }) {
    this.logger.log(`Updating membership ${membershipId} in community ${communityId}: ${JSON.stringify(data)}`);
    return this.prisma.membership.update({ where: { id: membershipId, communityId }, data });
  }
}
