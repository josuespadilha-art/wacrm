import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import {
  mergeConsecutive,
  normalizeUsage,
  providerHttpError,
  toNetworkError,
  type ProviderArgs,
} from './shared'
import { agendaToolDefinition, executeAgendaTool } from '../tools/agenda'
import { agendarHorarioDefinition, executeAgendarHorario } from '../tools/agendar_horario'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

interface OpenAiResponse {
  choices?: {
    message?: {
      content?: string
      tool_calls?: any[]
      role?: string
    }
    finish_reason?: string
  }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

/**
 * Call OpenAI's Chat Completions endpoint with the caller's own key.
 * Returns the raw assistant text + token usage (handoff parsing happens
 * in `generateReply`). Supports Tool Calling for agenda access.
 */
export async function generateOpenAi(args: ProviderArgs & { contactId?: string }): Promise<ProviderResult> {
  const { accountId, contactId, agendaAccessEnabled, apiKey, model, systemPrompt, messages, timeoutMs } = args

  let currentMessages: any[] = [
    { role: 'system', content: systemPrompt },
    ...mergeConsecutive(messages).map(m => ({ role: m.role, content: m.content })),
  ]

  let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  let loopCount = 0
  const MAX_LOOPS = 3 // Prevent infinite loops

  while (loopCount < MAX_LOOPS) {
    loopCount++
    let res: Response
    try {
      res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: currentMessages,
          max_completion_tokens: MAX_OUTPUT_TOKENS,
          tools: agendaAccessEnabled ? [agendaToolDefinition, agendarHorarioDefinition] : undefined,
          tool_choice: agendaAccessEnabled ? 'auto' : undefined,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      throw toNetworkError(err)
    }

    if (!res.ok) {
      throw await providerHttpError('OpenAI', res)
    }

    const data = (await res.json().catch(() => null)) as OpenAiResponse | null
    
    // Accumulate usage
    if (data?.usage) {
      totalUsage.prompt_tokens += data.usage.prompt_tokens || 0
      totalUsage.completion_tokens += data.usage.completion_tokens || 0
      totalUsage.total_tokens += data.usage.total_tokens || 0
    }

    const choice = data?.choices?.[0]
    const message = choice?.message

    if (!choice || !message) {
      throw new AiError('OpenAI returned an empty response.', { code: 'empty_response' })
    }

    if (choice.finish_reason === 'tool_calls' && message.tool_calls && message.tool_calls.length > 0) {
      // Append assistant's tool call message
      currentMessages.push({
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.tool_calls,
      })

      // Resolve each tool call
      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === 'verificar_agenda') {
          let toolResult: any
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments)
            toolResult = await executeAgendaTool(accountId, parsedArgs)
          } catch (e) {
            toolResult = { error: 'Failed to parse or execute tool arguments.' }
          }
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          })
        } else if (toolCall.function.name === 'agendar_horario') {
          let toolResult: any
          try {
            const parsedArgs = JSON.parse(toolCall.function.arguments)
            if (!contactId) {
              toolResult = { error: 'contactId is missing, cannot schedule.' }
            } else {
              toolResult = await executeAgendarHorario(accountId, contactId, parsedArgs)
            }
          } catch (e) {
            toolResult = { error: 'Failed to parse or execute tool arguments.' }
          }
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          })
        } else {
          // Fallback for unknown tools
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Unknown tool.' }),
          })
        }
      }
      
      // Continue the loop to send tool results back to OpenAI
      continue
    }

    // Normal text completion
    const text = message.content
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new AiError('OpenAI returned an empty response.', { code: 'empty_response' })
    }

    const usage = normalizeUsage({
      prompt: totalUsage.prompt_tokens,
      completion: totalUsage.completion_tokens,
      total: totalUsage.total_tokens,
    })

    return { text, usage }
  }

  throw new AiError('OpenAI tool call loop limit exceeded.', { code: 'loop_limit_exceeded' })
}
