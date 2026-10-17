import {getLivery} from './livery.js';
// A380-800 PROCEDURAL EDUCATIONAL MODEL. 1 Babylon unit = 1 meter.
// Dimensions follow Airbus A380 factsheets; surface shapes are an approximation,
// not a certified CAD model or an Airbus-provided 3-D asset.
export function createAircraft(scene){
 const B=window.BABYLON;
 const root=new B.TransformNode('A380-800',scene);root.rotationQuaternion=B.Quaternion.Identity();
 const parts={elevators:[],ailerons:[],flaps:[],engines:[],rudder:null};
 const mat=(name,hex,metal=.12)=>{const m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromHexString(hex);m.metallic=metal;m.roughness=.43;m.backFaceCulling=false;return m;};
 const white=mat('Pearl cabin','#f0f4f7',.2),steel=mat('Alloy','#8797a9',.55),rubber=mat('Tires','#151c23'),windowMat=mat('Double deck windows','#214457'),dark=mat('Engine intakes','#1b2732'),light=mat('Wing panels','#e4ecf2');
 const primary=mat('Livery primary','#1b6ba2'),secondary=mat('Livery secondary','#44bfc5'),tailMat=mat('Livery tail','#153b67');
 const registerMat=mat('Registration white','#ffffff');
 const sphere=(n,p,s,m,parent=root)=>{let o=B.MeshBuilder.CreateSphere(n,{diameter:1,segments:20},scene);o.parent=parent;o.position.set(...p);o.scaling.set(...s);o.material=m;return o;};
 const box=(n,p,d,m,parent=root)=>{let o=B.MeshBuilder.CreateBox(n,{width:d[0],height:d[1],depth:d[2]},scene);o.parent=parent;o.position.set(...p);o.material=m;return o;};
 const cyl=(n,p,rad,height,m,rotate=[0,0,0],parent=root)=>{let o=B.MeshBuilder.CreateCylinder(n,{diameter:rad*2,height,tessellation:24},scene);o.parent=parent;o.position.set(...p);o.rotation.set(...rotate);o.material=m;return o;};
 // Wing meshes use swept quadrilateral sections, thickness and positive dihedral.
 function surface(n,side,rootX,tipX,rootFore,rootBack,tipFore,tipBack,rootY,tipY,thickness,m,parent=root){
  const xs=[side*rootX,side*tipX], corners=[[xs[0],rootY,rootFore],[xs[0],rootY,rootBack],[xs[1],tipY,tipFore],[xs[1],tipY,tipBack]];
  const upper=corners.map(v=>[v[0],v[1]+thickness/2,v[2]]), lower=corners.map(v=>[v[0],v[1]-thickness/2,v[2]]);
  const verts=[...upper,...lower].flat();
  const inds=[0,1,2,1,3,2,4,6,5,5,6,7,0,4,1,1,4,5,2,3,6,3,7,6,0,2,4,2,6,4,1,5,3,3,5,7];
  const normals=[];B.VertexData.ComputeNormals(verts,inds,normals);const mesh=new B.Mesh(n,scene),v=new B.VertexData();v.positions=verts;v.indices=inds;v.normals=normals;v.applyToMesh(mesh);mesh.parent=parent;mesh.material=m;return mesh;
 }
 // Longitudinal direction +Z = forward. Fuselage length 72.7 m.
 sphere('A380 broad fuselage',[0,0,0],[7.10,7.65,69],white);
 sphere('A380 upper deck',[0,2.3,8],[6.65,4.0,37],white);
 sphere('Nose dome',[0,0,32.0],[6.2,6.4,9.4],white);
 sphere('Tail taper',[0,1,-31],[4.2,4.4,11],white);
 sphere('Belly fairing',[0,-3.2,-1],[7.4,2.5,23],light);
 // Painted longitudinal ribbon on upper part of twin-deck fuselage.
 for(const side of [-1,1]){
  sphere('Color fuselage ribbon '+side,[side*3.52,1.25,9.6],[.26,.46,43.5],primary);
  sphere('Secondary ribbon '+side,[side*3.28,.45,8.2],[.14,.20,44],secondary);
  // Rows of upper and lower deck windows on each side.
  for(let z=-20;z<=25;z+=1.42){
   sphere('Lower deck window',[side*3.59,.65,z],[.08,.27,.38],windowMat);
   if(z>-12 && z<21)sphere('Upper deck window',[side*3.35,2.65,z],[.08,.25,.34],windowMat);
  }
 }
 for(const side of [-1,1]){
  const canopy=sphere('Cockpit windshield '+side,[side*1.20,1.15,33.38],[1.35,.72,.20],windowMat);canopy.rotation.y=side*.20;
  box('Door A '+side,[side*3.53,.70,17.2],[.06,1.9,1.25],light);
  box('Door B '+side,[side*3.53,.70,-12],[.06,1.9,1.25],light);
 }
 // Airbus A380 reference wingspan 79.8 m, roots and tips approximately fitted.
 for(const side of [-1,1]){
  surface('Primary main wing '+side,side,2.0,39.85,15,-15.5,-9,-20,0,-.3,.54,white);
  surface('Leading edge chrome '+side,side,3,39.2,15,13.7,-9,-9.4,.21,-.06,.09,light);
  const ail=new B.TransformNode('Aileron hinge '+side,scene);ail.parent=root;ail.position.set(side*30.8,-.28,-17.6);
  surface('Aileron plate '+side,side,.0,7.0,1.2,-1.0,.25,-.8,0,.05,.12,primary,ail);parts.ailerons.push({pivot:ail,side});
  const flap=new B.TransformNode('Flap hinge '+side,scene);flap.parent=root;flap.position.set(side*15.5,-.16,-12);
  surface('High lift flap '+side,side,0,9,1.1,-2,.5,-2.7,0,0,.15,light,flap);parts.flaps.push(flap);
  // Wingtip fences (visual approximation).
  box('Wingtip fence '+side,[side*39.35,.55,-14.1],[.5,1.65,2.4],secondary);
  // Two turbofans per wing, fan intake faces +Z.
  for(const [i,x,z] of [[0,12,2.1],[1,25,-5.4]]){
   const eng=sphere(`Engine nacelle ${side}:${i}`,[side*x,-3.10,z],[4.5,4.45,8.3],white);
   cyl('Intake rim '+side+':'+i,[side*x,-3.12,z+3.55],2.05,.24,steel,[Math.PI/2,0,0]);
   const intake=cyl('Fan inlet '+side+':'+i,[side*x,-3.12,z+3.69],1.72,.11,dark,[Math.PI/2,0,0]);
   const fan=cyl('Fan disk '+side+':'+i,[side*x,-3.12,z+3.76],1.44,.09,steel,[Math.PI/2,0,0]);
   parts.engines.push({eng,intake,fan});
   box('Engine pylon '+side+':'+i,[side*x,-1.15,z-.8],[1.0,2.4,3.0],steel);
  }
  surface('Horizontal tail '+side,side,1.2,14.8,-24.5,-35.6,-32.2,-37.4,2.0,2.7,.36,white);
  const elev=new B.TransformNode('Elevator hinge '+side,scene);elev.parent=root;elev.position.set(side*7.5,2.1,-35);
  surface('Elevator '+side,side,0,6,.7,-1.45,-.4,-1.4,0,.05,.1,primary,elev);parts.elevators.push(elev);
 }
 // Vertical stabilizer 24.1 m overall from ground when gear deployed (illustrative).
 const vtail=surface('Vertical tailplane',1,0.0,.16,-25,-36,-34,-39,1,16,.46,tailMat);
 // Tall swept fin custom side-wall polygon for accurate fin silhouette.
 const finShape=new B.Mesh('A380 main fin',scene);
 const vs=[-.25,2,-26,.25,2,-26,-.15,15.7,-34,.15,15.7,-34,-.25,2,-37,.25,2,-37];
 const face=[0,2,4,1,5,3,0,1,2,1,3,2,2,3,4,3,5,4,4,5,0,5,1,0];
 const norms=[];B.VertexData.ComputeNormals(vs,face,norms);const vd=new B.VertexData();vd.positions=vs;vd.indices=face;vd.normals=norms;vd.applyToMesh(finShape);finShape.material=tailMat;finShape.parent=root;
 const rud=new B.TransformNode('Rudder hinge',scene);rud.parent=root;rud.position.set(0,9,-36);box('Rudder surface',[0,0,-1.8],[.30,8,2.4],primary,rud);parts.rudder=rud;
 // Landing gear: nose + four main bodies, 22 wheels diagrammatic approximation.
 function wheel(x,z,y,r){const stem=cyl('Hydraulic strut',[x,y+2,z],.16,4,steel);cyl('Wheel tire',[x,y,z],r,.65,rubber,[0,0,Math.PI/2]);cyl('Wheel hub',[x,y,z],r*.42,.70,steel,[0,0,Math.PI/2]);}
 for(const side of [-1,1]){for(const z of [-10,-8,-6,-4])wheel(side*8.4,z,-8.0,1.0);for(const z of [-13,-11,-9,-7,-5,-3])wheel(side*3.4,z,-8.0,1.0);wheel(side*1.1,27,-8.0,.9);}
 // Registration as dynamic texture, no proprietary external models.
 const tex=new B.DynamicTexture('A380 nameplate',{width:1024,height:256},scene,false);tex.hasAlpha=true;
 const textMat=new B.StandardMaterial('Livery text',scene);textMat.diffuseTexture=tex;textMat.opacityTexture=tex;textMat.backFaceCulling=false;textMat.emissiveColor=new B.Color3(.1,.15,.20);
 for(const side of [-1,1]){const plane=B.MeshBuilder.CreatePlane('Livery lettering '+side,{width:10,height:2.45},scene);plane.parent=root;plane.position.set(side*3.62,0.15,3.5);plane.rotation.y=side>0?Math.PI/2:-Math.PI/2;plane.material=textMat;}
 // Optional custom logo is displayed on both sides with the same data URL
 // saved by the papercraft editor. Its UV placement is illustrative, not a true
 // one-to-one unwrapping of the original papercraft parts.
 const logoMat=new B.StandardMaterial('Custom logo',scene);logoMat.backFaceCulling=false;logoMat.diffuseColor=B.Color3.White();logoMat.emissiveColor=new B.Color3(.18,.18,.18);logoMat.useAlphaFromDiffuseTexture=true;
 const logoPlates=[];
 for(const side of [-1,1]){const p=B.MeshBuilder.CreatePlane('Custom livery logo '+side,{width:6.8,height:3.3},scene);p.parent=root;p.position.set(side*3.66,.48,17.4);p.rotation.y=side>0?Math.PI/2:-Math.PI/2;p.material=logoMat;logoPlates.push(p);}
 let currentLogo='';
 function applyLivery(l){const B=window.BABYLON;primary.albedoColor=B.Color3.FromHexString(l.primary);secondary.albedoColor=B.Color3.FromHexString(l.secondary);tailMat.albedoColor=B.Color3.FromHexString(l.tail);tex.getContext().clearRect(0,0,1024,256);tex.drawText(l.name.toUpperCase().slice(0,22),22,134,'bold 110px Arial','#ffffff','transparent',true);tex.update();
  if(currentLogo!==l.logoData){currentLogo=l.logoData;logoMat.diffuseTexture?.dispose();logoMat.diffuseTexture=l.logoData?new B.Texture(l.logoData,scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE):null;logoPlates.forEach(p=>p.isVisible=!!l.logoData);}
 }
 applyLivery(getLivery());
 const onChange=e=>applyLivery(e.detail);window.addEventListener('aerolab-livery',onChange);
 const observer=e=>{if(e.key==='aerolab.a380.livery.v1')applyLivery(getLivery());};window.addEventListener('storage',observer);
 root.getChildMeshes().forEach(m=>{m.receiveShadows=true;m.isPickable=false;});
 function update(control,dt){for(const o of parts.engines)o.fan.rotation.z+=dt*(2+control.throttle*18);parts.elevators.forEach(p=>p.rotation.x=-control.pitch*.18);parts.ailerons.forEach(({pivot,side})=>pivot.rotation.x=side*control.roll*.16);parts.flaps.forEach(p=>p.rotation.x=-control.flap*Math.PI/180*.55);parts.rudder.rotation.y=control.yaw*.16;}
 return {root,parts,update,applyLivery,dispose(){window.removeEventListener('storage',observer);window.removeEventListener('aerolab-livery',onChange);}};
}
