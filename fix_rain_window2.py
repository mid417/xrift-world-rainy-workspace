import re

with open('src/components/RainWindow/index.tsx', 'r') as f:
    content = f.read()

# remove remaining buttons
content = re.sub(r'\s*\{/\* 中ボタン.*?</Interactable>', '', content, flags=re.DOTALL)
content = re.sub(r'\s*\{/\* 小ボタン.*?</Interactable>', '', content, flags=re.DOTALL)
content = re.sub(r'\s*\{/\*.*大中小.*?\*\/\}', '', content, flags=re.DOTALL)

with open('src/components/RainWindow/index.tsx', 'w') as f:
    f.write(content)

