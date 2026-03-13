import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTeleport } from '@xrift/world-components'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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

  // refs
  const ringGroupRef = useRef<THREE.Group>(null)
  const diskMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const particleMatRef = useRef<THREE.ShaderMaterial>(null)
  const hoveredRef = useRef(false)
  const emissiveRef = useRef(0.4)

  // particle geometry
  const particleGeo = useMemo(() => {
    const COUNT = 80
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    const offsets = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 0.2 + Math.random() * 0.7
      positions[i * 3 + 0] = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.random() * 1.0
      positions[i * 3 + 2] = Math.sin(angle) * r
      speeds[i] = 0.4 + Math.random() * 0.6
      offsets[i] = Math.random() * 2.0
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 1))
    geo.setAttribute('offset', new THREE.Float32BufferAttribute(offsets, 1))
    return geo
  }, [])

  const colorVec = useMemo(() => new THREE.Color(color), [color])

  useEffect(() => {
    return () => {
      particleGeo.dispose()
    }
  }, [particleGeo])

  useFrame((_, delta) => {
    // ring Y-axis rotation
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += delta * 0.6
    }
    // particle time uniform
    if (particleMatRef.current) {
      particleMatRef.current.uniforms.time.value += delta
    }
    // hover emissive lerp
    if (diskMaterialRef.current) {
      const target = hoveredRef.current ? 1.2 : 0.4
      emissiveRef.current = THREE.MathUtils.lerp(emissiveRef.current, target, delta * 5)
      diskMaterialRef.current.emissiveIntensity = emissiveRef.current
    }
  })

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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerEnter={() => { hoveredRef.current = true }}
        onPointerLeave={() => { hoveredRef.current = false }}
      >
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial
          ref={diskMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* リング（Y軸回転） */}
      <group ref={ringGroupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <torusGeometry args={[0.9, 0.05, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* 上向きパーティクル */}
      <points position={[0, 0.05, 0]} geometry={particleGeo}>
        <shaderMaterial
          ref={particleMatRef}
          transparent
          depthWrite={false}
          uniforms={{
            time: { value: 0 },
            color: { value: colorVec },
          }}
          vertexShader={`
            uniform float time;
            attribute float speed;
            attribute float offset;
            varying float vAlpha;
            void main() {
              vec3 pos = position;
              float t = mod(time * speed + offset, 2.0);
              pos.y += t;
              vAlpha = 1.0 - t / 2.0;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = 3.0;
            }
          `}
          fragmentShader={`
            uniform vec3 color;
            varying float vAlpha;
            void main() {
              gl_FragColor = vec4(color, vAlpha * 0.8);
            }
          `}
        />
      </points>

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
