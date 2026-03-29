import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  createConversation,
  saveMessage,
  getMessages,
  updateConversationTitle,
  touchConversation,
  getConversationById,
} from '@/lib/db'
import { callOpenRouter } from '@/lib/openrouter'
import { canUseModel, DEFAULT_FREE_MODEL } from '@/lib/models'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    const { message, history, model, conversationId } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    const requestedModel = model || DEFAULT_FREE_MODEL

    // Pro models require login
    const userPlan = session?.plan ?? 'free'
    if (!canUseModel(requestedModel, userPlan)) {
      return NextResponse.json(
        { error: 'Pro models require a Pro subscription. Please login and upgrade.', requiresLogin: !session, requiresPro: true },
        { status: 403 }
      )
    }

    // Build messages for OpenRouter
    const historyMessages = Array.isArray(history)
      ? history.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }))
      : []

    const openRouterMessages = [
      ...historyMessages,
      { role: 'user' as const, content: message },
    ]

    const reply = await callOpenRouter(openRouterMessages, requestedModel)

    // Save to DB only when logged in
    let returnedConvId: number | undefined
    if (session) {
      let convId: number
      if (conversationId) {
        const conv = await getConversationById(conversationId, session.userId)
        convId = conv ? conv.id : (await createConversation(session.userId, requestedModel)).id
      } else {
        convId = (await createConversation(session.userId, requestedModel)).id
      }

      await saveMessage(convId, 'user', message)
      await saveMessage(convId, 'assistant', reply)
      await touchConversation(convId)

      const allMsgs = await getMessages(convId)
      if (allMsgs.length <= 2) {
        await updateConversationTitle(convId, message.slice(0, 60) + (message.length > 60 ? '…' : ''))
      }

      returnedConvId = convId
    }

    return NextResponse.json({ reply, conversationId: returnedConvId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    console.error('Chat error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
