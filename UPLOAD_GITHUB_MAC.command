#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "AEROLAB A380 - Upload GitHub"
command -v git >/dev/null || { echo "Git belum terpasang"; exit 1; }
if [ ! -d .git ]; then git init; git branch -M main; fi
if ! git remote get-url origin >/dev/null 2>&1; then
 read -rp "Masukkan URL repository GitHub (contoh https://github.com/USER/REPO.git): " REPO
 case "$REPO" in https://github.com/*|git@github.com:*) git remote add origin "$REPO";; *) echo "Alamat GitHub tidak valid"; exit 1;; esac
fi
git add .
if ! git diff --cached --quiet; then git commit -m "AEROLAB A380 simulator and papercraft studio"; fi
git push -u origin main
echo "Selesai. Import repository ke Netlify."
