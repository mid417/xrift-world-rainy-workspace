import { useEffect, useMemo, useRef } from 'react'
import { useXRift } from '@xrift/world-components'

import { DEFAULT_RAIN_BGM } from './constants'
import type { RainBGMProps } from './types'

export const RainBGM: React.FC<RainBGMProps> = ({
  fileName = DEFAULT_RAIN_BGM.fileName,
  volume = DEFAULT_RAIN_BGM.volume,
}) => {
  const { baseUrl } = useXRift()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const url = useMemo(() => {
    const normalized = fileName.startsWith('/') ? fileName.slice(1) : fileName
    return `${baseUrl}${normalized}`
  }, [baseUrl, fileName])

  useEffect(() => {
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  return null
}
