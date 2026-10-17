// An intentionally illustrative flow-tracer system: not CFD.
// Reference frame: local +Z = aircraft nose, incoming air goes +Z -> -Z.
// Dense, emissive strokes are sized to be visible beside a ~80 m span A380.
export const AIRFLOW_DEFAULT_COUNT=176;
export const FLOW_SPAN_METERS=210;
export function flowPosition(index,phase,alphaDegrees=0){
  const fract=n=>n-Math.floor(n);
  const a=fract((index+1)*0.61803398875);
  const b=fract((index+1)*0.75487766625);
  const c=fract((index+1)*0.41421356237);
  const zone=index%5;
  const sign=a>.5?1:-1;
  const wing=zone<3;
  let x=wing?sign*(7+40*b):sign*(2+12*b);
  let y=(c-.5)*(wing?17:20);
  const z=105-((phase%1+1)%1)*FLOW_SPAN_METERS;
  // Qualitative wing upwash/downwash and tip vortices, not a CFD prediction.
  const nearWing=Math.max(0,1-Math.abs(z)/44)*Math.max(0,1-Math.abs(Math.abs(x)-24)/34);
  y+=nearWing*(1.8+Math.min(12,Math.max(-8,alphaDegrees))*.16);
  if(wing && Math.abs(x)>33 && z<0){
    const distance=Math.min(1,Math.max(0,-z/85));
    const spiral=distance*distance*6;
    x+=sign*Math.sin(distance*15+index*.11)*spiral;
    y+=Math.cos(distance*15+index*.11)*spiral;
  }
  return {x,y,z};
}
export function createAirflow(scene,aircraftRoot,{count=AIRFLOW_DEFAULT_COUNT}={}){
  const B=window.BABYLON;
  const group=new B.TransformNode('VISIBLE A380 AIRFLOW (educational tracers)',scene);
  group.parent=aircraftRoot;
  const colors=['#70efff','#c5fbff','#5ccfde'];
  const sources=colors.map((hex,j)=>{
    const material=new B.StandardMaterial('Aliran udara terang '+j,scene);
    material.disableLighting=true;
    material.diffuseColor=B.Color3.FromHexString(hex);
    material.emissiveColor=B.Color3.FromHexString(hex);
    material.alpha=1;
    const base=B.MeshBuilder.CreateCylinder('Air tracer template '+j,{height:1,diameter:j===1?.55:.40,tessellation:7},scene);
    base.rotation.x=Math.PI/2;
    base.material=material;
    base.position.y=-10000; // Hide source geometry; instances remain visible.
    base.isPickable=false;
    return base;
  });
  const traces=[];
  for(let i=0;i<count;i++){
    const base=sources[i%3];
    const mesh=base.createInstance('Visible air streamline '+i);
    mesh.parent=group;
    mesh.rotation.x=Math.PI/2;
    mesh.isPickable=false;
    mesh.alwaysSelectAsActiveMesh=true;
    const length=4.7+(i%6)*.94;
    mesh.scaling.set(1,length,1);
    traces.push({mesh,phase:(i+.5)/count});
  }
  let enabled=true;
  // Transform-only instance updates avoid per-frame mesh creation.
  function update(dt,airspeed=0,alpha=0){
    if(!enabled)return;
    const speed=Math.max(0,Math.min(300,Number(airspeed)||0));
    for(let i=0;i<traces.length;i++){
      const item=traces[i];
      item.phase=(item.phase+speed*dt/FLOW_SPAN_METERS)%1;
      // All tracers are positioned in airplane-local coordinates.
      const p=flowPosition(i,item.phase,alpha);
      item.mesh.position.set(p.x,p.y,p.z);
    }
  }
  function setVisible(v){enabled=!!v;group.setEnabled(enabled);}
  update(0,80,5);
  return {update,setVisible,get visible(){return enabled;},get count(){return traces.length;},dispose(){group.dispose(false,true);sources.forEach(m=>{m.material?.dispose();m.dispose();});}};
}
