import {FlightModel,labCalculation,DEFAULT_LAB,AIRCRAFT} from './physics.js';
import {rotate,rad,V} from './math.js';
import {createWorld} from './world.js';
import {createAircraftWithGLB} from './glb-aircraft.js';

const asB=(v)=>new window.BABYLON.Vector3(v.x,v.y,v.z);
const hue={lift:'#4ae5bb',drag:'#fc9070',thrust:'#f4cc74',weight:'#88baff'};
export class FlightScene{
  constructor(canvas,{mode='flight',labParams={},onError=()=>{},onModelStatus=()=>{}}={}){
    if(!window.BABYLON)throw new Error('Babylon.js belum berhasil dimuat. Periksa koneksi internet karena engine 3D dimuat dari CDN.');
    this.B=window.BABYLON;this.canvas=canvas;this.mode=mode;this.onError=onError;
    this.paused=false;this.showForces=mode==='lab';this.cameraMode=mode==='lab'?'orbit':'chase';
    this.labParams={...DEFAULT_LAB,...labParams};this.elapsed=0;this.accum=0;this.lastUI=0;
    this.model=new FlightModel();this.interactions=[];this.onModelStatus=onModelStatus;
    try{this.setup();}catch(err){this.dispose();throw err;}
  }
  setup(){
    const B=this.B;
    this.engine=new B.Engine(this.canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true},true);
    this.engine.setHardwareScalingLevel(Math.max(1,Math.min(1.6,window.devicePixelRatio>1.7?1.3:1)));
    this.scene=new B.Scene(this.engine);this.scene.skipPointerMovePicking=true;
    this.scene.imageProcessingConfiguration.toneMappingEnabled=true;
    this.scene.imageProcessingConfiguration.exposure=1.15;
    this.scene.imageProcessingConfiguration.contrast=1.12;
    if(this.mode==='flight'){
      this.world=createWorld(this.scene,'flight');
      this.aircraft=createAircraftWithGLB(this.scene,{onStatus:this.onModelStatus});
      this.aircraft.root.position.set(0,AIRCRAFT.groundHeight,-1690);
      this.camera=new B.FreeCamera('Pilot camera',new B.Vector3(0,38,-1840),this.scene);
      this.camera.minZ=.1;this.camera.maxZ=6000;this.scene.activeCamera=this.camera;
      this.camera.fov=.86;
      const shadowList=this.aircraft.root.getChildMeshes();
      for(const mesh of shadowList){if(mesh.name.includes('Propeller'))continue;this.world.shadow.addShadowCaster(mesh);}
    }else{
      this.setupLabScene();
    }
    this.createForceGraphics();this.lastForce=0;
    this.initPointerControls();
    this.lastFrame=performance.now();
    this.frame=()=>{
      try{
        const now=performance.now(),dt=Math.min(.06,(now-this.lastFrame)/1000);
        this.lastFrame=now;
        if(!this.paused){
          this.elapsed+=dt;
          if(this.mode==='flight'){
            this.accum=Math.min(.12,this.accum+dt);
            let loops=0;
            while(this.accum>=1/60 && loops<8){
              this.model.step(1/60);this.accum-=1/60;loops++;
            }
            this.syncFlight(dt);
            this.world.update(dt,this.elapsed);
          }else{
            this.aircraft.update({throttle:.65,pitch:0,roll:0,yaw:0,flap:this.labParams.flap},dt);
            this.updateFlow(dt);
          }
        }
        if(this.showForces && now-this.lastForce>90){this.updateForces();this.lastForce=now;}
        this.scene.render();
        if(now-this.lastUI>110){this.lastUI=now;if(this.onTelemetry)this.onTelemetry(this.telemetry());}
      }catch(err){this.onError(err);this.engine.stopRenderLoop(this.frame);}
    };
    this.engine.runRenderLoop(this.frame);
    this.resize=()=>this.engine?.resize();window.addEventListener('resize',this.resize);
    this.resize();
  }
  setupLabScene(){
    const B=this.B;const scene=this.scene;
    scene.clearColor=new B.Color4(.035,.09,.16,1);
    const hemi=new B.HemisphericLight('Lab ambient',new B.Vector3(0,1,0),scene);hemi.intensity=1.3;
    const light=new B.DirectionalLight('Lab softbox',new B.Vector3(-.5,-1,.5),scene);light.intensity=1.7;
    const floorMat=new B.StandardMaterial('Lab floor',scene);floorMat.diffuseColor=B.Color3.FromHexString('#112b3b');
    const ground=B.MeshBuilder.CreateGround('Wind tunnel base',{width:250,height:250},scene);ground.position.y=-1;ground.material=floorMat;
    const gridMat=new B.StandardMaterial('Grid',scene);gridMat.emissiveColor=B.Color3.FromHexString('#1f4a5c');gridMat.disableLighting=true;
    for(let i=-120;i<=120;i+=20){
      const l=B.MeshBuilder.CreateBox('Reference grid X',{width:240,height:.015,depth:.08},scene);l.position.set(0,-.975,i);l.material=gridMat;
      const v=B.MeshBuilder.CreateBox('Reference grid Z',{width:.08,height:.015,depth:240},scene);v.position.set(i,-.975,0);v.material=gridMat;
    }
    const backMat=new B.StandardMaterial('Wind tunnel backdrop',scene);
    backMat.diffuseColor=B.Color3.FromHexString('#102535');
    const back=B.MeshBuilder.CreatePlane('Backdrop',{width:250,height:120},scene);back.position.set(0,62,122);back.material=backMat;
    this.aircraft=createAircraftWithGLB(scene,{onStatus:this.onModelStatus});this.aircraft.root.position.set(0,20,0);
    this.camera=new B.ArcRotateCamera('Research camera',-Math.PI/2,1.20,155,new B.Vector3(0,20,0),scene);
    this.camera.minZ=.1;this.camera.maxZ=1000;this.camera.lowerRadiusLimit=75;this.camera.upperRadiusLimit=320;
    this.camera.wheelPrecision=30;this.camera.panningSensibility=0;
    this.camera.attachControl(this.canvas,true);
    this.camera.keysUp=[];this.camera.keysDown=[];this.camera.keysLeft=[];this.camera.keysRight=[];
    this.scene.activeCamera=this.camera;
    this.flowParticles=[];
    const flowMat=new B.StandardMaterial('Airflow cyan',scene);
    flowMat.emissiveColor=B.Color3.FromHexString('#65e6ea');flowMat.disableLighting=true;flowMat.alpha=.76;
    const base=B.MeshBuilder.CreateSphere('Flow tracer base',{diameter:.12,segments:5},scene);base.material=flowMat;
    for(let i=0;i<112;i++){
      const dot=base.createInstance('Air tracer '+i);
      this.flowParticles.push({mesh:dot,phase:Math.random(),x:(Math.random()-.5)*88,y:(Math.random()-.5)*15});
    }
    base.position.set(0,-10000,0);
    this.labDecor=[];
    const ringMat=new B.StandardMaterial('Tunnel rings',scene);ringMat.emissiveColor=B.Color3.FromHexString('#236077');ringMat.alpha=.3;
    for(const z of [-62,-20,20,62]){
      const torus=B.MeshBuilder.CreateTorus('Tunnel hoop',{diameter:110,thickness:.12,tessellation:56},scene);
      torus.position.set(0,20,z);torus.rotation.x=Math.PI/2;torus.material=ringMat;this.labDecor.push(torus);
    }
    this.setLabParameters(this.labParams);
  }
  updateFlow(dt){
    // In laboratorium / wind-tunnel mode the aircraft is treated as stationary,
    // so the incoming airflow must move from the nose (front, +Z) toward the tail (rear, -Z).
    // Older builds moved tracers from belakang ke depan, which was visually reversed.
    const flow=Math.max(5,this.labParams.speed+this.labParams.wind);
    for(const t of this.flowParticles){
      t.phase=(t.phase+dt*flow/160)%1;
      const z=80-t.phase*160;
      let y=t.y;
      if(Math.abs(t.x)>2 && Math.abs(t.x)<43){
        const around=Math.max(0,1-Math.abs(z)/75);
        y+=around*(6+this.labParams.alpha*.12);
      }
      t.mesh.position.set(t.x,20+y,z);
      t.mesh.scaling.set(1.5,1.5,2.5+flow/40);
    }
  }
  createForceGraphics(){
    this.forceLines={};
    for(const type of ['lift','drag','thrust','weight']){
      const B=this.B;
      const line=B.MeshBuilder.CreateLines('Force '+type,{points:[new B.Vector3(0,0,0),new B.Vector3(0,1,0)],updatable:true},this.scene);
      line.color=B.Color3.FromHexString(hue[type]);line.isPickable=false;line.alwaysSelectAsActiveMesh=true;
      this.forceLines[type]=line;
    }
    this.updateForces();
  }
  updateForces(){
    const B=this.B;
    const a=this.aircraft.root.position;
    const planeLocal=(x,y,z)=>{
      const v=rotate(V(x,y,z),this.model.quaternion);
      return new B.Vector3(a.x+v.x,a.y+v.y,a.z+v.z);
    };
    const lab=this.mode==='lab';
    const calc=lab?labCalculation(this.labParams):this.model.last;
    const lift=calc.lift,drag=calc.drag,thrust=calc.thrust,weight=AIRCRAFT.mass*9.80665;
    const max=lab?Math.max(1e6,lift,drag,thrust):Math.max(1e6,lift,drag,thrust);
    const mag=(n)=>8+Math.min(25,Math.abs(n)/Math.max(max,1)*22);
    const center=new B.Vector3(a.x,a.y,a.z);
    const vectors={
      lift:lab?new B.Vector3(0,mag(lift),0):planeLocal(0,mag(lift),0),
      drag:lab?new B.Vector3(0,0,-mag(drag)):planeLocal(0,0,-mag(drag)),
      thrust:lab?new B.Vector3(0,0,mag(thrust)):planeLocal(0,0,mag(thrust)),
      weight:new B.Vector3(a.x,a.y-mag(weight),a.z)
    };
    for(const [k,line] of Object.entries(this.forceLines)){
      line.isVisible=this.showForces;
      if(!this.showForces)continue;
      const end=vectors[k];
      const endpoint=lab&&k!=='weight'?center.add(end):end;
      B.MeshBuilder.CreateLines('Force '+k,{points:[center,endpoint],instance:line},this.scene);
    }
  }
  syncFlight(dt){
    const m=this.model,pos=m.position;
    const root=this.aircraft.root;
    root.position.set(pos.x,pos.y,pos.z);
    root.rotationQuaternion.set(m.quaternion.x,m.quaternion.y,m.quaternion.z,m.quaternion.w);
    this.aircraft.update(m.controls,dt);
    const B=this.B;
    const targetRoot=new B.Vector3(pos.x,pos.y,pos.z);
    let wanted,point;
    if(this.cameraMode==='cockpit'){
      const eye=rotate(V(0,2.5,32),m.quaternion);
      const look=rotate(V(0,2.5,160),m.quaternion);
      wanted=targetRoot.add(asB(eye));point=targetRoot.add(asB(look));
    }else{
      const distance=this.zoom||155;
      const offset=this.cameraMode==='side'?V(distance*.85,45,-distance*.5):this.cameraMode==='top'?V(0,distance*1.1,-distance*.35):V(Math.sin(this.orbitYaw||0)*distance,35+Math.sin(this.orbitPitch||0)*28,-Math.cos(this.orbitYaw||0)*distance);
      wanted=targetRoot.add(asB(rotate(offset,m.quaternion)));
      point=targetRoot.add(asB(rotate(V(0,2,14),m.quaternion)));
    }
    const smoothing=this.cameraMode==='cockpit'?1:Math.min(1,dt*4.2);
    if(this.model.turbulence>0 && this.cameraMode==='chase'){const t=this.elapsed,a=this.model.turbulence*.025;wanted.x+=Math.sin(t*8.3)*a;wanted.y+=Math.sin(t*11.5)*a;}
    this.camera.position.copyFrom(B.Vector3.Lerp(this.camera.position,wanted,smoothing));
    this.camera.setTarget(point);
  }
  initPointerControls(){
    if(this.mode==='lab')return;
    let held=false,lastX=0,lastY=0;
    const down=(e)=>{if(e.button!==0)return;held=true;lastX=e.clientX;lastY=e.clientY;};
    const move=(e)=>{if(!held)return;this.orbitYaw=(this.orbitYaw||0)+(e.clientX-lastX)*.005;this.orbitPitch=Math.max(-.5,Math.min(.85,(this.orbitPitch||0)+(e.clientY-lastY)*-.005));lastX=e.clientX;lastY=e.clientY;};
    const up=()=>held=false;
    const wheel=(e)=>{if(e.cancelable)e.preventDefault();this.zoom=Math.max(70,Math.min(400,(this.zoom||155)+Math.sign(e.deltaY)*12));};
    this.canvas.addEventListener('pointerdown',down);
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);
    this.canvas.addEventListener('wheel',wheel,{passive:false});
    this.interactions.push(()=>this.canvas.removeEventListener('pointerdown',down),()=>window.removeEventListener('pointermove',move),()=>window.removeEventListener('pointerup',up),()=>this.canvas.removeEventListener('wheel',wheel));
  }
  setControl(k,v){this.model.setControl(k,v);}
  setWeather(settings){this.model.setWeather(settings);this.world?.setWeather(this.model.weather);}
  setCamera(mode){if(['chase','cockpit','side','top'].includes(mode))this.cameraMode=mode;}
  setLabParameters(values){
    this.labParams={...this.labParams,...values};
    if(this.aircraft){
      this.aircraft.root.rotationQuaternion=this.B.Quaternion.RotationAxis(this.B.Axis.X,-rad(this.labParams.alpha));
    }
  }
  setForces(value){this.showForces=value;this.updateForces();}
  setQuality(value){this.engine?.setHardwareScalingLevel(value==='low'?2:value==='medium'?1.35:1);this.engine?.resize();}
  togglePause(){this.paused=!this.paused;return this.paused;}
  reset(){this.model.reset();this.accum=0;this.paused=false;}
  telemetry(){return this.mode==='lab'?labCalculation(this.labParams):this.model.telemetry();}
  dispose(){
    this.interactions.forEach(fn=>fn());this.interactions=[];this.aircraft?.dispose?.();
    if(this.resize)window.removeEventListener('resize',this.resize);
    try{this.engine?.stopRenderLoop(this.frame);this.scene?.dispose();this.engine?.dispose();}catch(e){console.warn('Scene cleanup',e);}
  }
}
