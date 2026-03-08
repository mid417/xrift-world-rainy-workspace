/**
 * 開発環境用エントリーポイント
 *
 * ローカル開発時（npm run dev）に使用されます。
 * 本番ビルド（npm run build）では使用されません。
 */

import { useThree } from '@react-three/fiber'
import { DevEnvironment, XRiftProvider } from '@xrift/world-components'
import type { PhysicsConfig } from '@xrift/world-components'
import { StrictMode, useLayoutEffect } from 'react'
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

const InitialCameraLookAt = ({ lookAt }: { lookAt?: Vector3Tuple }) => {
  const { camera } = useThree()

  useLayoutEffect(() => {
    if (!lookAt) return

    camera.lookAt(lookAt[0], lookAt[1], lookAt[2])
    camera.updateMatrixWorld()
  }, [camera, lookAt])

  return null
}

createRoot(rootElement).render(
  <StrictMode>
    <XRiftProvider baseUrl="/">
      <DevEnvironment physicsConfig={physicsConfig} spawnPosition={spawnPosition}>
        <InitialCameraLookAt lookAt={cameraLookAt} />
        <World />
      </DevEnvironment>
    </XRiftProvider>
  </StrictMode>,
)
