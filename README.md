# AEROLAB A380 — Flight Simulator, Laboratorium Fluida & Papercraft Studio

Paket pengembangan website AEROLAB lama (HTML/CSS/JavaScript + Babylon.js). Semua menu lama tetap ada. Menu **A380 Papercraft Studio** ditambahkan di navigasi atas, sekaligus mengganti pesawat prosedural ringan menjadi model Airbus A380-800. Proyek dapat diunggah ke GitHub dan di-deploy ke Netlify tanpa build atau database.

## Cara menjalankan

1. Ekstrak ZIP, masuk ke folder `AEROLAB_A380`.
2. Di Mac, buka Terminal: `cd ~/Downloads/AEROLAB_A380` (sesuaikan lokasi).
3. Jalankan `npm start` atau `python3 scripts/dev_server.py`.
4. Buka http://localhost:5173. **Jangan membuka `index.html` langsung via file://.**
5. Untuk pengujian: `npm test` dan `npm run check`.

`npm install` **tidak diperlukan** untuk menjalankan proyek statis ini. WebGL/Babylon.js membutuhkan internet untuk memuat library dari CDN (tetap menggunakan CDN dari proyek asal). Ekspor livery PDF kustom juga memerlukan akses ke pdf-lib dari CDN; jika tidak tersedia, PDF A3+ master siap unduh sebagai fallback.

## Fitur yang berfungsi

- **Simulator**: model Airbus A380-800 prosedural empat turbofan, dua tingkat jendela kabin, permukaan kendali sederhana, rodanya terlihat, warna livery dan nama maskapai tersinkron, HUD, throttle, pitch, yaw, roll, kamera, suara sintetis, cuaca, runway yang diperpanjang.
- **Laboratorium**: delapan eksperimen yang ada tetap tersedia, dengan area sayap dan kecepatan acuan A380; CSV praktikum dan grafik tetap ada.
- **Papercraft Studio** (`/papercraft`): thumbnail tiga halaman PDF asli, atur warna, nama, nomor registrasi, unggah logo PNG/JPG/WebP, ubah posisi/ukuran logo di halaman 3, pilih halaman, JSON save/load, pratinjau A380 3D dengan identitas yang sama.
- **PDF A3+**: tersedia PDF master **tanpa modifikasi** yang telah diperbesar 151,9048% secara proporsional pada lembar 329 × 483 mm. Sumber asli 3 halaman A4 tidak ditimpa. Ekspor PDF kustom memuat sumber sebagai embedded vector pages lalu menambahkan **overlay transparan**, dengan garis konstruksi sumber tetap ada.

## Penting — batasan yang belum terpenuhi

1. **A380 3D merupakan model prosedural edukatif, bukan CAD/model maskapai resmi dan bukan flight-simulator tersertifikasi.** Spesifikasi Airbus nyata dipakai sebagai acuan; geometri aerodinamis, respons kontrol, momen inersia, gaya seret, *stall*, *turbulence* dan take-off merupakan model pendekatan. Tidak mencakup FMS, autopilot, sistem high-lift A380 aktual, fuel burn, flight envelope penuh, atau uji sertifikasi. Pengambilan keputusan penerbangan nyata tidak boleh didasarkan pada hasil ini.
2. **Papercraft tidak sepenuhnya mengganti motif cetakan Flying Honu lama.** File yang diunggah merupakan PDF berwarna jadi, bukan master berlapis berisi path konstruksi dan livery terpisah. Aplikasi mempertahankan geometri vektor sumber dan menambah lapisan warna/logo transparan. Ini bisa menampakkan motif asli di belakang overlay. Untuk benar-benar mengganti semua motif asli, perlu dibuat master SVG/AI berlapis satu kali, memisahkan cut, fold, glue, dan warna, lalu dilakukan pengujian cetak dan perakitan. Aplikasi tidak mengklaim pemisahan tersebut sudah beres.
3. **Preview simulator 3D dan papercraft 2D membagikan identitas visual (warna, nama, gambar logo)** tetapi belum satu-ke-satu UV mapping gambar pada tiap bagian badan/sayap. Preview 3D dalam Studio menunjukkan model A380 simulator, **bukan simulasi rakitan papercraft**.
4. Posisi overlay warna di editor adalah area dekoratif yang diperkirakan, bukan hasil deteksi terverifikasi dari semua garis potong/lipat. Jangan tempatkan logo tepat pada garis sambungan. Uji satu kali cetak sebelum produksi.
5. PDF sumber dan manual adalah materi yang Anda berikan. Pastikan Anda memiliki izin yang sesuai untuk publikasi ulang/distribusi pola dan desain yang mengandung logo/merek ANA/Airbus.

## Data yang dipakai

| Parameter | Model |
|---|---:|
| Panjang badan pesawat | 72,7 m |
| Bentang sayap | 79,8 m |
| Tinggi pesawat (referensi) | 24,1 m |
| Luas referensi sayap | 845 m² |
| Empat mesin | Trent 900 / GP7200 (kelas ~70.000 lbf/mesin) |
| Daya dorong maksimum contoh | 1,244 MN total (pendekatan 4 × 311 kN) |
| Maksimum take-off weight varian tertentu | 575.000 kg |
| Massa **contoh simulasi** | 420.000 kg (asumsi skenario, bukan satu nilai wajib A380) |
| Cruise long-range | Mach 0,85 |
| Panjang runway virtual | 4.350 m |
| Variabel model yang belum tersertifikasi | CD0, CL(alpha), efisiensi sayap, inertia, respons kontrol, flap |

Sumber referensi:
- Airbus, *A380 Facts & Figures* (2021): https://www.airbus.com/sites/g/files/jlcbta136/files/2021-11/EN-Airbus-A380-Facts-and-Figures-Nov%20-2021.pdf
- Airbus, *A380 Aircraft Characteristics / Airport and Maintenance Planning* (2025): https://www.aircraft.airbus.com/sites/g/files/jlcbta126/files/2025-12/AC_A380_20251201.pdf

## Mencetak pola

- PDF asli: `assets/papercraft/master-a380-original.pdf` (A4, 3 halaman).
- PDF A3+ siap cetak: `assets/papercraft/A380_Master_A3Plus.pdf` (329 × 483 mm, 3 halaman).
- Manual: `assets/papercraft/manual-a380-original.pdf`.
- Hasil ekspor dari editor: `A380_Papercraft_A3Plus_3Halaman.pdf`.
- Set **Actual Size / 100%**, jangan **Fit to Page**, pastikan printer menerima 329 × 483 mm. Cek ruler/ukuran dan lakukan cetak uji perakitan.

## Deploy Netlify

1. Unggah **isi folder** `AEROLAB_A380` ke repository GitHub (jangan node_modules atau file ZIP saja).
2. Jika upload lewat browser GitHub gagal, gunakan Git Terminal: jalankan `bash UPLOAD_GITHUB_MAC.command` dari folder proyek.
3. Di Netlify → Add new project → Import from Git → pilih repo.
4. Build command: kosong (atau perintah echo dalam `netlify.toml`), publish directory: `.`.
5. Deploy. `/papercraft`, `/simulator`, dan rute lain akan ditangani fallback `_redirects`/`netlify.toml`.

Tidak perlu membuat akun peserta, DB, API key, atau server backend. Penyimpanan livery dan hasil praktikum hanya di browser lokal.
