import re

with open('src/components/RainWindow/index.tsx', 'r') as f:
    content = f.read()

# Remove rainVolume and onVolumeChange from Props
content = re.sub(r'\s*rainVolume = [^,]+,', '', content)
content = re.sub(r'\s*onVolumeChange,', '', content)

# Remove handleVolume functions
content = re.sub(r'  const handleVolumeSmall.*?(?=  useFrame)', '', content, flags=re.DOTALL)

# Remove the buttons rendering
content = re.sub(r'      {/\* 音量調整ボタン.*?      </Interactable>\n', '', content, flags=re.DOTALL)

# Also remove Interactable import if not needed elsewhere
if '{ Interactable }' in content:
    content = content.replace("import { Interactable } from '@xrift/world-components'\n", "")

with open('src/components/RainWindow/index.tsx', 'w') as f:
    f.write(content)

