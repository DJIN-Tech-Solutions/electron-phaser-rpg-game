import type { LLMResponse, Message, Personality } from '../game/types'

// #region Dummy Data

const PLAYER_LINES: Record<string, string[]> = {
  flirt: [
    '君のことが頭から離れないんだよね。',
    'こんなに魅力的な人、初めて会ったかも。',
    'ねえ、このあと一緒にどこか行かない？',
    '君と話してると時間が経つの忘れちゃうな。',
    'その笑顔、反則じゃない？',
    '君のこともっと知りたいな。',
  ],
  neutral: [
    '最近どんなことしてるの？',
    'ここ、いつも来るの？',
    '今日の天気、いいよね。',
    'なんか面白いことあった？',
    '出身どこなの？',
    '好きな食べ物とか、ある？',
    '趣味って何？',
  ],
  tease: [
    'そんな顔されると、もっとからかいたくなるよ？',
    'あれ、もしかして照れてる？',
    'そんなに慌てなくても逃げないよ？',
    'うわ、わかりやす〜い。',
    'へえ、そういうとこ正直だよね。',
    'もしかして私のこと意識してる？',
  ],
}

const FALLBACK_PLAYER_LINES = [
  'あ、えっと…何の話でしたっけ？',
  'うーん、なんて言えばいいかな。',
  '…ちょっと待ってて。',
]

const DUMMY_RESPONSES: Record<Personality, LLMResponse[]> = {
  shy: [
    { text: 'あ、あの…急にそんなこと言われても困ります…！',                   emotion: 'thinking'     },
    { text: 'え…わ、わたしのこと、ですか…？',                                 emotion: 'happy'        },
    { text: 'す、すみません…うまく答えられなくて…',                           emotion: 'thinking'     },
    { text: 'そ、そんなこと言われたら…顔が上げられません…',                   emotion: 'happy'        },
    { text: 'ち、違います…！そういう意味じゃ、なくて…',                       emotion: 'thinking'     },
    { text: 'あっ…ちょっとびっくりしました！',                                 emotion: 'happy'        },
    { text: '…正直に言うと、少し嬉しかったです。',                             emotion: 'happy'        },
    { text: 'ごめんなさい…何か考え込んでしまいました…',                       emotion: 'thinking'     },
    { text: '…傷つけるつもりでしたか？',                                       emotion: 'sad'          },
    { text: 'うーん…どうすればいいんでしょう…',                               emotion: 'thinking'     },
    { text: 'そ…そんなこと急に言わないでください…心臓に悪いです…',           emotion: 'thinking'     },
    { text: '…あの、よく見ないでください。恥ずかしいです。',                   emotion: 'happy'        },
    { text: 'わ、わたし、そういうの苦手で…でも、嫌じゃないです…',             emotion: 'happy'        },
    { text: 'どうしよう…なんて返せばいいか全然わからなくて…',                 emotion: 'thinking'     },
    { text: 'ひどい…そんなこと言わなくていいじゃないですか…',                 emotion: 'sad'          },
    { text: 'そ、それって…本気ですか…？',                                     emotion: 'thinking'     },
    { text: '…うれしいけど、信じていいのか、よくわからなくて。',               emotion: 'happy'        },
    { text: '少しだけ…笑えました。ありがとうございます。',                     emotion: 'happy'        },
    { text: '…なんで急に泣きたい気分になるんでしょう。',                       emotion: 'sad'          },
    { text: 'もう…からかわないでください…本気にしてしまうので…',             emotion: 'thinking'     },
    { text: 'え…え？そ、それって…どういう意味…？',                           emotion: 'thinking'     },
    { text: '…ちょっと、黙っていてもいいですか。少しだけ。',                   emotion: 'thinking'     },
    { text: 'すごく…すごく嬉しかったです。本当に。',                           emotion: 'cheerleading' },
    { text: 'あんまりじろじろ見ないでほしいんですけど…気になっちゃうので…', emotion: 'happy'        },
    { text: 'ふふ…そういうとこ、好きかもしれないです。',                       emotion: 'happy'        },
  ],

  tsundere: [
    { text: 'べ、別にあなたのことなんか気にしてないですから！',                 emotion: 'angry'        },
    { text: '勘違いしないでよ！たまたまここにいただけなんだから！',             emotion: 'angry'        },
    { text: 'ふん…まあ、悪くはないと思うけど？',                               emotion: 'thinking'     },
    { text: 'な、なに見てるのよ！変な人！',                                     emotion: 'angry'        },
    { text: '…べ、別に嬉しくないですし？全然？',                               emotion: 'happy'        },
    { text: 'もう、しつこいんですけど！…でも、まあ…',                         emotion: 'thinking'     },
    { text: 'あなたって本当にうるさいですよね。…でも飽きないけど。',           emotion: 'bored'        },
    { text: '！…び、びっくりさせないでよ、もう！',                             emotion: 'angry'        },
    { text: 'ちょっと…それはちょっと、嬉しいかもしれない。ちょっとだけ。',     emotion: 'happy'        },
    { text: 'な、なによ急に。…正直、悪い気はしないけど。',                     emotion: 'thinking'     },
    { text: 'は？何が言いたいの？わかりやすく言って。',                         emotion: 'angry'        },
    { text: '…べ、別に待ってたわけじゃないんだからね！',                       emotion: 'angry'        },
    { text: 'もーっ！なんでそういうこと平気で言えるの！？',                     emotion: 'angry'        },
    { text: 'あなたって本当に…まあ…悪い人じゃないとは思ってるけど。',         emotion: 'thinking'     },
    { text: 'ちょっと待って、今の…言い方、ひどくない？',                       emotion: 'sad'          },
    { text: 'なんで私ばっかりこんな気持ちにさせるの。ずるい。',                 emotion: 'sad'          },
    { text: '…わかった、認める。少しだけ、ドキッとした。ちょっとだけ！',       emotion: 'happy'        },
    { text: 'えっ……えっ？今、なんて言った？',                                 emotion: 'thinking'     },
    { text: 'もう！そういうとこが嫌いなんだから！…好きだけど！',               emotion: 'cheerleading' },
    { text: '…ふん。まあ一緒にいてあげてもいいけど。感謝しなさいよ。',         emotion: 'bored'        },
    { text: 'なんか…今日のあなた、いつもより腹立つ。なんで。',                 emotion: 'angry'        },
    { text: '…別に、心配してたわけじゃないし。ちょっと気になっただけ。',       emotion: 'thinking'     },
    { text: 'わ、笑ってる場合じゃないでしょ！…でもちょっとおかしかった。',     emotion: 'happy'        },
    { text: 'もうこんな話やめましょ。…でも続けてもいいけど。',                 emotion: 'bored'        },
    { text: '…あなたって、たまにすごいこと言うよね。びっくりする。',           emotion: 'thinking'     },
  ],

  playful: [
    { text: 'へへ〜、引っかかった！やっぱりそう反応するよね〜！',               emotion: 'cheerleading' },
    { text: 'えー！もっと続けてよ、面白いんだけど！',                           emotion: 'happy'        },
    { text: 'あはは、そんな顔しないでよ〜かわいいじゃん！',                     emotion: 'happy'        },
    { text: 'うわー、天才すぎる！さすが！',                                     emotion: 'cheerleading' },
    { text: 'ちょっとちょっと、それはずるいでしょ〜！',                         emotion: 'happy'        },
    { text: 'んー…それはちょっとつまんないかも？',                             emotion: 'bored'        },
    { text: 'やばい！もっかい言って！もっかい！',                               emotion: 'cheerleading' },
    { text: 'はい、そこ照れるとこ〜！わかりやすい！',                           emotion: 'happy'        },
    { text: 'え、マジで？それ本気で言ってる？最高じゃん！',                     emotion: 'cheerleading' },
    { text: 'もしかして…負けず嫌い？ふふ、かわいい〜',                         emotion: 'happy'        },
    { text: 'えっ、急に真面目な顔しないでよ、びびるじゃん！',                   emotion: 'happy'        },
    { text: 'ねえねえ今の顔最高だった、もう一回やって！',                       emotion: 'cheerleading' },
    { text: 'あー、なんか私今日機嫌いいな〜あなたのせいだよ？',                 emotion: 'happy'        },
    { text: 'うーん…面白くなくはないけど、もうひと押し欲しいかな〜。',         emotion: 'bored'        },
    { text: 'え！？それほんとに言っちゃうの！？すき〜！！',                     emotion: 'cheerleading' },
    { text: 'あれ、今ちょっとよくなかった？自分でもわかった？',                 emotion: 'happy'        },
    { text: '…ごめん、今のちょっとだけ刺さった。ちょっとね。',                 emotion: 'sad'          },
    { text: 'なんかさー、あなたってほんと読めないよね。それが好きだけど！',     emotion: 'happy'        },
    { text: 'えー！そんなこと言うの！？ずるっ！！',                             emotion: 'cheerleading' },
    { text: '笑ったら負けだと思ってたのに…負けた。',                           emotion: 'happy'        },
    { text: 'もうやだ〜！なんでそんな上手いこと言えるの！！',                   emotion: 'cheerleading' },
    { text: 'ん〜、まあ合格ってことにしといてあげる。',                         emotion: 'happy'        },
    { text: 'あ、これもしかしてかなり楽しい展開では？',                         emotion: 'cheerleading' },
    { text: 'うわ、その言い方なんかむかつく〜！（笑）',                         emotion: 'happy'        },
    { text: 'はあ〜、もう少し盛り上げてくれたら嬉しかったんだけどな。',         emotion: 'bored'        },
  ],

  cold: [
    { text: '…そうですか。',                                                   emotion: 'bored'    },
    { text: '特に興味はありません。',                                           emotion: 'bored'    },
    { text: '…よくわかりません。',                                             emotion: 'thinking' },
    { text: '必要なことだけ話してください。',                                   emotion: 'bored'    },
    { text: '…少し、考えさせてください。',                                     emotion: 'thinking' },
    { text: 'うるさいです。',                                                   emotion: 'angry'    },
    { text: '…悪くはないと思います。',                                         emotion: 'thinking' },
    { text: '…それは。少し、意外でした。',                                     emotion: 'sad'      },
    { text: 'それ以上は結構です。',                                             emotion: 'angry'    },
    { text: '…まあ。',                                                         emotion: 'bored'    },
    { text: '聞いています。続けてください。',                                   emotion: 'thinking' },
    { text: 'それが何か。',                                                     emotion: 'bored'    },
    { text: '…返す言葉が見当たりません。',                                     emotion: 'thinking' },
    { text: '今それを聞く必要がありますか。',                                   emotion: 'bored'    },
    { text: '…少し、黙っていてほしいです。',                                   emotion: 'angry'    },
    { text: 'あなたはいつもそういうことを言うんですね。',                       emotion: 'bored'    },
    { text: '…珍しいことを言いますね。',                                       emotion: 'thinking' },
    { text: 'わかりました。以上ですか。',                                       emotion: 'bored'    },
    { text: '…今のは、少し考えさせられました。',                               emotion: 'thinking' },
    { text: '興味があるとしたら、それだけです。',                               emotion: 'thinking' },
    { text: '…感情的になるつもりはありません。ただ、不愉快です。',             emotion: 'angry'    },
    { text: 'それを私に言う理由は何ですか。',                                   emotion: 'bored'    },
    { text: '……。',                                                           emotion: 'thinking' },
    { text: '…覚えておきます。',                                               emotion: 'thinking' },
    { text: '今のは…少し、嫌いじゃなかったです。',                             emotion: 'sad'      },
  ],
}

// #endregion

// #region Helpers

// Avoid repeating the same response twice in a row per personality
const lastPicked: Partial<Record<Personality, number>> = {}

function pickDummy(personality: Personality, history: Message[]): LLMResponse {
  const pool = DUMMY_RESPONSES[personality]

  // Bias toward rarer emotions after many turns to keep late-game surprising
  const turnCount = history.filter(m => m.role === 'user').length
  const useRareBias = turnCount > 4 && Math.random() < 0.25

  let candidates = pool
    .map((r, i) => ({ r, i }))
    .filter(({ i }) => i !== lastPicked[personality])

  if (useRareBias) {
    const rare = candidates.filter(({ r }) =>
      r.emotion === 'sad' || r.emotion === 'cheerleading' || r.emotion === 'cheers'
    )
    if (rare.length > 0) candidates = rare
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  lastPicked[personality] = chosen.i
  return chosen.r
}

function resolvePlayerLine(intent: string): string {
  for (const [key, lines] of Object.entries(PLAYER_LINES)) {
    if (intent.includes(key)) return lines[Math.floor(Math.random() * lines.length)]
  }
  return FALLBACK_PLAYER_LINES[Math.floor(Math.random() * FALLBACK_PLAYER_LINES.length)]
}

function fakeDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// #endregion

// #region Composable

const $llm = {
  async generatePlayerLine(intent: string): Promise<string> {
    await fakeDelay(200 + Math.random() * 200)
    return resolvePlayerLine(intent)
  },

  async send(history: Message[], personality: Personality = 'shy'): Promise<LLMResponse> {
    await fakeDelay(400 + Math.random() * 400)
    return pickDummy(personality, history)
  },
} as const

export default $llm

// #endregion
