import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const routerId = searchParams.get('routerId')

    let whereClause: any = {}
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (routerId) {
      whereClause.routerId = routerId
    }

    const plans = await db.plan.findMany({
      where: whereClause,
      include: {
        router: {
          select: {
            id: true,
            name: true,
            ipAddress: true
          }
        },
        _count: {
          select: {
            vouchers: true,
            hotspotUsers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, duration, dataLimit, speedLimit, description, isActive, routerId } = body

    if (!name || price === undefined || !duration || !routerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    const plan = await db.plan.create({
      data: {
        name,
        price,
        duration,
        dataLimit,
        speedLimit,
        description,
        isActive: isActive ?? true,
        routerId
      },
      include: {
        router: {
          select: {
            id: true,
            name: true,
            ipAddress: true
          }
        }
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}