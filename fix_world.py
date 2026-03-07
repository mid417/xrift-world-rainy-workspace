import re

with open('src/World.tsx', 'r') as f:
    content = f.read()

# Replace old RainBGM call
find_str = '<RainBGM fileName="Rain-Real_Ambi01-1.mp3" volume={rainVolume} />'
replace_str = """<RainBGM 
        fileName="Rain-Real_Ambi01-1.mp3" 
        volume={rainVolume} 
        onVolumeChange={setRainVolume}
        position={[-3.0, 1.7, -14.58]}
        rotation={[0, 0, 0]}
      />"""
content = content.replace(find_str, replace_str)

with open('src/World.tsx', 'w') as f:
    f.write(content)

