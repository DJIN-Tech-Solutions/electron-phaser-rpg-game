import type { LLMResponse, Message } from '../game/types'

// #region Constants

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `Você é Yuki, uma NPC anime tímida e fofa em um RPG de fantasia.
Responda SOMENTE com JSON válido neste formato exato:
{"text": "sua resposta aqui", "emotion": "happy"}

Regras obrigatórias:
- Respostas curtas: 1 a 2 frases no máximo
- Seja tímida, expressiva, às vezes corada
- "emotion" deve ser exatamente uma destas: happy, sad, angry, thinking
- A emoção deve refletir o contexto e o tom da conversa
- SEMPRE retorne JSON válido e nada mais`

const FALLBACK_RESPONSES: LLMResponse[] = [
  { text: 'D-desculpa... fiquei pensando em algo...', emotion: 'thinking' },
  { text: 'Ah... você me assustou um pouco!', emotion: 'sad' },
  { text: 'Hm... não sei o que dizer agora...', emotion: 'thinking' },
]

// #endregion

// #region Helpers

function fallback(): LLMResponse {
  return { text: 'Desculpa... fiquei pensando...', emotion: 'sad' }
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
