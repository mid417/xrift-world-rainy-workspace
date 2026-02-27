import { useCallback } from 'react'
import { useTeleport } from '@xrift/world-components'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'

interface Props {
  position: [number, number, number]
  destination: [number, number, number]
  yaw?: number
  label?: string
  color?: string
  /** ラベルのY軸回転（度数法）。デフォルト: 0 */
  labelRotationY?: number
}

export const TeleportPortal = ({
  position,
  destination,
  yaw,
  label = 'テレポート',
  color = '#3B82F6',
  labelRotationY = 0,
}: Props) => {
  const { teleport } = useTeleport()

  const handleEnter = useCallback(() => {
    teleport({ position: destination, yaw })
  }, [teleport, destination, yaw])

  return (
    <group position={position}>
      {/* センサー: プレイヤーが触れたらテレポート */}
      <RigidBody type="fixed" sensor onIntersectionEnter={handleEnter}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[1.0, 1.0, 1, 32]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {/* 地面のポータル円盤 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* リング */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <torusGeometry args={[0.9, 0.05, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* ラベル */}
      <Text
        position={[0, 1.4, 0]}
        rotation={[0, (labelRotationY * Math.PI) / 180, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="black"
      >
        {label}
      </Text>
    </group>
  )
}
