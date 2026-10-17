import {getLivery,saveLivery,validateLivery,downloadLivery,DEFAULT_LIVERY} from './livery.js';
const BASE='/assets/papercraft';
// Regions are visual overlays only, NOT construction geometry or physical UV maps.
// Coordinates 0..1 within each ORIGINAL A4 page, top-left origin.
const ACCENTS=[
 [ {x:.22,y:.13,w:.45,h:.14,type:'primary'}, {x:.18,y:.35,w:.48,h:.12,type:'secondary'} ],
 [ {x:.29,y:.23,w:.39,h:.065,type:'primary'}, {x:.29,y:.54,w:.39,h:.065,type:'secondary'} ],
 [ {x:.11,y:.39,w:.72,h:.083,type:'primary'}, {x:.14,y:.78,w:.67,h:.05,type:'secondary'} ]
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colorHex=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
function trigger(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),8000);}
export function papercraftPage(){return `<section class="container page-section paper-app"><span class="section-kicker">AIRBUS A380 / DESIGN + PRINT</span>
<h1 class="page-title">A380 <em>Papercraft Studio</em></h1>
<p class="page-description">Ubah identitas livery yang juga digunakan pesawat 3D di simulator. Tiga halaman PDF asli dipertahankan sebagai master vektor; hasil ekspor diperbesar seragam ke A3+.</p>
<div class="paper-warning"><b>Mode aman geometri:</b> perubahan warna dan logo sekarang berupa <strong>lapisan transparan di atas desain asli Flying Honu</strong> (tidak menghapus motif bawaan). Garis potong, lipatan, dan tab lem pada master tidak diubah. Untuk mengganti motif lama secara sempurna, masih diperlukan pembuatan master berlapis dari file Illustrator sumber dan uji cetak fisik.</div>
<div class="paper-layout"><aside class="paper-controls">
<h3>Identitas pesawat</h3>
<label for="liveryName">Nama / maskapai</label><input maxlength="24" id="liveryName" type="text" placeholder="AEROLAB"/>
<label for="liveryRegistration">Nomor registrasi</label><input maxlength="18" id="liveryRegistration" type="text" placeholder="A380-LAB"/>
<div class="paper-colors"><div><label for="liveryPrimary">Warna utama</label><input type="color" id="liveryPrimary"/></div><div><label for="liverySecondary">Warna aksen</label><input type="color" id="liverySecondary"/></div><div><label for="liveryTail">Warna ekor 3D</label><input type="color" id="liveryTail"/></div></div>
<label for="liveryOpacity">Transparansi lapisan cetak <span id="opacityLabel"></span></label><input type="range" min="15" max="65" step="5" id="liveryOpacity" />
<label for="liveryLogo">Gambar logo sendiri (PNG, JPEG, WebP; maks 1,5 MB)</label><input id="liveryLogo" type="file" accept="image/png,image/jpeg,image/webp"/><p class="paper-note">Logo muncul pada desain 2D dan pada pesawat 3D. Untuk hasil terbaik gunakan gambar dengan latar transparan.</p>
<label for="logoSize">Ukuran logo pada badan (halaman 3): <span id="logoSizeLabel">20%</span></label><input type="range" min="8" max="34" id="logoSize" value="20" />
<p class="paper-note">Seret logo pada lembar halaman 3 untuk mengubah posisi. Hindari garis lipatan dan area sambungan saat mencetak.</p>
<div class="paper-buttonstack"><button id="saveLivery" class="btn btn-primary">✓ Terapkan ke Simulator 3D</button><button id="saveLiveryJson" class="btn btn-outline">↓ Simpan desain (.json)</button><label class="btn btn-outline paper-file-label">↑ Buka desain (.json)<input type="file" id="loadLiveryJson" accept=".json,application/json"/></label><button id="resetLivery" class="btn btn-outline">↺ Reset desain</button></div>
<div class="paper-note paper-resources"><a href="${BASE}/master-a380-original.pdf" target="_blank" rel="noopener">↗ Unduh PDF A380 asli (A4)</a><a href="${BASE}/A380_Master_A3Plus.pdf" target="_blank" rel="noopener">↗ Download pola master A3+ (tanpa overlay)</a><a href="${BASE}/manual-a380-original.pdf" target="_blank" rel="noopener">↗ Manual perakitan</a></div>
</aside>
<div class="paper-workspace"><div class="paper-toolbar"><b>Template pesawat asli</b><div class="paper-tabs">${[1,2,3].map(i=>`<button data-page="${i}" class="paper-tab ${i===1?'active':''}">${String(i).padStart(2,'0')}</button>`).join('')}</div><span id="paperStatus">Halaman 1/3</span></div>
<div class="paper-preview"><div class="paper-sheet" id="paperSheet"><img draggable="false" id="paperPreviewImage" src="${BASE}/preview-1.jpg" alt="Pratinjau halaman master A380"/><div id="paperPaint" class="paper-paint"></div><img alt="Logo desain" id="paperLogo" draggable="false"/></div></div>
<div class="paper-toolbar"><div><strong>PDF A3+ · 329 × 483 mm</strong><small>Skala 151,90% · margin sisi 5 mm · 3 halaman</small></div><button id="exportA3" class="btn btn-primary">↓ Ekspor PDF A3+</button></div>
<div id="exportMessage" class="paper-note" aria-live="polite"></div>
<div class="paper-three-d"><div><h3>Pratinjau livery A380 3D</h3><div class="control-field"><label for="paperModelSelect">Sumber model 3D</label><select id="paperModelSelect"><option value="community">GLB amvlab (CC BY)</option><option value="bundled">GLB AEROLAB lokal</option><option value="procedural">Prosedural</option><option value="custom" disabled>GLB pribadi</option></select><label for="paperGlbUpload" class="upload-glb-label">↑ Upload GLB Anda</label><input type="file" id="paperGlbUpload" accept=".glb,model/gltf-binary"/></div><p>Warna, nama maskapai, dan gambar logo memakai penyimpanan yang sama dengan simulator. Bentuk 3D ini adalah model edukatif A380, bukan representasi lipatan papercraft satu-per-satu.</p></div><div class="viewport paper-3d-viewport"><div class="model-source-status" data-model-status aria-live="polite">Menyiapkan model A380…</div><canvas id="papercraftCanvas" aria-label="Model A380 tiga dimensi dengan livery terpilih"></canvas><div id="engineError" class="engine-error hidden"></div></div></div>
</div></div></section>`;}
export function initPapercraft({listen,notice}){
 const $=id=>document.getElementById(id);let active=1,l=getLivery();
 // Logo placement stored as a separate editor preference; never part of master geometry.
 let placement={x:.40,y:.40,w:.20};try{placement={...placement,...JSON.parse(localStorage.getItem('aerolab.a380.logoPlacement')||'{}')};}catch{}
 const inputMap={name:'liveryName',registration:'liveryRegistration',primary:'liveryPrimary',secondary:'liverySecondary',tail:'liveryTail'};
 const syncControls=()=>{for(const [key,id]of Object.entries(inputMap))$(id).value=l[key];$('liveryOpacity').value=Math.round(l.opacity*100);$('opacityLabel').textContent=Math.round(l.opacity*100)+'%';$('logoSize').value=Math.round(placement.w*100);$('logoSizeLabel').textContent=Math.round(placement.w*100)+'%';};
 const readControls=()=>{let o={...l};for(const [key,id]of Object.entries(inputMap))o[key]=$(id).value;o.opacity=Number($('liveryOpacity').value)/100;l=validateLivery(o);};
 const updatePreview=()=>{
  const over=$('paperPaint');over.replaceChildren();for(const zone of ACCENTS[active-1]){
   const div=document.createElement('div');div.className='paper-tint';div.style.cssText=`left:${zone.x*100}%;top:${zone.y*100}%;width:${zone.w*100}%;height:${zone.h*100}%;background:${l[zone.type]};opacity:${(l.opacity*.50).toFixed(3)};`;over.append(div);
  }
  const logo=$('paperLogo');logo.style.display=active===3&&l.logoData?'block':'none';if(l.logoData){logo.src=l.logoData;logo.style.cssText+=`;left:${placement.x*100}%;top:${placement.y*100}%;width:${placement.w*100}%;opacity:${l.opacity};display:${active===3?'block':'none'}`;}
  $('opacityLabel').textContent=Math.round(l.opacity*100)+'%';$('logoSizeLabel').textContent=Math.round(placement.w*100)+'%';
 };
 const setPage=n=>{active=n;$('paperPreviewImage').src=`${BASE}/preview-${active}.jpg`;document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',+b.dataset.page===active));$('paperStatus').textContent=`Halaman ${active}/3`;updatePreview();};
 const commit=()=>{readControls();try{saveLivery(l);notice('Livery diperbarui pada simulator dan pratinjau 3D.');}catch(e){notice(e.message);}updatePreview();};
 for(const key of Object.keys(inputMap))listen($(inputMap[key]),'input',commit);
 listen($('liveryOpacity'),'input',commit);
 listen($('saveLivery'),'click',commit);
 listen($('logoSize'),'input',()=>{placement.w=+$('logoSize').value/100;savePlacement();updatePreview();});
 for(const b of document.querySelectorAll('[data-page]'))listen(b,'click',()=>setPage(+b.dataset.page));
 listen($('liveryLogo'),'change',async e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>1_500_000){notice('Format gambar tidak didukung atau ukuran lebih dari 1,5 MB.');return;}let data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});l.logoData=data;try{saveLivery(l);}catch(err){notice(err.message);return;}setPage(3);notice('Logo terhubung dengan simulator 3D.');});
 function savePlacement(){try{localStorage.setItem('aerolab.a380.logoPlacement',JSON.stringify(placement));}catch{}}
 let drag=false;
 listen($('paperLogo'),'pointerdown',e=>{e.preventDefault();drag=true;$('paperLogo').setPointerCapture(e.pointerId);});
 listen($('paperLogo'),'pointermove',e=>{if(!drag)return;const rect=$('paperSheet').getBoundingClientRect();placement.x=Math.max(.02,Math.min(.98-placement.w,(e.clientX-rect.left)/rect.width-placement.w/2));placement.y=Math.max(.03,Math.min(.87,(e.clientY-rect.top)/rect.height-.025));savePlacement();updatePreview();});
 listen($('paperLogo'),'pointerup',()=>{drag=false;});listen($('paperLogo'),'pointercancel',()=>{drag=false;});
 listen($('resetLivery'),'click',()=>{if(!confirm('Reset livery ke warna bawaan AEROLAB?'))return;l={...DEFAULT_LIVERY};placement={x:.4,y:.4,w:.2};savePlacement();saveLivery(l);syncControls();updatePreview();notice('Livery kembali ke bawaan AEROLAB.');});
 listen($('saveLiveryJson'),'click',()=>{readControls();trigger(new Blob([downloadLivery(l)],{type:'application/json'}),'A380_Livery.json');});
 listen($('loadLiveryJson'),'change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>3_000_000)throw Error('File terlalu besar');const j=JSON.parse(await f.text());if(j.schema!=='aerolab-a380-livery-v1')throw Error('Format proyek tidak dikenali');l=validateLivery(j.livery);saveLivery(l);syncControls();updatePreview();notice('Desain livery berhasil dibuka.');}catch(err){notice('Gagal membuka desain: '+err.message)}});
 listen($('exportA3'),'click',()=>exportA3(l,placement,$('exportA3'),$('exportMessage')));
 syncControls();setPage(1);
}
async function loadPdfLib(){if(window.PDFLib)return window.PDFLib;
 const urls=['https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js','https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'];
 for(const url of urls){try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=reject;document.head.append(script)});if(window.PDFLib)return window.PDFLib;}catch{}}
 throw new Error('Pustaka PDF tidak dapat dimuat. Periksa koneksi internet ke CDN.');
}
async function embedLogo(pdf,lib,data){if(!data)return null;const img=new Image();img.src=data;await img.decode();const canvas=document.createElement('canvas');canvas.width=Math.min(1200,img.naturalWidth);canvas.height=Math.round(canvas.width*img.naturalHeight/img.naturalWidth);const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);return await pdf.embedPng(canvas.toDataURL('image/png'));}
export async function exportA3(l,placement,button,message){
 button.disabled=true;button.textContent='Membuat PDF…';message.textContent='Mempersiapkan 3 halaman A3+…';
 try{
  const lib=await loadPdfLib();const resp=await fetch(BASE+'/master-a380-original.pdf');if(!resp.ok)throw Error('PDF master A380 tidak ditemukan.');const input=await resp.arrayBuffer();
  const {PDFDocument,rgb}=lib;const out=await PDFDocument.create();const source=await out.embedPdf(input,[0,1,2]);const mm=72/25.4;
  const outW=329*mm,outH=483*mm,srcW=210*mm,srcH=297*mm,scale=(329-10)/210,drawW=srcW*scale,drawH=srcH*scale,startX=(outW-drawW)/2,startY=(outH-drawH)/2;
  const logo=await embedLogo(out,lib,l.logoData);
  for(let i=0;i<3;i++){
   const page=out.addPage([outW,outH]);page.drawPage(source[i],{x:startX,y:startY,width:drawW,height:drawH});
   // The original PDF is embedded as an UNMODIFIED vector page. These are transparent ink overlays.
   for(const z of ACCENTS[i]){const c=colorHex(l[z.type]);page.drawRectangle({x:startX+drawW*z.x,y:startY+drawH*(1-z.y-z.h),width:drawW*z.w,height:drawH*z.h,color:rgb(c.r,c.g,c.b),opacity:l.opacity*.50});}
   if(i===2 && logo){page.drawImage(logo,{x:startX+placement.x*drawW,y:startY+(1-placement.y-.075)*drawH,width:placement.w*drawW,height:.075*drawH,opacity:l.opacity});}
   // A3+ document has no forced fit-to-page or rasterized base PDF.
  }
  out.setTitle('A380 Papercraft Studio - Pola 3 halaman A3+');out.setSubject('Pola asli A380 dengan overlay livery transparan; master konstruksi tidak diubah');
  const bytes=await out.save();trigger(new Blob([bytes],{type:'application/pdf'}),'A380_Papercraft_A3Plus_3Halaman.pdf');
  message.textContent='PDF 329 × 483 mm selesai. Cetak 100% / Actual Size. Pastikan posisi overlay tidak menutupi area konstruksi; lakukan satu cetak uji sebelum produksi.';
 }catch(err){console.error(err);message.textContent='Gagal ekspor: '+err.message;}
 finally{button.disabled=false;button.textContent='↓ Ekspor PDF A3+';}
}
