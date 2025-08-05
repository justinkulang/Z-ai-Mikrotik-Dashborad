import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereClause: any = {}
    
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    const [routers, total] = await Promise.all([
      db.router.findMany({
        where: whereClause,
        include: {
          sessions: {
            where: { isActive: true },
            select: {
              id: true,
              hotspotUserId: true,
              startTime: true
            }
          },
          plans: {
            select: {
              id: true,
              name: true,
              price: true
            }
          },
          _count: {
            select: {
              sessions: true,
              plans: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.router.count({ where: whereClause })
    ])

    // Simulate router status check (in real implementation, this would ping the router)
    const routersWithStatus = routers.map(router => ({
      ...router,
      status: router.isActive ? 'online' : 'offline',
      uptime: router.isActive ? '15d 4h 32m' : '0d 0h 0m',
      cpuLoad: router.isActive ? Math.floor(Math.random() * 30) + 10 : 0,
      memoryUsage: router.isActive ? Math.floor(Math.random() * 40) + 30 : 0,
      version: '6.49.7',
      lastSeen: router.isActive ? new Date().toISOString() : router.updatedAt.toISOString()
    }))

    return NextResponse.json({
      routers: routersWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching routers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, ipAddress, username, password, apiPort, isActive } = body

    if (!name || !ipAddress || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if IP address already exists
    const existingRouter = await db.router.findFirst({
      where: { ipAddress }
    })

    if (existingRouter) {
      return NextResponse.json(
        { error: 'Router with this IP address already exists' },
        { status: 400 }
      )
    }

    const router = await db.router.create({
      data: {
        name,
        ipAddress,
        username,
        password,
        apiPort: apiPort || 8728,
        isActive: isActive ?? true
      }
    })

    // In a real implementation, you would test the connection here
    // and set the initial status based on the connection test

    return NextResponse.json(router, { status: 201 })
  } catch (error) {
    console.error('Error creating router:', error)
    return NextResponse.json(
      { error: 'Failed to create router' },
      { status: 500 }
    )
  }
}