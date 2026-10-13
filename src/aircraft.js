// Detailed procedural light-aircraft. No third-party model or license required.
export function createAircraft(scene){
  const B=window.BABYLON;
  const root=new B.TransformNode('aircraftRoot',scene);
  root.rotationQuaternion=B.Quaternion.Identity();
  const parts={};
  function mat(name,color,metal=.03,rough=.64,emissive){
    const m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromHexString(color);
    m.metallic=metal;m.roughness=rough;
    if(emissive)m.emissiveColor=B.Color3.FromHexString(emissive);
    return m;
  }
  const white=mat('Ceramic aircraft paint','#f2f7ff',.24,.32);
  const blue=mat('Aircraft navy blue','#1b5384',.3,.35);
  const cyan=mat('Stripes teal','#25bdd0',.15,.42);
  const dark=mat('Aero black rubber','#131b25',.02,.9);
  const steel=mat('Brushed aluminium','#8494a9',.67,.35);
  const glass=mat('Tinted cockpit glazing','#15334e',.25,.12);
  glass.alpha=.78;glass.transparencyMode=B.Material.MATERIAL_ALPHABLEND;
  const redLamp=mat('Red nav light','#e93e58',.1,.5,'#e93e58');
  const greenLamp=mat('Green nav light','#48edb4',.1,.5,'#48edb4');
  function sphere(name,xyz,scale,m,parent=root){
    const mesh=B.MeshBuilder.CreateSphere(name,{diameter:1,segments:18},scene);
    mesh.parent=parent;mesh.position.set(...xyz);mesh.scaling.set(...scale);mesh.material=m;return mesh;
  }
  function box(name,xyz,whd,m,parent=root){
    const o=B.MeshBuilder.CreateBox(name,{width:whd[0],height:whd[1],depth:whd[2]},scene);
    o.parent=parent;o.position.set(...xyz);o.material=m;return o;
  }
  function cylinder(name,xyz,radius,height,m,rot,parent=root){
    const o=B.MeshBuilder.CreateCylinder(name,{diameter:radius*2,height,tessellation:20},scene);
    o.parent=parent;o.position.set(...xyz);if(rot)o.rotation.set(...rot);o.material=m;return o;
  }
  // Ellipsoid fuselage and tapered nose/tail sections.
  sphere('Fuselage streamlined monocoque',[0,0,0],[1.02,.92,7.9],white);
  sphere('Nose cowling',[0,.03,3.55],[.68,.66,2.15],white);
  sphere('Rear tapered fuselage',[0,.12,-3.38],[.55,.53,2.55],white);
  // Cockpit glazing, windshield and side windows.
  sphere('Blue bubble canopy',[0,.57,.8],[.89,.60,3.1],glass);
  box('Cockpit center pillar',[0,1.04,1.35],[.055,.08,.12],steel);
  for(const side of [-1,1]){
    box('Long fuselage livery '+side,[side*.86,-.08,1.35],[.035,.14,5.9],blue);
    box('Fine cyan stripe '+side,[side*.867,-.18,1.25],[.033,.047,5.1],cyan);
    // Side window panes with window-frame accents.
    box('Window side '+side,[side*.76,.58,.44],[.09,.57,1.85],glass);
    box('Window divider '+side,[side*.81,.6,-.14],[.055,.67,.08],white);
  }
  // Wing solids with both upper and lower surfaces.
  function wing(name,side,{span,rootZ,tipZ,y,chordRoot,chordTip,material,parent=root,rootX=0.62,thickness=.16}){
    const x0=side*rootX,x1=side*(rootX+span);
    const p=[
      [x0,y,rootZ+chordRoot/2],[x0,y,rootZ-chordRoot/2],
      [x1,y+.14,tipZ+chordTip/2],[x1,y+.14,tipZ-chordTip/2]
    ];
    const pts=[];for(const h of [thickness/2,-thickness/2])for(const point of p)pts.push(point[0],point[1]+h,point[2]);
    const idx=[0,2,1,1,2,3,4,5,6,5,7,6,0,4,2,2,4,6,1,3,5,3,7,5,0,1,4,1,5,4,2,6,3,3,6,7];
    const normals=[];B.VertexData.ComputeNormals(pts,idx,normals);
    const mesh=new B.Mesh(name,scene);const data=new B.VertexData();data.positions=pts;data.indices=idx;data.normals=normals;data.applyToMesh(mesh);
    mesh.material=material;mesh.parent=parent;return mesh;
  }
  for(const side of [-1,1]){
    wing('Main high wing '+side,side,{span:4.96,rootZ:.27,tipZ:-.14,y:.93,chordRoot:1.72,chordTip:1.03,material:white});
    wing('Horizontal stabilizer '+side,side,{span:1.89,rootZ:-3.46,tipZ:-3.70,y:.44,chordRoot:.9,chordTip:.54,material:white,rootX:.17,thickness:.12});
    // Wing upper colored panel near tips.
    box('Wingtip paint '+side,[side*5.37,1.115,-.08],[.55,.035,.95],cyan);
    // Tie rods / landing light fixtures.
    const strut=box('Wing support strut '+side,[side*1.71,.12,.05],[.065,1.53,.065],steel);
    strut.rotation.z=side*.56;
    sphere('Navigation lamp '+side,[side*5.59,1.04,-.17],[.12,.11,.16],side<0?redLamp:greenLamp);
  }
  // Vertical stabilizer by two tilted tapered boxes.
  const fin=box('Vertical stabilizer',[0,.93,-3.37],[.16,1.75,1.08],white);
  fin.rotation.x=-.3;
  const rudderPivot=new B.TransformNode('RudderPivot',scene);rudderPivot.parent=root;rudderPivot.position.set(0,1.18,-3.96);
  const rudder=box('Rudder',[0,.26,-.08],[.10,1.04,.25],blue,rudderPivot);
  parts.rudder=rudderPivot;
  parts.elevators=[];parts.ailerons=[];parts.flaps=[];
  for(const side of [-1,1]){
    const elevPivot=new B.TransformNode('ElevatorPivot'+side,scene);elevPivot.parent=root;elevPivot.position.set(side*1.11,.55,-3.93);
    box('Elevator surface '+side,[0,0,-.08],[1.45,.075,.38],blue,elevPivot);parts.elevators.push(elevPivot);
    const ailPivot=new B.TransformNode('AileronPivot'+side,scene);ailPivot.parent=root;ailPivot.position.set(side*3.73,1.05,-.73);
    box('Aileron surface '+side,[0,0,-.1],[1.98,.075,.34],blue,ailPivot);parts.ailerons.push({pivot:ailPivot,side});
    const flapPivot=new B.TransformNode('FlapPivot'+side,scene);flapPivot.parent=root;flapPivot.position.set(side*1.75,1.045,-.67);
    box('Flap surface '+side,[0,0,-.12],[1.45,.09,.37],white,flapPivot);parts.flaps.push(flapPivot);
  }
  // Propeller and hub on nose.
  const spinner=cylinder('Spinner',[0,.03,4.56],.27,.55,steel,[Math.PI/2,0,0]);
  const propellerPivot=new B.TransformNode('PropellerAxis',scene);
  propellerPivot.parent=root;propellerPivot.position.set(0,.03,4.86);
  for(let i=0;i<3;i++){
    const pivot=new B.TransformNode('BladePivot'+i,scene);pivot.parent=propellerPivot;pivot.rotation.z=i*Math.PI*2/3;
    const blade=box('Propeller Blade '+i,[0,.81,0],[.16,1.55,.075],dark,pivot);blade.rotation.z=-.1;
    box('Blade tip paint '+i,[0,1.47,.005],[.17,.2,.08],cyan,pivot);
  }
  sphere('Prop hub',[0,0,.05],[.24,.24,.3],steel,propellerPivot);
  parts.propeller=propellerPivot;
  // Fixed tricycle undercarriage.
  function wheel(x,z,r=.38){
    const leg=cylinder('Landing gear leg',[x,-1.18,z],.055,.93,steel,null);
    const tyre=cylinder('Rubber wheel',[x,-1.62,z],r,.21,dark,[0,0,Math.PI/2]);
    const hub=cylinder('Wheel hub',[x,-1.62,z],r*.43,.23,steel,[0,0,Math.PI/2]);
    return {leg,tyre,hub};
  }
  wheel(0,2.9,.29);wheel(-1.34,-1.18,.38);wheel(1.34,-1.18,.38);
  // Decorative registration lettering in 3D texture on both sides.
  const registration=new B.DynamicTexture('RegistrationTexture',{width:512,height:128},scene,false);
  registration.hasAlpha=true;
  registration.drawText('AT  •  01',16,88,'bold 76px Arial','#e6f7ff','transparent',true);
  const textmat=new B.StandardMaterial('registration',scene);textmat.diffuseTexture=registration;textmat.opacityTexture=registration;textmat.emissiveColor=new B.Color3(.3,.65,.8);textmat.backFaceCulling=false;
  for(const side of [-1,1]){
    const plate=B.MeshBuilder.CreatePlane('Registration '+side,{width:1.7,height:.42},scene);
    plate.parent=root;plate.position.set(side*.91,-.2,-1.6);plate.rotation.y=side>0?Math.PI/2:-Math.PI/2;plate.material=textmat;
  }
  function update(control,dt){
    parts.propeller.rotation.z+=dt*(9+control.throttle*160);
    parts.elevators.forEach((p)=>{p.rotation.x=-control.pitch*.3;});
    parts.ailerons.forEach(({pivot,side})=>{pivot.rotation.x=side*control.roll*.28;});
    parts.flaps.forEach((p)=>{p.rotation.x=-control.flap*Math.PI/180*.85;});
    parts.rudder.rotation.y=control.yaw*.3;
  }
  return {root,update,parts};
}
