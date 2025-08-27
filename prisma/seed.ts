import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.event.deleteMany();

  // Create seed data for today
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const seedEvents = [
    // Newsletter.com events for today
    {
      id: 'evt_001',
      type: 'sent',
      email: 'user1@example.com',
      site: 'newsletter.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      metadata: { campaign: 'weekly-digest' }
    },
    {
      id: 'evt_002',
      type: 'open',
      email: 'user1@example.com',
      site: 'newsletter.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 0),
      metadata: { campaign: 'weekly-digest' }
    },
    {
      id: 'evt_003',
      type: 'click',
      email: 'user1@example.com',
      site: 'newsletter.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 45, 0),
      metadata: { campaign: 'weekly-digest', link: 'https://example.com/article1' }
    },
    {
      id: 'evt_004',
      type: 'sent',
      email: 'user2@example.com',
      site: 'newsletter.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      metadata: { campaign: 'weekly-digest' }
    },
    {
      id: 'evt_005',
      type: 'open',
      email: 'user2@example.com',
      site: 'newsletter.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 15, 0),
      metadata: { campaign: 'weekly-digest' }
    },
    
    // Promo.com events for today
    {
      id: 'evt_006',
      type: 'sent',
      email: 'customer1@domain.com',
      site: 'promo.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0),
      metadata: { campaign: 'flash-sale' }
    },
    {
      id: 'evt_007',
      type: 'open',
      email: 'customer1@domain.com',
      site: 'promo.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30, 0),
      metadata: { campaign: 'flash-sale' }
    },
    {
      id: 'evt_008',
      type: 'click',
      email: 'customer1@domain.com',
      site: 'promo.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 35, 0),
      metadata: { campaign: 'flash-sale', link: 'https://promo.com/deals' }
    },
    {
      id: 'evt_009',
      type: 'sent',
      email: 'customer2@domain.com',
      site: 'promo.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0),
      metadata: { campaign: 'flash-sale' }
    },
    {
      id: 'evt_010',
      type: 'complaint',
      email: 'customer3@domain.com',
      site: 'promo.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 20, 0),
      metadata: { campaign: 'flash-sale', reason: 'spam' }
    },

    // Blog.com events for today
    {
      id: 'evt_011',
      type: 'sent',
      email: 'reader1@mail.com',
      site: 'blog.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0),
      metadata: { campaign: 'new-post-notification' }
    },
    {
      id: 'evt_012',
      type: 'open',
      email: 'reader1@mail.com',
      site: 'blog.com',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 45, 0),
      metadata: { campaign: 'new-post-notification' }
    },

    // Yesterday's events (should not appear in daily stats)
    {
      id: 'evt_013',
      type: 'sent',
      email: 'old@example.com',
      site: 'newsletter.com',
      timestamp: yesterday,
      metadata: { campaign: 'old-campaign' }
    }
  ];

  for (const event of seedEvents) {
    await prisma.event.create({
      data: event
    });
  }

  console.log(`Created ${seedEvents.length} events`);
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });