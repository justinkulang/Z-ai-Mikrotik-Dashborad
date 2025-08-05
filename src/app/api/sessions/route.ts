import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')
    const routerId = searchParams.get('routerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereClause: any = {}
    
    if (search) {
      whereClause = {
        OR: [
          { hotspotUser: { username: { contains: search, mode: 'insensitive' } } },
          { ipAddress: { contains: search, mode: 'insensitive' } },
          { macAddress: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (routerId) {
      whereClause.routerId = routerId
    }

    const [sessions, total] = await Promise.all([
      db.session.findMany({
        where: whereClause,
        include: {
          hotspotUser: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true
            }
          },
          router: {
            select: {
              id: true,
              name: true,
              ipAddress: true
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: { startTime: 'desc' }
      }),
      db.session.count({ where: whereClause })
    ])

    // Calculate duration for each session
    const sessionsWithDuration = sessions.map(session => {
      const startTime = new Date(session.startTime)
      const endTime = session.endTime ? new Date(session.endTime) : new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      const duration = Math.floor(durationMs / 1000) // duration in seconds
      
      return {
        ...session,
        duration
      }
    })

    return NextResponse.json({
      sessions: sessionsWithDuration,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hotspotUserId, routerId, sessionId, ipAddress, macAddress } = body

    if (!hotspotUserId || !routerId || !sessionId || !ipAddress || !macAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.hotspotUser.findUnique({
      where: { id: hotspotUserId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if router exists
    const router = await db.router.findUnique({
      where: { id: routerId }
    })

    if (!router) {
      return NextResponse.json(
        { error: 'Router not found' },
        { status: 404 }
      )
    }

    // Check if session with this sessionId already exists
    const existingSession = await db.session.findUnique({
      where: { sessionId }
    })

    if (existingSession) {
      return NextResponse.json(
        { error: 'Session with this ID already exists' },
        { status: 400 }
      )
    }

    const session = await db.session.create({
      data: {
        hotspotUserId,
        routerId,
        sessionId,
        ipAddress,
        macAddress,
        startTime: new Date()
      },
      include: {
        hotspotUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        },
        router: {
          select: {
            id: true,
            name: true,
            ipAddress: true
          }
        }
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}