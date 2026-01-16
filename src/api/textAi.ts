import { eventSource, post } from '@/utils/request'

export async function talk(message: string, sessionId: string, history: any[] = []): Promise<EventSource> {
  return eventSource('/opi/topic/llm/text/talk', { message, sessionId, history })
}

export interface TextAiSession {
  id: string
  title: string
  spiderDataId: string
  createdAt: string
}

export interface TextAiHistory {
  id: string
  sessionId: string
  role: ConversationRole
  content: string
  createdAt: string
}

export enum ConversationRole {
  User = 'user',
  AI = 'assistant'
}

export async function listSession(): Promise<TextAiSession[]> {
  return post('/opi/topic/llm/text/listSession')
}

export async function createSession(spiderDataId: string): Promise<TextAiSession> {
  return post('/opi/topic/llm/text/createSession', { spiderDataId })
}

export async function listHistory(sessionId: string): Promise<TextAiHistory[]> {
  return post('/opi/topic/llm/text/listHistory', { sessionId })
}

export async function editSession(session: TextAiSession): Promise<TextAiSession> {
  return post('/opi/topic/llm/text/editSession', session)
}

export async function removeSession(sessionId: string) {
  return post('/opi/topic/llm/text/removeSession', { sessionId })
}
