import Phaser from 'phaser'
import { gameStore } from './store'

// #region Constants

const PLAYER_SPEED = 220
const INTERACT_RANGE = 90
const DESIGN_W = 800
const DESIGN_H = 600

// Fixed NPC position in design space
const NPC_X = 580
const NPC_Y = 260

// #endregion

// #region GameScene

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle
  private wasd!: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private interactKey!: Phaser.Input.Keyboard.Key
  private escKey!: Phaser.Input.Keyboard.Key
  private hintText!: Phaser.GameObjects.Text
  private npcLabel!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.drawRoom()
    this.createNPC()
    this.createPlayer()
    this.setupInput()
    this.createHintText()
  }

  private drawRoom() {
    const gfx = this.add.graphics()

    // Floor
    gfx.fillStyle(0x1a1a2e)
    gfx.fillRect(60, 50, 680, 480)

    // Walls border
    gfx.lineStyle(3, 0x7c3aed, 1)
    gfx.strokeRect(60, 50, 680, 480)

    // Window decoration (top right)
    gfx.fillStyle(0x0ea5e9, 0.3)
    gfx.fillRect(560, 65, 100, 60)
    gfx.lineStyle(2, 0x38bdf8, 0.8)
    gfx.strokeRect(560, 65, 100, 60)
    gfx.strokeRect(560, 65, 50, 60)

    // Bookshelves (left wall)
    gfx.fillStyle(0x4a2d08)
    gfx.fillRect(75, 100, 30, 180)
    gfx.fillStyle(0x7c3aed, 0.6)
    for (let i = 0; i < 5; i++) {
      gfx.fillRect(78, 104 + i * 34, 24, 28)
    }

    // Floor rug
    gfx.fillStyle(0x4c1d95, 0.4)
    gfx.fillRect(200, 220, 380, 200)
    gfx.lineStyle(1, 0xa78bfa, 0.5)
    gfx.strokeRect(200, 220, 380, 200)

    // NPC area marker (soft glow)
    gfx.fillStyle(0xff9de2, 0.08)
    gfx.fillCircle(NPC_X, NPC_Y, 60)
  }

  private createNPC() {
    // NPC body (anime girl silhouette — simple shapes)
    const gfx = this.add.graphics()

    // Shadow
    gfx.fillStyle(0x000000, 0.3)
    gfx.fillEllipse(NPC_X, NPC_Y + 45, 40, 12)

    // Body
    gfx.fillStyle(0xff9de2)
    gfx.fillRect(NPC_X - 14, NPC_Y - 20, 28, 50)

    // Head
    gfx.fillStyle(0xffd4c0)
    gfx.fillCircle(NPC_X, NPC_Y - 32, 18)

    // Hair
    gfx.fillStyle(0x7c3aed)
    gfx.fillRect(NPC_X - 18, NPC_Y - 50, 36, 24)
    gfx.fillCircle(NPC_X, NPC_Y - 50, 18)

    // Eyes
    gfx.fillStyle(0xffffff)
    gfx.fillCircle(NPC_X - 7, NPC_Y - 33, 4)
    gfx.fillCircle(NPC_X + 7, NPC_Y - 33, 4)
    gfx.fillStyle(0x7c3aed)
    gfx.fillCircle(NPC_X - 7, NPC_Y - 32, 2.5)
    gfx.fillCircle(NPC_X + 7, NPC_Y - 32, 2.5)

    // Name label
    this.npcLabel = this.add.text(NPC_X, NPC_Y - 75, 'Yuki', {
      fontSize: '13px',
      color: '#f0abfc',
      fontFamily: 'monospace',
      backgroundColor: '#00000066',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5)
  }

  private createPlayer() {
    const gfx = this.add.graphics()

    // Shadow
    gfx.fillStyle(0x000000, 0.3)
    gfx.fillEllipse(200, 317, 28, 8)

    // Player body
    gfx.fillStyle(0x4f46e5)
    gfx.fillRect(186, 282, 28, 38)

    // Head
    gfx.fillStyle(0xffd4c0)
    gfx.fillCircle(200, 272, 14)

    // Hair
    gfx.fillStyle(0x1e1b4b)
    gfx.fillRect(186, 260, 28, 16)
    gfx.fillCircle(200, 260, 14)

    // This is the physics/movement rectangle (invisible, drives the body graphics)
    this.player = this.add.rectangle(200, 295, 28, 52, 0x000000, 0)
  }

  private setupInput() {
    const kb = this.input.keyboard!
    this.cursors = kb.createCursorKeys()
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
  }

  private createHintText() {
    this.hintText = this.add.text(DESIGN_W / 2, DESIGN_H - 55, '', {
      fontSize: '15px',
      color: '#e9d5ff',
      fontFamily: 'monospace',
      backgroundColor: '#1a0a2e99',
      padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setVisible(false)
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000
    const isInDialogue =
      gameStore.state === 'interacting' ||
      gameStore.state === 'waiting_llm' ||
      gameStore.state === 'npc_reply' ||
      gameStore.state === 'player_choice'

    // ESC closes dialogue
    if (Phaser.Input.Keyboard.JustDown(this.escKey) && isInDialogue) {
      gameStore.state = 'idle'
      gameStore.history = []
      return
    }

    if (isInDialogue) return

    // Movement
    let vx = 0
    let vy = 0
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -PLAYER_SPEED
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = PLAYER_SPEED
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -PLAYER_SPEED
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = PLAYER_SPEED

    this.player.x = Phaser.Math.Clamp(this.player.x + vx * dt, 90, DESIGN_W - 90)
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * dt, 80, DESIGN_H - 80)

    // Proximity check
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, NPC_X, NPC_Y)
    const near = dist < INTERACT_RANGE

    if (near) {
      this.hintText.setText('[ E ] 話しかける').setVisible(true)
      if (gameStore.state !== 'near_npc') gameStore.state = 'near_npc'

      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        gameStore.state = 'interacting'
        this.hintText.setVisible(false)
      }
    } else {
      this.hintText.setVisible(false)
      if (gameStore.state === 'near_npc') gameStore.state = 'idle'
    }
  }
}

// #endregion
