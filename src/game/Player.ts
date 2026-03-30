import Phaser from 'phaser'

// #region Types & Constants

type Cursors = Record<
  'w' | 'a' | 's' | 'd' | 'up' | 'left' | 'down' | 'right',
  Phaser.Input.Keyboard.Key
>

const enum Anim {
  Left  = 'player_left',
  Right = 'player_right',
  Up    = 'player_up',
  Down  = 'player_down',
}

const SPEED = 175

// #endregion

// #region Player

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  cursors!: Cursors
  selector!: Phaser.Physics.Arcade.StaticBody
  interactKey!: Phaser.Input.Keyboard.Key
  escKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 'misa-front')

    scene.add.existing(this)
    scene.physics.world.enable(this)

    // Collision box at the feet (character is taller than the tile)
    this.setSize(32, 42).setOffset(0, 22)
    this.setCollideWorldBounds(true)

    scene.cameras.main.startFollow(this)
    scene.cameras.main.setZoom(1.5)

    this.cursors = scene.input.keyboard!.addKeys(
      'w,a,s,d,up,left,down,right',
    ) as Cursors

    this.interactKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    )

    this.escKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    )

    this.buildAnimations()

    // Small invisible body used for NPC interaction overlap detection
    this.selector = scene.physics.add.staticBody(x - 8, y + 32, 16, 16)
  }

  private buildAnimations() {
    const anims = this.scene.anims

    function make(key: Anim, prefix: string) {
      if (anims.exists(key)) return
      anims.create({
        key,
        frames: anims.generateFrameNames('player', {
          prefix: `${prefix}-walk.`,
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      })
    }

    make(Anim.Left,  'misa-left')
    make(Anim.Right, 'misa-right')
    make(Anim.Up,    'misa-back')
    make(Anim.Down,  'misa-front')
  }

  private updateSelector(anim: Anim) {
    const b = this.body
    switch (anim) {
      case Anim.Left:  this.selector.x = b.x - 19;   this.selector.y = b.y + 14; break
      case Anim.Right: this.selector.x = b.x + 35;   this.selector.y = b.y + 14; break
      case Anim.Up:    this.selector.x = b.x + 8;    this.selector.y = b.y - 18; break
      case Anim.Down:  this.selector.x = b.x + 8;    this.selector.y = b.y + 46; break
    }
  }

  update() {
    const { anims, body, cursors } = this
    const prev = body.velocity.clone()

    body.setVelocity(0)

    // Horizontal
    if (cursors.left.isDown  || cursors.a.isDown) body.setVelocityX(-SPEED)
    else if (cursors.right.isDown || cursors.d.isDown) body.setVelocityX(SPEED)

    // Vertical
    if (cursors.up.isDown   || cursors.w.isDown) body.setVelocityY(-SPEED)
    else if (cursors.down.isDown  || cursors.s.isDown) body.setVelocityY(SPEED)

    // Normalize diagonal to prevent speed boost
    body.velocity.normalize().scale(SPEED)

    // Animation + selector update (left/right has priority)
    if      (cursors.left.isDown  || cursors.a.isDown)  { anims.play(Anim.Left,  true); this.updateSelector(Anim.Left) }
    else if (cursors.right.isDown || cursors.d.isDown)  { anims.play(Anim.Right, true); this.updateSelector(Anim.Right) }
    else if (cursors.up.isDown    || cursors.w.isDown)  { anims.play(Anim.Up,    true); this.updateSelector(Anim.Up) }
    else if (cursors.down.isDown  || cursors.s.isDown)  { anims.play(Anim.Down,  true); this.updateSelector(Anim.Down) }
    else {
      anims.stop()
      // Idle frame based on last movement direction
      if      (prev.x < 0) { this.setTexture('player', 'misa-left');  this.updateSelector(Anim.Left) }
      else if (prev.x > 0) { this.setTexture('player', 'misa-right'); this.updateSelector(Anim.Right) }
      else if (prev.y < 0) { this.setTexture('player', 'misa-back');  this.updateSelector(Anim.Up) }
      else if (prev.y > 0) { this.setTexture('player', 'misa-front'); this.updateSelector(Anim.Down) }
    }
  }
}

// #endregion
