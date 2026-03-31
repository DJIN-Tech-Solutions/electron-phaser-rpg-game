import type { LLMResponse, Message, Personality } from '../game/types'

// #region Dummy Data

const PLAYER_LINES: Record<string, string> = {
  flirt:   '君のことが頭から離れないんだよね。',
  neutral: '最近どんなことしてるの？',
  tease:   'そんな顔されると、もっとからかいたくなるよ？',
}

const FALLBACK_PLAYER_LINE = 'あ、えっと…何の話でしたっけ？'

const DUMMY_RESPONSES: Record<Personality, LLMResponse[]> = {
  shy: [
    { text: 'あ、あの…急にそんなこと言われても困ります…！', emotion: 'thinking' },
    { text: 'え…わ、わたしのこと、ですか…？', emotion: 'happy' },
    { text: 'す、すみません…うまく答えられなくて…', emotion: 'thinking' },
    { text: 'そ、そんなこと言われたら…顔が上げられません…', emotion: 'happy' },
    { text: 'ち、違います…！そういう意味じゃ、なくて…', emotion: 'thinking' },
    { text: 'あっ…ちょっとびっくりしました！', emotion: 'happy' },
    { text: '…正直に言うと、少し嬉しかったです。', emotion: 'happy' },
    { text: 'ごめんなさい…何か考え込んでしまいました…', emotion: 'thinking' },
    { text: '…傷つけるつもりでしたか？', emotion: 'sad' },
    { text: 'うーん…どうすればいいんでしょう…', emotion: 'thinking' },
  ],

  tsundere: [
    { text: 'べ、別にあなたのことなんか気にしてないですから！', emotion: 'angry' },
    { text: '勘違いしないでよ！たまたまここにいただけなんだから！', emotion: 'angry' },
    { text: 'ふん…まあ、悪くはないと思うけど？', emotion: 'thinking' },
    { text: 'な、なに見てるのよ！変な人！', emotion: 'angry' },
    { text: '…べ、別に嬉しくないですし？全然？', emotion: 'happy' },
    { text: 'もう、しつこいんですけど！…でも、まあ…', emotion: 'thinking' },
    { text: 'あなたって本当にうるさいですよね。…でも飽きないけど。', emotion: 'bored' },
    { text: '！…び、びっくりさせないでよ、もう！', emotion: 'angry' },
    { text: 'ちょっと…それはちょっと、嬉しいかもしれない。ちょっとだけ。', emotion: 'happy' },
    { text: 'な、なによ急に。…正直、悪い気はしないけど。', emotion: 'thinking' },
  ],

  playful: [
    { text: 'へへ〜、引っかかった！やっぱりそう反応するよね〜！', emotion: 'cheerleading' },
    { text: 'えー！もっと続けてよ、面白いんだけど！', emotion: 'happy' },
    { text: 'あはは、そんな顔しないでよ〜かわいいじゃん！', emotion: 'happy' },
    { text: 'うわー、天才すぎる！さすが！', emotion: 'cheerleading' },
    { text: 'ちょっとちょっと、それはずるいでしょ〜！', emotion: 'happy' },
    { text: 'んー…それはちょっとつまんないかも？', emotion: 'bored' },
    { text: 'やばい！もっかい言って！もっかい！', emotion: 'cheerleading' },
    { text: 'はい、そこ照れるとこ〜！わかりやすい！', emotion: 'happy' },
    { text: 'え、マジで？それ本気で言ってる？最高じゃん！', emotion: 'cheerleading' },
    { text: 'もしかして…負けず嫌い？ふふ、かわいい〜', emotion: 'happy' },
  ],

  cold: [
    { text: '…そうですか。', emotion: 'bored' },
    { text: '特に興味はありません。', emotion: 'bored' },
    { text: '…よくわかりません。', emotion: 'thinking' },
    { text: '必要なことだけ話してください。', emotion: 'bored' },
    { text: '…少し、考えさせてください。', emotion: 'thinking' },
    { text: 'うるさいです。', emotion: 'angry' },
    { text: '…悪くはないと思います。', emotion: 'thinking' },
    { text: '…それは。少し、意外でした。', emotion: 'sad' },
    { text: 'それ以上は結構です。', emotion: 'angry' },
    { text: '…まあ。', emotion: 'bored' },
  ],
}

// #endregion

// #region Helpers

function pickDummy(personality: Personality): LLMResponse {
  const pool = DUMMY_RESPONSES[personality]
  return pool[Math.floor(Math.random() * pool.length)]
}

function resolvePlayerLine(intent: string): string {
  for (const [key, line] of Object.entries(PLAYER_LINES)) {
    if (intent.includes(key)) return line
  }
  return FALLBACK_PLAYER_LINE
}

function fakeDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// #endregion

// #region Composable

const $llm = {
  async generatePlayerLine(intent: string): Promise<string> {
    await fakeDelay(300)
    return resolvePlayerLine(intent)
  },

  async send(history: Message[], personality: Personality = 'shy'): Promise<LLMResponse> {
    await fakeDelay(600)
    return pickDummy(personality)
  },
} as const

export default $llm

// #endregion
