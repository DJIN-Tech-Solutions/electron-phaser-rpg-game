import type { LLMResponse, Message, Personality } from '../game/types'

// #region Constants

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getModel() {
  return (import.meta.env.VITE_GROQ_MODEL as string | undefined) ?? 'llama-3.1-8b-instant'
}

// #endregion

// #region Tool Definition

/**
 * The LLM is forced to call this tool on every response.
 * This guarantees a structured { text, emotion } output without JSON prompt hacks.
 */
const RESPOND_TOOL = {
  type: 'function',
  function: {
    name: 'respond',
    description: 'Send Yuki\'s response to the player with the matching emotion portrait',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Yuki\'s response text. Max 2-3 sentences.',
        },
        emotion: {
          type: 'string',
          enum: ['happy', 'sad', 'angry', 'thinking'],
          description: 'The emotion that best matches the tone of the response',
        },
      },
      required: ['text', 'emotion'],
    },
  },
} as const

// #endregion

// #region Personality Prompts

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  shy:      'あなたは内気で優しいアニメの女の子です。小声で話し、すぐ恥ずかしがります。',
  tsundere: 'あなたはツンデレなアニメの女の子です。表面上はそっけなく冷たいですが、内心は嬉しがっています。素直になれません。',
  playful:  'あなたは元気でいたずらっぽいアニメの女の子です。軽快に話し、相手をからかうのが好きです。',
  cold:     'あなたはクールで無表情なアニメの女の子です。感情を表に出さず、短く淡々と話します。',
}

function buildSystemPrompt(personality: Personality): string {
  return `あなたはファンタジーRPGのNPC「ユキ」です。
${PERSONALITY_PROMPTS[personality]}

ルール：
- 返答は短く：最大2〜3文
- emojiは使わない
- 感情はその返答の内容に合わせて毎回新しく選ぶこと（前回と同じ感情を繰り返さないこと）
- デフォルトはhappy。sad・angryは文脈が明確にそれを求める時だけ使うこと`
}

// #endregion

// #region Fallbacks

const FALLBACK_RESPONSES: LLMResponse[] = [
  { text: 'す、すみません…何か考えてました…', emotion: 'thinking' },
  { text: 'あっ…ちょっとびっくりしました！',   emotion: 'happy' },
  { text: 'う…今は何と言えばいいか…',           emotion: 'thinking' },
]

function fallback(): LLMResponse {
  return { text: 'ごめんなさい…考え込んでしまいました…', emotion: 'thinking' }
}

function offlineResponse(): LLMResponse {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
}

function parseToolCall(args: string): LLMResponse {
  try {
    const parsed = JSON.parse(args) as { text?: unknown; emotion?: unknown }
    const validEmotions = ['happy', 'sad', 'angry', 'thinking']

    const text    = typeof parsed.text    === 'string' && parsed.text.trim() ? parsed.text.trim() : null
    const emotion = typeof parsed.emotion === 'string' && validEmotions.includes(parsed.emotion)
      ? (parsed.emotion as LLMResponse['emotion'])
      : 'thinking'

    if (!text) return fallback()
    return { text, emotion }
  } catch {
    return fallback()
  }
}

// #endregion

// #region Player Line Generation

const PLAYER_LINE_PROMPT = `あなたはRPGゲームのプレイヤーキャラクターです。
以下の意図に基づいて、NPCに向けた自然な一言（1文のみ）を日本語で生成してください。
セリフのみ返答してください。JSON不要、引用符不要。`

// #endregion

// #region Composable

const $llm = {
  async generatePlayerLine(intent: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return '...'
    }

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getModel(),
          messages: [
            { role: 'system', content: PLAYER_LINE_PROMPT },
            { role: 'user',   content: intent },
          ],
          max_tokens: 80,
          temperature: 0.9,
        }),
      })

      if (!res.ok) return '...'
      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      return data?.choices?.[0]?.message?.content?.trim() ?? '...'
    } catch {
      return '...'
    }
  },

  async send(history: Message[], personality: Personality = 'shy'): Promise<LLMResponse> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return offlineResponse()
    }

    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: getModel(),
          messages: [{ role: 'system', content: buildSystemPrompt(personality) }, ...history],
          tools: [RESPOND_TOOL],
          tool_choice: { type: 'function', function: { name: 'respond' } },
          max_tokens: 300,
          temperature: 0.85,
        }),
      })

      if (!res.ok) return fallback()

      const data = await res.json() as {
        choices: Array<{
          message: {
            tool_calls?: Array<{ function: { name: string; arguments: string } }>
          }
        }>
      }

      const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0]
      if (toolCall?.function?.name === 'respond') {
        return parseToolCall(toolCall.function.arguments)
      }

      return fallback()
    } catch {
      return fallback()
    }
  },
} as const

export default $llm

// #endregion
