// Shared identity between the flight model and the papercraft editor.
export const LIVERY_KEY='aerolab.a380.livery.v1';
export const DEFAULT_LIVERY=Object.freeze({name:'AEROLAB',primary:'#1b6ba2',secondary:'#44bfc5',tail:'#153b67',registration:'A380-LAB',opacity:0.52,logoData:''});
const safeHex=(v,f)=>typeof v==='string' && /^#[a-fA-F0-9]{6}$/.test(v)?v:f;
export function validateLivery(raw={}){
 const o=raw&&typeof raw==='object'?raw:{};
 return {name:String(o.name??DEFAULT_LIVERY.name).slice(0,24),primary:safeHex(o.primary,DEFAULT_LIVERY.primary),secondary:safeHex(o.secondary,DEFAULT_LIVERY.secondary),tail:safeHex(o.tail,DEFAULT_LIVERY.tail),registration:String(o.registration??DEFAULT_LIVERY.registration).slice(0,18),opacity:Math.max(.15,Math.min(.65,Number(o.opacity)||DEFAULT_LIVERY.opacity)),logoData:typeof o.logoData==='string' && /^data:image\/(png|jpeg|webp);base64,/.test(o.logoData)&&o.logoData.length<3_000_000?o.logoData:''};
}
export function getLivery(){try{return validateLivery(JSON.parse(localStorage.getItem(LIVERY_KEY)||'{}'));}catch{return {...DEFAULT_LIVERY};}}
export function saveLivery(livery){const v=validateLivery(livery);try{localStorage.setItem(LIVERY_KEY,JSON.stringify(v));}catch(e){throw new Error('Penyimpanan browser penuh: kecilkan gambar logo.');}window.dispatchEvent(new CustomEvent('aerolab-livery',{detail:v}));return v;}
export function downloadLivery(l){return JSON.stringify({schema:'aerolab-a380-livery-v1',livery:validateLivery(l)},null,2);}
