<script setup lang="ts">
//#region Imports
import { gameStore } from '../game/store'
import type { Personality } from '../game/types'
//#endregion

//#region Options
const options: { value: Personality; label: string; hint: string }[] = [
  { value: 'shy',      label: '内気',      hint: '恥ずかしがり屋' },
  { value: 'tsundere', label: 'ツンデレ',   hint: '素直になれない' },
  { value: 'playful',  label: '元気',      hint: 'いたずらっぽい' },
  { value: 'cold',     label: 'クール',     hint: '無表情・淡々' },
]
//#endregion

//#region Handlers
function select(p: Personality) {
  if (gameStore.personality === p) return
  gameStore.personality = p
  // Reset conversation so new personality applies from the start
  gameStore.history = []
  gameStore.npcText = ''
}
//#endregion
</script>

<template>
  <!--#region Personality Selector -->
  <div class="personality-panel">
    <div class="panel-title">キャラクター</div>
    <div class="options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="option"
        :class="{ 'option--active': gameStore.personality === opt.value }"
        @click="select(opt.value)"
      >
        <span class="option-dot"></span>
        <span class="option-label">{{ opt.label }}</span>
        <span class="option-hint">{{ opt.hint }}</span>
      </button>
    </div>
  </div>
  <!--#endregion -->
</template>

<style scoped>
.personality-panel {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 50;
  background: rgba(10, 5, 25, 0.88);
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: 10px;
  padding: 12px 14px;
  min-width: 148px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  pointer-events: all;
}

.panel-title {
  font-family: monospace;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #7c3aed;
  margin-bottom: 10px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.option:hover {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(124, 58, 237, 0.3);
}

.option--active {
  background: rgba(124, 58, 237, 0.2);
  border-color: rgba(167, 139, 250, 0.5);
}

.option-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #7c3aed;
  flex-shrink: 0;
  transition: background 0.15s;
}

.option--active .option-dot {
  background: #a78bfa;
  border-color: #a78bfa;
}

.option-label {
  font-family: monospace;
  font-size: 13px;
  color: #e9d5ff;
  font-weight: 500;
}

.option-hint {
  font-family: monospace;
  font-size: 10px;
  color: #7c3aed;
  margin-left: auto;
}
</style>
