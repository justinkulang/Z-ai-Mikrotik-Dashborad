import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isUsed = searchParams.get('isUsed')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereClause: any = {}
    
    if (search) {
      whereClause = {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { plan: { name: { contains: search, mode: 'insensitive' } } }
        ]
      }
    }

    if (isUsed !== null) {
      whereClause.isUsed = isUsed === 'true'
    }

    const [vouchers, total] = await Promise.all([
      db.voucher.findMany({
        where: whereClause,
        include: {
          plan: true
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.voucher.count({ where: whereClause })
    ])

    return NextResponse.json({
      vouchers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, quantity, prefix, expiresAt, generateQr } = body

    if (!planId || !quantity || quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Check if plan exists
    const plan = await db.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    const vouchers = []
    const generatedCodes = new Set()

    for (let i = 0; i < quantity; i++) {
      let code
      let attempts = 0
      const maxAttempts = 100

      // Generate unique code
      do {
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
        const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase()
        code = `${prefix}-${randomPart}-${randomPart2}`
        attempts++
      } while (generatedCodes.has(code) && attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique voucher code')
      }

      generatedCodes.add(code)

      const voucher = await db.voucher.create({
        data: {
          code,
          planId,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        },
        include: {
          plan: true
        }
      })

      vouchers.push(voucher)
    }

    return NextResponse.json({
      message: `Successfully generated ${quantity} vouchers`,
      vouchers,
      totalGenerated: quantity
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to generate vouchers' },
      { status: 500 }
    )
  }
}