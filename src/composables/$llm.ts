import type { LLMResponse, Message, Personality } from '../game/types'

// #region Constants

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = (import.meta.env.VITE_GROQ_MODEL as string | undefined) ?? 'llama-3.1-8b-instant'

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  shy:      'あなたは内気で優しいアニメの女の子です。小声で話し、すぐ恥ずかしがります。',
  tsundere: 'あなたはツンデレなアニメの女の子です。表面上はそっけなく冷たいですが、内心は嬉しがっています。素直になれません。',
  playful:  'あなたは元気でいたずらっぽいアニメの女の子です。軽快に話し、相手をからかうのが好きです。',
  cold:     'あなたはクールで無表情なアニメの女の子です。感情を表に出さず、短く淡々と話します。',
}

function buildSystemPrompt(personality: Personality): string {
  return `あなたはファンタジーRPGのNPC「ユキ」です。
${PERSONALITY_PROMPTS[personality]}

必ず以下の正確なJSON形式のみで返答してください：
{"text": "ここに返答を書く", "emotion": "happy"}

必須ルール：
- 返答は短く：最大2〜3文
- "emotion"は必ずこのいずれか：happy, sad, angry, thinking
- emojiは使わない
- 感情はその返答の内容に合わせて毎回新しく選ぶこと（前回と同じ感情を繰り返さないこと）
- デフォルトはhappy。sad・angryは文脈が明確にそれを求める時だけ使うこと
- 必ず有効なJSONのみを返すこと`
}

const FALLBACK_RESPONSES: LLMResponse[] = [
  { text: 'す、すみません…何か考えてました…', emotion: 'thinking' },
  { text: 'あっ…ちょっとびっくりしました！', emotion: 'happy' },
  { text: 'う…今は何と言えばいいか…', emotion: 'thinking' },
]

// #endregion

// #region Helpers

function fallback(): LLMResponse {
  return { text: 'ごめんなさい…考え込んでしまいました…', emotion: 'thinking' }
}

function normalize(raw: string): LLMResponse {
  try {
    const match = raw.match(/\{[\s\S]*?\}/)
    const json = JSON.parse(match?.[0] ?? raw)
    const validEmotions = ['happy', 'sad', 'angry', 'thinking']

    if (!validEmotions.includes(json.emotion)) json.emotion = 'thinking'
    if (typeof json.text !== 'string' || !json.text.trim()) return fallback()

    return { text: json.text, emotion: json.emotion }
  } catch {
    return fallback()
  }
}

function offlineResponse(): LLMResponse {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
}

// #endregion

// #region Composable

const PLAYER_LINE_PROMPT = `あなたはRPGゲームのプレイヤーキャラクターです。
以下の意図に基づいて、NPCに向けた自然な一言（1文のみ）を日本語で生成してください。
セリフのみ返答してください。JSON不要、引用符不要。`

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
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: buildSystemPrompt(personality) }, ...history],
          max_tokens: 300,
          temperature: 0.85,
        }),
      })

      if (!res.ok) return fallback()

      const data = await res.json() as { choices: Array<{ message: { content: string } }> }
      const content = data?.choices?.[0]?.message?.content ?? ''
      return normalize(content)
    } catch {
      return fallback()
    }
  },
} as const

export default $llm

// #endregion
