export function plotLab(canvas,curve,observations,xLabel='Variabel eksperimen'){
  if(!canvas)return;
  const rect=canvas.getBoundingClientRect();if(rect.width<10)return;
  const ratio=Math.min(2,window.devicePixelRatio||1),w=rect.width,h=rect.height||245;
  canvas.width=Math.floor(w*ratio);canvas.height=Math.floor(h*ratio);
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
  ctx.clearRect(0,0,w,h);
  const pad={l:62,r:22,t:28,b:47},plotW=w-pad.l-pad.r,plotH=h-pad.t-pad.b;
  const all=[...curve,...observations];
  const minX=Math.min(...all.map(p=>p.x),0),maxX=Math.max(...all.map(p=>p.x),1);
  const yValues=all.flatMap(p=>[p.lift,p.drag]);
  const maxY=Math.max(1,...yValues)*1.12;
  const minY=Math.min(0,...yValues)*1.1;
  const xPos=x=>pad.l+(x-minX)/Math.max(1e-8,maxX-minX)*plotW;
  const yPos=y=>pad.t+plotH-(y-minY)/Math.max(1e-8,maxY-minY)*plotH;
  ctx.font='11px Inter,system-ui,sans-serif';ctx.textAlign='right';
  for(let i=0;i<=4;i++){
    const y=minY+(maxY-minY)*i/4;
    const yy=yPos(y);ctx.strokeStyle='#244255';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();
    ctx.fillStyle='#98b3c3';ctx.fillText(y.toFixed(1),pad.l-12,yy+4);
  }
  ctx.textAlign='center';ctx.fillStyle='#94acbe';
  for(let i=0;i<=4;i++){
    const x=minX+(maxX-minX)*i/4;
    ctx.fillText(Number(x.toFixed(1)).toString(),xPos(x),h-25);
  }
  ctx.fillStyle='#acc4d2';ctx.font='11px Inter,system-ui,sans-serif';ctx.fillText(xLabel,w/2,h-6);
  ctx.save();ctx.translate(14,h/2);ctx.rotate(-Math.PI/2);ctx.fillText('Gaya (kN)',0,0);ctx.restore();
  function lineSeries(key,color){
    if(!curve.length)return;
    ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();curve.forEach((p,i)=>{if(i===0)ctx.moveTo(xPos(p.x),yPos(p[key]));else ctx.lineTo(xPos(p.x),yPos(p[key]));});ctx.stroke();
    for(const p of observations){
      ctx.beginPath();ctx.arc(xPos(p.x),yPos(p[key]),4.5,0,Math.PI*2);
      ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#0e2537';ctx.stroke();
    }
  }
  lineSeries('lift','#4de3c6');lineSeries('drag','#fba179');
  ctx.textAlign='left';ctx.font='11px Inter,system-ui,sans-serif';ctx.fillStyle='#4de3c6';ctx.fillText('● Lift',pad.l+7,17);
  ctx.fillStyle='#fba179';ctx.fillText('● Drag',pad.l+78,17);
}
