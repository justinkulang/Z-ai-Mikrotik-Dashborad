import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const voucher = await db.voucher.findUnique({
      where: { id: params.id },
      include: {
        plan: true
      }
    })

    if (!voucher) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error fetching voucher:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voucher' },
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
    const { expiresAt } = body

    const updateData: any = {}
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    }

    const voucher = await db.voucher.update({
      where: { id: params.id },
      data: updateData,
      include: {
        plan: true
      }
    })

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('Error updating voucher:', error)
    return NextResponse.json(
      { error: 'Failed to update voucher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.voucher.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Voucher deleted successfully' })
  } catch (error) {
    console.error('Error deleting voucher:', error)
    return NextResponse.json(
      { error: 'Failed to delete voucher' },
      { status: 500 }
    )
  }
}