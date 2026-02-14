import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BackSide, ShaderMaterial } from 'three'

export interface RainSkyProps {
  /** 位置（デフォルト: [0, 0, 0]） */
  position?: [number, number, number]
  /** 回転（デフォルト: [0, 0, 0]） */
  rotation?: [number, number, number]
  /** スケール（デフォルト: 1） */
  scale?: number
  /** skyのサイズ（半径） */
  radius?: number
}

const vertexShader = /* glsl */ `
varying vec3 vWorldDir;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(worldPosition.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const fragmentShader = /* glsl */ `
precision highp float;

uniform float time;
uniform float dynamicRainIntensity;
varying vec3 vWorldDir;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  float n000 = hash11(n + 0.0);
  float n100 = hash11(n + 1.0);
  float n010 = hash11(n + 57.0);
  float n110 = hash11(n + 58.0);
  float n001 = hash11(n + 113.0);
  float n101 = hash11(n + 114.0);
  float n011 = hash11(n + 170.0);
  float n111 = hash11(n + 171.0);

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float f = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    f += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return f;
}

void main() {
  vec3 dir = normalize(vWorldDir);
  float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

  // 暗い雨雲のベース（上:濃い、下:霧っぽい）
  vec3 skyTop = vec3(0.06, 0.07, 0.09);
  vec3 skyHorizon = vec3(0.12, 0.13, 0.15);
  vec3 col = mix(skyHorizon, skyTop, smoothstep(0.05, 0.9, h));

  // 雲（控えめなfbm）
  vec3 p = dir * 3.0 + vec3(0.0, time * 0.02, 0.0);
  float clouds = fbm(p);
  col *= mix(0.75, 1.05, smoothstep(0.2, 0.9, clouds));

  // 霧っぽい地平線グラデーション
  float horizonBand = smoothstep(0.04, 0.0, abs(dir.y + 0.03));
  col = mix(col, vec3(0.15, 0.16, 0.17), horizonBand * 0.6);

  // ③ 遠景ミスト層（地平線近傍に青灰色の薄いミスト）
  float mistBand = smoothstep(0.15, 0.0, dir.y + 0.1) * smoothstep(-0.2, 0.05, dir.y);
  vec3 mistColor = vec3(0.16, 0.18, 0.22);
  col = mix(col, mistColor, mistBand * 0.35);

  // 雨筋（球面UV相当: 方位角と高さで簡易生成）
  float az = atan(dir.z, dir.x); // -pi..pi
  float u = (az / 6.2831853) + 0.5;
  float v = acos(clamp(dir.y, -1.0, 1.0)) / 3.14159265;
  vec2 uv = vec2(u, v);

  // ④ 雨筋の2層化
  // Layer 1: 細かい高速レイヤー（既存を調整）
  float windGlobal1 = 0.10;
  vec2 rainUv1 = uv;
  rainUv1.x += rainUv1.y * 0.06;
  rainUv1 += vec2(time * windGlobal1, 0.0);

  vec2 grid1 = rainUv1 * vec2(540.0, 255.0);
  vec2 cell1 = floor(grid1);
  vec2 f1 = fract(grid1);
  float seed1 = hash21(cell1);

  float speed1 = mix(1.05, 1.9, seed1);
  float wind1 = mix(0.03, 0.10, fract(seed1 * 9.31));
  float y1 = fract(f1.y - time * speed1 + seed1);
  float xCenter1 = 0.5 + wind1 * (1.0 - y1);

  float streakX1 = smoothstep(0.020, 0.0, abs(f1.x - xCenter1));
  float streakY1 = smoothstep(0.99, 0.18, y1);
  float streak1 = streakX1 * streakY1;
  streak1 *= smoothstep(0.18, 0.62, clouds);

  // Layer 2: 太めで低速レイヤー
  float windGlobal2 = 0.05;
  vec2 rainUv2 = uv;
  rainUv2.x += rainUv2.y * 0.04;
  rainUv2 += vec2(time * windGlobal2, 0.0);

  vec2 grid2 = rainUv2 * vec2(280.0, 140.0);
  vec2 cell2 = floor(grid2);
  vec2 f2 = fract(grid2);
  float seed2 = hash21(cell2);

  float speed2 = mix(0.6, 1.1, seed2);
  float wind2 = mix(0.02, 0.06, fract(seed2 * 7.89));
  float y2 = fract(f2.y - time * speed2 + seed2);
  float xCenter2 = 0.5 + wind2 * (1.0 - y2);

  float streakX2 = smoothstep(0.045, 0.0, abs(f2.x - xCenter2));
  float streakY2 = smoothstep(0.97, 0.15, y2);
  float streak2 = streakX2 * streakY2;
  streak2 *= smoothstep(0.15, 0.55, clouds);

  // 2層を合成し、雨強度に連動
  float combinedStreak = streak1 * 0.7 + streak2 * 0.5;
  combinedStreak *= dynamicRainIntensity;

  col = mix(col, col + vec3(0.14, 0.14, 0.15), combinedStreak);

  // 「10階の高さ」演出: 地平線付近に控えめな都市光の点
  float cityBand = smoothstep(0.08, 0.0, abs(dir.y + 0.05));
  float cityU = fract(u * 140.0);
  float cityCell = floor(u * 140.0);
  float citySeed = hash11(cityCell + 12.3);
  float cityDot = smoothstep(0.03, 0.0, abs(cityU - citySeed));
  cityDot *= smoothstep(0.75, 0.95, citySeed);
  vec3 cityColor = mix(vec3(0.85, 0.65, 0.35), vec3(0.35, 0.55, 0.85), citySeed);
  col += cityColor * cityDot * cityBand * 0.12;

  // 仕上げ: 全体を少し暗く
  col *= 0.95;

  gl_FragColor = vec4(col, 1.0);
}
`

// JavaScript側でノイズ関数を実装（GLSL側の hash11 / noise 関数と互換）
function hash11(p: number): number {
  // GLSLのfractと一致: x - floor(x)
  p = p * 0.1031 - Math.floor(p * 0.1031)
  p *= p + 33.33
  p *= p + p
  return p - Math.floor(p)
}

// GLSL側noise(vec3)のJS実装（シェーダー側と同等の3D noise）
function noise3D(x: number, y: number, z: number): number {
  const px = Math.floor(x)
  const py = Math.floor(y)
  const pz = Math.floor(z)
  const fx = x - px
  const fy = y - py
  const fz = z - pz
  
  // smoothstep補間: f * f * (3 - 2 * f)
  const ux = fx * fx * (3.0 - 2.0 * fx)
  const uy = fy * fy * (3.0 - 2.0 * fy)
  const uz = fz * fz * (3.0 - 2.0 * fz)
  
  // GLSL側と同じハッシュ計算: n = p.x + p.y * 57.0 + 113.0 * p.z
  const n = px + py * 57.0 + 113.0 * pz
  const n000 = hash11(n + 0.0)
  const n100 = hash11(n + 1.0)
  const n010 = hash11(n + 57.0)
  const n110 = hash11(n + 58.0)
  const n001 = hash11(n + 113.0)
  const n101 = hash11(n + 114.0)
  const n011 = hash11(n + 170.0)
  const n111 = hash11(n + 171.0)
  
  // trilinear補間
  const nx00 = n000 * (1.0 - ux) + n100 * ux
  const nx10 = n010 * (1.0 - ux) + n110 * ux
  const nx01 = n001 * (1.0 - ux) + n101 * ux
  const nx11 = n011 * (1.0 - ux) + n111 * ux
  const nxy0 = nx00 * (1.0 - uy) + nx10 * uy
  const nxy1 = nx01 * (1.0 - uy) + nx11 * uy
  return nxy0 * (1.0 - uz) + nxy1 * uz
}

export const RainSky: React.FC<RainSkyProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  radius = 500,
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      dynamicRainIntensity: { value: 0.5 },
    }),
    []
  )

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.time.value += delta
    
    // ① 時間変化する雨強度（低周波ノイズで滑らかに変化）
    // CPU側で計算してuniformに設定（全ピクセルで計算する必要がないため）
    // GLSL側の noise(vec3(time*0.08,0,0)) と同等に計算
    const intensityNoise = noise3D(material.uniforms.time.value * 0.08, 0, 0)
    material.uniforms.dynamicRainIntensity.value = 0.5 + 0.45 * intensityNoise // mix(0.5, 0.95, noise)
  })

  return (
    <mesh position={position} rotation={rotation} scale={scale} frustumCulled={false}>
      <sphereGeometry args={[radius, 64, 40]} />
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            vertexShader,
            fragmentShader,
            uniforms,
            side: BackSide,
            depthWrite: false,
          },
        ]}
      />
    </mesh>
  )
}
