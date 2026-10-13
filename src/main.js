import {FlightScene} from './scene.js';
import {AudioEngine} from './audio.js';
import {LABS,DEFAULT_LAB,labCalculation} from './physics.js';
import {plotLab} from './chart.js';
import {getSavedExperiments,saveExperiment,deleteExperiment,downloadText,toCSV,escapeHTML} from './storage.js';
import {homePage,simulatorPage,labsPage,experimentPage,theoryPage,guidePage,labCard,format} from './ui.js';

const page=document.getElementById('page');
let currentScene=null,cleanup=[],toastTimeout=null,babylonPromise=null;
const $=(id)=>document.getElementById(id);
function listen(target,event,fn,options){target.addEventListener(event,fn,options);cleanup.push(()=>target.removeEventListener(event,fn,options));}
function notice(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3400);}
function destroy(){if(currentScene){currentScene.dispose();currentScene=null;}cleanup.forEach(fn=>{try{fn();}catch{}});cleanup=[];}
function go(path){if(location.pathname!==path)history.pushState({},'',path);render();window.scrollTo(0,0);}
function render(){
  destroy();
  const url=decodeURI(location.pathname),parts=url.split('/').filter(Boolean);
  let route='home',lab=null;
  if(url==='/simulator')route='simulator';
  else if(url==='/laboratorium')route='laboratorium';
  else if(parts[0]==='laboratorium'&&parts[1]){lab=LABS.find(l=>l.id===parts[1]);route=lab?'experiment':'404';}
  else if(url==='/materi')route='materi';
  else if(url==='/panduan')route='panduan';
  else if(url==='/hasil')route='hasil';
  else if(url!=='/')route='404';
  const templates={home:homePage,simulator:simulatorPage,laboratorium:labsPage,materi:theoryPage,panduan:guidePage,hasil:resultsPage};
  page.innerHTML=route==='experiment'?experimentPage(lab):route==='404'?`<section class="container page-section"><h1>Halaman tidak ditemukan</h1><p>Alamat yang dibuka tidak tersedia.</p><a data-link href="/" class="btn btn-primary">Kembali ke beranda</a></section>`:templates[route]();
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(route==='experiment'?'laboratorium':route)));
  $('mainNav').classList.remove('open');
  document.title=(route==='experiment'?lab.title:{simulator:'Flight Simulator 3D',laboratorium:'Laboratorium Fluida',materi:'Materi Aerodinamika',panduan:'Panduan',hasil:'Riwayat Praktikum'}[route]||'Beranda')+' | Aerodynamics Flight Lab';
  if(route==='simulator')initSimulator();
  if(route==='experiment')initExperiment(lab);
  if(route==='hasil')initResults();
}
function loadBabylon(){
  if(window.BABYLON)return Promise.resolve();
  if(babylonPromise)return babylonPromise;
  const mirrors=[
    'https://cdn.babylonjs.com/babylon.js',
    'https://cdn.jsdelivr.net/npm/babylonjs@8.0.0/babylon.js',
    'https://unpkg.com/babylonjs@8.0.0/babylon.js'
  ];
  babylonPromise=(async()=>{
    for(const url of mirrors){
      try{
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');script.src=url;script.async=true;
          const timeout=setTimeout(()=>{script.remove();reject(new Error('Timeout memuat engine 3D'));},9000);
          script.onload=()=>{clearTimeout(timeout);resolve();};
          script.onerror=()=>{clearTimeout(timeout);script.remove();reject(new Error('CDN tidak dapat diakses'));};
          document.head.appendChild(script);
        });
        if(window.BABYLON)return;
      }catch(e){console.warn('Babylon CDN mirror failed',url,e.message);}
    }
    throw new Error('Gagal memuat Babylon.js dari semua CDN. Pastikan koneksi internet dan browser mengizinkan JavaScript dari CDN.');
  })();
  babylonPromise.catch(()=>{babylonPromise=null;});
  return babylonPromise;
}
async function attachScene(canvasId,options){
  const canvas=$(canvasId),error=$('engineError');
  const loading=document.createElement('div');loading.className='engine-loading';loading.innerHTML='<span class="spinner"></span><span>Memuat mesin 3D Babylon.js...</span>';
  canvas.parentElement.appendChild(loading);
  try{
    await loadBabylon();
    if(!canvas.isConnected)return null;
    const instance=new FlightScene(canvas,{...options,onError:(e)=>{console.error(e);error.classList.remove('hidden');error.textContent='Terjadi kesalahan rendering: '+e.message;}});
    currentScene=instance;return instance;
  }catch(e){
    if(canvas.isConnected){console.error(e);error.classList.remove('hidden');error.textContent=e.message+' Silakan refresh halaman atau coba browser terbaru.';}
    return null;
  }finally{loading.remove();}
}

async function initSimulator(){
  const s=await attachScene('flightCanvas',{mode:'flight'});
  if(!s)return;
  const sel=(id)=>$(id);
  const sound=new AudioEngine();cleanup.push(()=>{void sound.stop();});
  const pressed=new Set();
  const cameras=['chase','cockpit','side','top'];let cameraIndex=0;
  const liveControl=()=>{
    const active=(name)=>pressed.has(name);
    s.setControl('pitch',Number(active('arrowup')||active('pitch-up'))-Number(active('arrowdown')||active('pitch-down')));
    s.setControl('roll',Number(active('d')||active('roll-right'))-Number(active('a')||active('roll-left')));
    s.setControl('yaw',Number(active('e')||active('yaw-right'))-Number(active('q')||active('yaw-left')));
    s.setControl('brake',active('b')||active('brake'));
  };
  const throttle=sel('throttle');
  const setThrottle=(v)=>{v=Math.round(Math.max(0,Math.min(100,v)));throttle.value=String(v);sel('throttleLabel').textContent=v+'%';s.setControl('throttle',v/100);};
  const cycleCamera=()=>{cameraIndex=(cameraIndex+1)%cameras.length;s.setCamera(cameras[cameraIndex]);sel('cameraName').textContent=cameras[cameraIndex].toUpperCase();notice('Kamera: '+cameras[cameraIndex]);};
  const cycleFlap=()=>{const v=(s.model.controls.flap+10)%40;s.setControl('flap',v);sel('flapLabel').textContent=v+'°';notice('Flap '+v+'°');};
  const toggleVectors=()=>{s.setForces(!s.showForces);sel('vectorButton').classList.toggle('active',s.showForces);notice('Vektor gaya '+(s.showForces?'ditampilkan':'disembunyikan'));};
  const togglePause=()=>{const pause=s.togglePause();sel('pauseButton').textContent=pause?'▶ LANJUT':'Ⅱ PAUSE';notice(pause?'Simulasi dihentikan sementara':'Simulasi dilanjutkan');};
  const applyWeather=()=>{
    const settings={weather:sel('weatherSelect').value,windSpeed:+sel('windSpeed').value,windDirection:+sel('windDirection').value,turbulence:+sel('turbulence').value};
    sel('windSpeedLabel').textContent=settings.windSpeed+' m/s';sel('turbulenceLabel').textContent=settings.turbulence+' / 5';s.setWeather(settings);
  };
  listen(throttle,'input',()=>setThrottle(+throttle.value));
  for(const id of ['weatherSelect','windSpeed','windDirection','turbulence'])listen(sel(id),'input',applyWeather);
  listen(sel('cameraButton'),'click',cycleCamera);
  listen(sel('qualitySelect'),'change',e=>{s.setQuality(e.target.value);notice('Kualitas grafis: '+e.target.value);});
  s.setQuality('medium');
  listen(sel('audioButton'),'click',async()=>{try{if(sound.active){await sound.stop();sel('audioButton').textContent='♫ SUARA OFF';}else{await sound.start();sel('audioButton').textContent='♫ SUARA ON';}}catch(e){notice('Audio tidak dapat diaktifkan: '+e.message);}});
  listen(sel('flapButton'),'click',cycleFlap);
  listen(sel('vectorButton'),'click',toggleVectors);
  listen(sel('pauseButton'),'click',togglePause);
  listen(sel('resetButton'),'click',()=>{s.reset();setThrottle(35);sel('flapLabel').textContent='0°';sel('pauseButton').textContent='Ⅱ PAUSE';applyWeather();notice('Pesawat kembali ke landasan');});
  for(const el of document.querySelectorAll('[data-hold]')){
    const key=el.dataset.hold;
    listen(el,'pointerdown',e=>{e.preventDefault();pressed.add(key);liveControl();el.classList.add('pressed');el.setPointerCapture?.(e.pointerId);});
    const release=()=>{pressed.delete(key);liveControl();el.classList.remove('pressed');};
    listen(el,'pointerup',release);listen(el,'pointercancel',release);listen(el,'lostpointercapture',release);
  }
  const mapped=new Set(['arrowup','arrowdown','a','d','q','e','b','shift','control','f','c','p','v','r']);
  const isTyping=e=>e.target instanceof HTMLElement&&!!e.target.closest('input,textarea,select,[contenteditable]');
  listen(window,'keydown',e=>{
    if(isTyping(e))return;
    const key=e.key.toLowerCase();if(!mapped.has(key))return;
    e.preventDefault();
    const isFirst=!pressed.has(key);pressed.add(key);liveControl();
    if(!isFirst)return;
    if(key==='f')cycleFlap();if(key==='c')cycleCamera();if(key==='p')togglePause();if(key==='v')toggleVectors();
    if(key==='r'){s.reset();setThrottle(35);sel('flapLabel').textContent='0°';applyWeather();notice('Pesawat di-reset');}
  });
  listen(window,'keyup',e=>{pressed.delete(e.key.toLowerCase());liveControl();});
  listen(window,'blur',()=>{pressed.clear();liveControl();});
  const interval=setInterval(()=>{
    if(pressed.has('shift'))setThrottle(+throttle.value+1.7);
    if(pressed.has('control'))setThrottle(+throttle.value-1.7);
  },55);
  cleanup.push(()=>clearInterval(interval));
  s.onTelemetry=t=>{
    sound.update(t);
    const data={airspeed:format(t.speedKmh,0),altitude:format(t.altitude,0),heading:format(t.heading,0).padStart(3,'0'),vertical:format(t.verticalSpeed,1),aoa:format(t.alpha,1),pitch:format(t.pitch,1),bank:format(t.bank,1),lift:format(t.lift/1000,2),drag:format(t.drag/1000,2),load:format(t.loadFactor,2)+' g'};
    for(const [key,value]of Object.entries(data))document.querySelectorAll(`[data-t="${key}"]`).forEach(el=>el.textContent=value);
    const alert=sel('flightAlert');if(!alert)return;
    if(t.stall){alert.textContent='⚠ PERINGATAN: STALL — KURANGI SUDUT SERANG';alert.classList.add('warning');}
    else if(t.crash){alert.textContent='⚠ PENYENTUHAN KERAS — RESET UNTUK MENGULANG';alert.classList.add('warning');}
    else if(t.onGround){alert.textContent='● ON GROUND — '+(t.speedKmh>30?'GROUND ROLL':'SIAP TAKE-OFF');alert.classList.remove('warning');}
    else{alert.textContent='● AIRBORNE — '+format(t.groundKmh,0)+' KM/J TERHADAP TANAH';alert.classList.remove('warning');}
  };
  applyWeather();
  setThrottle(35);
}
const PARAM_CONTROLS={
  speed:{name:'Kecepatan terhadap tanah',unit:'m/s',min:5,max:75,step:1},
  density:{name:'Massa jenis udara',unit:'kg/m³',min:.6,max:1.3,step:.025},
  alpha:{name:'Sudut serang (AoA)',unit:'°',min:-12,max:30,step:1},
  area:{name:'Luas sayap',unit:'m²',min:10,max:28,step:.5},
  span:{name:'Bentang sayap',unit:'m',min:8,max:16,step:.25},
  flap:{name:'Sudut flap',unit:'°',min:0,max:30,step:5},
  wind:{name:'Angin depan (+) / belakang (−)',unit:'m/s',min:-18,max:18,step:1},
  throttle:{name:'Tenaga mesin',unit:'%',min:0,max:100,step:5},
  altitude:{name:'Ketinggian atmosfer',unit:'m',min:0,max:9000,step:250}
};
const CONTROLS_PER_LAB={
  'gaya-angkat':['speed','alpha'],
  'sudut-serang':['alpha','speed'],
  'massa-jenis':['density','speed'],
  'luas-sayap':['area','span'],
  'flap':['flap','speed'],
  'angin':['wind','speed'],
  'dorong-hambat':['throttle','speed'],
  'ketinggian':['altitude','speed']
};
async function initExperiment(lab){
  const p={...DEFAULT_LAB},records=[];
  const scene=await attachScene('labCanvas',{mode:'lab',labParams:p});
  if(!scene)return;
  let visible=true;
  const controls=CONTROLS_PER_LAB[lab.id]||['speed','alpha'];
  $('labSliders').innerHTML=controls.map(key=>{
    const spec=PARAM_CONTROLS[key];
    return `<div class="control-field"><label for="labParam-${key}">${spec.name}<strong id="labValue-${key}">${format(p[key],spec.step<1?2:0)} ${spec.unit}</strong></label><input id="labParam-${key}" type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${p[key]}"><div class="range-tips"><span>${spec.min} ${spec.unit}</span><span>${spec.max} ${spec.unit}</span></div></div>`;
  }).join('');
  const updateUI=()=>{
    const r=labCalculation(p);
    $('labLift').textContent=format(r.lift/1000,2);$('labDrag').textContent=format(r.drag/1000,2);
    $('labCL').textContent=format(r.cl,3);$('labQ').textContent=format(r.dynamicPressure,0);
    $('labAir').textContent=format(r.airspeed,1)+' m/s';$('labCD').textContent=format(r.cd,3);
    $('labThrust').textContent=format(r.thrust/1000,2)+' kN';$('labStall').textContent=r.stall?'STALL':'NORMAL';
    $('labStall').style.color=r.stall?'#fba179':'#4ce7c6';
    scene.setLabParameters(p);drawGraph();
  };
  const plotValue=values=>values[lab.x];
  const drawGraph=()=>{
    const spec=PARAM_CONTROLS[lab.x],curve=[];
    for(let i=0;i<=42;i++){
      const v=spec.min+(spec.max-spec.min)*i/42;
      const r=labCalculation({...p,[lab.x]:v});
      curve.push({x:v,lift:r.lift/1000,drag:r.drag/1000});
    }
    plotLab($('labChart'),curve,records.map(v=>({x:v.x,lift:v.liftN/1000,drag:v.dragN/1000})),spec.name+' ('+spec.unit+')');
    $('recordCount').textContent=records.length+' data pengamatan';
  };
  for(const key of controls){
    listen($('labParam-'+key),'input',e=>{
      p[key]=+e.target.value;
      $('labValue-'+key).textContent=format(p[key],PARAM_CONTROLS[key].step<1?2:0)+' '+PARAM_CONTROLS[key].unit;
      updateUI();
    });
  }
  listen($('labForceButton'),'click',()=>{
    visible=!visible;scene.setForces(visible);
    $('labForceButton').textContent='↑ VEKTOR: '+(visible?'ON':'OFF');
  });
  listen($('recordButton'),'click',()=>{
    const r=labCalculation(p);
    records.push({index:records.length+1,x:plotValue(p),variable:lab.x,airspeedMs:r.airspeed,alphaDeg:p.alpha,densityKgM3:r.density,wingAreaM2:p.area,spanM:p.span,flapDeg:p.flap,windMs:p.wind,altitudeM:p.altitude,cl:r.cl,cd:r.cd,liftN:r.lift,dragN:r.drag,thrustN:r.thrust,dynamicPressurePa:r.dynamicPressure});
    drawGraph();notice('Pengamatan '+records.length+' berhasil direkam');
  });
  listen($('clearRecords'),'click',()=>{records.length=0;drawGraph();notice('Pengamatan dikosongkan');});
  listen($('resetLab'),'click',()=>{
    Object.assign(p,DEFAULT_LAB);
    for(const key of controls){$('labParam-'+key).value=p[key];$('labValue-'+key).textContent=format(p[key],PARAM_CONTROLS[key].step<1?2:0)+' '+PARAM_CONTROLS[key].unit;}
    updateUI();notice('Variabel kembali ke nilai awal');
  });
  listen($('exportLab'),'click',()=>{
    if(!records.length){notice('Klik Rekam hasil sebelum mengunduh CSV');return;}
    downloadText('Aerodynamics_'+lab.id+'_'+new Date().toISOString().slice(0,10)+'.csv','\uFEFF'+toCSV(records),'text/csv;charset=utf-8');
    notice('CSV pengamatan telah dibuat');
  });
  listen($('saveLab'),'click',()=>{
    if(!records.length){notice('Rekam minimal satu pengamatan sebelum menyimpan laporan');return;}
    const conclusion=$('labConclusion').value.trim();
    try{saveExperiment({labId:lab.id,title:lab.title,question:lab.question,conclusion,samples:records.map(r=>({...r}))});notice('Laporan praktikum disimpan di browser!');}
    catch(e){notice('Penyimpanan gagal. Kapasitas penyimpanan browser mungkin penuh.');}
  });
  listen(window,'resize',()=>requestAnimationFrame(drawGraph));
  updateUI();requestAnimationFrame(drawGraph);
}
function resultsPage(){
  const saved=getSavedExperiments();
  return `<section class="container page-section"><span class="section-kicker">EXPERIMENT HISTORY</span><h1 class="page-title">Hasil <em>Praktikum</em></h1><p class="page-description">Laporan tersimpan pada browser/perangkat ini dan tidak dikirim ke server. Ekspor CSV untuk memindahkan data.</p>${saved.length?`<div class="results-list">${saved.map(item=>`<article class="result-card" data-result="${escapeHTML(item.id)}"><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.question)}</p><small>${new Date(item.savedAt).toLocaleString('id-ID')} · ${(item.samples||[]).length} pengamatan</small>${item.conclusion?`<p style="margin-top:10px;color:#c4dce4">Kesimpulan: ${escapeHTML(item.conclusion)}</p>`:''}</div><div class="result-actions"><button data-download="${escapeHTML(item.id)}" class="btn btn-outline btn-small">↓ CSV</button><button data-delete="${escapeHTML(item.id)}" class="btn btn-outline btn-small">Hapus</button></div></article>`).join('')}</div>`:`<div class="empty-state"><b>Belum ada laporan tersimpan</b><p>Pilih eksperimen, rekam hasil, lalu simpan laporan.</p><a href="/laboratorium" data-link class="btn btn-primary">Buka laboratorium →</a></div>`}</section>`;
}
function initResults(){
  listen(page,'click',e=>{
    const down=e.target.closest('[data-download]'),del=e.target.closest('[data-delete]');
    if(down){const item=getSavedExperiments().find(r=>r.id===down.dataset.download);if(item)downloadText('Laporan_'+item.labId+'.csv','\uFEFF'+toCSV(item.samples||[]),'text/csv;charset=utf-8');}
    if(del){if(!confirm('Hapus laporan ini dari browser?'))return;deleteExperiment(del.dataset.delete);render();notice('Laporan dihapus');}
  });
}
document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-link]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target==='_blank')return;
  e.preventDefault();go(new URL(a.href,location.origin).pathname);
});
window.addEventListener('popstate',render);
$('mobileMenu').addEventListener('click',()=>$('mainNav').classList.toggle('open'));
render();
