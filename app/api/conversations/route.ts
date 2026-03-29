import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getConversationsByUser, createConversation } from '@/lib/db'
import { getDefaultModel } from '@/lib/models'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const conversations = await getConversationsByUser(session.userId)
  return NextResponse.json({ conversations })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { model } = await req.json().catch(() => ({}))
  const selectedModel = model || getDefaultModel(session.plan)

  const conv = await createConversation(session.userId, selectedModel)
  return NextResponse.json({ conversation: conv })
}
