<script setup lang="ts">
//#region Imports
import { ref, onMounted, onUnmounted } from 'vue'
import DialogueUI from './components/DialogueUI.vue'
import PersonalitySelector from './components/PersonalitySelector.vue'
//#endregion

//#region Game Setup
const gameContainer = ref<HTMLElement | null>(null)
let game: import('phaser').Game | null = null

onMounted(async function initGame() {
  if (!gameContainer.value) return

  const Phaser = (await import('phaser')).default
  const { BootScene } = await import('./game/BootScene')
  const { GameScene } = await import('./game/GameScene')

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: 800,
    height: 600,
    backgroundColor: '#000',
    scene: [BootScene, GameScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
  })
})

onUnmounted(function destroyGame() {
  game?.destroy(true)
  game = null
})
//#endregion
</script>

<template>
  <!--#region Game Wrapper -->
  <div class="game-wrapper">
    <div ref="gameContainer" id="game-container" />
    <PersonalitySelector />
    <DialogueUI />
  </div>
  <!--#endregion -->
</template>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0d0d1a;
  overflow: hidden;
  position: relative;
}

#game-container {
  width: 100%;
  height: 100%;
}
</style>
