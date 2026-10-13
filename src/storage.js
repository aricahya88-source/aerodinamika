const KEY='aerolab3d-experiments-v1';
export function getSavedExperiments(){
  try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(data)?data:[];}catch{return [];}
}
export function saveExperiment(experiment){
  const prev=getSavedExperiments();const item={...experiment,id:`run-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,savedAt:new Date().toISOString()};
  const all=[item,...prev].slice(0,60);localStorage.setItem(KEY,JSON.stringify(all));return item;
}
export function deleteExperiment(id){localStorage.setItem(KEY,JSON.stringify(getSavedExperiments().filter(x=>x.id!==id)));}
export function downloadText(file,text,mime='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=file;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function toCSV(rows){
  if(!rows.length)return '';
  const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))];
  return [keys.join(','),...rows.map(row=>keys.map(k=>{
    let val=row[k]??'';
    if(typeof val==='object')val=JSON.stringify(val);
    let str=String(val);
    if(/^[=+@-]/.test(str) && !/^-[0-9.]+$/.test(str))str="'"+str;
    return '"'+str.replace(/"/g,'""')+'"';
  }).join(','))].join('\r\n');
}
export const escapeHTML=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
