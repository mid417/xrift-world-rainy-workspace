import { useEffect, useMemo, useRef, useCallback } from 'react'
import { Text } from '@react-three/drei'
import { Interactable, useXRift } from '@xrift/world-components'

import { DEFAULT_RAIN_BGM } from './constants'
import type { RainBGMProps } from './types'

export const RainBGM: React.FC<RainBGMProps> = ({
  fileName = DEFAULT_RAIN_BGM.fileName,
  volume = DEFAULT_RAIN_BGM.volume,
  onVolumeChange,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  const { baseUrl } = useXRift()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const volumeRef = useRef(volume)

  // volumeRefを常に最新のvolumeに更新する
  volumeRef.current = volume

  const url = useMemo(() => {
    const normalized = fileName.startsWith('/') ? fileName.slice(1) : fileName
    return `${baseUrl}${normalized}`
  }, [baseUrl, fileName])

  useEffect(() => {
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.loop = true
    audioRef.current = audio

    // Web Audio API のセットアップ
    let ctx: AudioContext | null = null
    try {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AudioContextCtor()
      const gainNode = ctx.createGain()
      gainNode.gain.value = volumeRef.current
      const source = ctx.createMediaElementSource(audio)
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      audioContextRef.current = ctx
      gainNodeRef.current = gainNode
    } catch {
      // Web Audio API が使えない環境ではフォールバック
      audio.volume = volumeRef.current
      audioContextRef.current = null
      gainNodeRef.current = null
    }

    let disposed = false
    let unlockListening = false

    const tryPlay = async () => {
      if (disposed) return
      try {
        await audio.play()
        removeUnlockListeners()
      } catch {
        // ignore
      }
    }

    const onUserGesture = () => {
      // iOSでは AudioContext をユーザー操作後に resume() する必要がある
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume()
      }
      void tryPlay()
    }

    const addUnlockListeners = () => {
      if (unlockListening) return
      unlockListening = true

      window.addEventListener('pointerdown', onUserGesture, { passive: true })
      window.addEventListener('touchstart', onUserGesture, { passive: true })
      window.addEventListener('keydown', onUserGesture)
    }

    const removeUnlockListeners = () => {
      if (!unlockListening) return
      unlockListening = false

      window.removeEventListener('pointerdown', onUserGesture)
      window.removeEventListener('touchstart', onUserGesture)
      window.removeEventListener('keydown', onUserGesture)
    }

    void audio.play().catch(() => {
      // 自動再生制限などで失敗した場合のみ、ユーザー操作後に再試行する
      addUnlockListeners()
    })

    return () => {
      disposed = true
      removeUnlockListeners()

      try {
        audio.pause()
        audio.currentTime = 0
      } catch {
        // ignore
      }

      if (audioRef.current === audio) {
        audioRef.current = null
      }

      // AudioContext のクリーンアップ
      if (audioContextRef.current === ctx) {
        audioContextRef.current = null
        gainNodeRef.current = null
      }
      if (ctx) {
        void ctx.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    const gainNode = gainNodeRef.current
    if (gainNode) {
      // GainNode で音量制御（iOSでも動作）
      gainNode.gain.value = volume
      // GainNode 使用時は HTML 側は最大に固定
      const audio = audioRef.current
      if (audio) {
        audio.volume = 1
      }
    } else {
      // GainNode が未初期化の場合は audio.volume にフォールバック
      const audio = audioRef.current
      if (audio) {
        audio.volume = volume
      }
    }
  }, [volume])


  const handleVolume = useCallback((v: number) => {
    onVolumeChange?.(v)
  }, [onVolumeChange])

  // ボタン設定の設定
  const buttons = [
    { label: '最大', value: 0.2, color: '#F44336' },
    { label: '大', value: 0.1, color: '#FF9800' },
    { label: '中', value: 0.05, color: '#FFC107' },
    { label: '小', value: 0.01, color: '#4CAF50' },
    { label: 'OFF', value: 0.0, color: '#9E9E9E' },
  ]

  // 全体の高さを同じくらいにするため、ボタン間の間隔を詰める
  const spacing = 0.3
  const startY = (buttons.length - 1) * spacing / 2

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Text
        position={[0, startY + 0.25, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
      >
        雨音の音量
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
                <boxGeometry args={[0.4, 0.25, 0.05]} />
                <meshStandardMaterial color={isActive ? btn.color : '#555555'} />
              </mesh>
            </Interactable>
            <Text
              position={[0, 0, 0.026]}
              fontSize={0.1}
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

