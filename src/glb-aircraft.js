import {createAircraft} from './aircraft.js';
import {getLivery} from './livery.js';

// The shipped local GLB is an original illustrative A380 mesh (not a real Airbus CAD file).
// The third-party option is an openly licensed CC-BY 4.0 no-logo A380 by amvlab.
export const MODEL_SOURCE_KEY='aerolab.a380.visual-model.v1';
export const MODEL_SOURCES=Object.freeze({
  community:{label:'GLB Komunitas — amvlab (CC BY 4.0)',url:'https://cdn.jsdelivr.net/gh/amvlab/aircraft-models@main/models/A380_nologo.glb'},
  bundled:{label:'GLB bawaan AEROLAB',url:'/assets/models/a380-aerolab.glb'},
  procedural:{label:'Model prosedural AEROLAB',url:null}
});
export function getModelSource(){try{const value=localStorage.getItem(MODEL_SOURCE_KEY);return Object.hasOwn(MODEL_SOURCES,value)?value:'community';}catch{return 'community';}}
export function saveModelSource(source){if(!Object.hasOwn(MODEL_SOURCES,source))throw new Error('Sumber model tidak dikenali');try{localStorage.setItem(MODEL_SOURCE_KEY,source);}catch{}return source;}
let loadersPromise=null;
function loadGLBPlugin(B){
  if(loadersPromise)return loadersPromise;
  loadersPromise=new Promise(async(resolve,reject)=>{
    // Babylon loader registers the .glb SceneLoader plugin automatically.
    const urls=['https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js','https://cdn.jsdelivr.net/npm/babylonjs-loaders@8.0.0/babylonjs.loaders.min.js'];
    for(const url of urls){
      try{await new Promise((ok,fail)=>{const script=document.createElement('script');script.src=url;script.async=true;
        const timeout=setTimeout(()=>{script.remove();fail(Error('Timeout loader GLB'));},12000);
        script.onload=()=>{clearTimeout(timeout);ok();};script.onerror=()=>{clearTimeout(timeout);script.remove();fail(Error('GLB loader CDN tidak tersedia'));};
        document.head.appendChild(script);
      });
      if(B.SceneLoader?.ImportMeshAsync){resolve();return;}
    }catch(error){console.warn('GLB plugin mirror failed:',url,error.message);}
    }
    reject(Error('Plugin GLB Babylon.js gagal dimuat'));
  });
  loadersPromise.catch(()=>{loadersPromise=null;});return loadersPromise;
}
function assetLocation(url){const i=url.lastIndexOf('/');return [url.slice(0,i+1),url.slice(i+1)];}
function minMaxMeshes(B,meshes){
  const min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
  let n=0;
  for(const mesh of meshes){
    if(typeof mesh.getTotalVertices!=='function'||mesh.getTotalVertices()<=0)continue;
    mesh.computeWorldMatrix(true);
    const box=mesh.getBoundingInfo().boundingBox;
    min.minimizeInPlace(box.minimumWorld);max.maximizeInPlace(box.maximumWorld);n++;
  }
  if(!n)throw Error('GLB tidak berisi mesh geometri yang dapat ditampilkan');
  return {min,max,size:max.subtract(min),center:min.add(max).scale(.5)};
}
function destroyAsset(result){
  for(const n of [...(result?.meshes||[]),...(result?.transformNodes||[])]){
    try{if(!n.isDisposed?.())n.dispose(false,true);}catch{}
  }
}
function decalLayer(B,scene,parent){
  const group=new B.TransformNode('A380 shared livery overlays (illustrative mapping)',scene);group.parent=parent;
  const paint=new B.StandardMaterial('AEROLAB main livery badge',scene);paint.backFaceCulling=false;
  const strip=new B.StandardMaterial('AEROLAB secondary stripe',scene);strip.backFaceCulling=false;
  const tex=new B.DynamicTexture('Shared airline text',{width:1024,height:256},scene,false);tex.hasAlpha=true;
  const label=new B.StandardMaterial('Airline label',scene);label.diffuseTexture=tex;label.opacityTexture=tex;label.emissiveColor=new B.Color3(.15,.15,.15);label.backFaceCulling=false;
  const logoMat=new B.StandardMaterial('A380 shared logo',scene);logoMat.backFaceCulling=false;logoMat.useAlphaFromDiffuseTexture=true;
  const logos=[];
  for(const side of [-1,1]){
    const heading=B.MeshBuilder.CreatePlane(`Shared name ${side}`,{width:10,height:2.2},scene);heading.parent=group;
    heading.position.set(side*3.72,1.16,-1);heading.rotation.y=side>0?Math.PI/2:-Math.PI/2;heading.material=label;
    const box=B.MeshBuilder.CreatePlane(`Shared accent ${side}`,{width:13,height:.30},scene);box.parent=group;
    box.position.set(side*3.77,.08,1.5);box.rotation.y=heading.rotation.y;box.material=paint;
    const line=B.MeshBuilder.CreatePlane(`Shared stripe ${side}`,{width:13,height:.12},scene);line.parent=group;
    line.position.set(side*3.79,-.27,1.5);line.rotation.y=heading.rotation.y;line.material=strip;
    const logo=B.MeshBuilder.CreatePlane(`Shared uploaded logo ${side}`,{width:4.4,height:2.5},scene);logo.parent=group;
    logo.position.set(side*3.79,1.3,13.8);logo.rotation.y=heading.rotation.y;logo.material=logoMat;logos.push(logo);
  }
  let logoData='';
  function apply(l){
    paint.diffuseColor=B.Color3.FromHexString(l.primary);strip.diffuseColor=B.Color3.FromHexString(l.secondary);
    const ctx=tex.getContext();ctx.clearRect(0,0,1024,256);tex.drawText(l.name.toUpperCase().slice(0,22),24,156,'bold 115px Arial','#ffffff','transparent',true);tex.update();
    if(logoData!==l.logoData){logoData=l.logoData;logoMat.diffuseTexture?.dispose();logoMat.diffuseTexture=l.logoData?new B.Texture(l.logoData,scene):null;for(const logo of logos)logo.isVisible=!!l.logoData;}
  }
  apply(getLivery());
  return {group,apply};
}
export function createAircraftWithGLB(scene,{onStatus=()=>{}}={}){
  const B=window.BABYLON;
  const original=createAircraft(scene);
  const originalMeshes=original.root.getChildMeshes().slice();
  const layer=decalLayer(B,scene,original.root);layer.group.setEnabled(false);
  let imported=null,visualNode=null,activeSource='procedural',dead=false,request=0,customURL=null;
  const announce=(message,source)=>{if(!dead){try{onStatus(message,source);}catch{}}};
  const changed=e=>layer.apply(e.detail);
  const storage=e=>{if(e.key==='aerolab.a380.livery.v1')layer.apply(getLivery());};
  window.addEventListener('aerolab-livery',changed);window.addEventListener('storage',storage);
  const showProcedural=()=>{originalMeshes.forEach(m=>m.setEnabled(true));layer.group.setEnabled(false);};
  const showGLB=()=>{originalMeshes.forEach(m=>m.setEnabled(false));layer.group.setEnabled(true);};
  function clearGLB(){
    if(visualNode){visualNode.dispose(false,true);visualNode=null;}
    imported=null;
  }
  async function attempt(url){
    await loadGLBPlugin(B);
    if(dead)throw Error('Scene sudah ditutup');
    const [path,name]=assetLocation(url);
    const result=await B.SceneLoader.ImportMeshAsync(null,path,name,scene,null,'.glb');
    if(dead){destroyAsset(result);throw Error('Scene sudah ditutup');}
    try{
      const bounds=minMaxMeshes(B,result.meshes);
      const mainAxis=bounds.size.x>=bounds.size.z?'x':'z';
      const span=Math.max(bounds.size.x,bounds.size.z);
      if(span<=0.001)throw Error('Dimensi model GLB tidak valid');
      const k=79.8/span,turn=mainAxis==='z'?Math.PI/2:0;
      const node=new B.TransformNode('A380 GLB visual root',scene);node.parent=original.root;
      // Keep the nose aligned with local +Z. For assets with a reverse-facing
      // source orientation use the optional orientation setting in the UI.
      const art=new B.TransformNode('Normalized imported aircraft',scene);art.parent=node;
      art.rotation.y=turn;art.scaling.setAll(k);
      const rotateY=v=>new B.Vector3(v.x*Math.cos(turn)+v.z*Math.sin(turn),v.y,-v.x*Math.sin(turn)+v.z*Math.cos(turn));
      const center=rotateY(bounds.center);
      art.position.set(-center.x*k,-8.16-bounds.min.y*k,-center.z*k);
      const loadedNodes=new Set([...result.meshes,...result.transformNodes]);
      // Keep the imported hierarchy intact: only direct roots are reparented.
      for(const candidate of [...result.transformNodes,...result.meshes]){
        if(candidate&&!candidate.parent&&!candidate.isDisposed?.() && loadedNodes.has(candidate))candidate.parent=art;
      }
      return {node,result,art,spanMeters:span,sourceBounds:bounds};
    }catch(error){destroyAsset(result);throw error;}
  }
  async function setSource(source=getModelSource(),customBlobUrl=null){
    const call=++request;
    showProcedural();clearGLB();
    if(source==='procedural'){
      activeSource='procedural';announce('Model prosedural A380 aktif','procedural');return;
    }
    const custom=source==='custom';
    if(custom&&!customBlobUrl){announce('Pilih file .glb untuk menggunakan model sendiri','procedural');return;}
    const sources=custom?[['custom',customBlobUrl]]:source==='bundled'?[['bundled',MODEL_SOURCES.bundled.url]]:[['community','/assets/models/A380_nologo.glb'],['community',MODEL_SOURCES.community.url],['bundled',MODEL_SOURCES.bundled.url]];
    for(const [id,url] of sources){
      if(dead||request!==call)return;
      announce(id==='community'?'Mengunduh model A380 GLB komunitas…':id==='bundled'?'Memuat GLB bawaan AEROLAB…':'Memuat GLB pilihan Anda…',activeSource);
      try{
        const result=await attempt(url);
        if(dead||request!==call){result.node.dispose(false,true);destroyAsset(result.result);return;}
        imported=result.result;visualNode=result.node;activeSource=id;showGLB();
        announce(id==='community'?'A380 GLB amvlab aktif (CC BY 4.0)':id==='custom'?'A380 GLB unggahan Anda aktif':'A380 GLB bawaan AEROLAB aktif',id);
        return;
      }catch(error){if(dead||request!==call)return;console.warn('A380 GLB gagal dimuat:',url,error);}
    }
    activeSource='procedural';announce('GLB tidak tersedia; memakai model prosedural agar simulasi tetap berjalan','procedural');
  }
  async function loadCustomFile(file){
    if(!file||(!file.name.toLowerCase().endsWith('.glb')))throw Error('Hanya file .glb yang didukung');
    if(file.size>35*1024*1024)throw Error('GLB maksimal 35 MB untuk menjaga performa');
    if(customURL)URL.revokeObjectURL(customURL);
    customURL=URL.createObjectURL(file);
    await setSource('custom',customURL);
  }
  // Render the procedural fallback immediately, swap when the GLB has loaded.
  void setSource(getModelSource());
  return {root:original.root,parts:original.parts,
    update:(controls,dt)=>{if(activeSource==='procedural')original.update(controls,dt);},
    applyLivery:l=>{original.applyLivery(l);layer.apply(l);},
    setModelSource:setSource,loadCustomFile,
    get activeModel(){return activeSource;},
    dispose(){dead=true;request++;window.removeEventListener('aerolab-livery',changed);window.removeEventListener('storage',storage);if(customURL)URL.revokeObjectURL(customURL);clearGLB();layer.group.dispose(false,true);original.dispose();}
  };
}
