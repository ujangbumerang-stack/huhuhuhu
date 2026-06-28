import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const [sari, budi, dewi, agus] = await Promise.all([
    prisma.user.upsert({ where: { email: 'sari@demo.test' }, update: {}, create: { email: 'sari@demo.test', passwordHash: await hash('password123'), name: 'Sari Utami' } }),
    prisma.user.upsert({ where: { email: 'budi@demo.test' }, update: {}, create: { email: 'budi@demo.test', passwordHash: await hash('password123'), name: 'Budi Santoso' } }),
    prisma.user.upsert({ where: { email: 'dewi@demo.test' }, update: {}, create: { email: 'dewi@demo.test', passwordHash: await hash('password123'), name: 'Dewi Rahayu' } }),
    prisma.user.upsert({ where: { email: 'agus@demo.test' }, update: {}, create: { email: 'agus@demo.test', passwordHash: await hash('password123'), name: 'Agus Permana' } }),
  ]);

  let community = await prisma.community.findUnique({ where: { slug: 'arisan-rw05' } });
  if (!community) {
    community = await prisma.community.create({
      data: { name: 'Arisan RW 05', slug: 'arisan-rw05', description: 'Komunitas warga RW 05 Kelurahan Menteng', themeColor: '#16a34a', createdById: sari.id },
    });
  }

  // Memberships
  await Promise.all([
    prisma.membership.upsert({ where: { communityId_userId: { communityId: community.id, userId: sari.id } }, update: {}, create: { communityId: community.id, userId: sari.id, role: 'admin', status: 'active' } }),
    prisma.membership.upsert({ where: { communityId_userId: { communityId: community.id, userId: budi.id } }, update: {}, create: { communityId: community.id, userId: budi.id, role: 'member', status: 'active' } }),
    prisma.membership.upsert({ where: { communityId_userId: { communityId: community.id, userId: dewi.id } }, update: {}, create: { communityId: community.id, userId: dewi.id, role: 'member', status: 'active' } }),
    prisma.membership.upsert({ where: { communityId_userId: { communityId: community.id, userId: agus.id } }, update: {}, create: { communityId: community.id, userId: agus.id, role: 'member', status: 'active' } }),
  ]);

  // Payment config
  await prisma.paymentConfig.upsert({
    where: { communityId: community.id },
    update: {},
    create: { communityId: community.id, method: 'manual_transfer', bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'Sari Utami' },
  });

  // Pockets
  let kasRw = await prisma.pocket.findFirst({ where: { communityId: community.id, name: 'Kas RW' } });
  let arisanPocket = await prisma.pocket.findFirst({ where: { communityId: community.id, name: 'Arisan Bulanan' } });

  if (!kasRw) kasRw = await prisma.pocket.create({ data: { communityId: community.id, name: 'Kas RW', description: 'Kas Umum (Treasury)', type: 'KAS' } });
  if (!arisanPocket) arisanPocket = await prisma.pocket.create({ data: { communityId: community.id, name: 'Arisan Bulanan', description: 'Arisan', type: 'ARISAN' } });

  // Transactions (trigger will update balance)
  const txnCount = await prisma.transaction.count({ where: { pocketId: kasRw.id } });
  if (txnCount === 0) {
    await prisma.transaction.createMany({
      data: [
        { communityId: community.id, pocketId: kasRw.id, memberId: budi.id, amount: BigInt(50000), direction: 'in', category: 'dues', note: 'Iuran Juni - Budi', status: 'confirmed', createdById: sari.id },
        { communityId: community.id, pocketId: kasRw.id, memberId: dewi.id, amount: BigInt(50000), direction: 'in', category: 'dues', note: 'Iuran Juni - Dewi', status: 'confirmed', createdById: sari.id },
        { communityId: community.id, pocketId: kasRw.id, memberId: agus.id, amount: BigInt(50000), direction: 'in', category: 'dues', note: 'Iuran Juni - Agus', status: 'confirmed', createdById: sari.id },
        { communityId: community.id, pocketId: kasRw.id, amount: BigInt(30000), direction: 'out', category: 'operational', note: 'Beli ATK dan bahan rapat', status: 'confirmed', createdById: sari.id },
      ],
    });
  }

  // Dues schedule
  let schedule = await prisma.duesSchedule.findFirst({ where: { communityId: community.id } });
  if (!schedule) {
    schedule = await prisma.duesSchedule.create({
      data: { communityId: community.id, pocketId: kasRw.id, title: 'Iuran Bulanan RW', amount: BigInt(50000), period: 'monthly' },
    });
  }

  // Contributions
  const contribCount = await prisma.contribution.count({ where: { communityId: community.id } });
  if (contribCount === 0) {
    await prisma.contribution.createMany({
      data: [
        { communityId: community.id, scheduleId: schedule.id, memberId: budi.id, amount: BigInt(50000), status: 'paid', paidAt: new Date() },
        { communityId: community.id, scheduleId: schedule.id, memberId: dewi.id, amount: BigInt(50000), status: 'paid', paidAt: new Date() },
        { communityId: community.id, scheduleId: schedule.id, memberId: agus.id, amount: BigInt(50000), status: 'pending_verify' },
        { communityId: community.id, scheduleId: schedule.id, memberId: sari.id, amount: BigInt(50000), status: 'unpaid' },
      ],
    });
  }

  // Arisan participants
  for (const [i, user] of [budi, dewi, agus, sari].entries()) {
    await prisma.arisanParticipant.upsert({
      where: { pocketId_memberId: { pocketId: arisanPocket.id, memberId: user.id } },
      update: {},
      create: { communityId: community.id, pocketId: arisanPocket.id, memberId: user.id, joinOrder: i + 1, hasReceived: user.id === dewi.id },
    });
  }

  const periodCount = await prisma.arisanPeriod.count({ where: { pocketId: arisanPocket.id } });
  if (periodCount === 0) {
    await prisma.arisanPeriod.create({
      data: { communityId: community.id, pocketId: arisanPocket.id, roundNo: 1, recipientMemberId: dewi.id, status: 'drawn', periodDate: new Date('2026-06-01') },
    });
  }

  // Forum post + event
  const postCount = await prisma.post.count({ where: { communityId: community.id } });
  if (postCount === 0) {
    await prisma.post.create({
      data: { communityId: community.id, authorId: sari.id, isAnnouncement: true, body: '📢 Rapat RW akan diadakan Sabtu 5 Juli 2026 pukul 09.00 di Balai RW. Mohon kehadiran semua warga!' },
    });
  }

  const eventCount = await prisma.event.count({ where: { communityId: community.id } });
  if (eventCount === 0) {
    const event = await prisma.event.create({
      data: { communityId: community.id, createdById: sari.id, title: 'Rapat Bulanan RW 05', location: 'Balai RW 05', eventDate: new Date('2026-07-05T09:00:00'), description: 'Rapat rutin bulanan warga RW 05' },
    });
    await prisma.rsvp.createMany({
      data: [
        { communityId: community.id, eventId: event.id, memberId: budi.id, status: 'yes' },
        { communityId: community.id, eventId: event.id, memberId: dewi.id, status: 'yes' },
        { communityId: community.id, eventId: event.id, memberId: agus.id, status: 'maybe' },
      ],
    });
  }

  console.log('Seed done! Login with budi@demo.test / password123 to see member view.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
