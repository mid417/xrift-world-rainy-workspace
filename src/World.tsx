import { LiveVideoPlayer, ScreenShareDisplay, SpawnPoint, TagBoard } from '@xrift/world-components'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { RainBGM } from './components/RainBGM'
import { RainSky } from './components/RainSky'
import { RainWindow } from './components/RainWindow'
import { EntryLogBoard } from './components/EntryLogBoard'
import { COLORS, WORLD_CONFIG } from './constants'

export interface WorldProps {
  position?: [number, number, number]
  scale?: number
}

export const World: React.FC<WorldProps> = ({ position = [0, 0, 0], scale = 1 }) => {
  const worldSize = WORLD_CONFIG.size
  const wallHeight = WORLD_CONFIG.wallHeight
  const wallThickness = WORLD_CONFIG.wallThickness

  const tableCenter: [number, number, number] = [0, 0.75, 0]
  const tableTopSize = 2.0
  const tableTopThickness = 0.08

  const screenDistance = 2.5
  const screenY = 1.65

  return (
    <group position={position} scale={scale}>
      <RainBGM fileName="Rain-Real_Ambi01-1.mp3" volume={0.01} />

      {/* 雨天の空（シェーダー） */}
      <RainSky radius={500} />

      {/* プレイヤーのスポーン地点 */}
      <group position={[0.11, 0, 7.59]} rotation={[0, 0, 0]}>
        <SpawnPoint />
      </group>

      {/* 照明設定（室内想定で控えめ） */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
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
        <mesh position={[worldSize / 2, wallHeight / 2, 0]} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, worldSize]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[-worldSize / 2, wallHeight / 2, 0]} castShadow>
          <boxGeometry args={[wallThickness, wallHeight, worldSize]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, wallHeight / 2, -worldSize / 2]} castShadow>
          <boxGeometry args={[worldSize, wallHeight, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 大きな窓（正面壁の代わり） */}
      <RainWindow
        width={worldSize * 0.92}
        height={wallHeight * 0.86}
        position={[0, wallHeight * 0.52, worldSize / 2 - wallThickness * 0.55]}
        rotation={[0, Math.PI, 0]}
        colliderThickness={0.08}
      />

      {/* 壁側の表示機器 */}
      <ScreenShareDisplay
        id="screen-share-1"
        position={[worldSize / 2 - wallThickness * 0.6, 2.1, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={4}
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
        position={[tableCenter[0] + screenDistance, screenY, tableCenter[2]]}
        rotation={[0, Math.PI / 2, 0]}
        width={4}
        volume={0.2}
      />

      <LiveVideoPlayer
        id="live-video-4"
        position={[tableCenter[0] - screenDistance, screenY, tableCenter[2]]}
        rotation={[0, -Math.PI / 2, 0]}
        width={4}
        volume={0.2}
      />

      {/* 入口（背面側）に入退室ログ */}
      {/* 入退室ログボード注記 */}
      <Text
        position={[-4.2, 0.23, -9.64]}
        rotation={[-1.2244602795081332e-16, -1.4224732503009818e-16, 1.2032737654665154e-16]}
        fontSize={0.04 * scale}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.2 * scale}
      >
        効果音は OtoLogicの素材を使用しています
      </Text>

      <EntryLogBoard
        position={[-4.8, 1.7, -worldSize / 2 + wallThickness * 0.7]}
        rotation={[0, 0, 0]}
        scale={1}
      />

      {/* 背面壁にタグボード */}
      <TagBoard
        instanceStateKey="rainy-tags"
        position={[4.8, 2.1, -worldSize / 2 + wallThickness * 0.7]}
        scale={1}
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
