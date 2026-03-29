import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getMessages, getConversationById } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const conv = await getConversationById(Number(id), session.userId)
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const messages = await getMessages(Number(id))
  return NextResponse.json({ messages })
}
