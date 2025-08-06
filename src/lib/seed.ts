import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function seed() {
  try {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await db.user.upsert({
      where: { email: 'admin@hotspot.com' },
      update: {},
      create: {
        email: 'admin@hotspot.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    })

    console.log('Admin user created:', adminUser)

    // Create sample routers
    const router1 = await db.router.create({
      data: {
        name: 'Main Router',
        ipAddress: '192.168.1.1',
        username: 'admin',
        password: await bcrypt.hash('admin', 12),
        apiPort: 8728,
        isActive: true
      }
    })

    const router2 = await db.router.create({
      data: {
        name: 'Branch Router',
        ipAddress: '192.168.2.1',
        username: 'admin',
        password: await bcrypt.hash('admin', 12),
        apiPort: 8728,
        isActive: true
      }
    })

    console.log('Sample routers created')

    // Create sample plans for Main Router
    const plan1 = await db.plan.create({
      data: {
        name: 'Basic 30 Min',
        price: 1.0,
        duration: 30,
        dataLimit: 100, // 100MB
        speedLimit: '512K/512K',
        description: 'Basic 30-minute access',
        isActive: true,
        routerId: router1.id
      }
    })

    const plan2 = await db.plan.create({
      data: {
        name: 'Basic 1 Hour',
        price: 2.0,
        duration: 60,
        dataLimit: 200, // 200MB
        speedLimit: '1M/1M',
        description: 'Basic 1-hour access',
        isActive: true,
        routerId: router1.id
      }
    })

    const plan3 = await db.plan.create({
      data: {
        name: 'Premium 1 Hour',
        price: 3.0,
        duration: 60,
        dataLimit: 500, // 500MB
        speedLimit: '2M/2M',
        description: 'Premium 1-hour access with higher speed',
        isActive: true,
        routerId: router1.id
      }
    })

    const plan4 = await db.plan.create({
      data: {
        name: 'Premium 2 Hours',
        price: 5.0,
        duration: 120,
        dataLimit: 1000, // 1GB
        speedLimit: '2M/2M',
        description: 'Premium 2-hour access',
        isActive: true,
        routerId: router1.id
      }
    })

    console.log('Sample plans created')

    // Create sample vouchers
    const voucher1 = await db.voucher.create({
      data: {
        code: 'HS-1234-5678',
        planId: plan1.id,
        isUsed: false,
        expiresAt: new Date('2024-12-31')
      }
    })

    const voucher2 = await db.voucher.create({
      data: {
        code: 'HS-2345-6789',
        planId: plan2.id,
        isUsed: true,
        usedBy: 'john_doe',
        usedAt: new Date('2024-01-20'),
        expiresAt: new Date('2024-12-15')
      }
    })

    const voucher3 = await db.voucher.create({
      data: {
        code: 'HS-3456-7890',
        planId: plan3.id,
        isUsed: false,
        expiresAt: new Date('2024-11-30')
      }
    })

    console.log('Sample vouchers created')

    // Create sample hotspot users
    const user1 = await db.hotspotUser.create({
      data: {
        username: 'john_doe',
        password: await bcrypt.hash('password123', 12),
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        planId: plan2.id,
        isActive: true,
        expiresAt: new Date('2024-12-31')
      }
    })

    const user2 = await db.hotspotUser.create({
      data: {
        username: 'jane_smith',
        password: await bcrypt.hash('password123', 12),
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        planId: plan3.id,
        isActive: true,
        expiresAt: new Date('2024-12-15')
      }
    })

    const user3 = await db.hotspotUser.create({
      data: {
        username: 'mike_wilson',
        password: await bcrypt.hash('password123', 12),
        name: 'Mike Wilson',
        email: 'mike@example.com',
        phone: '+1234567892',
        planId: plan1.id,
        isActive: false,
        expiresAt: new Date('2024-11-30')
      }
    })

    console.log('Sample hotspot users created')

    // Create sample sessions
    const session1 = await db.session.create({
      data: {
        hotspotUserId: user1.id,
        routerId: router1.id,
        sessionId: 'sess_001',
        ipAddress: '192.168.1.100',
        macAddress: '00:11:22:33:44:55',
        startTime: new Date('2024-01-20T14:30:00'),
        uploadBytes: 1024000,
        downloadBytes: 5120000,
        isActive: true
      }
    })

    const session2 = await db.session.create({
      data: {
        hotspotUserId: user2.id,
        routerId: router1.id,
        sessionId: 'sess_002',
        ipAddress: '192.168.1.101',
        macAddress: '00:11:22:33:44:56',
        startTime: new Date('2024-01-20T14:15:00'),
        uploadBytes: 2048000,
        downloadBytes: 10240000,
        isActive: true
      }
    })

    const session3 = await db.session.create({
      data: {
        hotspotUserId: user3.id,
        routerId: router1.id,
        sessionId: 'sess_003',
        ipAddress: '192.168.1.102',
        macAddress: '00:11:22:33:44:57',
        startTime: new Date('2024-01-20T13:45:00'),
        endTime: new Date('2024-01-20T14:15:00'),
        uploadBytes: 512000,
        downloadBytes: 2560000,
        isActive: false
      }
    })

    console.log('Sample sessions created')

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await db.$disconnect()
  }
}

seed()