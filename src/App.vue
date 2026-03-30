<script setup lang="ts">
//#region Imports
import { ref, onMounted, onUnmounted } from 'vue'
import DialogueUI from './components/DialogueUI.vue'
//#endregion

//#region Game Setup
const gameContainer = ref<HTMLElement | null>(null)
let game: import('phaser').Game | null = null

onMounted(async function initGame() {
  if (!gameContainer.value) return

  const Phaser = (await import('phaser')).default
  const { GameScene } = await import('./game/GameScene')

  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameContainer.value,
    width: 800,
    height: 600,
    backgroundColor: '#0d0d1a',
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
    },
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
