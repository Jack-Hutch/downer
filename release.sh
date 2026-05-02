#!/bin/bash
# Downer release script — bumps patch version, builds, and publishes to GitHub.
# Run from anywhere: bash ~/Desktop/Projets/Downer/app/release.sh

set -e
cd "$(dirname "$0")"

# Bump patch version (e.g. 0.1.6 → 0.1.7)
OLD=$(node -p "require('./package.json').version")
NEW=$(node -p "const [a,b,c] = '${OLD}'.split('.'); \`\${a}.\${b}.\${parseInt(c)+1}\`")
node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('package.json','utf8'));
  p.version = '${NEW}';
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
echo "→ Version bumped: ${OLD} → ${NEW}"

# Build
echo "→ Building..."
npm run build

# Create GitHub release and upload all assets
echo "→ Publishing v${NEW} to GitHub..."
gh release create "v${NEW}" \
  "release/Downer-${NEW}-arm64.dmg" \
  "release/Downer-${NEW}.dmg" \
  "release/Downer-${NEW}-arm64-mac.zip" \
  "release/Downer-${NEW}-mac.zip" \
  "release/Downer-${NEW}-arm64.dmg.blockmap" \
  "release/Downer-${NEW}.dmg.blockmap" \
  "release/Downer-${NEW}-arm64-mac.zip.blockmap" \
  "release/Downer-${NEW}-mac.zip.blockmap" \
  "release/latest-mac.yml" \
  --repo Jack-Hutch/downer \
  --title "v${NEW}" \
  --notes "Update v${NEW}"

echo "✅ Done! v${NEW} is live at https://github.com/Jack-Hutch/downer/releases/tag/v${NEW}"
