import { useTexture } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useXRift } from '@xrift/world-components'
import { useEffect, useMemo } from 'react'
import { ClampToEdgeWrapping, RepeatWrapping } from 'three'
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
  const { baseUrl } = useXRift()
  const wallThickness = WORLD_CONFIG.wallThickness
  // 小部屋の中心Z座標（主空間の背面壁から外側へ）
  const roomCenterZ = connectionZ - depth / 2
  const clampBetween = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))

  const sideWindowDesiredWidth = 2.8 * 2
  const sideWindowMinSegmentDepth = 0.1
  const sideWindowDesiredHeight = 1.6
  const sideWindowDesiredBottom = 1.45
  const sideWindowMinSegmentHeight = 0.1
  const sideWindowTrim = 0.1
  const sideWindowFrameDepth = 0.04
  const sideWindowFrameThickness = 0.03
  const sideWindowFrameInset = 0.02
  const sideWindowGlassInset = 0.08
  const sideWindowDesiredCenterZ = roomCenterZ - 0.3
  const sideWindowWidth = Math.max(
    Math.min(sideWindowDesiredWidth, depth - sideWindowMinSegmentDepth * 2),
    0,
  )
  const sideWindowCenterMinZ =
    connectionZ - depth + sideWindowMinSegmentDepth + sideWindowWidth / 2
  const sideWindowCenterMaxZ = connectionZ - sideWindowMinSegmentDepth - sideWindowWidth / 2
  const sideWindowCenterZ =
    sideWindowWidth > 0
      ? clampBetween(sideWindowDesiredCenterZ, sideWindowCenterMinZ, sideWindowCenterMaxZ)
      : roomCenterZ
  const sideWindowMaxHeight = Math.max(height - sideWindowMinSegmentHeight * 2, 0)
  const sideWindowHeight =
    sideWindowWidth > 0 && sideWindowMaxHeight > sideWindowGlassInset
      ? Math.min(sideWindowDesiredHeight, sideWindowMaxHeight)
      : 0
  const hasSideWindowOpening = sideWindowWidth > 0 && sideWindowHeight > 0
  const sideWindowBottom = hasSideWindowOpening
    ? clampBetween(
        sideWindowDesiredBottom,
        sideWindowMinSegmentHeight,
        height - sideWindowHeight - sideWindowMinSegmentHeight,
      )
    : 0
  const sideWindowTop = sideWindowBottom + sideWindowHeight
  const sideWindowUpperSegmentHeight = Math.max(height - sideWindowTop, 0)
  const sideWindowOpeningCenterY = sideWindowBottom + sideWindowHeight / 2
  const sideWindowFrontSegmentDepth = hasSideWindowOpening
    ? Math.max(connectionZ - (sideWindowCenterZ + sideWindowWidth / 2), 0)
    : 0
  const sideWindowBackSegmentDepth = hasSideWindowOpening
    ? Math.max(sideWindowCenterZ - sideWindowWidth / 2 - (connectionZ - depth), 0)
    : 0
  const sideWindowFrontSegmentCenterZ = connectionZ - sideWindowFrontSegmentDepth / 2
  const sideWindowBackSegmentCenterZ = connectionZ - depth + sideWindowBackSegmentDepth / 2
  const sideWindowGlassX = -width / 2 + wallThickness / 2 + 0.01
  const sideWindowOuterWidth = sideWindowWidth + sideWindowTrim
  const sideWindowOuterHeight = sideWindowHeight + sideWindowTrim
  const sideWindowInnerWidth = Math.max(sideWindowWidth - sideWindowGlassInset, 0)
  const sideWindowInnerHeight = Math.max(sideWindowHeight - sideWindowGlassInset, 0)
  const sideWindowHalfOuterWidth = sideWindowOuterWidth / 2
  const sideWindowHalfOuterHeight = sideWindowOuterHeight / 2
  const hasSideWindowVisuals =
    hasSideWindowOpening && sideWindowWidth > 0.12 && sideWindowInnerWidth > 0 && sideWindowInnerHeight > 0
  const entranceWallInteriorZ = connectionZ - wallThickness / 2
  const wallTexture = useTexture(`${baseUrl}textures/wall.png`)
  const floorTexture = useTexture(`${baseUrl}textures/floor.png`)
  const ceilingTexture = useTexture(`${baseUrl}textures/ceiling.png`)

  const [sideWallTexture, frontBackWallTexture, tiledFloorTexture, tiledCeilingTexture] = useMemo(() => {
    const createWallTexture = (repeatX: number) => {
      const texture = wallTexture.clone()
      texture.wrapS = RepeatWrapping
      texture.wrapT = ClampToEdgeWrapping
      texture.repeat.set(repeatX, 1)
      texture.needsUpdate = true
      return texture
    }

    const createTiledTexture = (sourceTexture: typeof floorTexture, repeatX: number, repeatY: number) => {
      const texture = sourceTexture.clone()
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.repeat.set(repeatX, repeatY)
      texture.needsUpdate = true
      return texture
    }

    const repeatX = Math.max(width / 2, 1)
    const repeatY = Math.max(depth / 2, 1)

    return [
      createWallTexture(Math.max(depth / 4, 1)),
      createWallTexture(Math.max(width / 4, 1)),
      createTiledTexture(floorTexture, repeatX, repeatY),
      createTiledTexture(ceilingTexture, repeatX, repeatY),
    ]
  }, [ceilingTexture, depth, floorTexture, wallTexture, width])

  useEffect(() => {
    return () => {
      sideWallTexture.dispose()
      frontBackWallTexture.dispose()
      tiledFloorTexture.dispose()
      tiledCeilingTexture.dispose()
    }
  }, [frontBackWallTexture, sideWallTexture, tiledCeilingTexture, tiledFloorTexture])

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
          <meshLambertMaterial map={tiledFloorTexture} color={COLORS.ground} />
        </mesh>
      </RigidBody>

      {/* 小部屋の天井 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, roomCenterZ]}>
          <planeGeometry args={[width, depth]} />
          <meshLambertMaterial map={tiledCeilingTexture} color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 小部屋左壁（大窓開口付き） */}
      {hasSideWindowOpening ? (
        <>
          {sideWindowBottom > 0 && (
            <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
              <mesh position={[-width / 2, sideWindowBottom / 2, roomCenterZ]}>
                <boxGeometry args={[wallThickness, sideWindowBottom, depth]} />
                <meshLambertMaterial color={COLORS.wall} />
              </mesh>
            </RigidBody>
          )}

          {sideWindowUpperSegmentHeight > 0 && (
            <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
              <mesh
                position={[-width / 2, sideWindowTop + sideWindowUpperSegmentHeight / 2, roomCenterZ]}
              >
                <boxGeometry args={[wallThickness, sideWindowUpperSegmentHeight, depth]} />
                <meshLambertMaterial color={COLORS.wall} />
              </mesh>
            </RigidBody>
          )}

          {sideWindowFrontSegmentDepth > 0 && (
            <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
              <mesh position={[-width / 2, sideWindowOpeningCenterY, sideWindowFrontSegmentCenterZ]}>
                <boxGeometry args={[wallThickness, sideWindowHeight, sideWindowFrontSegmentDepth]} />
                <meshLambertMaterial color={COLORS.wall} />
              </mesh>
            </RigidBody>
          )}

          {sideWindowBackSegmentDepth > 0 && (
            <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
              <mesh position={[-width / 2, sideWindowOpeningCenterY, sideWindowBackSegmentCenterZ]}>
                <boxGeometry args={[wallThickness, sideWindowHeight, sideWindowBackSegmentDepth]} />
                <meshLambertMaterial color={COLORS.wall} />
              </mesh>
            </RigidBody>
          )}
        </>
      ) : (
        <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
          <mesh position={[-width / 2, height / 2, roomCenterZ]}>
            <boxGeometry args={[wallThickness, height, depth]} />
            <meshLambertMaterial color={COLORS.wall} />
          </mesh>
        </RigidBody>
      )}

      {/* 小部屋右壁（ソリッド） */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[width / 2, height / 2, roomCenterZ]}>
          <boxGeometry args={[wallThickness, height, depth]} />
          <meshLambertMaterial map={sideWallTexture} color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {hasSideWindowVisuals && (
        <>
          {/* 大窓ガラス（室内側の見た目用） */}
          <mesh position={[sideWindowGlassX, sideWindowOpeningCenterY, sideWindowCenterZ]}>
            <boxGeometry args={[sideWindowFrameDepth, sideWindowInnerHeight, sideWindowInnerWidth]} />
            <meshStandardMaterial color="#BFD7EA" transparent opacity={0.45} />
          </mesh>

          {/* 大窓フレーム（室内側） */}
          <group position={[sideWindowGlassX, sideWindowOpeningCenterY, sideWindowCenterZ]}>
            <mesh position={[0, 0, -sideWindowHalfOuterWidth + sideWindowFrameInset]}>
              <boxGeometry args={[sideWindowFrameThickness, sideWindowOuterHeight, sideWindowFrameDepth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
            <mesh position={[0, 0, sideWindowHalfOuterWidth - sideWindowFrameInset]}>
              <boxGeometry args={[sideWindowFrameThickness, sideWindowOuterHeight, sideWindowFrameDepth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
            <mesh position={[0, sideWindowHalfOuterHeight - sideWindowFrameInset, 0]}>
              <boxGeometry args={[sideWindowFrameThickness, sideWindowFrameDepth, sideWindowOuterWidth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
            <mesh position={[0, -(sideWindowHalfOuterHeight - sideWindowFrameInset), 0]}>
              <boxGeometry args={[sideWindowFrameThickness, sideWindowFrameDepth, sideWindowOuterWidth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
            <mesh>
              <boxGeometry args={[sideWindowFrameDepth, sideWindowInnerHeight, sideWindowFrameDepth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
            <mesh>
              <boxGeometry args={[sideWindowFrameDepth, sideWindowFrameDepth, sideWindowInnerWidth]} />
              <meshLambertMaterial color="#5C4008" />
            </mesh>
          </group>
        </>
      )}

      {/* 小部屋奥壁 */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, height / 2, connectionZ - depth]}>
          <boxGeometry args={[width, height, wallThickness]} />
          <meshLambertMaterial map={frontBackWallTexture} color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 前面壁（ソリッド・扉装飾付き） */}
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0}>
        <mesh position={[0, height / 2, connectionZ]}>
          <boxGeometry args={[width, height, wallThickness]} />
          <meshLambertMaterial map={frontBackWallTexture} color={COLORS.wall} />
        </mesh>
      </RigidBody>

      {/* 扉装飾フレーム（室内側） */}
      <mesh position={[0, doorHeight / 2, entranceWallInteriorZ - 0.01]}>
        <boxGeometry args={[doorWidth + 0.15, doorHeight + 0.15, 0.02]} />
        <meshLambertMaterial color="#5C4008" />
      </mesh>

      {/* 扉装飾パネル（室内側） */}
      <mesh position={[0.03, doorHeight / 2, entranceWallInteriorZ - 0.02]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.02]} />
        <meshLambertMaterial color={COLORS.door} />
      </mesh>

      {/* インターホン風パネル */}
      <group position={[doorWidth / 2 + 0.7, 1.45, entranceWallInteriorZ - 0.03]}>
        <mesh>
          <boxGeometry args={[0.28, 0.42, 0.03]} />
          <meshLambertMaterial color="#D9D9D9" />
        </mesh>
        <mesh position={[0, 0.08, 0.02]}>
          <boxGeometry args={[0.18, 0.12, 0.01]} />
          <meshLambertMaterial color="#2F3B4A" />
        </mesh>
        <mesh position={[0, -0.11, 0.02]}>
          <boxGeometry args={[0.12, 0.12, 0.01]} />
          <meshLambertMaterial color="#B5B5B5" />
        </mesh>
      </group>

      {/* 玄関マット */}
      <mesh position={[0, 0.02, connectionZ - 1.1]} receiveShadow>
        <boxGeometry args={[1.8, 0.03, 0.8]} />
        <meshLambertMaterial color="#5B5F66" />
      </mesh>

      {/* シューズボックス */}
      <group position={[-width / 2 + 0.85, 0.45, connectionZ - 0.9]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.9, 0.38]} />
          <meshLambertMaterial color="#A67C52" />
        </mesh>
        <mesh position={[0, 0.48, 0]} receiveShadow>
          <boxGeometry args={[1.16, 0.04, 0.42]} />
          <meshLambertMaterial color="#8A6646" />
        </mesh>
        <mesh position={[0.24, 0.7, 0.05]}>
          <cylinderGeometry args={[0.11, 0.14, 0.22, 16]} />
          <meshLambertMaterial color="#CFCFCF" />
        </mesh>
        <mesh position={[0.24, 0.92, 0.05]}>
          <sphereGeometry args={[0.2, 18, 18]} />
          <meshLambertMaterial color="#5B8C5A" />
        </mesh>
      </group>
    </group>
  )
}
