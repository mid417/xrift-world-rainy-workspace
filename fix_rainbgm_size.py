import re

with open('src/components/RainBGM/index.tsx', 'r') as f:
    orig = f.read()

# Replace spacing and dimensions
# spacing = 0.18 -> spacing = 0.46
orig = re.sub(r'const spacing = [\d.]+', 'const spacing = 0.46', orig)

# boxGeometry args=[0.25, 0.12, 0.05] -> [0.4, 0.25, 0.05]
orig = re.sub(r'<boxGeometry args=\[\[?[\d., ]+\]?\] />', '<boxGeometry args={[0.4, 0.25, 0.05]} />', orig)

# fontSize={0.06} -> {0.1}
orig = re.sub(r'fontSize={0\.06}', 'fontSize={0.1}', orig)

# fontSize={0.08} -> {0.15} for title
orig = re.sub(r'fontSize={0\.08}', 'fontSize={0.15}', orig)

with open('src/components/RainBGM/index.tsx', 'w') as f:
    f.write(orig)

