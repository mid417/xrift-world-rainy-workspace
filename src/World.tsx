import { LiveVideoPlayer, ScreenShareDisplay, SpawnPoint, TagBoard } from '@xrift/world-components'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { useState } from 'react'
import { RainBGM } from './components/RainBGM'
import { RainSky } from './components/RainSky'
import { RainWindow } from './components/RainWindow'
import { EntryLogBoard } from './components/EntryLogBoard'
import { EntranceRoom } from './components/EntranceRoom'
import { TeleportPortal } from './components/TeleportPortal'
import { COLORS, WORLD_CONFIG } from './constants'

export interface WorldProps {
  position?: [number, number, number]
  scale?: number
}

export const World: React.FC<WorldProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  const worldSize = WORLD_CONFIG.size
  const wallHeight = WORLD_CONFIG.wallHeight
  const wallThickness = WORLD_CONFIG.wallThickness
  const [rainVolume, setRainVolume] = useState(0.6)

  // 小部屋の前面壁 Z 座標（大部屋背面壁から 100units 外）
  const entranceConnectionZ = -worldSize / 2 - 100

  const tableCenter: [number, number, number] = [0, 0.75, 0]
  const tableTopSize = 2.0
  const tableTopThickness = 0.08

  const screenDistance = 2.5
  const screenY = 1.65

  return (
    <group position={position} scale={scale}>
      <RainBGM fileName="Rain-Real_Ambi01-1.mp3" volume={rainVolume * 0.06} />

      {/* 雨天の空（シェーダー） */}
      <RainSky radius={500} />

      {/* 入口用小部屋（独立・テレポートで行き来） */}
      <EntranceRoom
        width={10}
        depth={16}
        height={wallHeight}
        connectionZ={entranceConnectionZ}
        doorWidth={1.5}
        doorHeight={2.5}
      />

      {/* プレイヤーのスポーン地点（小部屋内） */}
      <group position={[0, 0, -128]} rotation={[0, Math.PI, 0]}>
        <SpawnPoint />
      </group>

      {/* 照明設定（室内想定で控えめ） */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* 床 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[worldSize, worldSize]} />
          <meshLambertMaterial color={COLORS.ground} />
        </mesh>
      </RigidBody>

      {/* 天井 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, wallHeight, 0]}>
          <planeGeometry args={[worldSize, worldSize]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 壁（窓以外の3面） */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[worldSize / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, worldSize]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[-worldSize / 2, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, worldSize]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 背面壁（ソリッド・扉装飾付き） */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, wallHeight / 2, -worldSize / 2]}>
          <boxGeometry args={[worldSize, wallHeight, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 大部屋側 扉装飾フレーム */}
      <mesh position={[0, 1.25, -worldSize / 2 + wallThickness / 2 + 0.01]}>
        <boxGeometry args={[1.65, 2.65, 0.02]} />
        <meshLambertMaterial color="#5C4008" />
      </mesh>

      {/* 大部屋側 扉装飾パネル */}
      <mesh position={[0, 1.25, -worldSize / 2 + wallThickness / 2 + 0.02]}>
        <boxGeometry args={[1.5, 2.5, 0.02]} />
        <meshLambertMaterial color={COLORS.door} />
      </mesh>

      {/* 大部屋側テレポートポータル（扉前） */}
      <TeleportPortal
        position={[0, 0, -worldSize / 2 + 1.5]}
        destination={[0, 0, -124]}
        label="玄関へ"
        color="#3B82F6"
      />

      {/* 大きな窓（正面壁の代わり） */}
      <RainWindow
        width={worldSize * 0.92}
        height={wallHeight * 0.86}
        position={[0, wallHeight * 0.52, worldSize / 2 - wallThickness * 0.55]}
        rotation={[0, Math.PI, 0]}
        colliderThickness={0.08}
        rainVolume={rainVolume}
        onVolumeChange={setRainVolume}
      />

      {/* 壁側の表示機器 */}
      <ScreenShareDisplay
        id="screen-share-1"
        position={[worldSize / 2 - wallThickness * 0.6, 2.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={8}
      />

      <LiveVideoPlayer
        id="live-video-1"
        position={[tableCenter[0], screenY, tableCenter[2] - screenDistance]}
        rotation={[0, Math.PI, 0]}
        width={4}
        volume={0.2}
      />

      <LiveVideoPlayer
        id="live-video-2"
        position={[tableCenter[0], screenY, tableCenter[2] + screenDistance]}
        rotation={[0, 0, 0]}
        width={4}
        volume={0.2}
      />

      <LiveVideoPlayer
        id="live-video-3"
        position={[tableCenter[0] - screenDistance, screenY, tableCenter[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={4}
        volume={0.2}
      />

      <LiveVideoPlayer
        id="live-video-4"
        position={[tableCenter[0] + screenDistance, screenY, tableCenter[2]]}
        rotation={[0, Math.PI / 2, 0]}
        width={4}
        volume={0.2}
      />

      {/* 入退室ログボード注記 */}
      <Text
        position={[-4.02, 0.42, -14.]}
        rotation={[0, 0, 0]}
        fontSize={0.04 * scale}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2 * scale}
      >
        効果音は OtoLogicの素材を使用しています
      </Text>

      {/* 入退室ログボード */}
      <EntryLogBoard
        position={[-4.49, 1.7, -14.58]}
        rotation={[0, 0, 0]}
        scale={1}
      />

      {/* タグボード（小部屋内） */}
      <TagBoard
        instanceStateKey="rainy-tags"
        position={[4.7115277530066, 2.1, -120.487894322149]}
        scale={1}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* 小部屋側テレポートポータル（扉前） */}
      <TeleportPortal
        position={[0, 0, entranceConnectionZ - 1.5]}
        destination={[0, 0, -10]}
        label="大部屋へ"
        color="#10B981"
        labelRotationY={180}
      />

      {/* 室内の簡単な置き家具 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={tableCenter} castShadow>
          <boxGeometry args={[tableTopSize, tableTopThickness, tableTopSize]} />
          <meshLambertMaterial color={COLORS.decorations.box} />
        </mesh>
      </RigidBody>
    </group>
  )
}
