/**
 * 開発環境用エントリーポイント
 *
 * ローカル開発時（npm run dev）に使用されます。
 * 本番ビルド（npm run build）では使用されません。
 */

import { useThree } from '@react-three/fiber'
import {
  DevEnvironment,
  XRiftProvider,
  useSpawnPoint,
  useSpawnPointContext,
} from '@xrift/world-components'
import type { PhysicsConfig } from '@xrift/world-components'
import type { TeleportDestination } from '@xrift/world-components'
import { StrictMode, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { World } from './World'
import { getDevEnvironmentOptions, type Vector3Tuple } from './devEnvironmentOptions'
import xriftConfig from '../xrift.json'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

const physicsConfig: PhysicsConfig | undefined = (
  xriftConfig as { physics?: PhysicsConfig }
).physics

const { spawnPosition, cameraLookAt } = getDevEnvironmentOptions(window.location.search)

const DevTeleportBridge = ({
  destination,
  onApplied,
}: {
  destination: TeleportDestination | null
  onApplied: () => void
}) => {
  const spawnPoint = useSpawnPoint()
  const { setSpawnPoint } = useSpawnPointContext()

  useEffect(() => {
    if (!destination) return

    setSpawnPoint({
      position: destination.position,
      yaw: destination.yaw ?? spawnPoint?.yaw ?? 0,
    })
    onApplied()
  }, [destination, onApplied, setSpawnPoint, spawnPoint])

  return null
}

const InitialCameraLookAt = ({ lookAt }: { lookAt?: Vector3Tuple }) => {
  const { camera } = useThree()

  useLayoutEffect(() => {
    if (!lookAt) return

    camera.lookAt(lookAt[0], lookAt[1], lookAt[2])
    camera.updateMatrixWorld()
  }, [camera, lookAt])

  return null
}

const DevApp = () => {
  const [teleportDestination, setTeleportDestination] = useState<TeleportDestination | null>(null)

  const handleTeleport = useCallback((destination: TeleportDestination) => {
    setTeleportDestination(destination)
  }, [])

  const handleTeleportApplied = useCallback(() => {
    setTeleportDestination(null)
  }, [])

  return (
    <XRiftProvider baseUrl="/" teleportImplementation={{ teleport: handleTeleport }}>
      <DevEnvironment physicsConfig={physicsConfig} spawnPosition={spawnPosition}>
        <DevTeleportBridge destination={teleportDestination} onApplied={handleTeleportApplied} />
        <InitialCameraLookAt lookAt={cameraLookAt} />
        <World />
      </DevEnvironment>
    </XRiftProvider>
  )
}

createRoot(rootElement).render(
  <StrictMode>
    <DevApp />
  </StrictMode>,
)
