# 🗑️ TikTok Repost Remover

**TikTok Repost Remover** adalah ekstensi Google Chrome yang dirancang untuk membantu Anda menghapus (membatalkan) semua video yang pernah Anda *repost* di TikTok secara otomatis. Ekstensi ini menggunakan algoritma otomasi cerdas yang meniru perilaku manusia dan dilengkapi dengan peretasan sistem untuk berjalan mulus di latar belakang tanpa mengganggu aktivitas Anda.

---

## ✨ Fitur Utama

- 🤖 **Otomasi Penuh (Hands-Free)**: Cukup tekan tombol "Start" dan ekstensi akan mencari tab "Reposts" di profil Anda, membuka setiap video, mengeklik tombol *Remove Repost*, dan menutupnya secara berulang hingga bersih.
- 👻 **Mode Siluman (Background Execution)**: Bot berjalan di jendela *minimized* (diperkecil) khusus. Anda bisa tetap menonton YouTube, bekerja, atau *browsing* di jendela utama Chrome tanpa terganggu.
- 🔇 **Anti-Bocor Suara (Audio Mute & Autoplay Blocker)**: Tab latar belakang secara paksa di-*mute* di level browser. Ekstensi juga membajak fungsi pemutar video bawaan TikTok agar video tidak terputar (*autoplay*), menghemat kuota dan memastikan telinga Anda aman dari suara bising.
- 🛡️ **Perisai Anti-Sentuh (Tamper-Proof Shield)**: Jendela otomatisasi dilindungi oleh layar gelap yang memblokir semua klik dan *scroll* manual. Ini mencegah Anda atau orang lain merusak alur kerja bot jika tidak sengaja membuka jendela tersebut.
- 🚀 **Bypass Throttling Chrome (SPA Hacks)**: Menggunakan manipulasi *IntersectionObserver*, *requestAnimationFrame*, dan dimensi layar (*viewport*) untuk membohongi algoritma *React* TikTok. Hal ini memaksa TikTok tetap memuat video meskipun tab disembunyikan.

---

## ⚙️ Cara Instalasi (Developer Mode)

Karena ekstensi ini tidak (atau belum) diunggah ke Chrome Web Store, Anda perlu menginstalnya secara manual:

1. Unduh atau *clone* *repository* folder ini ke komputer Anda.
2. Buka browser Google Chrome.
3. Ketik `chrome://extensions/` di bilah alamat (URL) dan tekan **Enter**.
4. Aktifkan **Developer mode** (Mode Pengembang) melalui tombol *toggle* di sudut kanan atas layar.
5. Klik tombol **Load unpacked** (Muat yang belum dikemas) di kiri atas.
6. Pilih direktori folder **`remove-repost-extension`** ini.
7. Ekstensi berhasil diinstal dan ikonnya akan muncul di daftar ekstensi Anda! (Sematkan *pin* ikonnya agar mudah diakses).

---

## 🎮 Cara Penggunaan

1. Buka halaman web mana saja di Chrome.
2. Klik ikon ekstensi **TikTok Repost Remover** di pojok kanan atas browser Anda.
3. Klik tombol **Start**.
4. Sebuah jendela Chrome baru akan terbuka secara otomatis dan langsung mengecil (*minimize*) ke *taskbar* Anda.
5. Pantau prosesnya! Anda bisa membuka kembali *Pop-Up* ekstensi kapan saja untuk melihat status '*Real-time*' dan jumlah video yang telah berhasil dihapus.
7. Setelah ekstensi tidak menemukan video *repost* lagi, ia akan berstatus **"Finished"** dan otomatis menutup jendela *background* tersebut dengan rapi.

---

## Troubleshooting
- Jika ekstensi tidak bisa menghapus maka anda perlu monitoring beberapa penghapusan di tab background. Tidak perlu klik apapun ketika tombol background berjalan. 
- Jika kode stuck di "Finished: No more reposts found", anda perlu hapus riwayat tiktok di browser.

## 🛠️ Struktur Direktori

```
remove-repost-extension/
│
├── background.js          # Mengelola siklus jendela background dan pengiriman perintah
├── manifest.json          # Konfigurasi perizinan dan identitas ekstensi
├── README.md              # Dokumentasi ini
│
├── assets/
│   └── color-icon.png     # Ikon ekstensi
│
├── content/
│   ├── automation.js      # Logika utama (Loop otomasi, Shield, dan Navigasi DOM)
│   ├── content.js         # Entry point & Injeksi script Anti-Throttling ke halaman web
│   ├── selectors.js       # Kumpulan selektor DOM (data-e2e) untuk TikTok
│   ├── bypass.js          # bypass anti tiktok detection
│   └── utils.js           # Fungsi pembantu (delay acak, logger, dll)
│
└── popup/
    ├── popup.css          # Gaya desain Pop-Up bergaya Glassmorphism
    ├── popup.html         # Struktur UI Pop-Up
    └── popup.js           # Logika antarmuka dan komunikasi status ke background
```

---

## ⚠️ Disclaimer

- **Pembaruan Antarmuka TikTok**: TikTok sering kali mengubah struktur kode HTML/CSS mereka (A/B Testing). Jika ekstensi tiba-tiba tidak berfungsi, kemungkinan besar atribut \`data-e2e\` atau selektor tombol telah berubah. Selektor tersebut dapat diperbarui secara terpusat di file \`content/selectors.js\`.
- Gunakan alat otomasi ini secara wajar. Kami tidak bertanggung jawab atas tindakan pembatasan akun yang mungkin dilakukan oleh pihak TikTok akibat aktivitas bot yang berlebihan.
- Program tidak berjalan instan perlu 2-3 detik untuk menghapus satu repost.