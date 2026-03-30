import { reactive } from 'vue'
import type { GameState, Emotion, Message, Personality } from './types'

// #region Game Store (bridge between Phaser and Vue)

export const gameStore = reactive({
  state: 'idle' as GameState,
  emotion: 'happy' as Emotion,
  npcText: '',
  history: [] as Message[],
  personality: 'shy' as Personality,
  playerText: '',
})

// #endregion
