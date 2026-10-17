import {V,Q,add,sub,scale,dot,length,normal,clamp,lerp,rad,deg,rotate,invRotate,integrateQuaternion,eulerFromQuaternion} from './math.js';

// Manufacturer-published dimensions and performance: Airbus Facts & Figures (2021),
// A380 Aircraft Characteristics (Dec 2025). Flight dynamics are an educational approximation.
export const AIRCRAFT={
 name:'Airbus A380-800',length:72.7,height:24.1,mass:420000,
 maxTakeoffMass:575000,maxLandingMass:395000,wingArea:845,span:79.8,
 chord:10.59,aspectRatio:79.8**2/845,efficiency:0.82,drag0:0.023,
 engines:4,thrustPerEngine:311000,maxThrust:4*311000,
 cruiseMach:0.85,referenceCruiseAltitude:11000,groundHeight:8.4,
 // Order-of-magnitude inertias, estimated from rigid-body span/length.
 inertias:V(1.78e8,3.7e8,2.20e8),
 dataSources:['Airbus A380 Facts and Figures (2021)','Airbus A380 Aircraft Characteristics (2025)']
};
export const LABS=[
  {id:'gaya-angkat',num:'01',icon:'↗',title:'Kecepatan & Gaya Angkat',topic:'Hubungan gaya angkat dengan kuadrat kecepatan',question:'Bagaimana pengaruh kecepatan udara terhadap besar gaya angkat apabila variabel lainnya tetap?',x:'speed'},
  {id:'sudut-serang',num:'02',icon:'∠',title:'Sudut Serang & Stall',topic:'Hubungan sudut serang dengan koefisien angkat',question:'Mengapa sayap dapat kehilangan sebagian gaya angkat ketika sudut serang terlalu besar?',x:'alpha'},
  {id:'massa-jenis',num:'03',icon:'◎',title:'Massa Jenis Udara',topic:'Kerapatan udara dan gaya aerodinamika',question:'Apa yang terjadi pada gaya angkat jika massa jenis udara berkurang?',x:'density'},
  {id:'luas-sayap',num:'04',icon:'▱',title:'Luas & Aspek Rasio Sayap',topic:'Pengaruh geometri sayap terhadap gaya aerodinamika',question:'Bagaimana perubahan luas sayap dan aspek rasio memengaruhi gaya angkat dan hambat?',x:'area'},
  {id:'flap',num:'05',icon:'▤',title:'Konfigurasi Flap',topic:'Perubahan gaya angkat dan hambat dengan flap',question:'Mengapa flap bermanfaat saat kecepatan take-off dan landing lebih rendah?',x:'flap'},
  {id:'angin',num:'06',icon:'≈',title:'Angin & Kecepatan Relatif',topic:'Airspeed, ground speed, dan angin',question:'Mengapa kecepatan terhadap tanah berbeda dengan kecepatan relatif terhadap udara?',x:'wind'},
  {id:'dorong-hambat',num:'07',icon:'⇢',title:'Gaya Dorong & Hambat',topic:'Keseimbangan gaya sepanjang arah penerbangan',question:'Pada kondisi apa pesawat mengalami percepatan atau perlambatan?',x:'throttle'},
  {id:'ketinggian',num:'08',icon:'⌁',title:'Ketinggian & Atmosfer',topic:'Kerapatan udara dan perubahan ketinggian',question:'Bagaimana kenaikan ketinggian memengaruhi performa aerodinamika?',x:'altitude'}
];
export const DEFAULT_LAB={speed:80,density:1.225,alpha:8,area:845,span:79.8,flap:10,wind:0,throttle:65,altitude:0};
export function speedOfSoundAtAltitude(h){const temp=288.15-.0065*Math.min(Math.max(h,0),11000);return Math.sqrt(1.4*287.05*temp);}
export function densityAtAltitude(h){return 1.225*Math.pow(Math.max(0.15,1-2.25577e-5*Math.max(h,0)),4.25588);}
export function aeroCoefficients(alphaDegrees,flap=0,area=845,span=79.8){
  const alpha=rad(alphaDegrees);
  const critical=rad(14+flap*.05);
  let cl=0.23+5.05*alpha+0.018*flap;
  if(alpha>critical){
    const peak=0.23+5.05*critical+0.018*flap;
    cl=peak-3.9*(alpha-critical);
  }else if(alpha<rad(-13)){
    const low=0.23+5.05*rad(-13)+0.018*flap;
    cl=low+2.1*(rad(-13)-alpha);
  }
  cl=clamp(cl,-1.3,2.2);
  const ar=span*span/Math.max(area,1);
  const stallPenalty=Math.max(0,Math.abs(alphaDegrees)-(alphaDegrees>=0?14+flap*.05:13));
  const cd=.023+cl*cl/(Math.PI*.82*ar)+.00085*flap+.008*stallPenalty;
  return {cl,cd,criticalAlpha:14+flap*.05,ar};
}
export function labCalculation(p){
  const params={...DEFAULT_LAB,...p};
  const density=params._densityOverride?params.density:(params.altitude>0?densityAtAltitude(params.altitude):params.density);
  // Lab wind is positive headwind. Ground speed in fixed-ground-speed experiments.
  const airspeed=Math.max(0,params.speed+params.wind);
  const {cl,cd,criticalAlpha,ar}=aeroCoefficients(params.alpha,params.flap,params.area,params.span);
  const dynamicPressure=.5*density*airspeed**2;
  const lift=dynamicPressure*params.area*cl;
  const drag=dynamicPressure*params.area*cd;
  const thrust=AIRCRAFT.maxThrust*params.throttle/100;
  return {airspeed,density,dynamicPressure,lift,drag,cl,cd,thrust,netForward:thrust-drag,criticalAlpha,ar,stall:params.alpha>=criticalAlpha};
}
function terrainAt(x,z){
  const d=Math.max(0,Math.abs(x)-130);
  if(d<3 && z>-1900 && z<2550) return 0;
  return .35*Math.sin(x*.015)*Math.cos(z*.014)+Math.min(40,d*.025)*Math.sin(x*.003+z*.004)**2;
}
export class FlightModel{
  constructor(){this.reset();}
  reset(){
    this.position=V(0,AIRCRAFT.groundHeight,-1690);
    this.velocity=V(0,0,0);
    this.quaternion=Q();
    this.omega=V();
    this.controls={pitch:0,roll:0,yaw:0,throttle:0.35,flap:15,brake:false};
    this.onGround=true;this.crash=false;this.time=0;
    this.windSpeed=0;this.windDirection=90;this.turbulence=0;this.weather='clear';
    this.last={lift:0,drag:0,thrust:0,airspeed:0,alpha:0,cl:0,cd:0,q:0,density:1.225,wind:V(),net:V()};
  }
  setControl(name,value){if(name in this.controls)this.controls[name]=value;}
  setWeather({windSpeed=this.windSpeed,windDirection=this.windDirection,turbulence=this.turbulence,weather=this.weather}={}){
    this.windSpeed=+windSpeed;this.windDirection=+windDirection;this.turbulence=+turbulence;this.weather=weather;
  }
  getWind(){
    const a=rad(this.windDirection),t=this.time,p=this.position;
    const gust=this.turbulence;
    return V(
      Math.sin(a)*this.windSpeed+gust*(1.6*Math.sin(t*.85+p.z*.004)+1.1*Math.sin(t*1.79+p.x*.016)),
      gust*(1.0*Math.sin(t*1.24+p.x*.008)+.55*Math.cos(t*2.4+p.z*.005)),
      Math.cos(a)*this.windSpeed+gust*(1.3*Math.cos(t*.69+p.x*.006)+.5*Math.sin(t*2.21))
    );
  }
  step(dt){
    dt=Math.min(dt,1/30);this.time+=dt;
    const ac=AIRCRAFT,c=this.controls,orient=this.quaternion;
    const wind=this.getWind();
    const vAirWorld=sub(this.velocity,wind);
    const vLocal=invRotate(vAirWorld,orient);
    const airspeed=length(vLocal);
    const alpha=deg(Math.atan2(-vLocal.y,Math.max(1,vLocal.z)));
    const beta=deg(Math.atan2(vLocal.x,Math.max(3,Math.abs(vLocal.z))));
    const density=densityAtAltitude(this.position.y);
    const coef=aeroCoefficients(alpha,c.flap,ac.wingArea,ac.span);
    const q=.5*density*airspeed*airspeed;
    const lift=q*ac.wingArea*coef.cl;
    const drag=q*ac.wingArea*coef.cd;
    const thrust=ac.maxThrust*c.throttle*Math.pow(density/1.225,.35);
    // Lift is perpendicular to the local forward air-velocity in the Y-Z plane.
    const liftDir=normal(V(0,Math.max(.01,vLocal.z),-vLocal.y));
    const dragDir=airspeed>.01?scale(normal(vLocal),-1):V();
    let forceLocal=add(add(scale(liftDir,lift),scale(dragDir,drag)),V(0,0,thrust));
    const gravity=V(0,-ac.mass*9.80665,0);
    let forceWorld=add(rotate(forceLocal,orient),gravity);
    const angles=eulerFromQuaternion(orient);
    if(this.onGround){
      // Rolling resistance and wheel brakes act opposite horizontal travel.
      const horiz=V(this.velocity.x,0,this.velocity.z);
      const resist=ac.mass*9.80665*(c.brake?.27:.012);
      if(length(horiz)>.05)forceWorld=add(forceWorld,scale(normal(horiz),-resist));
      forceWorld.y=0;
    }
    this.velocity=add(this.velocity,scale(forceWorld,dt/ac.mass));
    if(this.onGround){
      this.velocity.y=0;
      const horizontal=V(this.velocity.x,0,this.velocity.z);
      if(length(horizontal)<.1 && c.throttle<.02)this.velocity=V();
    }
    this.position=add(this.position,scale(this.velocity,dt));
    // Model aerodynamics moments + pitch/roll/yaw damping.
    const response=clamp((airspeed-35)/45,0,1);
    const momentX=q*ac.wingArea*ac.chord*(.29*(rad(alpha)-rad(4.2))-.26*c.pitch-.095*this.omega.x);
    const momentY=q*ac.wingArea*ac.span*(.055*c.yaw-.022*rad(beta)-.09*this.omega.y);
    const momentZ=q*ac.wingArea*ac.span*(-.075*c.roll-.014*rad(beta)-.11*this.omega.z);
    const torque=V(momentX,momentY,momentZ);
    if(this.onGround){
      // Wheel contact dampens roll/yaw and allows controlled rotation on take-off.
      this.omega.x=clamp(this.omega.x+dt*(-.18*c.pitch*response-.035*angles.pitch-2.6*this.omega.x),-.32,.32);
      this.omega.y=clamp(this.omega.y+dt*(c.yaw*response*.14-this.omega.y*3.6),-.28,.28);
      this.omega.z=lerp(this.omega.z,0,clamp(7*dt,0,1));
    }else{
      // Reduced rigid-body Euler equation (principal inertia body frame).
      const gyroscopic=V(
        (ac.inertias.y-ac.inertias.z)*this.omega.y*this.omega.z,
        (ac.inertias.z-ac.inertias.x)*this.omega.z*this.omega.x,
        (ac.inertias.x-ac.inertias.y)*this.omega.x*this.omega.y
      );
      this.omega.x=clamp(this.omega.x+dt*(torque.x-gyroscopic.x)/ac.inertias.x,-.65,.65);
      this.omega.y=clamp(this.omega.y+dt*(torque.y-gyroscopic.y)/ac.inertias.y,-.65,.65);
      this.omega.z=clamp(this.omega.z+dt*(torque.z-gyroscopic.z)/ac.inertias.z,-1,1);
    }
    this.quaternion=integrateQuaternion(this.quaternion,this.omega,dt);
    if(this.onGround){
      const angle=eulerFromQuaternion(this.quaternion);
      // Prevent unrealistic runway bank/pitch from a simplified contact model.
      if(Math.abs(angle.bank)>7 || angle.pitch>17 || angle.pitch< -4){
        // Attitude stabilization via corrective angular velocity.
        if(Math.abs(angle.bank)>7)this.omega.z-=Math.sign(-angle.bank)*dt*2;
        if(angle.pitch>17)this.omega.x+=dt*2;
        if(angle.pitch< -4)this.omega.x-=dt*2;
      }
      this.position.y=ac.groundHeight;
      if(lift>ac.mass*9.80665*.94 && airspeed>69 && angles.pitch>2){
        this.onGround=false;
        this.velocity.y=Math.max(this.velocity.y,1.0);
      }
    }else{
      const ground=terrainAt(this.position.x,this.position.z);
      if(this.position.y<=ground+ac.groundHeight){
        if(this.velocity.y< -6)this.crash=true;
        this.position.y=ground+ac.groundHeight;
        this.velocity.y=0;
        this.onGround=true;
        this.omega=V(this.omega.x*.2,this.omega.y*.4,0);
      }
    }
    // Keep enormous exploratory sessions within the playable world.
    if(this.position.y<-50)this.reset();
    this.last={lift,drag,thrust,airspeed,alpha,beta,cl:coef.cl,cd:coef.cd,q,density,wind,net:forceWorld,angles,stall:alpha>coef.criticalAlpha&&airspeed>50};
  }
  telemetry(){
    const a=eulerFromQuaternion(this.quaternion),g=this.last;
    return {...g,...a,altitude:Math.max(0,this.position.y-AIRCRAFT.groundHeight),
      speedKmh:g.airspeed*3.6,mach:g.airspeed/speedOfSoundAtAltitude(this.position.y),groundKmh:Math.hypot(this.velocity.x,this.velocity.z)*3.6,
      verticalSpeed:this.velocity.y,throttle:this.controls.throttle*100,flap:this.controls.flap,
      onGround:this.onGround,crash:this.crash,time:this.time,
      loadFactor:g.lift/(AIRCRAFT.mass*9.80665)};
  }
}
