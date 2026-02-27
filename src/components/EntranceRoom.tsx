import { RigidBody } from '@react-three/rapier'
import { COLORS, WORLD_CONFIG } from '../constants'

export interface EntranceRoomProps {
  /** 小部屋の幅（X方向） */
  width?: number
  /** 小部屋の奥行き（Z方向） */
  depth?: number
  /** 小部屋の高さ */
  height?: number
  /** 主空間との接続位置（Z座標） */
  connectionZ?: number
  /** 穴の幅 */
  doorWidth?: number
  /** 穴の高さ */
  doorHeight?: number
}

/**
 * 入口用の箱型小部屋
 * 独立した空間として配置し、前面壁に扉装飾を備える
 * useTeleport による行き来を想定
 */
export const EntranceRoom: React.FC<EntranceRoomProps> = ({
  width = 8,
  depth = 4,
  height = WORLD_CONFIG.wallHeight,
  connectionZ = -WORLD_CONFIG.size / 2 - 5,
  doorWidth = 2,
  doorHeight = 2.5,
}) => {
  const wallThickness = WORLD_CONFIG.wallThickness

  // 小部屋の中心Z座標（主空間の背面壁から外側へ）
  const roomCenterZ = connectionZ - depth / 2

  // 扉装飾に使用

  return (
    <group>
      {/* 小部屋の床 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, roomCenterZ]}
          receiveShadow
        >
          <planeGeometry args={[width, depth]} />
          <meshLambertMaterial color={COLORS.ground} />
        </mesh>
      </RigidBody>

      {/* 小部屋の天井 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, roomCenterZ]}>
          <planeGeometry args={[width, depth]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 小部屋左壁 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[-width / 2, height / 2, roomCenterZ]}>
          <boxGeometry args={[wallThickness, height, depth]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 小部屋右壁 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[width / 2, height / 2, roomCenterZ]}>
          <boxGeometry args={[wallThickness, height, depth]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 小部屋奥壁 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, height / 2, connectionZ - depth]}>
          <boxGeometry args={[width, height, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 前面壁（ソリッド・扉装飾付き） */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, height / 2, connectionZ]}>
          <boxGeometry args={[width, height, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 扉装飾フレーム（室内側） */}
      <mesh position={[0, doorHeight / 2, connectionZ + wallThickness / 2 + 0.01]}>
        <boxGeometry args={[doorWidth + 0.15, doorHeight + 0.15, 0.02]} />
        <meshLambertMaterial color="#5C4008" />
      </mesh>

      {/* 扉装飾パネル（室内側） */}
      <mesh position={[0.03, doorHeight / 2, connectionZ + wallThickness / 2 + 0.02]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.02]} />
        <meshLambertMaterial color={COLORS.door} />
      </mesh>
    </group>
  )
}
