<script setup lang="ts">
//#region Imports
import { ref, watch, computed } from 'vue'
import { gameStore } from '../game/store'
import $llm from '../composables/$llm'
import type { Emotion } from '../game/types'
//#endregion

//#region Emotion Map
const emotionMap: Record<Emotion, string> = {
  thinking: '/npc_01_thinking.png',
  happy:    '/npc_01_happy.png',
  sad:      '/npc_01_sad.png',
  angry:    '/npc_01_angry.png',
}
//#endregion

//#region State
const customInput = ref('')
const showInput = ref(false)

const portrait = computed(() => emotionMap[gameStore.emotion])

const isVisible = computed(() =>
  gameStore.state === 'interacting' ||
  gameStore.state === 'waiting_llm' ||
  gameStore.state === 'npc_reply' ||
  gameStore.state === 'player_choice'
)

const isLoading = computed(() => gameStore.state === 'waiting_llm')
//#endregion

//#region Intents (predefined — never sends raw user text)
const INTENTS = {
  flirt:   'プレイヤーがあなたにフリートしています。照れさせようとしています。',
  neutral: 'プレイヤーが普通に話しかけています。',
  tease:   'プレイヤーがあなたをからかっています。少し意地悪な雰囲気です。',
} as const
//#endregion

//#region Conversation Logic
async function sendIntent(intent: string) {
  gameStore.history.push({ role: 'user', content: intent })
  gameStore.emotion = 'thinking'
  gameStore.state = 'waiting_llm'

  const reply = await $llm.send(gameStore.history)

  gameStore.history.push({ role: 'assistant', content: reply.text })
  gameStore.emotion = reply.emotion
  gameStore.npcText = reply.text
  gameStore.state = 'player_choice'
}

async function sendFreeText() {
  const text = customInput.value.trim()
  if (!text) return

  showInput.value = false
  customInput.value = ''

  // Only path where actual user text reaches the LLM
  gameStore.history.push({ role: 'user', content: `プレイヤーが言いました：「${text}」` })
  gameStore.emotion = 'thinking'
  gameStore.state = 'waiting_llm'

  const reply = await $llm.send(gameStore.history)

  gameStore.history.push({ role: 'assistant', content: reply.text })
  gameStore.emotion = reply.emotion
  gameStore.npcText = reply.text
  gameStore.state = 'player_choice'
}

async function startConversation() {
  gameStore.emotion = 'thinking'
  gameStore.state = 'waiting_llm'
  gameStore.history = [{ role: 'user', content: 'プレイヤーがあなたに近づいて話しかけました。' }]

  const reply = await $llm.send(gameStore.history)

  gameStore.history.push({ role: 'assistant', content: reply.text })
  gameStore.emotion = reply.emotion
  gameStore.npcText = reply.text
  gameStore.state = 'player_choice'
}

function handleLeave() {
  gameStore.state = 'idle'
  gameStore.history = []
  gameStore.npcText = ''
  showInput.value = false
  customInput.value = ''
}
//#endregion

//#region Watchers
watch(
  () => gameStore.state,
  function onStateChange(state) {
    if (state === 'interacting') {
      startConversation()
    }
  }
)
//#endregion
</script>

<template>
  <!--#region Dialogue Overlay -->
  <Transition name="slide-up">
    <div v-if="isVisible" class="dialogue-overlay">

      <!--#region Dialogue Box -->
      <div class="dialogue-box">

        <div class="npc-name">Yuki</div>

        <!--#region Text / Loading -->
        <div class="dialogue-text">
          <template v-if="isLoading">
            <span class="loading-bar"></span>
            <span class="loading-bar loading-bar--short"></span>
          </template>
          <template v-else>
            {{ gameStore.npcText }}
          </template>
        </div>
        <!--#endregion -->

        <!--#region Player Options -->
        <div v-if="gameStore.state === 'player_choice'" class="options">

          <template v-if="!showInput">
            <button class="btn btn--flirt"   @click="sendIntent(INTENTS.flirt)">😊 ナンパ</button>
            <button class="btn btn--neutral" @click="sendIntent(INTENTS.neutral)">😐 普通に話す</button>
            <button class="btn btn--tease"   @click="sendIntent(INTENTS.tease)">😏 からかう</button>
            <button class="btn btn--write"   @click="showInput = true">✍️ 何か書く...</button>
            <button class="btn btn--leave"   @click="handleLeave">🚪 立ち去る</button>
          </template>

          <template v-else>
            <div class="input-area">
              <input
                v-model="customInput"
                type="text"
                placeholder="メッセージを入力..."
                class="player-input"
                autofocus
                @keydown.enter="sendFreeText"
                @keydown.escape="showInput = false"
              />
              <button class="btn btn--send" @click="sendFreeText">送信</button>
              <button class="btn btn--cancel" @click="showInput = false">✕</button>
            </div>
          </template>

        </div>
        <!--#endregion -->

      </div>
      <!--#endregion Dialogue Box -->

      <!--#region Portrait -->
      <div class="portrait-container">
        <img
          :src="portrait"
          :alt="gameStore.emotion"
          class="portrait"
          :class="{ 'portrait--thinking': isLoading }"
        />
        <div v-if="isLoading" class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <!--#endregion Portrait -->

    </div>
  </Transition>
  <!--#endregion Dialogue Overlay -->
</template>

<style scoped>
/***  Dialogue Overlay  ***/
.dialogue-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  padding: 0 40px 28px;
  gap: 24px;
  background: linear-gradient(to top, rgba(10, 5, 25, 0.96) 60%, transparent);
  z-index: 100;
  pointer-events: all;
}

/***  Portrait  ***/
.portrait-container {
  position: relative;
  flex-shrink: 0;
}

.portrait {
  width: 260px;
  height: 390px;
  object-fit: cover;
  object-position: top;
  border-radius: 12px 12px 0 0;
  border: 2px solid #7c3aed;
  box-shadow: 0 0 32px rgba(124, 58, 237, 0.6);
  transition: filter 0.3s ease;
}

.portrait--thinking {
  filter: brightness(0.7) saturate(0.6);
}

.thinking-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: #e9d5ff;
  border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/***  Dialogue Box  ***/
.dialogue-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px;
  background: rgba(15, 8, 35, 0.92);
  border: 1px solid rgba(124, 58, 237, 0.4);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.2);
  min-height: 140px;
}

.npc-name {
  font-family: monospace;
  font-size: 13px;
  color: #f0abfc;
  letter-spacing: 2px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(124, 58, 237, 0.3);
  padding-bottom: 6px;
}

/***  Dialogue Text  ***/
.dialogue-text {
  font-family: monospace;
  font-size: 16px;
  color: #f1f5f9;
  line-height: 1.7;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loading-bar {
  height: 14px;
  background: linear-gradient(90deg, #4c1d95, #7c3aed, #4c1d95);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.4s infinite;
  width: 80%;
}

.loading-bar--short {
  width: 50%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/***  Options  ***/
.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-area {
  display: flex;
  gap: 8px;
}

.player-input {
  flex: 1;
  background: rgba(30, 10, 60, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.5);
  border-radius: 8px;
  padding: 8px 14px;
  color: #f1f5f9;
  font-family: monospace;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.player-input:focus {
  border-color: #a78bfa;
}

.btn {
  font-family: monospace;
  font-size: 13px;
  padding: 9px 18px;
  border-radius: 8px;
  border: 1px solid rgba(124, 58, 237, 0.35);
  cursor: pointer;
  transition: all 0.18s;
  background: rgba(20, 8, 45, 0.75);
  color: #d8b4fe;
  text-align: left;
}

.btn:hover {
  background: rgba(124, 58, 237, 0.25);
  border-color: #a78bfa;
  color: #fff;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.25);
  transform: translateX(3px);
}

.btn--flirt:hover   { border-color: #f472b6; color: #fce7f3; background: rgba(244, 114, 182, 0.15); }
.btn--tease:hover   { border-color: #fb923c; color: #fed7aa; background: rgba(251, 146, 60, 0.12); }
.btn--leave:hover   { border-color: #f87171; color: #fecaca; background: rgba(248, 113, 113, 0.12); }
.btn--write         { border-style: dashed; }
.btn--send,
.btn--cancel        { flex-shrink: 0; }

/***  Transition  ***/
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
