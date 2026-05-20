import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8')

test('TeleportPortal updates particle time via shader material ref', () => {
  assert.match(source, /const particleMaterialRef = useRef<THREE\.ShaderMaterial>\(null\)/)
  assert.match(source, /particleMaterial\.uniforms\.time\.value \+= delta/)
  assert.match(source, /<shaderMaterial[\s\S]*ref=\{particleMaterialRef\}/)
})

test('TeleportPortal teleport behavior remains unchanged', () => {
  assert.match(source, /teleport\(\{ position: destination, yaw \}\)/)
})
