export function createWorld(scene,mode='flight'){
  const B=window.BABYLON;
  const h=(x,z)=>{
    const outer=Math.max(0,Math.abs(x)-180);
    const airportFlat=Math.max(0,Math.min(1,outer/500));
    const ridges=(9*Math.sin(x*.0028+z*.0017)**2+12*Math.sin(x*.0013-z*.0025)**2+8*Math.sin(z*.0031)**2)*airportFlat;
    return ridges+(.8*Math.sin(x*.02)*Math.cos(z*.017))*airportFlat;
  };
  scene.clearColor=new B.Color4(.58,.75,.87,1);
  scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.00023;scene.fogColor=new B.Color3(.70,.82,.91);
  const hemi=new B.HemisphericLight('ambientSky',new B.Vector3(0,1,0),scene);hemi.intensity=.97;
  hemi.groundColor=new B.Color3(.33,.42,.37);
  const sun=new B.DirectionalLight('warmSun',new B.Vector3(-.65,-.9,.3),scene);
  sun.intensity=2.25;sun.position=new B.Vector3(250,550,-400);
  const shadow=new B.ShadowGenerator(1024,sun);
  shadow.useBlurExponentialShadowMap=true;shadow.blurKernel=15;
  // Gradient sky dome shader, avoids any external texture downloads.
  B.Effect.ShadersStore.aeroSkyVertexShader=`precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 vDir;void main(){vDir=position;gl_Position=worldViewProjection*vec4(position,1.0);}`;
  B.Effect.ShadersStore.aeroSkyFragmentShader=`precision highp float;varying vec3 vDir;uniform vec3 zenith;uniform vec3 horizon;void main(){vec3 n=normalize(vDir);float t=smoothstep(-0.28,0.85,n.y);vec3 c=mix(horizon,zenith,t);float glow=pow(max(dot(n,normalize(vec3(-.48,.60,.42))),0.0),30.0);c+=vec3(.19,.13,.065)*glow;gl_FragColor=vec4(c,1.0);}`;
  const sky=B.MeshBuilder.CreateSphere('Atmospheric sky gradient',{diameter:6800,segments:16,sideOrientation:B.Mesh.BACKSIDE},scene);
  const skyMat=new B.ShaderMaterial('Sky shader',scene,{vertex:'aeroSky',fragment:'aeroSky'},{attributes:['position'],uniforms:['worldViewProjection','zenith','horizon']});
  skyMat.backFaceCulling=false;skyMat.disableDepthWrite=true;
  skyMat.setColor3('zenith',new B.Color3(.14,.41,.70));skyMat.setColor3('horizon',new B.Color3(.80,.88,.94));
  sky.material=skyMat;sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;
  const grass=new B.StandardMaterial('Grassy plain',scene);grass.diffuseColor=new B.Color3(.24,.42,.26);grass.specularColor=B.Color3.Black();
  const terrain=B.MeshBuilder.CreateGround('Landscape 5km',{width:5300,height:5300,subdivisions:90,updatable:true},scene);
  const positions=terrain.getVerticesData(B.VertexBuffer.PositionKind);
  const colors=[];
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i],z=positions[i+2],y=h(x,z);positions[i+1]=y;
    const variation=.86+.12*Math.sin(x*.017+z*.031)*Math.cos(x*.043-z*.012);
    colors.push(.27*variation,.45*variation,.24*variation,1);
  }
  terrain.updateVerticesData(B.VertexBuffer.PositionKind,positions);
  terrain.setVerticesData(B.VertexBuffer.ColorKind,colors);
  const indices=terrain.getIndices();const norms=[];
  B.VertexData.ComputeNormals(positions,indices,norms);terrain.setVerticesData(B.VertexBuffer.NormalKind,norms);
  grass.useVertexColors=true;terrain.material=grass;terrain.receiveShadows=true;
  const asphalt=new B.StandardMaterial('Asphalt runway',scene);
  asphalt.diffuseColor=B.Color3.FromHexString('#343c47');asphalt.specularColor=new B.Color3(.04,.04,.04);
  const paint=new B.StandardMaterial('White airfield markings',scene);paint.diffuseColor=new B.Color3(.92,.95,.96);paint.emissiveColor=new B.Color3(.08,.08,.08);
  const yellow=new B.StandardMaterial('Taxiway yellow',scene);yellow.diffuseColor=B.Color3.FromHexString('#eacb73');
  const runway=B.MeshBuilder.CreateGround('Primary runway',{width:47,height:1710},scene);
  runway.position.set(0,.105,380);runway.material=asphalt;runway.receiveShadows=true;
  const shoulder=B.MeshBuilder.CreateGround('Taxiway apron',{width:105,height:180},scene);
  shoulder.position.set(120,.12,-80);shoulder.material=asphalt;
  function stripe(name,x,z,width,depth,material=paint){
    const s=B.MeshBuilder.CreateGround(name,{width,height:depth},scene);s.position.set(x,.128,z);s.material=material;return s;
  }
  for(let z=-440;z<1210;z+=39)stripe('Centerline runway marker',0,z,1.2,15);
  for(let z=-465;z<1230;z+=18){stripe('Left runway shoulder',-22,z,.35,15);stripe('Right runway shoulder',22,z,.35,15);}
  for(const z of [-436,1183])for(const sign of [-1,1])for(let i=0;i<4;i++){
    stripe('Runway threshold piano-key',sign*(3+i*4),z,2.4,26);
  }
  // Aircraft runway guidance lights and taxiway strip.
  const lightsMat=new B.StandardMaterial('Runway light',scene);lightsMat.emissiveColor=new B.Color3(.62,.91,1);lightsMat.disableLighting=true;
  for(let z=-440;z<1210;z+=70)for(const x of [-25.4,25.4]){
    const bulb=B.MeshBuilder.CreateSphere('Runway edge light',{diameter:.45,segments:6},scene);
    bulb.position.set(x,.35,z);bulb.material=lightsMat;
  }
  const taxi=B.MeshBuilder.CreateGround('Taxiway guide',{width:4,height:160},scene);taxi.position.set(75,.134,-80);taxi.material=yellow;
  // Airport buildings.
  const hangarMat=new B.StandardMaterial('Hangar',scene);hangarMat.diffuseColor=B.Color3.FromHexString('#b9cbd2');
  const roofMat=new B.StandardMaterial('Industrial roof',scene);roofMat.diffuseColor=B.Color3.FromHexString('#4e7085');
  const glassMat=new B.StandardMaterial('Tower glass',scene);glassMat.diffuseColor=B.Color3.FromHexString('#274c62');
  function block(name,pos,size,m){const obj=B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);obj.position.set(...pos);obj.material=m;obj.receiveShadows=true;return obj;}
  block('Hangar One',[156,10,-95],[68,20,46],hangarMat);block('Hangar One roof',[156,21,-95],[72,2,50],roofMat);
  block('Hangar Two',[166,7,12],[48,14,35],hangarMat);block('Hangar Two roof',[166,15,12],[52,2,39],roofMat);
  block('Air traffic control tower',[105,15,120],[14,30,14],hangarMat);
  block('ATC glass cabin',[105,32,120],[23,8,23],glassMat);
  block('ATC roof',[105,37,120],[25,1.5,25],roofMat);
  // Distant shrubs and trees (low poly, repeated meshes).
  const trunkMat=new B.StandardMaterial('Tree trunk',scene);trunkMat.diffuseColor=new B.Color3(.28,.28,.20);
  const leavesMat=new B.StandardMaterial('Tree canopy',scene);leavesMat.diffuseColor=new B.Color3(.14,.35,.22);
  const trunkBase=B.MeshBuilder.CreateCylinder('treeTrunkBase',{height:7,diameterTop:.9,diameterBottom:1.2,tessellation:5},scene);trunkBase.material=trunkMat;
  const canopyBase=B.MeshBuilder.CreateSphere('treeCanopyBase',{diameter:7,segments:5},scene);canopyBase.material=leavesMat;
  let seed=12345;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<135;i++){
    const x=(rand()>.5?1:-1)*(115+rand()*2100),z=-700+rand()*2600;
    const alt=h(x,z);const size=.6+rand()*1.35;
    const tr=trunkBase.createInstance('tree '+i);tr.position.set(x,alt+3.5*size,z);tr.scaling.set(size,size,size);
    const leaf=canopyBase.createInstance('canopy '+i);leaf.position.set(x,alt+7.7*size,z);leaf.scaling.set(size,size,size);
  }
  trunkBase.position.set(0,-10000,0);canopyBase.position.set(0,-10000,0);
  // Soft volumetric-style clusters assembled from transparent ellipsoids.
  const cloudMat=new B.StandardMaterial('Soft cloud',scene);
  cloudMat.diffuseColor=new B.Color3(.98,.99,1);cloudMat.emissiveColor=new B.Color3(.16,.17,.17);
  cloudMat.alpha=.63;cloudMat.transparencyMode=B.Material.MATERIAL_ALPHABLEND;cloudMat.backFaceCulling=false;
  const clouds=[];
  for(let i=0;i<30;i++){
    const group=new B.TransformNode('Cloud bank '+i,scene);
    group.position.set((rand()-.5)*3500,190+rand()*430,(rand()-.5)*3200);
    const parts=3+Math.floor(rand()*3);
    for(let j=0;j<parts;j++){
      const o=B.MeshBuilder.CreateSphere('Cloud volume',{diameter:1,segments:8},scene);
      o.position.set((j-(parts-1)/2)*30,rand()*8,rand()*15);o.scaling.set(53+rand()*34,14+rand()*8,27+rand()*13);
      o.parent=group;o.material=cloudMat;
    }
    clouds.push(group);
  }
  function setWeather(type){
    if(type==='storm'){
      scene.fogDensity=.00072;skyMat.setColor3('zenith',new B.Color3(.16,.24,.35));
      skyMat.setColor3('horizon',new B.Color3(.43,.51,.61));sun.intensity=.8;
      cloudMat.diffuseColor=new B.Color3(.54,.60,.67);
    }else if(type==='sunset'){
      scene.fogDensity=.00031;skyMat.setColor3('zenith',new B.Color3(.17,.28,.53));
      skyMat.setColor3('horizon',new B.Color3(.98,.58,.37));sun.intensity=1.3;
      cloudMat.diffuseColor=new B.Color3(1,.76,.59);
    }else{
      scene.fogDensity=.00023;skyMat.setColor3('zenith',new B.Color3(.14,.41,.70));
      skyMat.setColor3('horizon',new B.Color3(.80,.88,.94));sun.intensity=2.25;
      cloudMat.diffuseColor=new B.Color3(.98,.99,1);
    }
  }
  function update(dt,time){for(const cloud of clouds)cloud.position.x+=dt*.9;}
  return {shadow,sun,terrain,clouds,setWeather,update};
}
