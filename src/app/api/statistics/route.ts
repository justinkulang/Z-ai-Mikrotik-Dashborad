import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const type = searchParams.get('type') || 'overview'

    // Calculate date range based on timeRange
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    switch (type) {
      case 'overview':
        return await getOverviewStats(startDate, now)
      case 'users':
        return await getUserStats(startDate, now)
      case 'sessions':
        return await getSessionStats(startDate, now)
      case 'revenue':
        return await getRevenueStats(startDate, now)
      case 'routers':
        return await getRouterStats()
      default:
        return await getOverviewStats(startDate, now)
    }
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

async function getOverviewStats(startDate: Date, endDate: Date) {
  const [totalUsers, activeUsers, totalSessions, activeSessions, routers] = await Promise.all([
    db.hotspotUser.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    db.hotspotUser.count({
      where: {
        isActive: true,
        expiresAt: {
          gte: new Date()
        }
      }
    }),
    db.session.count({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    db.session.count({
      where: {
        isActive: true
      }
    }),
    db.router.findMany({
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })
  ])

  // Calculate total data usage
  const sessionsWithData = await db.session.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      uploadBytes: true,
      downloadBytes: true
    }
  })

  const totalDataUsed = sessionsWithData.reduce(
    (total, session) => total + session.uploadBytes + session.downloadBytes,
    0
  )

  // Calculate revenue (based on used vouchers)
  const usedVouchers = await db.voucher.findMany({
    where: {
      isUsed: true,
      usedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      plan: {
        select: {
          price: true
        }
      }
    }
  })

  const totalRevenue = usedVouchers.reduce(
    (total, voucher) => total + (voucher.plan?.price || 0),
    0
  )

  // Generate daily stats for charts
  const dailyStats = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const [dayUsers, daySessions, dayVouchers] = await Promise.all([
      db.hotspotUser.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      }),
      db.session.count({
        where: {
          startTime: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      }),
      db.voucher.findMany({
        where: {
          isUsed: true,
          usedAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        include: {
          plan: {
            select: {
              price: true
            }
          }
        }
      })
    ])

    const dayRevenue = dayVouchers.reduce(
      (total, voucher) => total + (voucher.plan?.price || 0),
      0
    )

    dailyStats.push({
      date: currentDate.toISOString().split('T')[0],
      totalUsers: dayUsers,
      totalSessions: daySessions,
      revenue: dayRevenue
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return NextResponse.json({
    overview: {
      totalUsers,
      activeUsers,
      totalSessions,
      activeSessions,
      totalDataUsed,
      totalRevenue,
      onlineRouters: routers.filter(r => r.isActive).length,
      totalRouters: routers.length
    },
    dailyStats
  })
}

async function getUserStats(startDate: Date, endDate: Date) {
  const topUsers = await db.hotspotUser.findMany({
    include: {
      sessions: {
        where: {
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          uploadBytes: true,
          downloadBytes: true,
          startTime: true,
          endTime: true
        }
      }
    },
    orderBy: {
      sessions: {
        _count: 'desc'
      }
    },
    take: 10
  })

  const userStats = topUsers.map(user => {
    const totalSessions = user.sessions.length
    const totalDataUsed = user.sessions.reduce(
      (total, session) => total + session.uploadBytes + session.downloadBytes,
      0
    )

    // Calculate total duration
    let totalDuration = 0
    user.sessions.forEach(session => {
      const startTime = new Date(session.startTime).getTime()
      const endTime = session.endTime ? new Date(session.endTime).getTime() : Date.now()
      totalDuration += (endTime - startTime) / 1000 // Convert to seconds
    })

    return {
      username: user.username,
      sessions: totalSessions,
      dataUsed: totalDataUsed,
      duration: Math.floor(totalDuration)
    }
  })

  return NextResponse.json({
    topUsers: userStats
  })
}

async function getSessionStats(startDate: Date, endDate: Date) {
  const sessions = await db.session.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      router: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  const sessionStats = sessions.reduce((acc, session) => {
    const routerName = session.router.name
    if (!acc[routerName]) {
      acc[routerName] = {
        name: routerName,
        totalSessions: 0,
        totalDataUsed: 0,
        totalDuration: 0
      }
    }

    acc[routerName].totalSessions++
    acc[routerName].totalDataUsed += session.uploadBytes + session.downloadBytes

    const startTime = new Date(session.startTime).getTime()
    const endTime = session.endTime ? new Date(session.endTime).getTime() : Date.now()
    acc[routerName].totalDuration += (endTime - startTime) / 1000

    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({
    routerStats: Object.values(sessionStats)
  })
}

async function getRevenueStats(startDate: Date, endDate: Date) {
  const vouchers = await db.voucher.findMany({
    where: {
      isUsed: true,
      usedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true
        }
      }
    }
  })

  const revenueByPlan = vouchers.reduce((acc, voucher) => {
    const planName = voucher.plan.name
    if (!acc[planName]) {
      acc[planName] = {
        planName,
        count: 0,
        revenue: 0
      }
    }

    acc[planName].count++
    acc[planName].revenue += voucher.plan.price

    return acc
  }, {} as Record<string, any>)

  const dailyRevenue = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const dayVouchers = await db.voucher.findMany({
      where: {
        isUsed: true,
        usedAt: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      include: {
        plan: {
          select: {
            price: true
          }
        }
      }
    })

    const dayRevenue = dayVouchers.reduce(
      (total, voucher) => total + (voucher.plan?.price || 0),
      0
    )

    dailyRevenue.push({
      date: currentDate.toISOString().split('T')[0],
      revenue: dayRevenue
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return NextResponse.json({
    revenueByPlan: Object.values(revenueByPlan),
    dailyRevenue
  })
}

async function getRouterStats() {
  const routers = await db.router.findMany({
    include: {
      sessions: {
        where: {
          isActive: true
        },
        select: {
          id: true,
          uploadBytes: true,
          downloadBytes: true,
          startTime: true
        }
      },
      _count: {
        select: {
          sessions: true,
          plans: true
        }
      }
    }
  })

  const routerStats = routers.map(router => {
    const activeSessions = router.sessions
    const totalDataUsed = activeSessions.reduce(
      (total, session) => total + session.uploadBytes + session.downloadBytes,
      0
    )

    return {
      id: router.id,
      name: router.name,
      ipAddress: router.ipAddress,
      isActive: router.isActive,
      totalSessions: router._count.sessions,
      activeSessions: activeSessions.length,
      totalDataUsed,
      totalPlans: router._count.plans,
      // Simulated metrics
      cpuLoad: router.isActive ? Math.floor(Math.random() * 30) + 10 : 0,
      memoryUsage: router.isActive ? Math.floor(Math.random() * 40) + 30 : 0,
      uptime: router.isActive ? '15d 4h 32m' : '0d 0h 0m'
    }
  })

  return NextResponse.json({
    routerStats
  })
}