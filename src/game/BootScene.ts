import Phaser from 'phaser'

// #region BootScene

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Loading bar
    const { width, height } = this.cameras.main
    const barW = 300
    const barH = 16
    const barX = width / 2 - barW / 2
    const barY = height / 2 - barH / 2

    const bg = this.add.rectangle(barX - 2, barY - 2, barW + 4, barH + 4, 0x2d1b69).setOrigin(0)
    const bar = this.add.rectangle(barX, barY, 0, barH, 0xa78bfa).setOrigin(0)
    this.add.text(width / 2, barY - 28, 'ロード中...', {
      fontSize: '14px',
      color: '#e9d5ff',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.load.on('progress', (p: number) => {
      bar.width = barW * p
    })

    // Tilemap
    this.load.tilemapTiledJSON('map', 'tilemaps/tuxemon-town.json')
    this.load.image('tiles', 'tilesets/tuxemon-sample-32px-extruded.png')

    // Player sprite atlas
    this.load.atlas('player', 'atlas/atlas.png', 'atlas/atlas.json')
  }

  create() {
    this.scene.start('GameScene')
  }
}

// #endregion
