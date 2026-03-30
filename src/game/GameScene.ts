import Phaser from 'phaser'
import { gameStore } from './store'
import { Player } from './Player'

// #region Constants

const TILESET_NAME = 'tuxemon-sample-32px-extruded'

// Yuki's fixed position in the world (near the town center, above spawn)
const YUKI_X = 500
const YUKI_Y = 960

// Radius within which the hint appears
const HINT_RANGE = 80

// #endregion

// #region GameScene

export class GameScene extends Phaser.Scene {
  private player!: Player
  private worldLayer!: Phaser.Tilemaps.TilemapLayer
  private hintText!: Phaser.GameObjects.Text
  private yukiNpc!: Phaser.GameObjects.Container
  private yukiBody!: Phaser.Physics.Arcade.StaticBody
  private wasInDialogue = false

  constructor() {
    super({ key: 'GameScene' })
  }

  // #region Create

  create() {
    this.buildMap()
    this.buildNPC()
    this.buildPlayer()
    this.buildHint()
    this.setupNPCInteraction()
  }

  private buildMap() {
    const tilemap = this.make.tilemap({ key: 'map' })
    const tileset = tilemap.addTilesetImage(TILESET_NAME, 'tiles')!

    tilemap.createLayer('Below Player', tileset, 0, 0)
    this.worldLayer = tilemap.createLayer('World', tileset, 0, 0)!
    const aboveLayer = tilemap.createLayer('Above Player', tileset, 0, 0)!

    this.worldLayer.setCollisionByProperty({ collides: true })

    // World bounds match tilemap
    this.physics.world.setBounds(0, 0, this.worldLayer.width, this.worldLayer.height)

    // Above-player layer sits on top of the player sprite
    aboveLayer.setDepth(10)

    // Camera bounds
    this.cameras.main.setBounds(0, 0, tilemap.widthInPixels, tilemap.heightInPixels)
  }

  private buildNPC() {
    // Draw Yuki as a pixel-art top-down character tinted pink
    const npcSprite = this.add.sprite(0, 0, 'player', 'misa-left')
    npcSprite.setTint(0xff9de2)

    // Name label
    const label = this.add.text(0, -36, 'ユキ', {
      fontSize: '11px',
      color: '#f0abfc',
      fontFamily: 'monospace',
      backgroundColor: '#0d0a1ecc',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5)

    // Interaction range glow ring
    const ring = this.add.circle(0, 0, HINT_RANGE, 0xf0abfc, 0.06)

    this.yukiNpc = this.add.container(YUKI_X, YUKI_Y, [ring, npcSprite, label])
    this.yukiNpc.setDepth(5)

    // Static body for overlap with player selector
    this.yukiBody = this.physics.add.staticBody(YUKI_X - 16, YUKI_Y - 20, 32, 48)
  }

  private buildPlayer() {
    const spawnX = 352
    const spawnY = 1216

    this.player = new Player(this, spawnX, spawnY)
    this.physics.add.collider(this.player, this.worldLayer)
  }

  private buildHint() {
    // Fixed on screen (depth above everything, scrollFactor=0 makes it HUD)
    this.hintText = this.add
      .text(400, 520, '[ E ] 話しかける', {
        fontSize: '14px',
        color: '#e9d5ff',
        fontFamily: 'monospace',
        backgroundColor: '#1a0a2ecc',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false)
  }

  private setupNPCInteraction() {
    type Body = Phaser.Types.Physics.Arcade.ArcadeColliderType

    this.physics.add.overlap(
      this.yukiBody as unknown as Body,
      this.player.selector as unknown as Body,
      this.onNearYuki,
      undefined,
      this,
    )
  }

  // #endregion

  // #region Update

  update() {
    const inDialogue =
      gameStore.state === 'interacting' ||
      gameStore.state === 'waiting_llm' ||
      gameStore.state === 'npc_reply' ||
      gameStore.state === 'player_choice'

    // Resume movement after dialogue closes
    if (this.wasInDialogue && !inDialogue) {
      this.wasInDialogue = false
    }

    // Lock movement + hide hint during dialogue
    if (inDialogue) {
      this.wasInDialogue = true
      this.hintText.setVisible(false)
      return
    }

    // ESC closes dialogue
    if (Phaser.Input.Keyboard.JustDown(this.player.escKey) && gameStore.state !== 'idle') {
      gameStore.state = 'idle'
      gameStore.history = []
      return
    }

    this.player.update()
    this.updateProximityHint()
  }

  private onNearYuki() {
    if (
      gameStore.state === 'idle' ||
      gameStore.state === 'near_npc'
    ) {
      if (gameStore.state !== 'near_npc') gameStore.state = 'near_npc'
      this.hintText.setVisible(true)

      if (Phaser.Input.Keyboard.JustDown(this.player.interactKey)) {
        gameStore.state = 'interacting'
        this.hintText.setVisible(false)
      }
    }
  }

  private updateProximityHint() {
    // Hide hint when selector is no longer overlapping the NPC body
    // The overlap callback handles showing it — here we handle the "left range" case
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      YUKI_X, YUKI_Y,
    )

    if (dist > HINT_RANGE + 20) {
      this.hintText.setVisible(false)
      if (gameStore.state === 'near_npc') gameStore.state = 'idle'
    }
  }

  // #endregion
}

// #endregion
