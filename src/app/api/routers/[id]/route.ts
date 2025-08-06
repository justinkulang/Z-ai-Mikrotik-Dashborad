import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createMikrotikAPI } from '@/lib/mikrotik-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const router = await db.router.findUnique({
      where: { id: params.id },
      include: {
        sessions: {
          where: { isActive: true },
          include: {
            hotspotUser: {
              select: {
                id: true,
                username: true,
                name: true
              }
            }
          }
        },
        plans: true
      }
    })

    if (!router) {
      return NextResponse.json(
        { error: 'Router not found' },
        { status: 404 }
      )
    }

    // Create Mikrotik API instance
    const mikrotikAPI = createMikrotikAPI({
      host: router.ipAddress,
      port: router.apiPort,
      username: router.username,
      password: router.password
    })

    // Test connection and get real-time data
    const connectionTest = await mikrotikAPI.testConnection()
    let systemResources = null
    let hotspotUsers = []
    let interfaces = []

    if (connectionTest.success) {
      try {
        // Get system resources
        systemResources = await mikrotikAPI.getSystemResources()
        
        // Get hotspot users
        hotspotUsers = await mikrotikAPI.getHotspotUsers()
        
        // Get interfaces
        interfaces = await mikrotikAPI.getInterfaces()
      } catch (error) {
        console.error('Error fetching router data:', error)
      }
    }

    // Calculate active sessions from database
    const activeSessions = router.sessions.filter(session => session.isActive)
    const totalSessions = await db.session.count({
      where: { routerId: router.id }
    })

    const routerWithStatus = {
      ...router,
      status: connectionTest.success ? 'online' : 'offline',
      uptime: systemResources?.uptime || '0d 0h 0m',
      version: systemResources?.version || 'Unknown',
      cpuLoad: systemResources?.cpuLoad || 0,
      memoryUsage: systemResources ? Math.round(((systemResources.totalMemory - systemResources.freeMemory) / systemResources.totalMemory) * 100) : 0,
      lastSeen: connectionTest.success ? new Date().toISOString() : router.updatedAt.toISOString(),
      responseTime: connectionTest.responseTime,
      totalSessions,
      activeSessions: activeSessions.length,
      totalPlans: router.plans.length,
      systemResources,
      hotspotUsers,
      interfaces
    }

    return NextResponse.json(routerWithStatus)
  } catch (error) {
    console.error('Error fetching router:', error)
    return NextResponse.json(
      { error: 'Failed to fetch router' },
      { status: 500 }
    )
  }
}

import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, ipAddress, username, password, apiPort, isActive } = body

    // Check if IP address already exists for different router
    if (ipAddress) {
      const existingRouter = await db.router.findFirst({
        where: {
          ipAddress,
          NOT: { id: params.id }
        }
      })

      if (existingRouter) {
        return NextResponse.json(
          { error: 'Router with this IP address already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress
    if (username !== undefined) updateData.username = username
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }
    if (apiPort !== undefined) updateData.apiPort = apiPort
    if (isActive !== undefined) updateData.isActive = isActive

    const router = await db.router.update({
      where: { id: params.id },
      data: updateData
    })

    // Test connection to the updated router
    const mikrotikAPI = createMikrotikAPI({
      host: router.ipAddress,
      port: router.apiPort,
      username: router.username,
      password: router.password
    })

    const connectionTest = await mikrotikAPI.testConnection()

    return NextResponse.json({
      ...router,
      connectionTest
    })
  } catch (error) {
    console.error('Error updating router:', error)
    return NextResponse.json(
      { error: 'Failed to update router' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if router has active sessions
    const activeSessions = await db.session.count({
      where: { 
        routerId: params.id,
        isActive: true
      }
    })

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete router with active sessions' },
        { status: 400 }
      )
    }

    await db.router.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Router deleted successfully' })
  } catch (error) {
    console.error('Error deleting router:', error)
    return NextResponse.json(
      { error: 'Failed to delete router' },
      { status: 500 }
    )
  }
}

// POST to test router connection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const router = await db.router.findUnique({
      where: { id: params.id }
    })

    if (!router) {
      return NextResponse.json(
        { error: 'Router not found' },
        { status: 404 }
      )
    }

    // Test connection using Mikrotik API
    const mikrotikAPI = createMikrotikAPI({
      host: router.ipAddress,
      port: router.apiPort,
      username: router.username,
      password: router.password
    })

    const connectionTest = await mikrotikAPI.testConnection()

    if (connectionTest.success) {
      // Try to get additional router information
      try {
        const systemResources = await mikrotikAPI.getSystemResources()
        const hotspotUsers = await mikrotikAPI.getHotspotUsers()
        
        return NextResponse.json({
          message: 'Connection test successful',
          status: 'online',
          responseTime: connectionTest.responseTime,
          systemResources,
          activeUsers: hotspotUsers.length
        })
      } catch (error) {
        return NextResponse.json({
          message: 'Connection test successful but failed to get detailed info',
          status: 'online',
          responseTime: connectionTest.responseTime,
          error: 'Partial success'
        })
      }
    } else {
      return NextResponse.json({
        message: 'Connection test failed',
        status: 'offline',
        error: connectionTest.error || 'Unable to connect to router'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error testing router connection:', error)
    return NextResponse.json(
      { error: 'Failed to test router connection' },
      { status: 500 }
    )
  }
}