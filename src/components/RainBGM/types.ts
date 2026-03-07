export interface RainBGMProps {
  /** 音源ファイル名（public 配下） */
  fileName?: string
  /** 音量（0.0〜1.0） */
  volume?: number
  /** 音量変更コールバック（UIがある場合のみ動作） */
  onVolumeChange?: (volume: number) => void
  /** 位置（デフォルト: [0, 0, 0]） */
  position?: [number, number, number]
  /** 回転（デフォルト: [0, 0, 0]） */
  rotation?: [number, number, number]
  /** スケール（デフォルト: 1） */
  scale?: number
}
