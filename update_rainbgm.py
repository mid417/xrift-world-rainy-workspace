import re

with open('src/components/RainBGM/index.tsx', 'r') as f:
    orig = f.read()

# Replace the imports
new_imports = """import { useEffect, useMemo, useRef, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { Interactable, useXRift } from '@xrift/world-components'

import { DEFAULT_RAIN_BGM } from './constants'
import type { RainBGMProps } from './types'
"""
orig = re.sub(r"import .*? from './types'\n", new_imports, orig, flags=re.DOTALL)

# Change signature
sig_find = "export const RainBGM: React.FC<RainBGMProps> = ({"
sig_replace = """export const RainBGM: React.FC<RainBGMProps> = ({
  fileName = DEFAULT_RAIN_BGM.fileName,
  volume = DEFAULT_RAIN_BGM.volume,
  onVolumeChange,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {"""
orig = re.sub(r"export const RainBGM: React.FC<RainBGMProps> = \(\{.*?\}\) => \{", sig_replace, orig, flags=re.DOTALL)

# Change return null to rendering the UI
return_replace = """
  const handleVolume = useCallback((v: number) => {
    onVolumeChange?.(v)
  }, [onVolumeChange])

  // ボタン設定の設定
  const buttons = [
    { label: '最大', value: 0.5, color: '#F44336' },
    { label: '大', value: 0.1, color: '#FF9800' },
    { label: '中', value: 0.05, color: '#FFC107' },
    { label: '小', value: 0.01, color: '#4CAF50' },
    { label: '無音', value: 0.0, color: '#9E9E9E' },
  ]

  // 全体の高さを同じくらいにするため、ボタン間の間隔を詰める
  const spacing = 0.18
  const startY = (buttons.length - 1) * spacing / 2

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Text
        position={[0, startY + 0.25, 0]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        雨音 BGM
      </Text>
      
      {buttons.map((btn, i) => {
        const y = startY - i * spacing
        const isActive = volume === btn.value
        return (
          <group key={btn.label} position={[0, y, 0]}>
            <Interactable 
              id={`rain-volume-${i}`} 
              onInteract={() => handleVolume(btn.value)}
              interactionText={`雨音を「${btn.label}」にする`}
            >
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.25, 0.12, 0.05]} />
                <meshStandardMaterial color={isActive ? btn.color : '#555555'} />
              </mesh>
            </Interactable>
            <Text
              position={[0, 0, 0.026]}
              fontSize={0.06}
              color={isActive ? '#ffffff' : '#aaaaaa'}
              anchorX="center"
              anchorY="middle"
            >
              {btn.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
"""
orig = orig.replace("  return null\n}", return_replace)

with open('src/components/RainBGM/index.tsx', 'w') as f:
    f.write(orig)

