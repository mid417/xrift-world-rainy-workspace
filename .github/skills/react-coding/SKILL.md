---
name: react-coding
description: React(*.tsx, *.ts)の追加・修正時に必ず従うべきベストプラクティスです。
---

# React カスタム指示

React開発時に必ず従うべきベストプラクティスです。

## コンポーネント設計

### 関数型コンポーネント

- クラスコンポーネントではなく、**関数型コンポーネント**を使用する
- Hooksを活用して状態やライフサイクルを管理する
- メモ化が必要な場合は `React.memo` を使用

### 単一責任の原則

- 1つのコンポーネントは1つの役割を持つ
- 複雑なコンポーネントは小さな部品に分割
- 再利用可能な基本コンポーネントを作成

### Props と State

```typescript
// ✅ Good: 明確な型定義
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  // ...
}

// ❌ Bad: 型定義なし
function Button(props) {
  // ...
}
```

## R3F (React Three Fiber) を使用する場合

- 標準で `Props` (type.ts)に以下の型を設け、呼び出し元で位置、回転、スケールを設定できるようにする。

  ```typescript
  /** 位置（デフォルト: [0, 0, 0]） */
  position?: [number, number, number]
  /** 回転（デフォルト: [0, 0, 0]） */
  rotation?: [number, number, number]
  /** スケール（デフォルト: 1） */
  scale?: number
  ```
  
  - 位置の指定で 0 以外を利用する場合、`scale` を掛けて調整する。
    - 例
      ```typescript
      position={[x * scale, 0, z * scale]}
      ```

- `receiveShadow` と `castShadow` を使いすぎない。
  - パフォーマンスに影響するため、本当に必要なオブジェクトのみに設定する。

## ファイル構造

### 推奨構成
```
src/
├── public/              # アセットファイル（GLB, テクスチャ, 画像, BGM 等）
│   ├── models/          # 3Dモデル (.glb, .gltf)
│   ├── textures/        # テクスチャ画像
│   └── *.jpg, *.png     # Skybox、Thumbnail、BGM等
├── src/
│   ├── components/      # 3Dコンポーネント
│   ├── World.tsx        # メインワールドコンポーネント
│   ├── dev.tsx          # 開発用エントリーポイント
│   ├── index.tsx        # 本番用エクスポート
│   └── constants.ts     # 定数定義
├── .triplex/            # Triplex（3Dエディタ）設定
├── xrift.json           # XRift CLI設定
├── vite.config.ts       # ビルド設定（Module Federation）
└── package.json
```

### `components/` ディレクトリ構成

各コンポーネントは以下のスケーラブルな構造を推奨します：

```
components/
└── <ComponentName>/
    ├── index.tsx                  # メインのコンポーネント
    ├── constants.ts               # コンポーネント固有の定数
    ├── types.ts                   # コンポーネント固有の型定義
    ├── utils.ts                   # コンポーネント固有のユーティリティ関数
    └── <subcomponents>/           # サブコンポーネント（複雑な場合）
        └── SubComponent/
            ├── index.tsx
            ├── constants.ts
            ├── types.ts
            └── utils.ts
```

#### ファイル役割説明

| ファイル | 必須 | 説明 |
|---------|------|------|
| `index.tsx`    | ✅ | コンポーネントをエクスポート（外部から使用）、コンポーネント本体 |
| `constants.ts` | ✅ | 定数（表示テキスト、デフォルト値、選択肢等） |
| `types.ts`     | ✅ | Props、State、内部で使用する型定義 |
| `utils.ts`     | 任意 | コンポーネント内で使用するユーティリティ関数 |

```

## 禁止事項

- ❌ クラスコンポーネントを新規作成しない（既存コードの保守除く）
- ❌ `any` 型の使用
- ❌ `console.log` をコードに残さない、ただしデバッグ目的で一時的に使用する場合は除く
- ❌ `dangerouslySetInnerHTML` の無防備な使用
- ❌ ルートレベルでのAPIコール（useEffect内で行う）
- ❌ `useRef` で状態を管理する（useState を使用）
- ❌ インラインスタイルの過度な使用（CSSモジュール使用）
- ❌ ネストの深すぎるコンポーネント（分割して再利用可能に）
