import {AIRCRAFT} from './physics.js';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export function computeAirfoilAnalysis({
  alpha=5,
  flap=0,
  speed=80,
  density=1.225,
  cl=0.9,
  dynamicPressure
}={}){
  const q=Number.isFinite(dynamicPressure)?Math.max(0,dynamicPressure):0.5*Math.max(0,density)*Math.max(0,speed)**2;
  const stall=Math.abs(alpha)>=14+flap*0.05;
  const alphaNorm=clamp(alpha/16,-1.6,1.6);
  const deltaCp=clamp(cl*0.95 + alphaNorm*0.28 + flap*0.01,-1.4,2.3);
  const chord=Array.from({length:25},(_,i)=>i/24);
  const flapBoost=flap*0.004;
  const upper=[];
  const lower=[];
  for(const x of chord){
    const suctionPeak=(0.24+0.92*Math.exp(-x*3.8)+0.12*Math.sin((1-x)*Math.PI*1.1));
    const lowerShape=(0.18+0.65*(1-x)**0.7+0.06*Math.sin(x*Math.PI));
    const trailing= x>0.72 ? (x-0.72)*1.1 : 0;
    let cpu=-0.05-deltaCp*suctionPeak-flapBoost*trailing;
    let cpl=0.02+deltaCp*0.58*lowerShape+flapBoost*(0.6+trailing*2.1);
    if(stall){
      cpu=cpu*0.72 + 0.12*Math.sin(x*Math.PI*3);
      cpl=cpl*0.85 + 0.07*Math.cos(x*Math.PI*2.6);
    }
    upper.push({x,cp:clamp(cpu,-2.4,1.4)});
    lower.push({x,cp:clamp(cpl,-1.2,2.0)});
  }
  const avg=a=>a.reduce((s,p)=>s+p.cp,0)/a.length;
  const cpUpperAvg=avg(upper),cpLowerAvg=avg(lower);
  const cpUpperMin=Math.min(...upper.map(p=>p.cp));
  const cpLowerMax=Math.max(...lower.map(p=>p.cp));
  const pressureUpperPa=cpUpperAvg*q;
  const pressureLowerPa=cpLowerAvg*q;
  const deltaPressurePa=(cpLowerAvg-cpUpperAvg)*q;
  const effectiveLift=Math.max(0,q*AIRCRAFT.wingArea*cl);
  return {
    q,stall,alpha,flap,speed,density,cl,
    upper,lower,
    cpUpperAvg,cpLowerAvg,cpUpperMin,cpLowerMax,
    pressureUpperPa,pressureLowerPa,deltaPressurePa,
    effectiveLift
  };
}

export function drawAirfoilPanel(canvas,analysis,{label='Penampang sayap — analisis konseptual',subtitle='Bukan CFD / bukan profil Airbus resmi'}={}){
  if(!canvas || !analysis)return;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<20)return;
  const ratio=Math.min(2,window.devicePixelRatio||1),w=rect.width,h=rect.height||260;
  canvas.width=Math.floor(w*ratio);canvas.height=Math.floor(h*ratio);
  const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  // background
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0d2030');bg.addColorStop(1,'#0b1824');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const left={x:22,y:44,w:Math.min(w*0.46,320),h:h-70};
  const right={x:left.x+left.w+20,y:44,w:w-left.w-54,h:h-78};
  // titles
  ctx.fillStyle='#d8edf6';ctx.font='700 15px system-ui, sans-serif';ctx.fillText(label,18,22);
  ctx.fillStyle='#81a2b5';ctx.font='11px system-ui, sans-serif';ctx.fillText(subtitle,18,36);
  // airfoil box
  ctx.strokeStyle='#244457';ctx.lineWidth=1;ctx.strokeRect(left.x,left.y,left.w,left.h);
  ctx.fillStyle='rgba(83,169,229,.05)';ctx.fillRect(left.x,left.y,left.w,left.h);
  const centerY=left.y+left.h*0.58;
  const profileX=x=>left.x+25+x*(left.w-52);
  const camber=Math.max(-0.06,Math.min(0.12,analysis.alpha/120+analysis.flap/600));
  const thickness=x=>0.12*(0.2969*Math.sqrt(Math.max(x,0))-0.126*x-0.3516*x*x+0.2843*x*x*x-0.1015*x*x*x*x);
  const camberY=x=>camber*(1-(2*x-1)**2);
  const surface=(x,upper=true)=>centerY + (upper?-1:1)*(thickness(x)*(left.h*1.5)) - camberY(x)*(left.h*1.0);
  ctx.beginPath();
  for(let i=0;i<=40;i++){
    const x=i/40,y=surface(x,true);const px=profileX(x);if(i===0)ctx.moveTo(px,y);else ctx.lineTo(px,y);
  }
  for(let i=40;i>=0;i--){
    const x=i/40,y=surface(x,false);const px=profileX(x);ctx.lineTo(px,y);
  }
  ctx.closePath();
  const bodyGrad=ctx.createLinearGradient(left.x,0,left.x+left.w,0);bodyGrad.addColorStop(0,'#c8dee7');bodyGrad.addColorStop(1,'#8db4c8');
  ctx.fillStyle=bodyGrad;ctx.fill();ctx.strokeStyle='#dff8ff';ctx.lineWidth=1.2;ctx.stroke();
  // mean chord
  ctx.setLineDash([5,4]);ctx.strokeStyle='#53738a';ctx.beginPath();ctx.moveTo(profileX(0),centerY);ctx.lineTo(profileX(1),centerY);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#8fb0c2';ctx.font='11px system-ui, sans-serif';ctx.fillText('chord',profileX(.45),centerY+16);
  // highlight lower surface
  ctx.strokeStyle='#8ad6ff';ctx.lineWidth=2;
  ctx.beginPath();
  for(let i=0;i<=40;i++){
    const x=i/40;const px=profileX(x),py=surface(x,false); if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.stroke();
  ctx.fillStyle='#8ad6ff';ctx.fillText('permukaan bawah sayap',left.x+left.w-148,left.y+left.h-10);
  // arrows/pressure bars
  const lowerIntensity=clamp(Math.abs(analysis.cpLowerAvg)/2.1,0.18,1);
  const upperIntensity=clamp(Math.abs(analysis.cpUpperAvg)/2.3,0.18,1);
  for(let i=0;i<7;i++){
    const x=0.08+i*0.13; const px=profileX(x);
    const pyTop=surface(x,true)-10; const pyBottom=surface(x,false)+10;
    // top suction arrows
    ctx.strokeStyle=`rgba(76,231,198,${0.25+upperIntensity*0.55})`;
    ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(px,pyTop-18); ctx.lineTo(px,pyTop-2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px-3,pyTop-10); ctx.lineTo(px,pyTop-2); ctx.lineTo(px+3,pyTop-10); ctx.stroke();
    // lower pressure arrows upward
    ctx.strokeStyle=`rgba(251,185,130,${0.25+lowerIntensity*0.65})`;
    ctx.beginPath(); ctx.moveTo(px,pyBottom+18); ctx.lineTo(px,pyBottom+2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px-3,pyBottom+10); ctx.lineTo(px,pyBottom+2); ctx.lineTo(px+3,pyBottom+10); ctx.stroke();
  }
  // incoming flow arrows below and above
  ctx.strokeStyle='#6ee9ff';ctx.lineWidth=1.1;
  for(let row=0;row<3;row++){
    const y=left.y+28+row*22;
    for(let i=0;i<5;i++){
      const x=left.x+8+i*((left.w-28)/4);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+13,y-3);ctx.lineTo(x+18,y);ctx.lineTo(x+13,y+3);ctx.stroke();
    }
  }
  // right graph area
  ctx.strokeStyle='#244457';ctx.strokeRect(right.x,right.y,right.w,right.h);
  ctx.fillStyle='rgba(83,169,229,.03)';ctx.fillRect(right.x,right.y,right.w,right.h);
  const pad={l:34,r:14,t:16,b:24};
  const plot={x:right.x+pad.l,y:right.y+pad.t,w:right.w-pad.l-pad.r,h:right.h-pad.t-pad.b};
  const maxCp=2.0,minCp=-2.4;
  const xPos=x=>plot.x+x*plot.w;
  const yPos=cp=>plot.y+(cp-minCp)/(maxCp-minCp)*plot.h;
  ctx.font='10px system-ui, sans-serif';ctx.fillStyle='#7d9cb0';ctx.textAlign='right';
  for(const cp of [-2,-1,0,1,2]){const y=yPos(cp);ctx.strokeStyle='rgba(61,104,125,.55)';ctx.beginPath();ctx.moveTo(plot.x,y);ctx.lineTo(plot.x+plot.w,y);ctx.stroke();ctx.fillText(cp.toFixed(1),plot.x-6,y+3)}
  ctx.textAlign='center';ctx.fillText('0',xPos(0),right.y+right.h-6);ctx.fillText('0.5',xPos(.5),right.y+right.h-6);ctx.fillText('1.0 chord',xPos(1),right.y+right.h-6);
  ctx.save();ctx.translate(right.x+10,plot.y+plot.h/2);ctx.rotate(-Math.PI/2);ctx.fillText('Cp',0,0);ctx.restore();
  const drawSeries=(series,color)=>{ctx.beginPath();series.forEach((p,i)=>{const px=xPos(p.x),py=yPos(p.cp);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();};
  drawSeries(analysis.upper,'#4ce7c6'); drawSeries(analysis.lower,'#fbb982');
  ctx.fillStyle='#4ce7c6';ctx.textAlign='left';ctx.fillText('● permukaan atas (tekanan lebih rendah)',plot.x+4,plot.y-3);
  ctx.fillStyle='#fbb982';ctx.fillText('● permukaan bawah (tekanan relatif lebih tinggi)',plot.x+4,plot.y+11);
  // bottom summary
  ctx.fillStyle='#d7ebf4';ctx.font='600 11px system-ui, sans-serif';
  const summaryY=h-13; const items=[
    `q ${analysis.q.toFixed(0)} Pa`,
    `Cp atas avg ${analysis.cpUpperAvg.toFixed(2)}`,
    `Cp bawah avg ${analysis.cpLowerAvg.toFixed(2)}`,
    `ΔP ${analysis.deltaPressurePa.toFixed(0)} Pa`
  ];
  let x=18; for(const item of items){ctx.fillText(item,x,summaryY); x+=ctx.measureText(item).width+20;}
}
