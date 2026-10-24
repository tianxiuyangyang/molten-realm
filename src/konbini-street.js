import * as THREE from 'three';
import {
  PI,addBox,addRounded,addCylinder,addPlane,addGroundPlane,addTube,addGlow,basic,standard,toon,makeRng,glowTexture
} from './konbini-utils.js?v=4';

const HALF=13.6;
const KERB=.14;
const ROAD_FAR=8.15;
const ROAD_NEAR=.62;
const SIDEWALK_FAR=10.55;
const CROSS_X=-6.3;

function roadRibbon(parent,mats){
  const asphalt=addGroundPlane(parent,27.05,27.05,[0,.025,0],mats.asphalt,{name:'diorama-asphalt'});
  asphalt.receiveShadow=true;
  // Main street surface is slightly glossier than the alley.
  addGroundPlane(parent,27.1,.16,[0,.058,ROAD_NEAR+.02],mats.curb,{name:'gutter-near'});
  addGroundPlane(parent,27.1,.18,[0,.057,ROAD_FAR-.03],mats.curb,{name:'gutter-far'});
}

function buildBase(parent,mats){
  const base=new THREE.Group();base.name='diorama-base';parent.add(base);
  addRounded(base,[27.8,1.4,27.8],[0,-.72,0],mats.base,{radius:.18,outline:.045,name:'base-plinth',castShadow:true,receiveShadow:true});
  addRounded(base,[28.1,.28,28.1],[0,-1.52,0],mats.baseDark,{radius:.12,outline:.03,name:'base-foot',castShadow:true});
  // A brass-dark rim and a cool wet highlight around the top lip.
  addBox(base,[27.9,.13,27.9],[0,-.035,0],mats.baseRim,{outline:.02,name:'base-rim'});
  const rimMat=basic(0x7be1d4);
  addBox(base,[.035,.022,26.8],[-13.92,-.13,0],rimMat,{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[.035,.022,26.8],[13.92,-.13,0],rimMat,{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[26.8,.022,.035],[0,-.13,13.92],rimMat,{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[26.8,.022,.035],[0,-.13,-13.92],rimMat,{outline:0,castShadow:false,receiveShadow:false});
  // Corner caps.
  for(const x of [-13.8,13.8])for(const z of [-13.8,13.8]){
    addBox(base,[.4,.2,.4],[x,-.11,z],mats.metalWarm,{outline:.015,castShadow:false});
    addCylinder(base,[.055,.055],.06,[x,.015,z],mats.metalWarm,{segments:10,outline:0,castShadow:false});
  }
  // Front nameplate, a physical part of the collectible base.
  addBox(base,[5.55,1.26,.1],[0,-.75,13.91],mats.metalDark,{outline:.03,castShadow:false});
  addBox(base,[5.78,1.42,.05],[0,-.75,13.975],mats.metalWarm,{outline:.01,castShadow:false});
  addPlane(base,5.34,1.08,[0,-.75,14.005],mats.plaque,{name:'diorama-plaque'}).renderOrder=4;
  addBox(base,[4.9,.022,.02],[0,-.09,14.01],mats.neonCyan,{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[.032,.42,.02],[-2.68,-.75,14.01],mats.neonPink,{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[.032,.42,.02],[2.68,-.75,14.01],mats.neonPink,{outline:0,castShadow:false,receiveShadow:false});
  // Warm / cool underglow, kept faint so the object feels suspended.
  addBox(base,[26.7,.035,.02],[0,-1.3,13.9],basic(0x2e7980),{outline:0,castShadow:false,receiveShadow:false});
  addBox(base,[.02,.035,26.7],[13.9,-1.3,0],basic(0x9b5f6e),{outline:0,castShadow:false,receiveShadow:false});
  return base;
}

function buildPavements(parent,mats){
  const walks=new THREE.Group();walks.name='sidewalks';parent.add(walks);
  // Near sidewalk, split around the alley mouth.
  addBox(walks,[16.25,KERB,2.95],[-5.25,KERB/2,-.87],mats.paving,{outline:0,rotate:0,rotation:[0,0,0],receiveShadow:true});
  addBox(walks,[6.15,KERB,2.95],[10.35,KERB/2,-.87],mats.paving,{outline:0,receiveShadow:true});
  addBox(walks,[.55,KERB,2.95],[3.22,KERB/2,-.87],mats.pavingLight,{outline:0,receiveShadow:true});
  addBox(walks,[.55,KERB,2.95],[7.18,KERB/2,-.87],mats.pavingLight,{outline:0,receiveShadow:true});
  // Alley apron and side walk.
  addBox(walks,[.72,KERB,2.1],[3.31,KERB/2,-1.18],mats.pavingLight,{outline:0,receiveShadow:true});
  addBox(walks,[.65,KERB,8.25],[7.27,KERB/2,-6.2],mats.paving,{outline:0,receiveShadow:true});
  addBox(walks,[.38,KERB,8.05],[3.16,KERB/2,-6.2],mats.pavingLight,{outline:0,receiveShadow:true});
  // Opposite sidewalk and a low planted edge at the front of the diorama.
  addBox(walks,[27.2,KERB,2.4],[0,KERB/2,9.35],mats.paving,{outline:0,receiveShadow:true});
  addBox(walks,[27.2,.32,.6],[0,.16,10.85],mats.curb,{outline:.015,receiveShadow:true});
  addGroundPlane(walks,27.2,.34,[0,.33,11.35],mats.paving,{name:'verge'});
  // Curbs. The alley mouth is dropped for vehicles.
  const curbMat=mats.curb;
  addBox(walks,[16.5,.19,.22],[-5.35,.095,ROAD_NEAR-.02],curbMat,{outline:.014});
  addBox(walks,[6.2,.19,.22],[10.4,.095,ROAD_NEAR-.02],curbMat,{outline:.014});
  addBox(walks,[27.15,.19,.23],[0,.095,ROAD_FAR],curbMat,{outline:.014});
  addBox(walks,[.32,.16,8.45],[3.15,.08,-6.25],curbMat,{outline:.012});
  addBox(walks,[.3,.16,8.45],[7.35,.08,-6.25],curbMat,{outline:.012});
  // Tactile paving at the crossing mouth.
  for(let i=0;i<7;i++){
    addBox(walks,[3.5,.022,.085],[CROSS_X,.157,.0+i*.105],mats.paintYellow,{outline:0,castShadow:false,receiveShadow:false});
  }
  addBox(walks,[.36,.024,1.3],[CROSS_X+1.9,.157,.1],mats.paintYellow,{outline:0,castShadow:false,receiveShadow:false});
  // Storm drains and little utility covers.
  for(const x of [-10.8,-2.2,4.8,10.5]){
    addBox(walks,[.85,.018,.3],[x,.06,ROAD_NEAR+.015],mats.metalDark,{outline:.008,castShadow:false});
    for(let i=0;i<5;i++)addBox(walks,[.07,.014,.24],[x-.32+i*.16,.073,ROAD_NEAR+.015],mats.metal,{outline:0,castShadow:false});
  }
  for(const x of [-12.1,2.4,11.2]){
    addBox(walks,[.85,.018,.3],[x,.06,ROAD_FAR-.045],mats.metalDark,{outline:.008,castShadow:false});
    for(let i=0;i<5;i++)addBox(walks,[.07,.014,.24],[x-.32+i*.16,.073,ROAD_FAR-.045],mats.metal,{outline:0,castShadow:false});
  }
  // Alley drain channel and cover.
  addBox(walks,[.1,.02,7.3],[3.53,.055,-6.1],mats.metalDark,{outline:0,castShadow:false});
  for(let i=0;i<10;i++)addBox(walks,[.07,.015,.25],[3.53,.068,-9.5+i*.65],mats.metal,{outline:0,castShadow:false});
  addCylinder(walks,[.42,.42],.035,[6.3,.065,5.3],mats.metalDark,{segments:28,outline:0,castShadow:false});
  for(let i=0;i<4;i++)addCylinder(walks,[.34-i*.06,.34-i*.06],.006,[6.3,.086,5.3],mats.metal,{segments:28,outline:0,castShadow:false});
  return walks;
}

function buildMarkings(parent,mats){
  const group=new THREE.Group();group.name='road-markings';parent.add(group);
  const paint=mats.paintWhite;
  // Reflective zebra crossing: long bars parallel to traffic, a ladder up the wet road.
  for(let i=0;i<8;i++){
    const z=1.18+i*.78;
    addBox(group,[5.1,.024,.48],[CROSS_X,.068,z],paint,{outline:0,castShadow:false,receiveShadow:false});
  }
  // Dashed centre line, with a clear gap at the crossing.
  for(let i=0;i<18;i++){
    const x=-12.4+i*1.55;
    if(x>-9.4&&x<-3.1)continue;
    addBox(group,[.92,.02,.1],[x,.061,4.38],paint,{outline:0,castShadow:false,receiveShadow:false});
  }
  // Parking bay in front of the shop.
  addBox(group,[.09,.024,3.0],[-1.3,.066,2.32],paint,{outline:0,castShadow:false,receiveShadow:false});
  addBox(group,[.09,.024,3.0],[1.75,.066,2.32],paint,{outline:0,castShadow:false,receiveShadow:false});
  addBox(group,[3.14,.024,.09],[.225,.066,3.82],paint,{outline:0,castShadow:false,receiveShadow:false});
  addBox(group,[3.14,.024,.09],[.225,.066,.84],paint,{outline:0,castShadow:false,receiveShadow:false});
  const p=addGroundPlane(group,1.35,.8,[.24,.071,2.9],mats.roadP,{name:'parking-p-mark'});
  p.renderOrder=2;
  const tomare=addGroundPlane(group,3.5,1.55,[5.25,.072,5.65],mats.roadTomare,{name:'road-tomare'});
  tomare.renderOrder=2;
  // Lane edge dashes, separated at the crossing.
  for(let i=0;i<12;i++){
    const x=-12.4+i*2.25;
    if(x>-8.5&&x<-3.3)continue;
    addBox(group,[1.1,.018,.07],[x,.062,1.05],paint,{outline:0,castShadow:false,receiveShadow:false});
    addBox(group,[1.1,.018,.07],[x,.062,7.72],paint,{outline:0,castShadow:false,receiveShadow:false});
  }
  // Alley stop line and edge.
  addBox(group,[2.85,.02,.1],[5.1,.064,-1.05],paint,{outline:0,castShadow:false,receiveShadow:false});
  // Reflective road studs.
  for(let i=0;i<7;i++){
    addBox(group,[.07,.025,.14],[-12.0+i*2.2,.075,4.38],mats.reflector,{outline:0,castShadow:false,receiveShadow:false});
  }
  return group;
}

function buildPuddles(parent,mats){
  const group=new THREE.Group();group.name='puddles';parent.add(group);
  const rng=makeRng(4902);
  const puddleMat=standard(0x12232b,{roughness:.06,metalness:.72,transparent:true,opacity:.52});
  const spots=[
    [-8.8,2.1,1.4,.42,.1],[-4.7,5.7,1.9,.58,-.15],[-2.2,1.1,1.0,.3,.6],
    [3.1,6.4,1.4,.44,.1],[8.65,3.15,1.7,.5,-.2],[3.9,-2.8,.8,.3,.2],
    [5.5,-7.8,1.2,.4,-.1],[7.9,6.7,.8,.25,.1],[.6,9.8,1.9,.5,.05],
    [-11.9,9.55,1.35,.45,-.3]
  ];
  for(const [x,z,sx,sz,rot] of spots){
    const mesh=addGroundPlane(group,sx,sz,[x,.074,z],puddleMat,{rotationY:rot,name:'puddle'});
    mesh.receiveShadow=false;
  }
  // Tiny wet leaf litter, instanced.
  const leafGeo=new THREE.PlaneGeometry(.11,.055);
  const leafMat=new THREE.MeshBasicMaterial({color:0x788a5f,transparent:true,opacity:.55,side:THREE.DoubleSide});
  const leaves=new THREE.InstancedMesh(leafGeo,leafMat,44);
  const dummy=new THREE.Object3D();
  for(let i=0;i<44;i++){
    const x=(rng()-.5)*24;
    const z=1.2+rng()*8.6;
    dummy.position.set(x,.08,z);
    dummy.rotation.set(-PI/2,0,rng()*PI);
    dummy.scale.setScalar(.6+rng()*.7);
    dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  }
  leaves.instanceMatrix.needsUpdate=true;
  group.add(leaves);
  return group;
}

function tubeBetween(parent,a,b,radius,material,{outline=0,segments=8}={}){
  const start=new THREE.Vector3(...a);
  const end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  const length=delta.length();
  const geo=new THREE.CylinderGeometry(radius,radius,length,segments,1,false);
  const mesh=new THREE.Mesh(geo,material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;
  parent.add(mesh);
  if(outline>0){
    const shell=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x0c1118,side:THREE.BackSide}));
    shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.setScalar(1+outline);
    shell.castShadow=false;parent.add(shell);
  }
  return mesh;
}

function buildGuardrail(parent,mats){
  const group=new THREE.Group();group.name='corner-guardrail';parent.add(group);
  const railMat=mats.guardrail;
  const sections=[
    {x0:8.25,x1:13.25,z:.39},
    {x0:-13.2,x1:-8.3,z:8.35},
    {x0:-2.6,x1:6.9,z:8.35}
  ];
  for(const section of sections){
    const length=section.x1-section.x0;
    const posts=Math.max(2,Math.round(length/1.55)+1);
    for(let i=0;i<posts;i++){
      const x=section.x0+length*i/(posts-1);
      addCylinder(group,[.045,.055],.78,[x,.39+.14,section.z],railMat,{segments:10,outline:.009});
      addCylinder(group,[.085,.09],.08,[x,.79,section.z],railMat,{segments:10,outline:0,castShadow:false});
      addBox(group,[.1,.13,.022],[x,.52,section.z-.055],mats.reflector,{outline:0,castShadow:false});
    }
    addBox(group,[length,.065,.06],[(section.x0+section.x1)/2,.73,section.z],railMat,{outline:.008});
    addBox(group,[length,.04,.045],[(section.x0+section.x1)/2,.45,section.z],railMat,{outline:.006});
    for(let i=0;i<posts-1;i++){
      addCylinder(group,[.03,.03],.3,[section.x0+length*(i+.5)/(posts-1),.58,section.z],railMat,{segments:8,outline:0,castShadow:false,rotation:[0,0,PI*.05]});
    }
  }
  // A rounded corner return along the alley mouth.
  addCylinder(group,[.05,.055],.78,[7.95,.53,-.3],railMat,{segments:10,outline:.009});
  addBox(group,[.1,.06,1.3],[7.95,.73,-.92],railMat,{outline:.008});
  addCylinder(group,[.045,.05],.76,[7.95,.53,-1.5],railMat,{segments:10,outline:.009});
  // Diagonal brace near the opening.
  tubeBetween(group,[7.95,.16,-.1],[7.95,.7,-1.55],.025,railMat,{segments:8});
  return group;
}

function buildMarqueeStreetlamp(parent,mats,lights){
  const pole=new THREE.Group();pole.name='utility-pole';parent.add(pole);
  const px=13.15,pz=-1.85;
  addCylinder(pole,[.155,.255],10.2,[px,5.25,pz],mats.concrete,{segments:18,outline:.025});
  addCylinder(pole,[.37,.44],.2,[px,.25,pz],mats.concreteDark,{segments:16,outline:.02});
  for(let i=0;i<4;i++){
    addCylinder(pole,[.245,.255],.045,[px,.72+i*.19,pz],mats.metalDark,{segments:16,outline:0,castShadow:false});
  }
  addCylinder(pole,[.268,.268],.36,[px,.82,pz],mats.warning,{segments:16,outline:.008});
  addCylinder(pole,[.268,.268],.36,[px,1.35,pz],mats.warning,{segments:16,outline:.008});
  addCylinder(pole,[.24,.245],.24,[px,1.1,pz],mats.metalDark,{segments:16,outline:0,castShadow:false});
  // Crossarms.
  for(const [y,rot] of [[8.95,0],[9.55,PI/2]]){
    addBox(pole,[2.35,.1,.12],[px,y,pz],mats.metal,{outline:.012,rotation:[0,rot,0]});
    for(const offset of [-.85,.85]){
      const ox=rot===0?offset:0,oz=rot===0?0:offset;
      addCylinder(pole,[.065,.085],.17,[px+ox,y+.15,pz+oz],mats.insulator,{segments:10,outline:.006});
    }
  }
  // Transformers and switches.
  for(const [x,z] of [[px+.05,pz-.42],[px+.42,pz+.02]]){
    addCylinder(pole,[.27,.27],1.05,[x,6.8,z],mats.metal,{segments:14,outline:.018});
    addCylinder(pole,[.29,.29],.09,[x,7.36,z],mats.metalDark,{segments:14,outline:.008});
    addCylinder(pole,[.29,.29],.09,[x,6.25,z],mats.metalDark,{segments:14,outline:.008});
    addBox(pole,[.12,.16,.12],[x,6.98,z+.24],mats.metalDark,{outline:.008,castShadow:false});
  }
  addBox(pole,[.19,.74,.3],[px-.15,5.4,pz+.05],mats.metalDark,{outline:.014});
  addBox(pole,[.13,.22,.16],[px-.16,5.02,pz+.05],mats.metal,{outline:0,castShadow:false});
  addCylinder(pole,[.03,.03],3.4,[px+.24,3.15,pz-.02],mats.metal,{segments:6,outline:0});
  // Climbing pegs.
  for(let i=0;i<7;i++){
    const y=2.7+i*.52;
    const side=i%2?-.2:.2;
    addBox(pole,[.34,.035,.035],[px+side,y,pz],mats.metal,{outline:0,castShadow:false});
  }
  // Street name and address plates.
  addBox(pole,[.12,.5,.86],[px-.26,3.35,pz],mats.metalDark,{outline:.01,castShadow:false,rotation:[0,0,0]});
  addPlane(pole,.82,.5,[px-.325,3.35,pz+.01],mats.addressSign,{name:'address-plate'});
  addPlane(pole,.96,.76,[px-.33,4.05,pz+.02],mats.streetSign,{name:'street-direction'});
  addPlane(pole,.65,.6,[px-.33,2.45,pz+.02],mats.stopSign,{name:'stop-sign'});
  // Lamp arm, a lazy curve reaching over the lane toward the shop corner.
  addTube(pole,[[px,8.0,pz],[12.15,8.18,pz+.85],[11.25,8.06,pz+1.65],[10.68,7.99,pz+2.05]],.055,mats.metalDark,{segments:24,radial:6});
  addBox(pole,[.98,.14,.34],[10.64,7.93,pz+2.07],mats.metalDark,{outline:.015,rotation:[0,.3,-.045]});
  addBox(pole,[.72,.03,.2],[10.64,7.855,pz+2.07],basic(0xffa64f),{outline:0,castShadow:false,rotation:[0,.3,-.045]});
  addBox(pole,[.4,.015,.08],[px+.06,8.06,pz+.06],mats.metal,{outline:0,castShadow:false});
  addBox(pole,[.16,.48,.16],[px-.02,7.55,pz+.1],mats.metalDark,{outline:.01});
  addGlow(pole,{color:0xff9845,size:1.5,opacity:.24,position:[10.64,7.77,pz+2.06]});
  addGlow(pole,{color:0xffc078,size:.34,opacity:.6,position:[10.64,7.84,pz+2.06]});
  const lamp=new THREE.PointLight(0xff9d4c,88,16,2);
  lamp.position.set(10.64,7.35,pz+2.07);
  lamp.castShadow=false;
  pole.add(lamp);
  const spot=new THREE.SpotLight(0xffa055,58,17,Math.PI*.32,.92,1.8);
  spot.position.set(10.64,7.35,pz+2.07);
  spot.target.position.set(8.5,0,4.2);
  pole.add(spot,spot.target);
  // A restrained cone of warm drizzle under the lamp.
  const coneMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uColor:{value:new THREE.Color(0xffa45d)},uTime:{value:0}},
    vertexShader:`varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormalW;
      void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormalW=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormalW;
      void main(){
        float vertical=pow(clamp(vUv.y,0.0,1.0),1.5);
        vec3 viewDir=normalize(cameraPosition-vWorld);
        float fres=pow(1.0-abs(dot(normalize(vNormalW),viewDir)),1.6);
        float weather=.82+.18*sin(vUv.x*34.0+uTime*.35)+.08*sin(vUv.x*71.0-uTime*.24);
        float alpha=(.012+vertical*.12)*fres*weather;
        if(alpha<.001)discard;
        gl_FragColor=vec4(uColor,alpha);
      }`
  });
  const lampCone=new THREE.Mesh(new THREE.ConeGeometry(3.5,6.7,36,1,true),coneMat);
  lampCone.position.set(10.64,4.62,pz+2.07);
  lampCone.name='streetlamp-volume';
  lampCone.renderOrder=6;
  pole.add(lampCone);
  lights.push(lamp,spot);
  return pole;
}

function catenary(a,b,sag,segments=26){
  const points=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments;
    const x=a[0]+(b[0]-a[0])*t;
    const z=a[2]+(b[2]-a[2])*t;
    const linear=a[1]+(b[1]-a[1])*t;
    const y=linear-Math.sin(t*PI)*sag;
    points.push([x,y,z]);
  }
  return points;
}

function buildWires(parent,lights){
  const group=new THREE.Group();group.name='overhead-wires';parent.add(group);
  const pole=[13.15,9.15,-1.85];
  const spans=[
    {a:pole,b:[-13.2,8.65,-.8],sag:1.15,radius:.02},
    {a:[13.15,9.55,-1.85],b:[-13.0,9.1,-.9],sag:1.05,radius:.014},
    {a:[13.0,9.0,-1.85],b:[-12.6,8.2,2.6],sag:1.2,radius:.012},
    {a:[13.15,8.95,-1.85],b:[13.45,8.4,4.5],sag:.5,radius:.012},
    {a:[13.0,8.7,-1.85],b:[7.85,7.35,-6.2],sag:.65,radius:.012},
    {a:[13.15,8.6,-1.85],b:[-9.5,7.6,-11.1],sag:.95,radius:.009}
  ];
  const linePositions=[];
  spans.forEach((span,index)=>{
    if(index<2){
      addTube(group,catenary(span.a,span.b,span.sag,34),span.radius,new THREE.MeshStandardMaterial({color:0x1c242f,roughness:.85,metalness:.1}),{segments:34,radial:4});
    }else{
      const points=catenary(span.a,span.b,span.sag,28);
      for(let i=0;i<points.length-1;i++){
        linePositions.push(...points[i],...points[i+1]);
      }
    }
  });
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));
  const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x2a3542,transparent:true,opacity:.86}));
  group.add(lines);
  // Insulator drops from pole.
  for(let i=0;i<4;i++){
    const x=12.3+i*.5;
    addCylinder(group,[.018,.018],.45,[x,8.7,-1.85],new THREE.MeshStandardMaterial({color:0x202b35,roughness:.8}),{segments:5,outline:0,castShadow:false});
  }
  return group;
}

function buildSignsAndParking(parent,mats){
  const group=new THREE.Group();group.name='street-signs';parent.add(group);
  // Parking sign.
  addCylinder(group,[.035,.04],2.2,[1.7,1.25,.55],mats.metal,{segments:8,outline:.006});
  addPlane(group,.56,.56,[1.7,2.22,.575],mats.parkingSign,{name:'parking-sign'});
  addBox(group,[.64,.64,.03],[1.7,2.22,.56],mats.metalDark,{outline:.01,castShadow:false});
  addCylinder(group,[.07,.085],.07,[1.7,.27,.55],mats.metalDark,{segments:10,outline:0});
  // Low guard post reflectors at the parking bay.
  for(const x of [-1.45,1.92]){
    addCylinder(group,[.03,.035],.83,[x,.55,.45],mats.metal,{segments:8,outline:.005,castShadow:false});
    addBox(group,[.09,.11,.025],[x,.75,.425],mats.reflector,{outline:0,castShadow:false});
  }
  // A frame sign outside the shop is built in props; leave the curb post here.
  // Street direction arrow on the far sidewalk.
  addBox(group,[1.6,.035,.035],[5.1,2.3,10.95],mats.metalDark,{outline:0,castShadow:false});
  addBox(group,[.05,2.1,.05],[5.1,1.2,10.95],mats.metal,{outline:0,castShadow:false});
  addBox(group,[1.15,.26,.04],[5.15,2.33,10.92],mats.streetSign,{outline:.01,castShadow:false});
  return group;
}

function buildTree(parent,mats){
  const tree=new THREE.Group();tree.name='street-tree';parent.add(tree);
  const x=-11.45,z=9.85;
  addBox(tree,[.85,.4,.85],[x,.34,z],mats.planter,{outline:.02});
  addBox(tree,[.7,.06,.7],[x,.54,z],mats.soil,{outline:0,receiveShadow:true});
  addCylinder(tree,[.15,.23],2.4,[x,1.8,z],mats.bark,{segments:9,outline:.014});
  const branches=[[[x,2.8,z],[x-.65,3.45,z-.1]],[[x,2.7,z],[x+.48,3.32,z+.2]],[[x,2.95,z],[x-.1,3.65,z+.55]]];
  for(const [a,b] of branches)tubeBetween(tree,a,b,.08,mats.bark,{segments:7});
  const leafPositions=[[x-.95,3.55,z],[x+.55,3.75,z+.1],[x-.15,4.1,z+.54],[x+.2,3.55,z-.55],[x-.45,3.2,z-.3],[x+.85,3.25,z+.65]];
  const rng=makeRng(129);
  leafPositions.forEach((position,index)=>{
    const geo=new THREE.IcosahedronGeometry(.55+rng()*.3,1);
    const mesh=new THREE.Mesh(geo,index%2?mats.leaf:mats.leafDark);
    mesh.position.set(...position);
    mesh.scale.set(1.2,.7+rng()*.2,1);
    mesh.rotation.y=rng()*PI;
    mesh.castShadow=true;mesh.receiveShadow=true;
    tree.add(mesh);
    const shell=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x0b1117,side:THREE.BackSide}));
    shell.position.copy(mesh.position);shell.scale.copy(mesh.scale).multiplyScalar(1.03);shell.rotation.copy(mesh.rotation);
    tree.add(shell);
  });
  // Leaf litter under the tree.
  const leafGeo=new THREE.PlaneGeometry(.13,.065);
  const leafMat=new THREE.MeshBasicMaterial({color:0x80955f,transparent:true,opacity:.55,side:THREE.DoubleSide});
  const leaves=new THREE.InstancedMesh(leafGeo,leafMat,28);
  const dummy=new THREE.Object3D();
  for(let i=0;i<28;i++){
    dummy.position.set(x-1.2+(rng()-.5)*3,0.175,z-1+(rng()-.5)*2.4);
    dummy.rotation.set(-PI/2,0,rng()*PI);
    dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
  }
  leaves.instanceMatrix.needsUpdate=true;tree.add(leaves);
  return tree;
}

function buildLightPools(parent,mats){
  const group=new THREE.Group();group.name='wet-light-pools';parent.add(group);
  const pools=[
    {x:-2.4,z:.35,sx:10.4,sz:3.1,color:0xffd197,opacity:.17,rotationY:.03},
    {x:-8.05,z:.1,sx:2.8,sz:2.2,color:0x83eaf4,opacity:.15,rotationY:-.1},
    {x:10.55,z:1.6,sx:4.8,sz:4.1,color:0xff9b4e,opacity:.2,rotationY:.1},
    {x:8.6,z:-1.25,sx:3.4,sz:2.8,color:0xff6fae,opacity:.13,rotationY:.15},
    {x:5.15,z:-4.2,sx:2.2,sz:3.4,color:0x79d4d8,opacity:.07,rotationY:0}
  ];
  for(const pool of pools){
    const material=new THREE.MeshBasicMaterial({
      map:glowTexture(),color:pool.color,transparent:true,opacity:pool.opacity,
      depthWrite:false,blending:THREE.AdditiveBlending,fog:true
    });
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
    plane.rotation.x=-PI/2;
    plane.rotation.z=pool.rotationY;
    plane.position.set(pool.x,.087,pool.z);
    plane.scale.set(pool.sx,pool.sz,1);
    plane.renderOrder=4;
    group.add(plane);
  }
  return group;
}

function buildNeonStreaks(parent,mats){
  const group=new THREE.Group();group.name='neon-wet-streaks';parent.add(group);
  const streaks=[
    {x:-2.7,z:2.4,w:3.3,d:6.4,color:0xdff7e9,opacity:.14},
    {x:-2.2,z:1.2,w:5.0,d:3.2,color:0xffc589,opacity:.13},
    {x:-8.05,z:.8,w:.95,d:3.3,color:0x85f1ff,opacity:.18},
    {x:8.35,z:1.1,w:1.35,d:5.2,color:0xff5793,opacity:.22},
    {x:10.5,z:3.7,w:2.1,d:4.8,color:0xff9b47,opacity:.14},
    {x:1.95,z:1.35,w:.9,d:2.8,color:0xff7166,opacity:.09}
  ];
  for(const streak of streaks){
    const material=mats.reflectionStreak.clone();
    material.color=new THREE.Color(streak.color);
    material.opacity=streak.opacity;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
    mesh.rotation.x=-PI/2;
    mesh.position.set(streak.x,.09,streak.z);
    mesh.scale.set(streak.w,streak.d,1);
    mesh.renderOrder=5;
    group.add(mesh);
  }
  return group;
}

function buildGardenLamp(parent,mats,lights){
  const group=new THREE.Group();group.name='left-street-lamp';parent.add(group);
  const x=-10.2,z=8.95;
  addCylinder(group,[.052,.075],4.0,[x,.14+2.0,z],mats.concreteDark,{segments:10,outline:.01});
  addCylinder(group,[.16,.2],.18,[x,.23,z],mats.metalDark,{segments:12,outline:.012});
  addCylinder(group,[.08,.11],.26,[x,4.17,z],mats.metalDark,{segments:10,outline:.008});
  addTube(group,[[x,4.25,z],[x-.18,4.38,z-.02],[x-.42,4.34,z-.02]],.038,mats.metalDark,{segments:14,radial:6});
  addCylinder(group,[.025,.025],.25,[x-.42,4.22,z-.02],mats.metalDark,{segments:6,outline:0,castShadow:false});
  const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.19,.24,.4,8),basic(0xffd7a1));
  lantern.position.set(x-.42,3.94,z-.02);group.add(lantern);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.29,.27,.08,8),mats.metalDark);
  cap.position.set(x-.42,4.17,z-.02);group.add(cap);
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.3,.21,.09,8),mats.metalDark);
  skirt.position.set(x-.42,3.7,z-.02);group.add(skirt);
  const finial=new THREE.Mesh(new THREE.ConeGeometry(.1,.16,8),mats.metalDark);
  finial.position.set(x-.42,4.3,z-.02);group.add(finial);
  addGlow(group,{color:0xffc884,size:1.7,opacity:.3,position:[x-.42,3.9,z-.02]});
  addGlow(group,{color:0xffe4b0,size:.4,opacity:.7,position:[x-.42,3.94,z-.02]});
  const lamp=new THREE.PointLight(0xffbe77,31,12,2);
  lamp.position.set(x-.42,3.7,z-.02);group.add(lamp);
  lights.push(lamp);
  // A soft pool of old-fashioned lamp light on the crossing.
  const material=new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0xffb96d,transparent:true,opacity:.14,depthWrite:false,blending:THREE.AdditiveBlending
  });
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  pool.rotation.x=-PI/2;pool.position.set(x-.42,.09,z+.8);pool.scale.set(6.2,4.6,1);pool.renderOrder=4;group.add(pool);
  return group;
}

function buildLooseStreetClutter(parent,mats){
  const group=new THREE.Group();group.name='street-clutter';parent.add(group);
  // Convex traffic mirror, an unmistakable little Japanese street corner detail.
  const mirrorGroup=new THREE.Group();
  mirrorGroup.position.set(7.85,0,1.05);
  mirrorGroup.rotation.y=.52;
  group.add(mirrorGroup);
  addCylinder(mirrorGroup,[.045,.06],3.02,[0,1.58,0],mats.metal,{segments:9,outline:.008});
  addCylinder(mirrorGroup,[.032,.032],.42,[0,3.08,.2],mats.metal,{segments:8,rotation:[PI/2,0,0],outline:0});
  addCylinder(mirrorGroup,[.42,.42],.09,[0,3.2,.37],mats.orangePaint,{segments:28,rotation:[PI/2,0,0],outline:.014});
  const mirror=new THREE.Mesh(new THREE.CircleGeometry(.36,28),mats.mirror);
  mirror.position.set(0,3.2,.425);mirrorGroup.add(mirror);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.37,.025,7,28),mats.orangePaint);
  rim.position.set(0,3.2,.43);mirrorGroup.add(rim);
  const glint=new THREE.Mesh(new THREE.PlaneGeometry(.16,.3),basic(0xb9d3d7,{transparent:true,opacity:.35}));
  glint.position.set(-.11,3.23,.432);glint.rotation.z=-.35;mirrorGroup.add(glint);
  // Small bollard lights at the corner.
  for(const [bx,bz] of [[3.35,.38],[7.85,.42]]){
    addCylinder(group,[.075,.105],.58,[bx,.43,bz],mats.metalDark,{segments:10,outline:.008});
    addCylinder(group,[.055,.07],.14,[bx,.76,bz],mats.warmBulb,{segments:10,outline:0,castShadow:false});
    addGlow(group,{color:0xffc486,size:.5,opacity:.42,position:[bx,.77,bz]});
  }
  // Japanese postbox on the far sidewalk, a warm red note in the foreground.
  const postX=-2.85,postZ=9.55;
  addBox(group,[.12,.28,.12],[postX,.2,postZ],mats.metalDark,{outline:.008,castShadow:false});
  addCylinder(group,[.36,.4],.98,[postX,.83,postZ],mats.postRed,{segments:18,outline:.022});
  addCylinder(group,[.4,.36],.16,[postX,1.4,postZ],mats.postRed,{segments:18,outline:.015});
  addCylinder(group,[.43,.43],.05,[postX,1.49,postZ],mats.metalDark,{segments:18,outline:.008,castShadow:false});
  addBox(group,[.47,.1,.08],[postX,1.2,postZ+.355],mats.metalDark,{outline:.006,castShadow:false});
  addBox(group,[.3,.22,.02],[postX,1.3,postZ+.4],mats.wallWarm,{outline:0,castShadow:false});
  addBox(group,[.24,.018,.012],[postX,1.34,postZ+.412],mats.dark,{outline:0,castShadow:false});
  addBox(group,[.18,.018,.012],[postX,1.28,postZ+.412],mats.dark,{outline:0,castShadow:false});
  addBox(group,[.6,.055,.06],[postX,1.51,postZ+.02],mats.postRed,{outline:.008,castShadow:false,rotation:[0,0,.04]});
  // Utility cabinet on the far sidewalk, with a rain-dark tarp.
  addBox(group,[1.05,1.15,.55],[11.8,.73,9.95],mats.utilityBox,{outline:.02});
  addBox(group,[1.1,.06,.6],[11.8,1.33,9.95],mats.metalDark,{outline:.01});
  addBox(group,[.3,.22,.02],[11.7,.95,10.235],mats.wallWarm,{outline:0,castShadow:false});
  // Paper cup left by the vending machine.
  addCylinder(group,[.045,.035],.11,[-6.92,.23,-.9],mats.paper,{segments:10,outline:0,castShadow:false});
  return group;
}

export function buildStreet(parent,mats){
  const street=new THREE.Group();street.name='konbini-street';parent.add(street);
  const lights=[];
  buildBase(street,mats);
  roadRibbon(street,mats);
  buildPavements(street,mats);
  buildMarkings(street,mats);
  buildPuddles(street,mats);
  buildLightPools(street,mats);
  buildNeonStreaks(street,mats);
  buildGuardrail(street,mats);
  buildMarqueeStreetlamp(street,mats,lights);
  buildWires(street,mats);
  buildSignsAndParking(street,mats);
  buildTree(street,mats);
  buildGardenLamp(street,mats,lights);
  buildLooseStreetClutter(street,mats);
  return {group:street,lights};
}
