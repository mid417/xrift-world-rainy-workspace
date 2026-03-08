const QA_VIEW_PARAM = 'qa'
const ENTRANCE_QA_VIEW = 'entrance'

export type Vector3Tuple = [number, number, number]

// Pointer Lock が使えない QA/Playwright 向けに、玄関小部屋の奥右側から
// x- 側の中央寄り大窓を正面寄りに収めつつ、前面壁まわりも見渡しやすい固定視点を作る。
const ENTRANCE_QA_SPAWN_POSITION: Vector3Tuple = [2.8, 1.45, -128.8]
const ENTRANCE_QA_CAMERA_LOOK_AT: Vector3Tuple = [-2.5, 1.6, -122.8]

export interface DevEnvironmentOptions {
  spawnPosition?: Vector3Tuple
  cameraLookAt?: Vector3Tuple
}

export const getDevEnvironmentOptions = (search: string): DevEnvironmentOptions => {
  const params = new URLSearchParams(search)

  if (params.get(QA_VIEW_PARAM) === ENTRANCE_QA_VIEW) {
    return {
      spawnPosition: ENTRANCE_QA_SPAWN_POSITION,
      cameraLookAt: ENTRANCE_QA_CAMERA_LOOK_AT,
    }
  }

  return {}
}
