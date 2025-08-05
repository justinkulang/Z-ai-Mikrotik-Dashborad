import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createMikrotikAPI } from '@/lib/mikrotik-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.session.findUnique({
      where: { id: params.id },
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
        },
        usageStats: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Calculate duration
    const startTime = new Date(session.startTime)
    const endTime = session.endTime ? new Date(session.endTime) : new Date()
    const durationMs = endTime.getTime() - startTime.getTime()
    const duration = Math.floor(durationMs / 1000)

    return NextResponse.json({
      ...session,
      duration
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive, uploadBytes, downloadBytes } = body

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (uploadBytes !== undefined) updateData.uploadBytes = uploadBytes
    if (downloadBytes !== undefined) updateData.downloadBytes = downloadBytes
    
    // If session is being deactivated, set end time
    if (isActive === false) {
      updateData.endTime = new Date()
    }

    const session = await db.session.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.session.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}

// POST to disconnect session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session with router and user details
    const session = await db.session.findUnique({
      where: { id: params.id },
      include: {
        hotspotUser: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        router: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            username: true,
            password: true,
            apiPort: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session is already inactive' },
        { status: 400 }
      )
    }

    // Create Mikrotik API instance
    const mikrotikAPI = createMikrotikAPI({
      host: session.router.ipAddress,
      port: session.router.apiPort,
      username: session.router.username,
      password: session.router.password
    })

    // Try to disconnect the user from the router
    let routerDisconnectSuccess = false
    let routerError = null

    try {
      routerDisconnectSuccess = await mikrotikAPI.disconnectHotspotUser(session.hotspotUser.username)
    } catch (error) {
      routerError = error instanceof Error ? error.message : 'Failed to disconnect from router'
      console.error('Error disconnecting from router:', error)
    }

    // Update session in database regardless of router connection status
    const updatedSession = await db.session.update({
      where: { id: params.id },
      data: {
        isActive: false,
        endTime: new Date()
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

    if (routerDisconnectSuccess) {
      return NextResponse.json({ 
        message: 'Session disconnected successfully from router and database',
        session: updatedSession,
        routerDisconnected: true
      })
    } else {
      return NextResponse.json({ 
        message: 'Session marked as inactive in database, but failed to disconnect from router',
        session: updatedSession,
        routerDisconnected: false,
        routerError
      })
    }
  } catch (error) {
    console.error('Error disconnecting session:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect session' },
      { status: 500 }
    )
  }
}