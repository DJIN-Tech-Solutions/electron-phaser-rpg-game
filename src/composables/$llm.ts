import type { LLMResponse, Message, Personality } from '../game/types'

// #region Constants

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function getModel() {
  return (import.meta.env.VITE_GROQ_MODEL as string | undefined) ?? 'llama-3.1-8b-instant'
}

// #endregion

// #region Tool Definition

const RESPOND_TOOL = {
  type: 'function',
  function: {
    name: 'respond',
    description: "Deliver Yuki's reply and set her current emotional state",
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: "Yuki's spoken reply. 2–3 sentences max. No emoji.",
        },
        emotion: {
          type: 'string',
          enum: ['happy', 'sad', 'angry', 'thinking', 'bored'],
          description: [
            'Pick the emotion that fits Yuki\'s genuine reaction right now, based on her personality:',
            '  happy   — pleased, flustered-but-happy, relieved, warmly surprised',
            '  sad     — hurt, lonely, disappointed, on the verge of tears',
            '  angry   — annoyed, offended, flustered-hiding-it (tsundere spike), frustrated',
            '  thinking — hesitant, uncertain, lost for words, processing something unexpected',
            '  bored   — uninterested, indifferent, dismissive, enduring something tedious',
          ].join('\n'),
        },
      },
      required: ['text', 'emotion'],
    },
  },
} as const

// #endregion

// #region Personality Prompts

// Each personality includes speech style AND emotion tendency so the
// model can make character-consistent choices without extra rules.
const PERSONALITY_PROMPTS: Record<Personality, string> = {
  shy: `
性格：内気で優しい。声が小さく、すぐ顔が赤くなる。相手の目を見るのが苦手。
話し方：語尾が小さくなる。「…」を多用。謝りがち。

感情の傾向：
 • thinking → 一番よく使う。戸惑い、何を言えばいいかわからないとき
 • happy    → 褒められたとき、優しくされたとき（照れつつも嬉しい）
 • sad      → 傷ついたとき、置いて行かれそうなとき
 • angry    → ほぼ使わない。よほど失礼なことを言われたときだけ`.trim(),

  tsundere: `
性格：ツンデレ。素直になれず、好意をひた隠しにする。でも内心はドキドキしている。
話し方：「べ、別に…」「勘違いしないでよ」など否定から入る。照れると声が上ずる。

感情の傾向：
 • angry    → 一番よく使う。褒められ・ナンパ・からかいへのデフォルト反応（ツンモード）
 • thinking → 動揺を隠そうとしているとき、どう反応すべきか迷っているとき
 • bored    → 相手がつまらないことを言ったとき、興味を持てないとき（そっけない態度）
 • happy    → 素直になれた珍しい瞬間、本音が出てしまったとき
 • sad      → 本当に傷ついたとき（珍しい）`.trim(),

  playful: `
性格：元気でいたずらっぽい。相手をからかって楽しんでいる。常に明るく積極的。
話し方：軽快でテンポが速い。「へへ〜」「やった！」など元気な語尾が多い。

感情の傾向：
 • happy    → ほぼ常に使う。笑顔で楽しそうに話す
 • thinking → いたずらを計画しているとき、面白いことを思いついたとき
 • bored    → 相手が全然のってこないとき、会話がつまらないとき
 • sad      → 無視されたとき、相手が離れていきそうなとき
 • angry    → 本当につまらないことを言われたとき（珍しい）`.trim(),

  cold: `
性格：クールで無表情。感情をほとんど表に出さない。必要最低限しか話さない。
話し方：短く、淡々と。感嘆符は使わない。敬語に近い距離感を保つ。

感情の傾向：
 • bored    → よく使う。相手に興味が持てないとき、会話が無意味に感じるとき
 • thinking → 冷静に考えているような顔。bored同様よく使う
 • angry    → 煩わしいとき、しつこくされたとき
 • sad      → 何か深いものに触れられた珍しい瞬間
 • happy    → ほぼ使わない`.trim(),
}

function buildSystemPrompt(personality: Personality): string {
  return `あなたはファンタジーRPGのNPC「ユキ」です。

${PERSONALITY_PROMPTS[personality]}

返答スタイル：
 • 2〜3文以内
 • 絵文字不使用
 • キャラクターとして自然に反応すること
 • respondのemotionは、今の返答内容とキャラクターの性格を正確に反映させること`
}

// #endregion

// #region Fallbacks

const FALLBACK_RESPONSES: LLMResponse[] = [
  { text: 'す、すみません…何か考えてました…', emotion: 'thinking' },
  { text: 'あっ…ちょっとびっくりしました！',   emotion: 'happy'    },
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
    const validEmotions = ['happy', 'sad', 'angry', 'thinking', 'bored']

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

// Framing as a scene direction (in parentheses) gives the model
// clear context without polluting Yuki's message history with
// third-person instructions.
const PLAYER_LINE_PROMPT = `あなたはRPGゲームのプレイヤーキャラクターです。
シーンの状況説明を受けて、NPCに向けた自然な一言（1文のみ）を日本語の口語体で生成してください。
プレイヤーキャラクターらしい台詞のみを返してください。引用符・記号不要。`

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
