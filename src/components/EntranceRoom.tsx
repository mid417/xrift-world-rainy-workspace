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
 * 主空間の背面壁に接続し、境界壁に通行可能な穴を開ける
 */
export const EntranceRoom: React.FC<EntranceRoomProps> = ({
  width = 8,
  depth = 4,
  height = WORLD_CONFIG.wallHeight,
  connectionZ = -WORLD_CONFIG.size / 2,
  doorWidth = 2,
  doorHeight = 2.5,
}) => {
  const wallThickness = WORLD_CONFIG.wallThickness

  // 小部屋の中心Z座標（主空間の背面壁から外側へ）
  const roomCenterZ = connectionZ - depth / 2

  // 穴の下端Y座標（床から）
  const doorBottomY = 0

  // 境界壁（穴あき）の左右パーツ
  const boundaryWallLeftWidth = (width - doorWidth) / 2
  const boundaryWallRightWidth = (width - doorWidth) / 2
  const boundaryWallLeftX = -width / 2 + boundaryWallLeftWidth / 2
  const boundaryWallRightX = width / 2 - boundaryWallRightWidth / 2

  // 境界壁上部パーツ（穴の上）
  const boundaryWallTopHeight = (height - doorHeight - doorBottomY) / 2
  const boundaryWallTopY = height - boundaryWallTopHeight / 2

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

      {/* 境界壁（穴あき）- 左パーツ */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[boundaryWallLeftX, height / 2, connectionZ]}>
          <boxGeometry args={[boundaryWallLeftWidth, height, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 境界壁（穴あき）- 右パーツ */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[boundaryWallRightX, height / 2, connectionZ]}>
          <boxGeometry args={[boundaryWallRightWidth, height, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 境界壁（穴あき）- 上部パーツ */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, boundaryWallTopY, connectionZ]}>
          <boxGeometry args={[doorWidth, boundaryWallTopHeight, wallThickness]} />
          <meshLambertMaterial color={COLORS.wall} />
        </mesh>
      </RigidBody>
    </group>
  )
}
