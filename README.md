# AEROLAB — Aerodynamics Flight Lab 3D

Simulator penerbangan pesawat ringan 3D dan laboratorium aerodinamika untuk materi fisika fluida. Berjalan di browser menggunakan **Babylon.js**, tanpa login, tanpa database, tanpa API key, dan tanpa proses build.

## Apa saja yang sudah dibuat?

- **Simulator pesawat 3D:** pesawat ringan model prosedural dengan fuselage, sayap, ekor, aileron, elevator, rudder, flap, baling-baling, roda, dan tekstur/material.
- **Bandara dan lingkungan:** runway bergaris, taxiway, hangar, menara kontrol, pohon, gunung/medan, langit, awan, bayangan, dan preset cuaca (cerah, senja, mendung).
- **Dinamika penerbangan (pendekatan pembelajaran):** model benda tegar 6-DOF, gaya angkat, gaya hambat, dorong, gravitasi, momen kendali, ground roll, take-off, landing sederhana, stall, angin, dan turbulensi.
- **Kontrol:** keyboard, tombol sentuh, throttle, flap, brake, pause, reset, zoom/orbit, 4 sudut kamera, penunjuk vektor gaya.
- **Audio:** suara mesin baling-baling dan angin yang disintesis melalui Web Audio API (harus dinyalakan dengan tombol suara).
- **8 eksperimen:** kecepatan/lift, sudut serang/stall, massa jenis, luas/bentang sayap, flap, angin, dorong/hambat, dan ketinggian/atmosfer.
- **Panel sains:** gaya (lift/drag/thrust), koefisien, tekanan dinamis, grafik prediksi dan hasil pengamatan, input kesimpulan.
- **Manajemen hasil:** simpan praktikum di localStorage, lihat halaman `/hasil`, ekspor CSV.
- **Materi dan panduan:** halaman konten fisika dan petunjuk penggunaan.
- **Deploy Netlify:** file `netlify.toml` dan `_redirects` sudah ada untuk URL SPA seperti `/simulator` dan `/laboratorium/gaya-angkat`.

## Struktur file

```text
index.html          Halaman aplikasi + kerangka navigasi
styles.css          Gaya responsive desktop/mobile
assets/favicon.svg  Ikon aplikasi
src/main.js         Routing, interaksi UI, kontrol keyboard, praktikum
src/scene.js        Babylon.js scene, kamera, renderer dan vektor gaya
src/aircraft.js     Model 3D pesawat prosedural
src/world.js        Runway, bandara, langit, medan, pohon, awan
src/physics.js      Persamaan aerodinamika, model flight dynamics, modul lab
src/math.js         Matematika vektor dan quaternion
src/audio.js        Efek suara prosedural
src/chart.js        Grafik eksperimen tanpa library tambahan
src/storage.js      Penyimpanan lokal, ekspor data, sanitasi CSV
src/content.js      Materi aerodinamika dan panduan kontrol
src/ui.js           Komponen antarmuka halaman
netlify.toml        Build/publish dan SPA redirect Netlify
_redirects          SPA fallback untuk deployment manual
package.json        Perintah pengujian otomatis tanpa npm install
tests/physics.test.mjs  Pengujian unit mekanika dan take-off
```

## Cara menjalankan di komputer

**Tidak perlu `npm install`.** Buka terminal pada direktori proyek, lalu jalankan:

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080` pada Chrome/Edge/Firefox terbaru. Pada Windows bisa memakai `py -m http.server 8080` jika perintah `python3` tidak tersedia. Jangan membuka `index.html` lewat `file://` karena browser dapat memblokir JavaScript ES modules.

**Koneksi internet diperlukan saat pertama membuka simulator** untuk memuat Babylon.js lewat CDN. Aplikasi mencoba CDN resmi Babylon.js, lalu cadangan jsDelivr dan unpkg. Tidak diperlukan API key atau layanan backend.

## Deploy dari GitHub ke Netlify (disarankan)

1. Ekstrak ZIP ini.
2. Buat repositori baru di GitHub, misalnya `AerodynamicsFlightLab3D`.
3. **Unggah semua berkas dan folder di dalam direktori proyek** ke akar repositori. Pastikan `index.html`, `netlify.toml`, `styles.css`, `src/`, dan `assets/` berada langsung di akar repositori.
4. Buka [Netlify](https://app.netlify.com), pilih **Add new project / Import an existing project**.
5. Hubungkan GitHub lalu pilih repositori Anda.
6. Pengaturan penerbitan (jika diminta):
   - **Build command:** boleh kosong, atau `echo 'Static website'`.
   - **Publish directory:** `.` (titik, akar repositori).
   - **Base directory:** kosong.
   - **Environment variables:** tidak diperlukan.
7. Klik **Deploy**. Netlify akan melayani `index.html`; rute dalam aplikasi didukung oleh `netlify.toml` / `_redirects`.
8. Sesudah deploy, buka `/simulator` dan `/laboratorium/gaya-angkat` untuk mengecek URL langsung tidak menghasilkan 404.

> Jika Netlify mendeteksi build otomatis, pengaturan di `netlify.toml` sudah memakai `publish = "."` dan build perintah `echo` yang tidak memerlukan instalasi paket.

## Kontrol penerbangan

| Kontrol | Fungsi |
|---|---|
| ↑ / ↓ | Elevator, pitch naik / turun |
| A / D | Aileron, roll kiri / kanan |
| Q / E | Rudder, yaw kiri / kanan |
| Shift / Ctrl (tahan) | Tambah / kurangi throttle |
| F | Flap 0° → 10° → 20° → 30° → 0° |
| B (tahan) | Rem roda di darat |
| C | Kamera chase → cockpit → side → top |
| V | Aktif/nonaktif vektor gaya |
| P | Pause / lanjutkan |
| R | Reset |
| Mouse drag / scroll | Putar kamera chase / zoom |

**Latihan take-off:** naikkan throttle ke 100%. Setelah airspeed melewati kira-kira 26–32 m/s (tergantung kondisi), tekan ↑ dengan lembut. Lepaskan atau kurangi input setelah pesawat meninggalkan landasan. Kontrol terlalu ekstrem dapat menyebabkan stall atau osilasi.

## Cara praktik laboratorium

1. Masuk ke **Laboratorium**, pilih satu dari 8 eksperimen.
2. Ubah slider pada panel kanan. Model dan data dihitung ulang.
3. Klik **Rekam hasil** pada beberapa nilai variabel berbeda.
4. Grafik menampilkan garis prediksi (menggunakan model yang sama) dan titik pengamatan.
5. Isi kesimpulan, pilih **Simpan laporan**, atau **Unduh CSV**.
6. Laporan yang disimpan dapat dibuka pada `/hasil`. Penyimpanan hanya di browser/perangkat itu; menghapus data situs bisa menghapus laporan.

## Validasi matematis

Jalankan:

```bash
npm test
npm run check
```

Node.js >=18 diperlukan untuk pengujian, tetapi **tidak diperlukan untuk membuka atau deploy website**. Pengujian mencakup skala lift terhadap kuadrat kecepatan, massa jenis, stall, flap, angin, quaternion, akselerasi, take-off, dan reset.

## Batasan ilmiah dan teknis

- Ini simulator **edukatif berbasis model parameterisasi**, **bukan simulator penerbangan tersertifikasi**, flight dynamics profesional, atau solver CFD.
- Model 3D dibuat secara prosedural; tampilannya bergaya simulator visual dan belum menggunakan model fotorealistis GLB komersial. Material, shading, sky, dan terrain dapat dikembangkan lebih lanjut.
- Gaya lift dan drag menggunakan model koefisien aerodinamika sederhana serta kurva stall yang diaproksimasi; nilai karakteristiknya bukan klaim hasil pengujian pesawat Cessna atau data pabrikan.
- Kontak roda dan tanah menggunakan model sederhana (tanpa Havok). Terbang dan landing memiliki pembatasan agar efektif untuk pembelajaran; tumbukan dengan gedung dan pohon tidak dihitung.
- Visual aliran udara menampilkan tracer ilustratif; bukan solusi numerik persamaan Navier–Stokes atau visual tekanan CFD.
- Kecepatan dan performa bergantung pada WebGL/GPU. Pilih opsi grafis **Low** bila perangkat lambat.
- Audio perlu diaktifkan oleh klik pengguna karena kebijakan autoplay browser.
- Untuk menjalankan engine tanpa akses internet, file distribusi Babylon.js harus di-vendor secara legal ke proyek dan rujukan di `loadBabylon()` diganti ke file lokal.

## Pengembangan lebih lanjut

Saran fase berikutnya: model GLB pesawat realistis dari aset berlisensi jelas, model koefisien aerodinamika berdasarkan data airfoil terverifikasi, airfoil khusus per elemen sayap, instrumen kokpit lengkap, gamepad, collision body dengan Havok, navigasi area luas, skenario praktikum berbasis penilaian, dan penyimpanan opsional ke Neon PostgreSQL.

## Lisensi

Kode aplikasi asli dapat dimodifikasi untuk pembelajaran. Runtime Babylon.js dimuat dari CDN dan tunduk pada lisensi Babylon.js (Apache 2.0). Tidak ada aset 3D eksternal yang dibundel.
