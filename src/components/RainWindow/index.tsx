import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, ShaderMaterial } from 'three'

export interface RainWindowProps {
  /** 位置（デフォルト: [0, 0, 0]） */
  position?: [number, number, number]
  /** 回転（デフォルト: [0, 0, 0]） */
  rotation?: [number, number, number]
  /** スケール（デフォルト: 1） */
  scale?: number
  /** ガラス面の幅 */
  width: number
  /** ガラス面の高さ */
  height: number
  /** 衝突用の厚み（奥行き） */
  colliderThickness?: number
}

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const fragmentShader = /* glsl */ `
precision highp float;

uniform float time;
uniform float opacity;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 uv = vUv;

  // Fresnel（縁が少し明るいガラス）
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

  // 雨だれ/滴（窓に当たる雨）：小さめ＋斜めに流れる
  vec2 grid = uv * vec2(26.0, 12.0);
  vec2 cell = floor(grid);
  vec2 f = fract(grid);
  float seed = hash21(cell);

  // 1セル内の滴
  float xBase = mix(0.15, 0.85, fract(seed * 19.37));
  float speed = mix(0.35, 0.9, fract(seed * 7.13));
  float wind = mix(0.10, 0.28, fract(seed * 11.71));

  // 上から下へ（time減算）＋斜め（風でxにズレ）
  float y = fract(f.y - time * speed + seed);
  float x = xBase + wind * (1.0 - y);

  vec2 dropP = vec2(f.x - x, f.y - y);

  // 滴を小さく
  float drop = 1.0 - smoothstep(0.0, 0.018, sdCircle(dropP, 0.010));
  drop *= smoothstep(0.95, 0.45, y);

  // 滴の後ろ（上側）に薄い筋を作る
  float trailX = smoothstep(0.045, 0.0, abs(f.x - x));
  float trailY = smoothstep(0.0, 0.85, (f.y - y));
  float streak = trailX * trailY * smoothstep(0.1, 0.6, drop + 0.15);

  // 微細な流れ（斜めの薄い線）
  float diag = fract((uv.x + uv.y * 0.35) * 110.0 + seed * 13.0 - time * 0.6);
  float lines = smoothstep(0.02, 0.0, abs(diag - 0.5));
  lines *= 0.12;

  float wet = clamp(drop * 0.9 + streak * 0.35 + lines, 0.0, 1.0);

  // 色はほぼ無色（暗い空を少し白く曇らせる）
  vec3 glassTint = vec3(0.85, 0.9, 0.95);
  vec3 col = mix(vec3(1.0), glassTint, 0.15);

  // 濡れ表現: ハイライトが増える
  col = mix(col, vec3(1.0), wet * 0.35);
  col += vec3(1.0) * fresnel * 0.25;

  float a = opacity;
  a += wet * 0.18;
  a += fresnel * 0.15;
  a = clamp(a, 0.02, 0.6);

  gl_FragColor = vec4(col, a);
}
`

export const RainWindow: React.FC<RainWindowProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width,
  height,
  colliderThickness = 0.06,
}) => {
  const materialRef = useRef<ShaderMaterial>(null)

  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const scaledThickness = colliderThickness * scale

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      opacity: { value: 0.06 },
    }),
    [],
  )

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.time.value += delta
  })

  return (
    <>
      {/* ガラス */}
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={[scaledWidth, scaledHeight, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          args={[
            {
              vertexShader,
              fragmentShader,
              uniforms,
              transparent: true,
              depthWrite: false,
              side: DoubleSide,
            },
          ]}
        />
      </mesh>

      {/* 衝突（薄い板） */}
      <RigidBody
        type="fixed"
        colliders={false}
        restitution={0}
        friction={0}
        position={position}
        rotation={rotation}
      >
        <CuboidCollider args={[scaledWidth / 2, scaledHeight / 2, scaledThickness / 2]} />
      </RigidBody>
    </>
  )
}
