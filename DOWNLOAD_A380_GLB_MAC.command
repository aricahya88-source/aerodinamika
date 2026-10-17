#!/bin/bash
# Optional: place the properly licensed CC BY 4.0 community A380 file locally.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/models
URL="https://raw.githubusercontent.com/amvlab/aircraft-models/main/models/A380_nologo.glb"
DEST="assets/models/A380_nologo.glb"
TMP="${DEST}.part"
trap 'rm -f "$TMP"' EXIT
printf '%s\n' "Mengunduh model amvlab A380 tanpa logo (CC BY 4.0)…"
curl --fail --location --retry 2 --connect-timeout 15 --max-time 120 "$URL" --output "$TMP"
python3 - "$TMP" <<'PY'
import pathlib,struct,sys
p=pathlib.Path(sys.argv[1]); data=p.read_bytes()
if len(data)<20 or data[:4]!=b'glTF' or struct.unpack_from('<I',data,8)[0]!=len(data):
  raise SystemExit('Unduhan bukan file GLB valid, tidak akan disimpan.')
print('File GLB valid:',len(data),'bytes')
PY
mv "$TMP" "$DEST"
cat <<'EOF'
Sukses. AEROLAB sekarang dapat memakai file A380_nologo.glb secara lokal.
Lisensi CC BY 4.0 — kredit wajib: amvlab — https://github.com/amvlab/aircraft-models
EOF
