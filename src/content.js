export const TOPICS=[
  {icon:'◈',title:'Gaya Angkat (Lift)',text:'Gaya angkat bekerja tegak lurus terhadap aliran udara relatif. Besarnya dipengaruhi oleh tekanan dinamis, luas sayap, sudut serang, bentuk sayap, dan konfigurasi flap.',formula:'L = ½ ρ V² S Cₗ'},
  {icon:'⇥',title:'Gaya Hambat (Drag)',text:'Hambatan udara melawan pergerakan pesawat terhadap massa udara. Hambatan total mencakup hambatan parasit dan hambatan terinduksi yang berkaitan dengan pembentukan gaya angkat.',formula:'D = ½ ρ V² S Cᴅ'},
  {icon:'∠',title:'Sudut Serang (AoA)',text:'Sudut serang merupakan sudut antara garis chord sayap dengan arah angin relatif. AoA tidak sama dengan pitch pesawat; keduanya dapat berbeda ketika lintasan naik atau turun.',formula:'α = sudut chord − arah angin relatif'},
  {icon:'〰',title:'Stall dan Separasi Aliran',text:'Setelah melewati sudut serang kritis, aliran udara dapat terpisah dari sayap sehingga koefisien angkat turun dan hambat meningkat. Pesawat dapat stall pada berbagai kecepatan dan sikap.',formula:'α > αₖᵣᵢₜ → Cₗ menurun'},
  {icon:'⌁',title:'Massa Jenis Udara',text:'Kerapatan udara pada umumnya berkurang ketika ketinggian meningkat. Untuk kecepatan udara sejati dan koefisien tetap, hal ini mengurangi gaya aerodinamika.',formula:'q = ½ ρ V²'},
  {icon:'⇢',title:'Dorong dan Energi',text:'Mesin memberikan gaya dorong yang membantu pesawat mengatasi hambatan dan meningkatkan energi gerak. Dorong tidak selalu sama dengan kecepatan; percepatan dipengaruhi resultan gaya.',formula:'ΣF = m a'},
  {icon:'⤴',title:'Pitch, Roll, Yaw',text:'Elevator mengubah kecenderungan gerak pitch; aileron memengaruhi roll; rudder memengaruhi yaw. Stabilitasnya dipengaruhi momen aerodinamika dan inersia pesawat.',formula:'τ = I α (pendekatan satu sumbu)'},
  {icon:'✦',title:'Angin dan Turbulensi',text:'Gaya aerodinamika bergantung pada kecepatan pesawat relatif terhadap udara, bukan sekadar kecepatan terhadap tanah. Gangguan angin mengubah aliran relatif sehingga pesawat dapat mengalami guncangan.',formula:'Vᵣₑₗ = Vₚₑₛₐwₐₜ − Vₐₙɡᵢₙ'}
];
export const FLIGHT_GUIDE=[
  ['↑ / ↓','Pitch naik / turun','Gerakan elevator mengubah sikap hidung. Saat take-off tekan ↑ secara bertahap ketika airspeed cukup.'],
  ['A / D','Roll kiri / kanan','Miringkan pesawat untuk berbelok; gunakan elevator untuk mempertahankan ketinggian.'],
  ['Q / E','Yaw kiri / kanan','Kontrol rudder untuk arah dan koordinasi belokan.'],
  ['Shift / Ctrl','Throttle naik / turun','Tekan dan tahan untuk meningkatkan atau menurunkan tenaga mesin.'],
  ['F','Atur flap','Beralih 0° → 10° → 20° → 30° → 0°. Flap menambah lift dan drag.'],
  ['B (tahan)','Rem roda','Gunakan saat pesawat sudah berada di landasan.'],
  ['C','Ganti kamera','Urutan chase, cockpit, side, dan top.'],
  ['V','Tampilkan vektor gaya','Lihat arah lift, drag, thrust, dan weight.'],
  ['P','Pause / lanjut','Membekukan perhitungan fisika dan gerakan di layar.'],
  ['R','Reset pesawat','Kembali ke posisi awal di landasan.'],
  ['Mouse','Orbit / zoom','Tarik untuk memutar kamera chase; gulir untuk memperbesar / memperkecil.']
];
