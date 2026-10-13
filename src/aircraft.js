// Improved procedural light-aircraft mesh.
// Still license-free and generated entirely in code.
export function createAircraft(scene){
  const B=window.BABYLON;
  const root=new B.TransformNode('aircraftRoot',scene);
  root.rotationQuaternion=B.Quaternion.Identity();
  const parts={};

  function mat(name,color,metal=.05,rough=.58,emissive){
    const m=new B.PBRMaterial(name,scene);
    m.albedoColor=B.Color3.FromHexString(color);
    m.metallic=metal;
    m.roughness=rough;
    if(emissive) m.emissiveColor=B.Color3.FromHexString(emissive);
    return m;
  }

  const paint=mat('Aircraft paint','#f4f8ff',.22,.30);
  const accent=mat('Aircraft accent','#24679a',.28,.34);
  const accent2=mat('Aircraft accent 2','#32bfd2',.18,.40);
  const rubber=mat('Rubber dark','#131920',.02,.92);
  const steel=mat('Steel','#8d9caf',.68,.33);
  const black=mat('Charcoal','#1b2430',.08,.84);
  const lightGrey=mat('Light grey','#dde5ee',.22,.42);
  const redLamp=mat('Red light','#e74460',.08,.45,'#e74460');
  const greenLamp=mat('Green light','#47e9b2',.08,.45,'#47e9b2');

  const glass=new B.PBRMaterial('Cockpit glass',scene);
  glass.albedoColor=B.Color3.FromHexString('#7fc7ef');
  glass.reflectivityColor=new B.Color3(.75,.84,.93);
  glass.metallic=.02;glass.roughness=.08;
  glass.alpha=.34;glass.transparencyMode=B.Material.MATERIAL_ALPHABLEND;
  glass.indexOfRefraction=1.48;

  function sphere(name,xyz,scale,material,parent=root,segments=20){
    const mesh=B.MeshBuilder.CreateSphere(name,{diameter:1,segments},scene);
    mesh.parent=parent;mesh.position.set(...xyz);mesh.scaling.set(...scale);mesh.material=material;return mesh;
  }
  function box(name,xyz,whd,material,parent=root){
    const mesh=B.MeshBuilder.CreateBox(name,{width:whd[0],height:whd[1],depth:whd[2]},scene);
    mesh.parent=parent;mesh.position.set(...xyz);mesh.material=material;return mesh;
  }
  function cyl(name,xyz,radius,height,material,rot,parent=root,tessellation=24){
    const mesh=B.MeshBuilder.CreateCylinder(name,{diameter:radius*2,height,tessellation},scene);
    mesh.parent=parent;mesh.position.set(...xyz);if(rot)mesh.rotation.set(...rot);mesh.material=material;return mesh;
  }
  function taperedBox(name,side,{span,rootZ,tipZ,y,chordRoot,chordTip,material,parent=root,rootX=.58,thickness=.18,dihedral=.16,tipSweep=.0}){
    const x0=side*rootX;
    const x1=side*(rootX+span);
    const topPts=[
      [x0,y+thickness/2,rootZ+chordRoot/2],
      [x0,y+thickness/2,rootZ-chordRoot/2],
      [x1,y+dihedral+thickness/2,tipZ+chordTip/2+tipSweep],
      [x1,y+dihedral+thickness/2,tipZ-chordTip/2+tipSweep]
    ];
    const botPts=topPts.map(p=>[p[0],p[1]-thickness,p[2]]);
    const positions=[...topPts.flat(),...botPts.flat()];
    const indices=[0,2,1,1,2,3,4,5,6,5,7,6,0,4,2,2,4,6,1,3,5,3,7,5,0,1,4,1,5,4,2,6,3,3,6,7];
    const normals=[];B.VertexData.ComputeNormals(positions,indices,normals);
    const mesh=new B.Mesh(name,scene);
    const data=new B.VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.applyToMesh(mesh);
    mesh.material=material;mesh.parent=parent;return mesh;
  }
  function wheelAssembly({x,z,r=.38,steer=false}){
    const legPivot=new B.TransformNode('GearLegPivot'+x+z,scene);
    legPivot.parent=root;legPivot.position.set(x,-.84,z);
    legPivot.rotation.z=Math.sign(x||1)*.12;
    const leg=cyl('Gear leg',[0,-.36,0],.048,.84,steel,[0,0,0],legPivot);
    const shock=cyl('Gear shock',[0,-.70,0],.032,.20,lightGrey,[0,0,0],legPivot);
    const axle=box('Axle',[0,-.82,0],[.24,.045,.045],steel,legPivot);
    const tyre=cyl('Tyre',[0,-.82,0],r,.19,rubber,[0,0,Math.PI/2],legPivot,28);
    const hub=cyl('Hub',[0,-.82,0],r*.44,.21,steel,[0,0,Math.PI/2],legPivot,28);
    let spat;
    if(!steer){
      spat=sphere('Wheel fairing',[0,-.77,.02],[r*1.05,r*.78,r*1.95],paint,legPivot,18);
      const cut=box('Spat cut',[0,-.93,.02],[r*2.1,r*.45,r*2.2],lightGrey,legPivot);cut.isVisible=false;
    }
    return {legPivot,leg,shock,axle,tyre,hub,spat};
  }

  // --- Fuselage ---
  sphere('Main fuselage',[0,.05,.2],[1.03,.96,6.3],paint);
  sphere('Cabin bulge',[0,.46,.7],[.95,.68,2.65],paint);
  sphere('Belly fairing',[0,-.36,.0],[.92,.54,4.8],paint);
  sphere('Nose section',[0,.03,3.95],[.70,.68,2.00],paint);
  sphere('Spinner mount fairing',[0,.06,4.88],[.28,.28,.52],steel);
  sphere('Tail cone',[0,.18,-4.28],[.46,.43,2.15],paint);
  sphere('Tail taper',[0,.36,-5.28],[.22,.23,.82],paint);
  box('Lower accent stripe',[0,-.12,1.55],[1.52,.14,5.55],accent);
  box('Fine aqua stripe',[0,-.03,1.76],[1.70,.05,4.7],accent2);
  box('Nose side panel',[0,.18,3.85],[1.07,.34,1.18],accent);
  box('Cabin roof strip',[0,.93,.38],[.46,.05,2.8],accent2);

  // Cabin / windows / interior
  sphere('Canopy glazing',[0,.70,.78],[.82,.48,2.75],glass,root,22);
  box('Front windshield frame',[0,.86,1.95],[.10,.50,.10],paint);
  box('Center windshield post',[0,.92,1.35],[.06,.58,.08],paint);
  box('Rear cabin frame',[0,.68,-.12],[.08,.60,.08],paint);
  const panel=box('Instrument panel',[0,.45,1.72],[.92,.32,.18],black);
  panel.rotation.x=.18;
  const glareShield=box('Glare shield',[0,.58,1.84],[.78,.08,.15],black);
  glareShield.rotation.x=.18;
  for(const side of [-1,1]){
    box('Seat '+side,[side*.24,.18,.57],[.32,.54,.38],black);
    box('Seat back '+side,[side*.24,.48,.34],[.32,.58,.12],black);
    box('Door window '+side,[side*.78,.58,.65],[.075,.48,1.55],glass);
    box('Rear quarter window '+side,[side*.74,.58,-.46],[.072,.38,.78],glass);
    box('Door frame '+side,[side*.82,.17,.54],[.03,.95,1.65],paint);
    box('Door handle '+side,[side*.85,.18,.95],[.04,.05,.10],steel);
    box('Nose intake detail '+side,[side*.34,-.06,4.12],[.12,.10,.82],black);
    box('Exhaust stack '+side,[side*.52,-.18,3.58],[.08,.07,.45],steel);
  }

  // --- Wings ---
  taperedBox('Wing center fairing L',-1,{span:5.20,rootZ:.26,tipZ:-.18,y:.95,chordRoot:1.76,chordTip:1.02,material:paint,rootX:.40,thickness:.17,dihedral:.14,tipSweep:-.06});
  taperedBox('Wing center fairing R',1,{span:5.20,rootZ:.26,tipZ:-.18,y:.95,chordRoot:1.76,chordTip:1.02,material:paint,rootX:.40,thickness:.17,dihedral:.14,tipSweep:-.06});
  box('Wing center section',[0,.96,.02],[1.25,.16,1.55],paint);
  box('Wing carry-through stripe',[0,1.05,-.02],[1.18,.03,1.50],accent2);

  // Tail surfaces
  taperedBox('Tailplane L',-1,{span:1.98,rootZ:-3.48,tipZ:-3.72,y:.49,chordRoot:.95,chordTip:.54,material:paint,rootX:.16,thickness:.11,dihedral:.04,tipSweep:-.03});
  taperedBox('Tailplane R',1,{span:1.98,rootZ:-3.48,tipZ:-3.72,y:.49,chordRoot:.95,chordTip:.54,material:paint,rootX:.16,thickness:.11,dihedral:.04,tipSweep:-.03});

  const fin=box('Vertical fin',[0,1.18,-3.54],[.14,1.86,1.12],paint);
  fin.rotation.x=-.30;
  box('Fin accent',[0,1.34,-3.66],[.16,.68,.26],accent);

  // Control surfaces pivots
  parts.elevators=[];parts.ailerons=[];parts.flaps=[];
  const rudderPivot=new B.TransformNode('RudderPivot',scene);rudderPivot.parent=root;rudderPivot.position.set(0,1.22,-3.96);
  const rudder=box('Rudder',[0,.28,-.06],[.10,1.05,.30],accent,rudderPivot);rudder.rotation.x=-.05;parts.rudder=rudderPivot;
  for(const side of [-1,1]){
    const elevPivot=new B.TransformNode('ElevatorPivot'+side,scene);elevPivot.parent=root;elevPivot.position.set(side*1.12,.54,-3.95);
    box('Elevator '+side,[0,0,-.08],[1.45,.07,.40],accent,elevPivot);
    parts.elevators.push(elevPivot);

    const ailPivot=new B.TransformNode('AileronPivot'+side,scene);ailPivot.parent=root;ailPivot.position.set(side*3.88,1.06,-.72);
    box('Aileron '+side,[0,0,-.08],[2.10,.06,.34],accent,ailPivot);
    parts.ailerons.push({pivot:ailPivot,side});

    const flapPivot=new B.TransformNode('FlapPivot'+side,scene);flapPivot.parent=root;flapPivot.position.set(side*1.98,1.02,-.64);
    box('Flap '+side,[0,0,-.11],[1.70,.085,.40],lightGrey,flapPivot);
    parts.flaps.push(flapPivot);

    const strut=new B.TransformNode('WingStrut'+side,scene);strut.parent=root;strut.position.set(side*1.42,.30,.02);
    strut.rotation.z=side*.56;strut.rotation.x=.05;
    cyl('Strut tube',[0,.0,0],.045,1.62,steel,[0,0,0],strut);

    const nav=sphere('Nav lamp '+side,[side*5.70,1.08,-.18],[.12,.11,.15],side<0?redLamp:greenLamp);
    const tipCap=sphere('Wingtip '+side,[side*5.50,1.10,-.12],[.24,.10,.46],paint);
    tipCap.rotationQuaternion=B.Quaternion.Identity();
    box('Landing light '+side,[side*4.72,.96,.54],[.24,.08,.18],glass);
  }

  // Propeller group
  const spinner=cyl('Spinner',[0,.04,5.18],.23,.56,steel,[Math.PI/2,0,0],root,28);
  spinner.rotation.z=Math.PI/2;
  const propellerPivot=new B.TransformNode('PropellerAxis',scene);
  propellerPivot.parent=root;propellerPivot.position.set(0,.04,5.15);
  for(let i=0;i<2;i++){
    const bladePivot=new B.TransformNode('BladePivot'+i,scene);bladePivot.parent=propellerPivot;bladePivot.rotation.z=i*Math.PI;
    const blade=box('Blade '+i,[0,1.0,0],[.14,1.92,.07],black,bladePivot);
    blade.rotation.z=-.08;
    const bladeTip=box('BladeTip '+i,[0,1.78,.005],[.16,.22,.08],accent2,bladePivot);
    bladeTip.rotation.z=-.08;
  }
  sphere('Propeller hub',[0,0,0],[.22,.22,.22],steel,propellerPivot);
  parts.propeller=propellerPivot;

  // Landing gear
  wheelAssembly({x:0,z:2.80,r:.29,steer:true});
  wheelAssembly({x:-1.34,z:-1.12,r:.37});
  wheelAssembly({x:1.34,z:-1.12,r:.37});

  // Antenna and pitot tube
  cyl('Antenna mast',[0,.98,-.75],.014,.30,black,null,root,10);
  const pitot=box('Pitot tube',[5.18,1.01,.22],[.55,.03,.03],steel);
  pitot.rotation.z=.08;

  // Registration labels
  const registration=new B.DynamicTexture('RegistrationTexture',{width:512,height:128},scene,false);
  registration.hasAlpha=true;
  registration.drawText('AT • 01',28,88,'bold 74px Arial','#eff9ff','transparent',true);
  const textMat=new B.StandardMaterial('Registration',scene);
  textMat.diffuseTexture=registration;textMat.opacityTexture=registration;textMat.emissiveColor=new B.Color3(.35,.70,.90);textMat.backFaceCulling=false;
  for(const side of [-1,1]){
    const plate=B.MeshBuilder.CreatePlane('Registration '+side,{width:1.55,height:.34},scene);
    plate.parent=root;plate.position.set(side*.92,-.03,-1.45);plate.rotation.y=side>0?Math.PI/2:-Math.PI/2;plate.material=textMat;
  }

  // Gentle smoothing via child mesh settings
  root.getChildMeshes().forEach((mesh)=>{
    mesh.receiveShadows=true;
    mesh.isPickable=false;
  });

  function update(control,dt){
    parts.propeller.rotation.z+=dt*(10+control.throttle*175);
    parts.elevators.forEach((p)=>{p.rotation.x=-control.pitch*.32;});
    parts.ailerons.forEach(({pivot,side})=>{pivot.rotation.x=side*control.roll*.30;});
    parts.flaps.forEach((p)=>{p.rotation.x=-control.flap*Math.PI/180*.85;});
    parts.rudder.rotation.y=control.yaw*.32;
  }

  return {root,update,parts};
}
