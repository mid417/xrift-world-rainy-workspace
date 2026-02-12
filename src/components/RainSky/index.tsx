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

  // 雨筋（球面UV相当: 方位角と高さで簡易生成）
  float az = atan(dir.z, dir.x); // -pi..pi
  float u = (az / 6.2831853) + 0.5;
  float v = acos(clamp(dir.y, -1.0, 1.0)) / 3.14159265;
  vec2 uv = vec2(u, v);

  // 雨量は「普通」寄りだが、見た目は少し強め
  float rainDensity = 0.72;

  // 解像度を上げて筋をさらに細く（見た目で約1/3）
  float windGlobal = 0.10; // 全体の風（斜め方向はさらに控えめに）
  vec2 rainUv = uv;

  // 雨筋を斜めに見せるため、UVをせん断（yに応じてxがずれる）
  rainUv.x += rainUv.y * 0.06;

  // 風で横に流しつつ、上から下へ落とす
  rainUv += vec2(time * windGlobal, 0.0);

  vec2 grid = rainUv * vec2(540.0, 255.0);
  vec2 cell = floor(grid);
  vec2 f = fract(grid);
  float seed = hash21(cell);

  // 上から下へ降る（timeを減算方向に）＋セルごとの風のばらつき
  float speed = mix(1.05, 1.9, seed);
  float wind = mix(0.03, 0.10, fract(seed * 9.31));

  // 落下の進行（上→下）
  float y = fract(f.y - time * speed + seed);

  // 斜めの筋: yが進むほどx中心がずれる（風）
  float xCenter = 0.5 + wind * (1.0 - y);

  // 筋の太さを縮小（約1/3）
  float streakX = smoothstep(0.020, 0.0, abs(f.x - xCenter));
  float streakY = smoothstep(0.99, 0.18, y);
  float streak = streakX * streakY;

  // 雲の濃いところで雨が見える
  streak *= smoothstep(0.18, 0.62, clouds);

  col = mix(col, col + vec3(0.14, 0.14, 0.15), streak * rainDensity);

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

export const RainSky: React.FC<RainSkyProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  radius = 500,
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    material.uniforms.time.value += delta
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
