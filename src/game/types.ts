// #region Types

export type GameState =
  | 'idle'
  | 'near_npc'
  | 'interacting'
  | 'waiting_llm'
  | 'npc_reply'
  | 'player_choice'

export type Emotion = 'thinking' | 'happy' | 'sad' | 'angry' | 'bored' | 'cheerleading' | 'cheers'

export type Personality = 'shy' | 'tsundere' | 'playful' | 'cold'

export interface LLMResponse {
  text: string
  emotion: Emotion
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// #endregion
