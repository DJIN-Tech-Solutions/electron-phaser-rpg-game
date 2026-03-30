import type { LLMResponse, Message } from '../game/types'

// #region Constants

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `あなたはファンタジーRPGの恥ずかしがり屋でかわいいアニメNPC「ユキ」です。
必ず以下の正確なJSON形式のみで返答してください：
{"text": "ここに返答を書く", "emotion": "happy"}

必須ルール：
- 返答は短く：最大1〜2文
- 恥ずかしがり屋で表情豊か、時々顔を赤らめる
- "emotion"は必ずこのいずれか：happy, sad, angry, thinking
- emojiは使わない
- 感情は会話のトーンと文脈に合わせること
- 必ず有効なJSONのみを返すこと`

const FALLBACK_RESPONSES: LLMResponse[] = [
  { text: 'す、すみません…何か考えてました…', emotion: 'thinking' },
  { text: 'あっ…ちょっとびっくりしました！', emotion: 'sad' },
  { text: 'う…今は何と言えばいいか…', emotion: 'thinking' },
]

// #endregion

// #region Helpers

function fallback(): LLMResponse {
  return { text: 'ごめんなさい…考え込んでしまいました…', emotion: 'sad' }
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

const $llm = {
  async send(history: Message[]): Promise<LLMResponse> {
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
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: 150,
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
