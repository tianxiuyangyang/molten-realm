import * as THREE from 'three';
import {
  PI,addBox,addRounded,addCylinder,addPlane,addGroundPlane,addGlow,basic,standard,toon,glowTexture,
  textureCanvas,canvasTexture,roundRect
} from './konbini-utils.js?v=4';

function rodBetween(parent,a,b,radius,material,{segments=8,outline=0}={}){
  const start=new THREE.Vector3(...a);
  const end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  const length=delta.length();
  const geometry=new THREE.CylinderGeometry(radius,radius,length,segments,1,false);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;
  parent.add(mesh);
  if(outline>0){
    const shell=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x0b1119,side:THREE.BackSide}));
    shell.position.copy(mesh.position);shell.quaternion.copy(mesh.quaternion);shell.scale.setScalar(1+outline);
    parent.add(shell);
  }
  return mesh;
}

function buildVendingMachine(parent,mats){
  const group=new THREE.Group();group.name='vending-machine';parent.add(group);
  group.position.set(-8.05,.14,-1.32);
  addRounded(group,[1.26,1.96,.78],[0,1.06,0],mats.vendingBody,{radius:.08,outline:.035,name:'vending-body'});
  addBox(group,[1.22,.1,.72],[0,.11,0],mats.metalDark,{outline:.012,castShadow:false});
  for(const x of [-.48,.48]){
    addBox(group,[.12,.1,.52],[x,.05,.02],mats.metalDark,{outline:.006,castShadow:false});
  }
  addBox(group,[1.1,1.78,.04],[0,1.1,.39],mats.vendingBody,{outline:0,castShadow:false});
  addPlane(group,1.08,1.76,[0,1.1,.417],mats.vending,{name:'vending-glow-panel'}).renderOrder=4;
  addBox(group,[1.14,.06,.06],[0,2.05,.38],mats.trimLight,{outline:0,castShadow:false});
  addBox(group,[1.22,.08,.7],[0,2.08,.02],mats.vendingBody,{outline:.012,castShadow:false});
  addBox(group,[.1,.54,.08],[-.59,.8,.38],mats.metal,{outline:.005,castShadow:false});
  addBox(group,[.1,.54,.08],[.59,.8,.38],mats.metal,{outline:.005,castShadow:false});
  addBox(group,[.5,.06,.08],[0,.38,.4],mats.metalDark,{outline:0,castShadow:false});
  addCylinder(group,[.035,.035],.035,[-.38,1.3,.435],mats.metal,{segments:10,rotation:[PI/2,0,0],outline:0,castShadow:false});
  addCylinder(group,[.035,.035],.035,[-.38,.88,.435],mats.paintYellow,{segments:10,rotation:[PI/2,0,0],outline:0,castShadow:false});
  addGlow(group,{color:0xa7f3ff,size:1.9,opacity:.25,position:[0,1.4,.55]});
  const light=new THREE.PointLight(0xc5fbff,16,4.5,2);
  light.position.set(0,1.35,.85);group.add(light);
  // A small neighbourhood cat naps on top of the vending machine.
  const cat=new THREE.Group();cat.position.set(.18,2.07,.04);group.add(cat);
  const catMat=toon(0x20252a);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.11,10,7),catMat);
  body.scale.set(1.15,.85,.75);body.position.y=.06;body.castShadow=false;cat.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.078,10,7),catMat);
  head.position.set(.1,.14,.02);cat.add(head);
  for(const z of [-.043,.054]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.027,.065,4),catMat);
    ear.position.set(.105,.21,z);cat.add(ear);
  }
  const tail=new THREE.Mesh(new THREE.TorusGeometry(.12,.013,4,12,PI*1.2),catMat);
  tail.position.set(-.12,.06,.02);tail.rotation.set(PI/2,.4,1.1);cat.add(tail);
  // Tiny recycle box alongside the machine.
  addBox(group,[.42,.56,.42],[.85,.3,.12],mats.vendingBody,{outline:.02});
  addBox(group,[.3,.06,.3],[.85,.6,.12],mats.vendingBody,{outline:.008,castShadow:false});
  addCylinder(group,[.075,.075],.022,[.85,.59,.12],mats.black,{segments:12,outline:0,castShadow:false});
  addPlane(group,.35,.42,[.85,.32,.335],standard(0x355d5a,{roughness:.4}),{name:'vending-recycle-label'});
  return {group,light};
}

function buildTrashStation(parent,mats){
  const group=new THREE.Group();group.name='recycle-bins';parent.add(group);
  group.position.set(.42,.14,-1.76);
  group.rotation.y=0;
  const bodyMat=toon(0xcfcfc2);
  const colors=[0x55878b,0x5d865d,0x946a5b];
  addBox(group,[1.64,.94,.5],[0,.49,0],bodyMat,{outline:.025});
  addBox(group,[1.74,.08,.58],[0,.97,0],mats.trim,{outline:.012});
  for(let i=0;i<3;i++){
    addBox(group,[.51,.16,.06],[-.54+i*.54,1.02,.03],toon(colors[i]),{outline:.01,castShadow:false});
    addBox(group,[.28,.04,.16],[-.54+i*.54,1.06,.025],mats.black,{outline:0,castShadow:false,rotation:[PI/2,0,0]});
    addBox(group,[.04,.8,.04],[-.27+i*.54,.55,.26],mats.metal,{outline:0,castShadow:false});
  }
  // One shared info panel; three bays are framed separately.
  addPlane(group,1.45,.72,[0,.57,.258],mats.binLabel,{name:'bin-label'});
  addBox(group,[.05,.9,.05],[-.82,.5,.3],mats.metal,{outline:0,castShadow:false});
  addBox(group,[.05,.9,.05],[.82,.5,.3],mats.metal,{outline:0,castShadow:false});
  addBox(group,[1.7,.06,.06],[0,.08,.29],mats.metal,{outline:0,castShadow:false});
  // Little rain hood.
  addBox(group,[1.78,.07,.68],[0,1.15,.03],mats.trim,{outline:.012,rotation:[.06,0,0]});
  return group;
}

function buildAframe(parent,mats){
  const group=new THREE.Group();group.name='a-frame-menu';parent.add(group);
  group.position.set(-5.15,.14,-1.03);group.rotation.y=-.15;
  const left=new THREE.Group();left.rotation.x=-.17;group.add(left);
  addBox(left,[.8,.05,.6],[0,.04,0],mats.wood,{outline:.01,castShadow:false});
  const board=addPlane(group,.78,1.02,[0,.59,.24],mats.aframe,{rotation:[-.17,0,0],name:'menu-board'});
  board.renderOrder=3;
  const back=addPlane(group,.78,1.02,[0,.59,-.24],mats.aframe,{rotation:[.17,PI,0],name:'menu-board-back'});
  back.renderOrder=3;
  addBox(group,[.82,.06,.08],[0,1.09,.21],mats.wood,{outline:.008,castShadow:false});
  addBox(group,[.82,.06,.08],[0,1.09,-.21],mats.wood,{outline:.008,castShadow:false});
  addBox(group,[.6,.04,.6],[0,.04,0],mats.wood,{outline:.008,castShadow:false});
  return group;
}

function buildUmbrellaStand(parent,mats){
  const group=new THREE.Group();group.name='umbrella-stand';parent.add(group);
  group.position.set(-4.33,.14,-1.46);
  addCylinder(group,[.27,.3],.48,[0,.37,0],mats.metalDark,{segments:16,outline:.018});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.27,.018,6,20),mats.metal);
  rim.rotation.x=PI/2;rim.position.y=.63;group.add(rim);
  const inner=new THREE.Mesh(new THREE.CircleGeometry(.24,20),mats.metalDark);
  inner.rotation.x=-PI/2;inner.position.y=.55;group.add(inner);
  const colors=[0xe5b3a2,0x94cbd0,0xd6c985,0x9faecc];
  const clear=new THREE.MeshPhysicalMaterial({
    color:0xd9f0ef,transparent:true,opacity:.32,roughness:.12,metalness:.02,
    clearcoat:.5,side:THREE.DoubleSide,depthWrite:false
  });
  for(let i=0;i<4;i++){
    const angle=i/4*PI*2+.3;
    const x=Math.cos(angle)*.13,z=Math.sin(angle)*.13;
    const shaft=addCylinder(group,[.015,.015],.82,[x,.97,z],mats.metal,{segments:6,outline:0,castShadow:false});
    shaft.rotation.z=.035*Math.sin(angle);
    addCylinder(group,[.022,.075],.65,[x+.01,.83,z],clear,{segments:10,outline:0,castShadow:false});
    addCylinder(group,[.012,.012],.18,[x,.57,z],mats.metal,{segments:5,outline:0,castShadow:false,rotation:[0,0,.09]});
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.075,.017,6,16,PI),toon(colors[i]));
    handle.position.set(x+.045,1.39,z);handle.rotation.z=-PI/2;handle.rotation.y=angle;
    group.add(handle);
    addCylinder(group,[.028,.018],.3,[x-.01,.65,z],toon(colors[i]),{segments:8,outline:0,castShadow:false});
  }
  addBox(group,[.15,.24,.02],[.34,1.2,0],mats.wallWarm,{outline:0,castShadow:false});
  // One clear vinyl umbrella left open to dry, catching the shop light.
  const open=new THREE.Group();
  open.name='drying-umbrella';
  open.position.set(.72,0,.05);
  open.rotation.z=-.1;
  group.add(open);
  addCylinder(open,[.012,.012],1.52,[0,.76,0],mats.metal,{segments:6,outline:0,castShadow:false});
  const canopyMat=new THREE.MeshPhysicalMaterial({
    color:0xcfe9e9,transparent:true,opacity:.26,roughness:.08,metalness:.03,
    clearcoat:.8,clearcoatRoughness:.1,side:THREE.DoubleSide,depthWrite:false
  });
  const canopy=new THREE.Mesh(new THREE.ConeGeometry(.62,.3,12,1,true),canopyMat);
  canopy.position.y=1.33;canopy.castShadow=false;open.add(canopy);
  addCylinder(open,[.018,.018],.18,[0,1.51,0],mats.metal,{segments:6,outline:0,castShadow:false});
  addCylinder(open,[.055,.055],.08,[0,.06,0],mats.metal,{segments:8,outline:0,castShadow:false});
  addCylinder(open,[.14,.14],.02,[0,1.185,0],mats.metal,{segments:16,outline:0,castShadow:false});
  const ribPositions=[];
  for(let i=0;i<12;i++){
    const a=i/12*PI*2;
    ribPositions.push(0,1.47,0,Math.cos(a)*.6,1.19,Math.sin(a)*.6);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.024,6,4),mats.metal);
    tip.position.set(Math.cos(a)*.6,1.19,Math.sin(a)*.6);open.add(tip);
  }
  const ribGeo=new THREE.BufferGeometry();
  ribGeo.setAttribute('position',new THREE.Float32BufferAttribute(ribPositions,3));
  open.add(new THREE.LineSegments(ribGeo,new THREE.LineBasicMaterial({color:0x485b60,transparent:true,opacity:.65})));
  addCylinder(open,[.06,.06],.035,[0,1.48,0],mats.metalDark,{segments:10,outline:0,castShadow:false});
  return group;
}

function buildBicycle(parent,mats){
  const bike=new THREE.Group();bike.name='bicycle';parent.add(bike);
  bike.position.set(2.84,.145,-.58);
  bike.rotation.y=.1;
  const frameMat=mats.bikeCream;
  const dark=mats.metalDark;
  const wheelCenters=[-.66,.66];
  const wheelRadius=.36;
  for(const wx of wheelCenters){
    const tire=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius,.032,8,32),mats.blackRubber);
    tire.position.set(wx,wheelRadius+.01,0);tire.castShadow=true;bike.add(tire);
    const tireOutline=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius,.036,8,32),new THREE.MeshBasicMaterial({color:0x0b1117,side:THREE.BackSide}));
    tireOutline.position.copy(tire.position);tireOutline.scale.setScalar(1.02);bike.add(tireOutline);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius-.04,.012,6,32),mats.metal);
    rim.position.copy(tire.position);bike.add(rim);
    const hub=addCylinder(bike,[.035,.035],.1,[wx,wheelRadius+.01,0],mats.metal,{segments:10,rotation:[PI/2,0,0],outline:0});
    const spokePositions=[];
    for(let i=0;i<12;i++){
      const a=i/12*PI*2;
      spokePositions.push(wx, wheelRadius+.01, 0, wx+Math.cos(a)*(wheelRadius-.045), wheelRadius+.01+Math.sin(a)*(wheelRadius-.045), 0);
    }
    const spokeGeometry=new THREE.BufferGeometry();
    spokeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(spokePositions,3));
    const spokes=new THREE.LineSegments(spokeGeometry,new THREE.LineBasicMaterial({color:0x5f6c68,transparent:true,opacity:.8}));
    bike.add(spokes);
    // Fenders.
    const fender=new THREE.Mesh(new THREE.TorusGeometry(wheelRadius+.035,.017,5,24,PI*.82),frameMat);
    fender.position.copy(tire.position);fender.rotation.z=.09*PI;fender.castShadow=true;bike.add(fender);
  }
  const rear=[-.66,wheelRadius+.03,0];
  const front=[.66,wheelRadius+.03,0];
  const crank=[.03,.38,0];
  const seatBase=[-.22,.74,0];
  const headBase=[.51,.82,0];
  // Step-through swooping frame.
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(rear[0],rear[1],0),
    new THREE.Vector3(-.34,.62,0),
    new THREE.Vector3(.02,.53,0),
    new THREE.Vector3(.38,.62,0),
    new THREE.Vector3(headBase[0],headBase[1],0)
  ]);
  const downTube=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.036,6,false),frameMat);
  downTube.castShadow=true;bike.add(downTube);
  rodBetween(bike,rear,seatBase,.026,frameMat,{segments:7});
  rodBetween(bike,seatBase,headBase,.024,frameMat,{segments:7});
  rodBetween(bike,crank,headBase,.03,frameMat,{segments:7});
  rodBetween(bike,rear,crank,.024,dark,{segments:7});
  rodBetween(bike,crank,seatBase,.03,frameMat,{segments:7});
  // Seat post, saddle, handlebar.
  rodBetween(bike,[-.19,.74,0],[-.22,.91,0],.025,mats.metal,{segments:7});
  addRounded(bike,[.3,.1,.18],[-.23,.97,0],mats.blackRubber,{radius:.04,outline:.008});
  rodBetween(bike,[headBase[0],headBase[1],0],[.44,1.08,0],.024,mats.metal,{segments:7});
  const barCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(.39,1.09,-.3),new THREE.Vector3(.5,1.13,0),new THREE.Vector3(.39,1.09,.3)
  ]);
  const handlebar=new THREE.Mesh(new THREE.TubeGeometry(barCurve,12,.022,6,false),mats.metal);
  bike.add(handlebar);
  for(const z of [-.3,.3]){
    addCylinder(bike,[.027,.027],.12,[.39,1.09,z],mats.blackRubber,{segments:8,outline:0,rotation:[PI/2,0,0],castShadow:false});
  }
  // Front basket.
  const basketX=.87,basketY=.82;
  for(const [dx,dz] of [[-.19,-.19],[-.19,.19],[.19,-.19],[.19,.19]]){
    addBox(bike,[.025,.34,.025],[basketX+dx,basketY,dz],mats.basket,{outline:0,castShadow:false});
  }
  for(const y of [.67,.81,.99]){
    addBox(bike,[.4,.018,.018],[basketX,y,-.2],mats.basket,{outline:0,castShadow:false});
    addBox(bike,[.4,.018,.018],[basketX,y,.2],mats.basket,{outline:0,castShadow:false});
    addBox(bike,[.018,.018,.4],[basketX-.2,y,0],mats.basket,{outline:0,castShadow:false});
    addBox(bike,[.018,.018,.4],[basketX+.2,y,0],mats.basket,{outline:0,castShadow:false});
  }
  addBox(bike,[.32,.025,.32],[basketX,.665,0],mats.basket,{outline:0,castShadow:false});
  addBox(bike,[.24,.14,.18],[basketX,.74,0],mats.paper,{outline:.006,castShadow:false,rotation:[0,.3,0]});
  // Rack, chain guard, pedals and kickstand.
  addBox(bike,[.5,.08,.26],[-.62,.83,0],mats.metal,{outline:.006,castShadow:false});
  const chain=new THREE.Mesh(new THREE.TorusGeometry(.13,.012,4,18),mats.metalDark);
  chain.position.set(.03,.4,0);bike.add(chain);
  addCylinder(bike,[.12,.12],.018,[.03,.4,.07],mats.metalDark,{segments:14,outline:0,rotation:[PI/2,0,0],castShadow:false});
  addBox(bike,[.25,.025,.06],[.14,.39,.12],mats.metal,{outline:0,castShadow:false});
  addBox(bike,[.2,.025,.06],[.14,.38,-.12],mats.metal,{outline:0,castShadow:false});
  rodBetween(bike,[-.1,.38,0],[-.08,.03,-.17],.016,mats.metal,{segments:5});
  addCylinder(bike,[.038,.038],.11,[.74,.74,0],mats.warmBulb,{segments:10,outline:0,castShadow:false,rotation:[0,0,PI/2]});
  // A worn saddle cloth.
  addPlane(bike,.28,.11,[-.23,.98,.001],toon(0x73877d),{rotation:[-PI/2,0,0],name:'saddle-cloth'});
  return bike;
}

function buildKeiVan(parent,mats){
  const van=new THREE.Group();van.name='kei-delivery-van';parent.add(van);
  van.position.set(3.35,.03,6.15);
  van.rotation.y=-.055;
  const cream=toon(0xc8c1aa);
  const creamDark=toon(0xa9a38f);
  const glass=basic(0x101c22);
  const rubber=mats.blackRubber;
  const trim=mats.metalDark;
  const vanGreen=toon(0x4d756f);
  const {canvas:decalCanvas,ctx:decalCtx}=textureCanvas(512,256);
  decalCtx.clearRect(0,0,512,256);
  decalCtx.fillStyle='rgba(32,76,77,.9)';roundRect(decalCtx,34,34,300,188,36);decalCtx.fill();
  decalCtx.fillStyle='#f3ead3';decalCtx.font='700 76px "Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif';
  decalCtx.textAlign='center';decalCtx.fillText('雨宮',203,122);decalCtx.fillText('運輸',203,202);
  decalCtx.strokeStyle='#8ed4d0';decalCtx.lineWidth=5;decalCtx.beginPath();decalCtx.arc(412,124,67,0,Math.PI*2);decalCtx.stroke();
  decalCtx.fillStyle='#8ed4d0';decalCtx.beginPath();decalCtx.moveTo(412,78);decalCtx.bezierCurveTo(444,107,452,142,412,170);decalCtx.bezierCurveTo(372,142,380,107,412,78);decalCtx.fill();
  const decalMat=new THREE.MeshBasicMaterial({map:canvasTexture(decalCanvas),transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const redLight=basic(new THREE.Color(4.2,.22,.12));
  const amberLight=basic(new THREE.Color(4.0,1.1,.18));
  addBox(van,[3.05,.56,1.46],[0,.59,0],cream,{outline:.025,name:'van-lower-body'});
  addBox(van,[2.8,.88,1.38],[.04,1.3,0],cream,{outline:.025,name:'van-upper-body'});
  addRounded(van,[2.68,.13,1.32],[.04,1.8,0],creamDark,{radius:.06,outline:.012});
  addBox(van,[3.16,.16,1.5],[0,.34,0],trim,{outline:.012,castShadow:false});
  addBox(van,[.13,.38,1.46],[-1.55,.63,0],creamDark,{outline:.012});
  addBox(van,[.14,.24,1.5],[1.55,.45,0],trim,{outline:.01});
  addBox(van,[.1,.1,1.46],[1.56,.68,0],trim,{outline:.005,castShadow:false});
  // Cab glass.
  addBox(van,[.04,.58,1.22],[-1.39,1.42,0],glass,{outline:.012,castShadow:false,rotation:[0,0,.07]});
  addBox(van,[.04,.48,1.18],[-1.4,.82,0],glass,{outline:.008,castShadow:false});
  for(const z of [-.71,.71]){
    addBox(van,[1.0,.59,.035],[-.73,1.45,z],glass,{outline:.016,castShadow:false});
    addBox(van,[1.0,.45,.035],[.64,1.4,z],glass,{outline:.016,castShadow:false});
    addBox(van,[.035,1.05,.05],[-1.27,1.4,z],trim,{outline:0,castShadow:false});
    addBox(van,[.035,1.06,.05],[.13,1.4,z],trim,{outline:0,castShadow:false});
    addBox(van,[.035,.56,.05],[.91,1.41,z],trim,{outline:0,castShadow:false});
    addBox(van,[1.04,.035,.05],[-.73,1.18,z],trim,{outline:0,castShadow:false});
    addBox(van,[1.04,.035,.05],[.64,1.18,z],trim,{outline:0,castShadow:false});
    const face=z+Math.sign(z)*.03;
    addBox(van,[.34,.11,.16],[1.32,1.13,face],trim,{outline:.005,castShadow:false});
    addBox(van,[.075,.23,.03],[.27,1.0,face],vanGreen,{outline:0,castShadow:false});
    addBox(van,[.58,.32,.02],[-1.0,.44,face+.005],mats.black,{outline:0,castShadow:false});
    addBox(van,[.58,.32,.02],[1.0,.44,face+.005],mats.black,{outline:0,castShadow:false});
    addBox(van,[2.64,.085,.025],[-.06,.82,face+.012],vanGreen,{outline:0,castShadow:false});
  }
  const vanDecal=addPlane(van,.95,.48,[.55,.94,.743],decalMat,{name:'van-company-decal'});
  vanDecal.renderOrder=5;
  addPlane(van,.95,.48,[.55,.94,-.743],decalMat,{rotation:[0,PI,0],name:'van-company-decal-left'}).renderOrder=5;
  // Rear barn-door seams and hinges.
  addBox(van,[.035,1.12,.035],[1.46,1.22,.35],trim,{outline:0,castShadow:false});
  addBox(van,[.035,1.12,.035],[1.46,1.22,-.35],trim,{outline:0,castShadow:false});
  addBox(van,[.025,.02,1.16],[1.47,.87,0],trim,{outline:0,castShadow:false});
  addBox(van,[.025,.02,1.16],[1.47,1.55,0],trim,{outline:0,castShadow:false});
  addBox(van,[.025,.15,.04],[1.47,1.32,.58],trim,{outline:0,castShadow:false});
  addBox(van,[.025,.15,.04],[1.47,1.32,-.58],trim,{outline:0,castShadow:false});
  // A faint cyan reflection caught in the side glass.
  addPlane(van,.84,.23,[-.72,1.48,.735],basic(0x486e76,{transparent:true,opacity:.3,depthWrite:false}),{name:'van-glass-sheen'}).renderOrder=6;
  addBox(van,[.05,.54,1.2],[1.44,1.42,0],glass,{outline:.01,castShadow:false});
  addBox(van,[.07,.72,.07],[.97,1.62,.72],trim,{outline:0,castShadow:false});
  addBox(van,[.1,.18,.26],[.93,1.7,.78],trim,{outline:.006,castShadow:false});
  // Rack rails and a small delivery light.
  for(const z of [-.48,.48]){
    addBox(van,[2.2,.045,.045],[.08,1.92,z],trim,{outline:0,castShadow:false});
    addBox(van,[.045,.09,.045],[-.97,1.97,z],trim,{outline:0,castShadow:false});
    addBox(van,[.045,.09,.045],[1.04,1.97,z],trim,{outline:0,castShadow:false});
  }
  addBox(van,[.42,.14,.1],[.9,1.87,0],mats.warmBulb,{outline:.005,castShadow:false});
  // Headlamps, tail lamps, plates.
  for(const z of [-.48,.48]){
    addBox(van,[.035,.16,.24],[-1.59,.66,z],basic(0xb7d4d6),{outline:.005,castShadow:false});
    addBox(van,[.03,.19,.25],[1.6,.72,z],redLight,{outline:.005,castShadow:false});
    addBox(van,[.03,.08,.14],[1.61,.48,z],amberLight,{outline:0,castShadow:false});
  }
  addBox(van,[.02,.16,.44],[1.615,.57,0],basic(0xe5dcbf),{outline:.004,castShadow:false});
  addBox(van,[.03,.055,.38],[1.62,.57,0],trim,{outline:0,castShadow:false});
  addBox(van,[.08,.42,.06],[.25,.95,.74],trim,{outline:.005,castShadow:false});
  addBox(van,[.08,.42,.06],[.25,.95,-.74],trim,{outline:.005,castShadow:false});
  // Wheels.
  for(const x of [-1.0,1.0]){
    for(const z of [-.69,.69]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.18,18),rubber);
      tire.rotation.x=PI/2;tire.position.set(x,.31,z);tire.castShadow=true;van.add(tire);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.185,14),mats.metal);
      hub.rotation.x=PI/2;hub.position.copy(tire.position);van.add(hub);
      addBox(van,[.54,.14,.12],[x,.47,z*1.01],creamDark,{outline:.005,castShadow:false});
    }
  }
  addBox(van,[3.08,.09,.12],[0,.2,.73],trim,{outline:.006,castShadow:false});
  addBox(van,[3.08,.09,.12],[0,.2,-.73],trim,{outline:.006,castShadow:false});
  addGlow(van,{color:0xff3a22,size:.48,opacity:.3,position:[1.78,.74,.47]});
  addGlow(van,{color:0xff3a22,size:.48,opacity:.3,position:[1.78,.74,-.47]});
  addGlow(van,{color:0xffcf8b,size:.65,opacity:.2,position:[.9,1.86,0]});
  const tailLight=new THREE.PointLight(0xff3b22,4,3.2,2);
  tailLight.position.set(1.85,.68,0);van.add(tailLight);
  // A faint puddle of red on the wet lane.
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.9),new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0xff4827,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  pool.rotation.x=-PI/2;pool.position.set(2.4,.075,6.15);pool.renderOrder=4;parent.add(pool);
  return {group:van,light:tailLight};
}

function buildUmbrellaFigure(parent,mats){
  const person=new THREE.Group();person.name='umbrella-pedestrian';parent.add(person);
  person.position.set(-6.15,.073,4.55);
  person.rotation.y=-.18;
  const coat=toon(0x263844);
  const coatShade=toon(0x1a2832);
  const hair=toon(0x171d24);
  const skin=toon(0xcaa181);
  const scarf=toon(0xc6935c);
  const shoe=toon(0x12171b);
  const bagMat=toon(0xc9bda3);
  // Shoes and legs, one foot slightly forward.
  addRounded(person,[.18,.13,.34],[-.11,.08,.08],shoe,{radius:.045,outline:.008});
  addRounded(person,[.17,.12,.3],[.13,.07,-.05],shoe,{radius:.04,outline:.007});
  addCylinder(person,[.055,.07],.72,[-.11,.43,.02],coatShade,{segments:9,outline:.006,rotation:[.06,0,-.035]});
  addCylinder(person,[.055,.07],.72,[.13,.42,-.03],coatShade,{segments:9,outline:.006,rotation:[-.08,0,.03]});
  // A-line raincoat.
  addCylinder(person,[.2,.32],.76,[0,1.06,0],coat,{segments:11,outline:.016});
  addRounded(person,[.4,.24,.26],[0,1.34,0],coat,{radius:.08,outline:.012});
  addCylinder(person,[.19,.21],.09,[0,1.43,0],scarf,{segments:12,outline:.008,castShadow:false});
  addCylinder(person,[.055,.06],.24,[-.02,1.5,0],skin,{segments:8,outline:0,castShadow:false});
  const head=new THREE.Mesh(new THREE.SphereGeometry(.135,14,10),skin);
  head.scale.set(.95,1.08,.9);head.position.set(0,1.64,0);head.castShadow=true;person.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.142,14,10,0,PI*2,0,PI*.62),hair);
  hairCap.position.set(0,1.66,0);hairCap.castShadow=true;person.add(hairCap);
  addRounded(person,[.15,.16,.1],[0,1.6,-.105],hair,{radius:.03,outline:.006,castShadow:false});
  // Left arm down carrying a small convenience-store bag.
  rodBetween(person,[-.22,1.33,0],[-.3,.95,.02],.036,coat,{segments:7});
  addBox(person,[.28,.35,.15],[-.36,.72,.06],bagMat,{outline:.008,rotation:[0,.12,.05]});
  addBox(person,[.03,.17,.02],[-.36,.91,.06],mats.paper,{outline:0,castShadow:false});
  // Right arm lifted to hold the umbrella.
  rodBetween(person,[.22,1.35,-.01],[.28,1.27,.25],.038,coat,{segments:7});
  rodBetween(person,[.28,1.27,.25],[.1,1.19,.55],.032,coat,{segments:7});
  addCylinder(person,[.02,.02],.9,[.1,1.62,.55],mats.metal,{segments:6,outline:0,castShadow:false});
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.075,.017,6,14,PI),mats.woodLight);
  handle.position.set(.1,1.18,.55);handle.rotation.z=PI/2;person.add(handle);
  // Clear vinyl umbrella.
  const vinyl=new THREE.MeshPhysicalMaterial({
    color:0xd3ecec,transparent:true,opacity:.3,roughness:.1,metalness:.02,
    clearcoat:.8,clearcoatRoughness:.07,side:THREE.DoubleSide,depthWrite:false,
    emissive:0x1f3e43,emissiveIntensity:.45
  });
  const canopy=new THREE.Mesh(new THREE.ConeGeometry(.76,.3,14,1,true),vinyl);
  canopy.position.set(.1,2.08,.55);canopy.castShadow=false;person.add(canopy);
  addCylinder(person,[.015,.015],.18,[.1,2.28,.55],mats.metal,{segments:5,outline:0,castShadow:false});
  addCylinder(person,[.045,.045],.02,[.1,1.93,.55],mats.metalDark,{segments:10,outline:0,castShadow:false});
  const ribPositions=[];
  for(let i=0;i<14;i++){
    const angle=i/14*PI*2;
    ribPositions.push(.1,2.21,.55,.1+Math.cos(angle)*.73,1.94,.55+Math.sin(angle)*.73);
  }
  const ribGeo=new THREE.BufferGeometry();
  ribGeo.setAttribute('position',new THREE.Float32BufferAttribute(ribPositions,3));
  person.add(new THREE.LineSegments(ribGeo,new THREE.LineBasicMaterial({color:0x9ab6b9,transparent:true,opacity:.55})));
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.745,.012,6,32),basic(0xd6f4f4,{transparent:true,opacity:.5,depthWrite:false}));
  rim.rotation.x=PI/2;rim.position.set(.1,1.94,.55);person.add(rim);
  const topGlow=new THREE.Sprite(new THREE.SpriteMaterial({
    map:glowTexture(),color:0xbfeef0,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  topGlow.scale.set(2.3,2.3,1);topGlow.position.set(.1,2.07,.55);person.add(topGlow);
  // A small contact shadow ties the figurine to the wet crossing.
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.55,24),new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0x020405,transparent:true,opacity:.42,depthWrite:false
  }));
  shadow.rotation.x=-PI/2;shadow.position.set(0,.002,.03);person.add(shadow);
  return person;
}

function buildLooseShopWall(parent,mats){
  const group=new THREE.Group();group.name='shop-wall-details';parent.add(group);
  group.position.y=.14;
  // Security camera tucked under the canopy.
  addBox(group,[.17,.12,.26],[-.62,3.18,-1.35],mats.wall,{outline:.008,castShadow:false,rotation:[-.22,0,0]});
  addCylinder(group,[.055,.065],.1,[-.62,3.13,-1.23],mats.black,{segments:10,rotation:[PI/2,0,0],outline:0,castShadow:false});
  addBox(group,[.03,.03,.03],[-.58,3.22,-1.42],mats.redPaint,{outline:0,castShadow:false});
  // Cigarette / ashtray stand by the door.
  addCylinder(group,[.13,.16],.9,[-1.02,.6,-1.92],mats.metalDark,{segments:12,outline:.012});
  addCylinder(group,[.2,.2],.08,[-1.02,1.04,-1.92],mats.metal,{segments:16,outline:.008});
  addCylinder(group,[.14,.14],.03,[-1.02,1.1,-1.92],mats.black,{segments:16,outline:0,castShadow:false});
  addBox(group,[.22,.28,.015],[-1.02,.84,-1.76],mats.wallWarm,{outline:0,castShadow:false});
  // Little potted plants at the edge of the entrance.
  for(const [x,z,scale] of [[2.5,-1.26,.85],[-8.55,-.76,.7],[3.15,-2.02,.65]]){
    addCylinder(group,[.17*scale,.22*scale],.32*scale,[x,.32*scale,z],mats.terracotta,{segments:12,outline:.012});
    addCylinder(group,[.08*scale,.1*scale],.2*scale,[x,.5*scale,z],mats.soil,{segments:8,outline:0,castShadow:false});
    for(let i=0;i<5;i++){
      const a=i/5*PI*2;
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.09*scale,0),i%2?mats.leaf:mats.leafLight);
      leaf.position.set(x+Math.cos(a)*.13*scale,.62*scale+Math.sin(i*2.1)*.08,z+Math.sin(a)*.13*scale);
      leaf.scale.set(1.25,.6,1);
      leaf.castShadow=true;group.add(leaf);
    }
  }
  // Small wall meter and cable coils.
  addBox(group,[.35,.26,.08],[2.55,2.32,-2.03],mats.metal,{outline:.01,castShadow:false});
  addCylinder(group,[.015,.015],.7,[2.72,2.0,-2.02],mats.metalDark,{segments:5,outline:0,castShadow:false});
  return group;
}

function buildBar(parent,mats){
  const bar=new THREE.Group();bar.name='snack-bar';parent.add(bar);
  const barWall=toon(0x684e53);
  const barUpper=toon(0xa08378);
  const barTrim=toon(0x2b3034);
  const barWood=toon(0x443630);
  const x0=7.72,x1=13.22,z0=-11.6,z1=-3.8;
  const cx=(x0+x1)/2,cz=(z0+z1)/2;
  addBox(bar,[x1-x0,3.1,z1-z0],[cx,1.7,cz],barWall,{outline:.035});
  addBox(bar,[x1-x0,2.8,z1-z0],[cx,4.65,cz],barUpper,{outline:.035});
  addBox(bar,[x1-x0+.25,.16,z1-z0+.2],[cx,6.15,cz],barTrim,{outline:.025});
  addBox(bar,[x1-x0+.1,.32,z1-z0+.1],[cx,.16,cz],mats.concreteDark,{outline:.015});
  addBox(bar,[x1-x0+.1,.2,z1-z0+.1],[cx,3.24,cz],barTrim,{outline:.015});
  for(let i=0;i<5;i++){
    addBox(bar,[.04,2.8,.03],[x0+.4+i*1.1,4.65,z1+.015],mats.metalDark,{outline:0,castShadow:false});
  }
  // Front shopfront: warm bar entrance plus a shuttered neighbouring storefront.
  addBox(bar,[.94,2.35,.12],[8.55,1.32,z1+.06],barTrim,{outline:.013});
  addBox(bar,[.74,2.05,.05],[8.55,1.3,z1+.13],basic(0xd8a36d),{outline:0,castShadow:false});
  addBox(bar,[.05,1.0,.05],[8.55,1.25,z1+.17],mats.metalDark,{outline:0,castShadow:false});
  addBox(bar,[.06,1.0,.06],[8.97,1.25,z1+.17],mats.metalDark,{outline:0,castShadow:false});
  const noren=addPlane(bar,1.06,.8,[8.55,2.23,z1+.22],mats.barCurtain,{name:'bar-noren',double:true});
  noren.renderOrder=4;
  addBox(bar,[1.15,.05,.05],[8.55,2.65,z1+.19],barTrim,{outline:0,castShadow:false});
  addBox(bar,[3.25,2.62,.1],[11.18,1.45,z1+.07],mats.shutter,{outline:.02});
  addBox(bar,[3.45,.18,.22],[11.18,2.84,z1+.03],barTrim,{outline:.012});
  addBox(bar,[.2,2.75,.16],[9.53,1.47,z1+.04],barTrim,{outline:.012});
  addBox(bar,[.2,2.75,.16],[12.83,1.47,z1+.04],barTrim,{outline:.012});
  // Upper windows and curtains.
  for(const wx of [9.25,11.72]){
    addBox(bar,[1.55,.1,.22],[wx,4.16,z1+.02],barTrim,{outline:.008,castShadow:false});
    addBox(bar,[1.55,.1,.22],[wx,5.42,z1+.02],barTrim,{outline:.008,castShadow:false});
    addBox(bar,[.1,1.3,.22],[wx-.76,4.8,z1+.02],barTrim,{outline:.008,castShadow:false});
    addBox(bar,[.1,1.3,.22],[wx+.76,4.8,z1+.02],barTrim,{outline:.008,castShadow:false});
    addBox(bar,[1.42,1.16,.06],[wx,4.8,z1+.05],toon(0x9f6c68,{emissive:0x5f2b39,emissiveIntensity:.8}),{outline:0,castShadow:false});
    addBox(bar,[.06,1.1,.02],[wx,4.8,z1+.09],mats.metalDark,{outline:0,castShadow:false});
    addBox(bar,[1.36,.08,.04],[wx,4.8,z1+.09],mats.metalDark,{outline:0,castShadow:false});
    addPlane(bar,.28,1.03,[wx-.52,4.8,z1+.1],toon(0xa06e71,{transparent:true,opacity:.48,side:THREE.DoubleSide}),{name:'curtain'});
  }
  // Narrow balcony.
  addBox(bar,[4.4,.12,.72],[10.4,3.72,z1+.32],barTrim,{outline:.018});
  for(let i=0;i<7;i++){
    addCylinder(bar,[.022,.022],.55,[8.55+i*.62,4.03,z1+.63],mats.metal,{segments:6,outline:0,castShadow:false});
  }
  addBox(bar,[4.1,.045,.045],[10.4,4.28,z1+.63],mats.metal,{outline:0,castShadow:false});
  addBox(bar,[4.1,.032,.032],[10.4,4.03,z1+.63],mats.metal,{outline:0,castShadow:false});
  // A little balcony greenery against the flat rose windows.
  for(const [px,pz,scale] of [[8.9,z1+.48,.8],[12.05,z1+.48,.65]]){
    addCylinder(bar,[.12*scale,.16*scale],.26*scale,[px,3.85,pz],mats.terracotta,{segments:8,outline:.008});
    addCylinder(bar,[.065*scale,.085*scale],.14*scale,[px,4.03,pz],mats.soil,{segments:7,outline:0,castShadow:false});
    for(let i=0;i<4;i++){
      const a=i/4*PI*2;
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.1*scale,0),i%2?mats.leaf:mats.leafLight);
      leaf.position.set(px+Math.cos(a)*.1,4.13+Math.sin(i*1.9)*.06,pz+Math.sin(a)*.1);
      leaf.scale.set(1.2,.6,1);bar.add(leaf);
    }
  }
  // Pink vertical neon sign with visible neon tubing.
  addBox(bar,[.9,3.2,.18],[8.28,4.23,z1+.23],barTrim,{outline:.025});
  addPlane(bar,.74,2.9,[8.28,4.23,z1+.335],mats.barSign,{name:'bar-neon-sign'}).renderOrder=5;
  addPlane(bar,.74,2.9,[8.28,4.23,z1+.125],mats.barSign,{rotation:[0,PI,0],name:'bar-neon-back'}).renderOrder=5;
  addBox(bar,[.78,.035,.035],[8.28,5.84,z1+.34],mats.neonPink,{outline:0,castShadow:false});
  addBox(bar,[.78,.035,.035],[8.28,2.63,z1+.34],mats.neonPink,{outline:0,castShadow:false});
  addBox(bar,[.035,3.22,.035],[7.9,4.24,z1+.34],mats.neonPink,{outline:0,castShadow:false});
  addBox(bar,[.035,3.22,.035],[8.66,4.24,z1+.34],mats.neonCyan,{outline:0,castShadow:false});
  const pinkLight=new THREE.PointLight(0xff74ab,48,9,2);
  pinkLight.position.set(8.4,4.0,z1+1.5);bar.add(pinkLight);
  addGlow(bar,{color:0xff7fae,size:2.3,opacity:.17,position:[8.28,4.2,z1+.7]});
  addGlow(bar,{color:0xffc78a,size:.85,opacity:.25,position:[8.55,1.7,z1+.35]});
  // A warm paper lantern over the entrance.
  addCylinder(bar,[.18,.18],.46,[9.35,2.72,z1+.38],basic(0xf07761),{segments:12,outline:.01,castShadow:false});
  addCylinder(bar,[.2,.2],.045,[9.35,2.49,z1+.38],mats.metalDark,{segments:12,outline:0,castShadow:false});
  addCylinder(bar,[.2,.2],.045,[9.35,2.95,z1+.38],mats.metalDark,{segments:12,outline:0,castShadow:false});
  addCylinder(bar,[.012,.012],.35,[9.35,3.12,z1+.38],mats.metal,{segments:5,outline:0,castShadow:false});
  addGlow(bar,{color:0xffa774,size:.95,opacity:.3,position:[9.35,2.7,z1+.45]});
  const entranceLight=new THREE.PointLight(0xffb079,16,4.5,2);
  entranceLight.position.set(9.35,2.25,z1+1.0);bar.add(entranceLight);

  // Side entrance in the alley: a noren, step, lantern and plants.
  addBox(bar,[.18,2.3,1.12],[x0+.02,1.3,-7.2],barTrim,{outline:.015});
  addBox(bar,[.04,2.02,.82],[x0-.02,1.3,-7.2],basic(0xc79b6d),{outline:0,castShadow:false});
  const sideCurtain=addPlane(bar,1.2,.8,[x0-.1,2.16,-7.2],mats.barCurtain,{rotation:[0,-PI/2,0],name:'side-noren',double:true});
  sideCurtain.renderOrder=4;
  addBox(bar,[.64,.12,1.34],[x0-.38,.1,-7.2],mats.concrete,{outline:.012});
  addBox(bar,[.72,.06,1.5],[x0-.46,2.63,-7.2],barTrim,{outline:.01,rotation:[0,0,.07]});
  // Red paper lantern.
  addCylinder(bar,[.23,.23],.62,[x0-.52,2.58,-8.15],basic(0xd88376),{segments:16,outline:.014,castShadow:false});
  addCylinder(bar,[.25,.25],.05,[x0-.52,2.28,-8.15],mats.metalDark,{segments:16,outline:0,castShadow:false});
  addCylinder(bar,[.25,.25],.05,[x0-.52,2.88,-8.15],mats.metalDark,{segments:16,outline:0,castShadow:false});
  addGlow(bar,{color:0xffb47d,size:1.3,opacity:.33,position:[x0-.65,2.55,-8.15]});
  const lanternLight=new THREE.PointLight(0xffb176,17,4.2,2);
  lanternLight.position.set(x0-.7,2.45,-8.15);bar.add(lanternLight);
  // Side window, AC unit, pipes.
  addBox(bar,[.14,1.1,1.32],[x0+.01,4.72,-9.4],barTrim,{outline:.01,castShadow:false});
  addBox(bar,[.05,1.0,1.2],[x0-.04,4.72,-9.4],toon(0x8a6968,{emissive:0x5a2c3a,emissiveIntensity:.65}),{outline:0,castShadow:false});
  addBox(bar,[.05,1.0,.05],[x0-.06,4.72,-9.4],barTrim,{outline:0,castShadow:false});
  addBox(bar,[.5,.7,1.05],[x0-.32,3.4,-10.4],mats.wallShade,{outline:.018});
  addPlane(bar,.78,.57,[x0-.01,3.9,-9.4],mats.utilityBox,{rotation:[0,-PI/2,0],name:'bar-poster'}).renderOrder=3;
  addCylinder(bar,[.07,.07],4.9,[x0-.1,2.45,z0+.4],mats.metal,{segments:8,outline:.005});
  addCylinder(bar,[.07,.07],.5,[x0-.26,.25,z0+.4],mats.metal,{segments:8,outline:.005,rotation:[0,0,PI/2]});
  // Roof water tank and vents.
  addCylinder(bar,[.68,.74],1.24,[11.9,6.86,-9.0],mats.metal,{segments:18,outline:.02});
  addCylinder(bar,[.78,.78],.1,[11.9,7.53,-9.0],mats.metalDark,{segments:18,outline:.012});
  for(const x of [11.3,12.5]){
    addCylinder(bar,[.06,.06],.64,[x,6.42,-9.0],mats.metalDark,{segments:8,outline:0});
  }
  addCylinder(bar,[.09,.09],.95,[9.35,6.7,-4.8],mats.metal,{segments:8,outline:.006});
  addBox(bar,[.6,.4,.5],[10.1,6.4,-4.7],mats.metalDark,{outline:.015});
  addCylinder(bar,[.03,.03],1.8,[12.55,7.15,-7.4],mats.metal,{segments:6,outline:0,castShadow:false});
  addBox(bar,[1.1,.035,.035],[12.0,8.0,-7.4],mats.metal,{outline:0,castShadow:false});
  addBox(bar,[.85,.03,.03],[11.6,7.8,-7.4],mats.metal,{outline:0,castShadow:false});
  // Wall vent and laundry pole.
  addBox(bar,[.35,.24,.08],[10.6,3.45,z1+.02],mats.metalDark,{outline:0,castShadow:false});
  // Crates and pots at the alley entrance.
  addBox(bar,[.52,.35,.48],[7.35,.38,-6.2],mats.woodLight,{outline:.015,rotation:[0,-.2,0]});
  addBox(bar,[.46,.3,.4],[7.36,.68,-6.2],mats.wood,{outline:.012,rotation:[0,.15,0]});
  addGroundPlane(bar,.9,.15,[7.4,.145,-5.5],toon(0x3d5f50),{name:'bar-door-mat'});
  return {group:bar,pinkLight,lanternLight,entranceLight};
}

function buildAlleyGate(parent,mats){
  const group=new THREE.Group();group.name='alley-gate';parent.add(group);
  const x0=4.44,x1=7.55,z=-2.72,y=3.55;
  addBox(group,[x1-x0,.18,.18],[(x0+x1)/2,y,z],mats.wood,{outline:.02});
  addBox(group,[x1-x0+.35,.025,.7],[(x0+x1)/2,y+.14,z+.02],mats.trim,{outline:.012,rotation:[.05,0,0]});
  addBox(group,[.18,.08,.55],[x0,y+.04,z+.05],mats.metalDark,{outline:0,castShadow:false});
  addBox(group,[.18,.08,.55],[x1,y+.04,z+.05],mats.metalDark,{outline:0,castShadow:false});
  // A small hand-lettered alley sign.
  const {canvas,ctx}=textureCanvas(512,256);
  ctx.fillStyle='#2b312d';ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='#a98a5d';ctx.lineWidth=6;ctx.strokeRect(13,13,486,230);
  ctx.fillStyle='#e8ddc2';ctx.textAlign='center';
  ctx.font='600 82px "Yu Mincho","Hiragino Mincho ProN",serif';ctx.fillText('雨宮小路',256,124);
  ctx.fillStyle='#9fbab2';ctx.font='500 24px "Yu Gothic","Meiryo",sans-serif';ctx.letterSpacing='7px';ctx.fillText('AMEAMI LANE',256,181);ctx.letterSpacing='0px';
  ctx.fillStyle='#bd8b64';ctx.fillRect(154,206,204,3);
  const signMat=new THREE.MeshBasicMaterial({map:canvasTexture(canvas)});
  addBox(group,[1.42,.74,.05],[(x0+x1)/2,y-.53,z+.09],mats.wood,{outline:.012,castShadow:false});
  addPlane(group,1.28,.61,[(x0+x1)/2,y-.53,z+.12],signMat,{name:'alley-sign'}).renderOrder=4;
  addCylinder(group,[.012,.012],.42,[(x0+x1)/2-.55,y-.28,z+.08],mats.metalDark,{segments:4,outline:0,castShadow:false});
  addCylinder(group,[.012,.012],.42,[(x0+x1)/2+.55,y-.28,z+.08],mats.metalDark,{segments:4,outline:0,castShadow:false});
  // Two paper lanterns mark the lane from the main street.
  for(const lx of [x0+.42,x1-.42]){
    addCylinder(group,[.15,.15],.45,[lx,y-.44,z+.18],basic(0xe08d72),{segments:12,outline:.01,castShadow:false});
    addCylinder(group,[.17,.17],.045,[lx,y-.2,z+.18],mats.metalDark,{segments:12,outline:0,castShadow:false});
    addCylinder(group,[.17,.17],.045,[lx,y-.68,z+.18],mats.metalDark,{segments:12,outline:0,castShadow:false});
    addCylinder(group,[.01,.01],.3,[lx,y+.22,z+.18],mats.metalDark,{segments:4,outline:0,castShadow:false});
    addGlow(group,{color:0xffa56d,size:.8,opacity:.25,position:[lx,y-.45,z+.25]});
  }
  const light=new THREE.PointLight(0xffab73,14,4.5,2);
  light.position.set((x0+x1)/2,y-.65,z+.4);group.add(light);
  return {group,light};
}

function buildAlleyDetails(parent,mats){
  const group=new THREE.Group();group.name='alley-details';parent.add(group);
  // Rear fence closes the little alley without walling it in.
  addBox(group,[4.35,1.85,.25],[5.2,1.0,-12.55],mats.wood,{outline:.025});
  for(let i=0;i<7;i++){
    addBox(group,[.07,1.9,.29],[3.15+i*.66,1.0,-12.55],mats.wood,{outline:.008,castShadow:false});
  }
  addBox(group,[4.6,.17,.34],[5.2,2.0,-12.55],mats.metalDark,{outline:.012});
  addBox(group,[1.1,1.75,.08],[5.25,.95,-12.39],mats.metalDark,{outline:.012});
  addBox(group,[.75,.06,.04],[5.25,1.27,-12.33],mats.metal,{outline:0,castShadow:false});
  addBox(group,[.12,.34,.13],[5.25,.78,-12.32],mats.metal,{outline:0,castShadow:false});
  const backLight=new THREE.PointLight(0xffbd82,12,4.5,2);
  backLight.position.set(5.25,1.35,-11.9);group.add(backLight);
  addGlow(group,{color:0xffc18a,size:1.1,opacity:.25,position:[5.25,1.35,-12.05]});
  // Pipes and cable runs down the alley.
  addCylinder(group,[.045,.045],5.4,[6.95,2.85,-10.8],mats.metal,{segments:8,outline:.006});
  addCylinder(group,[.045,.045],.7,[6.7,.4,-10.8],mats.metal,{segments:8,outline:.006,rotation:[0,0,PI/2]});
  addCylinder(group,[.03,.03],4.8,[3.15,2.55,-9.8],mats.metalDark,{segments:7,outline:0,castShadow:false});
  addBox(group,[.16,.5,.34],[3.2,1.2,-9.6],mats.wallWarm,{outline:.01});
  addBox(group,[.16,.35,.26],[3.2,2.1,-9.6],mats.metal,{outline:.008,castShadow:false});
  // String lights across the narrow alley.
  const wirePoints=[];
  for(let i=0;i<=14;i++){
    const t=i/14;
    wirePoints.push([3.1+t*3.8,3.45-Math.sin(t*PI)*.32,-9.05]);
  }
  const wireCurve=new THREE.CatmullRomCurve3(wirePoints.map(p=>new THREE.Vector3(...p)));
  const wire=new THREE.Mesh(new THREE.TubeGeometry(wireCurve,24,.01,4,false),mats.metalDark);
  group.add(wire);
  for(let i=0;i<5;i++){
    const bulbX=3.55+i*.76,bulbY=3.4-Math.sin(((bulbX-3.1)/3.8)*PI)*.32-.12;
    addCylinder(group,[.06,.065],.11,[bulbX,bulbY,-9.05],mats.warmBulb,{segments:8,outline:0,castShadow:false});
    addCylinder(group,[.022,.022],.12,[bulbX,bulbY+.1,-9.05],mats.metalDark,{segments:6,outline:0,castShadow:false});
    addGlow(group,{color:0xffc991,size:.45,opacity:.34,position:[bulbX,bulbY,-9.04]});
  }
  const stringLight=new THREE.PointLight(0xffc28b,16,5.4,2);
  stringLight.position.set(5.0,3.0,-8.9);group.add(stringLight);
  // Crates and recycling sacks.
  addBox(group,[.45,.5,.38],[6.55,.4,-5.0],mats.bluePaint,{outline:.012,rotation:[0,.2,0]});
  addBox(group,[.52,.38,.4],[6.58,.24,-5.62],mats.woodLight,{outline:.012,rotation:[0,-.1,0]});
  for(let i=0;i<3;i++){
    const bag=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),mats.blackRubber);
    bag.position.set(6.2-i*.28,.3,-11.3+(i%2)*.42);
    bag.scale.set(1,.9,.8);bag.castShadow=true;group.add(bag);
  }
  // A small black cat on the crates, a quiet bit of neighbourhood life.
  const cat=new THREE.Group();cat.name='alley-cat';cat.position.set(7.36,.82,-6.2);group.add(cat);
  const catMat=toon(0x1a2026);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.17,12,8),catMat);
  body.scale.set(1.15,.95,.8);body.position.y=.18;body.castShadow=true;cat.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),catMat);
  head.position.set(.12,.36,.03);head.castShadow=true;cat.add(head);
  for(const z of [-.07,.09]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.045,.1,4),catMat);
    ear.position.set(.13,.48,z);ear.rotation.z=z>0?.14:-.14;cat.add(ear);
  }
  for(const z of [-.055,.06]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),basic(0xe8c66b));
    eye.position.set(.23,.37,z);cat.add(eye);
  }
  const tail=new THREE.Mesh(new THREE.TorusGeometry(.17,.022,5,16,PI*1.2),catMat);
  tail.position.set(-.14,.22,0);tail.rotation.set(PI/2,.1,1.2);cat.add(tail);
  // Drain steam / small paper scraps.
  addPlane(group,.22,.34,[3.55,.075,-3.25],toon(0xd9d4c4),{rotation:[-PI/2,0,.4],name:'paper-scrap'}).renderOrder=2;
  addBox(group,[.36,.05,.6],[6.25,.08,-7.2],mats.concrete,{outline:0,receiveShadow:true});
  return {group,lights:[stringLight,backLight]};
}

export function buildProps(parent,mats){
  const props=new THREE.Group();props.name='konbini-props';parent.add(props);
  const vending=buildVendingMachine(props,mats);
  const bins=buildTrashStation(props,mats);
  const aframe=buildAframe(props,mats);
  const umbrellas=buildUmbrellaStand(props,mats);
  const bike=buildBicycle(props,mats);
  const van=buildKeiVan(props,mats);
  const pedestrian=buildUmbrellaFigure(props,mats);
  const shopDetails=buildLooseShopWall(props,mats);
  const bar=buildBar(props,mats);
  const alleyGate=buildAlleyGate(props,mats);
  const alley=buildAlleyDetails(props,mats);
  return {
    group:props,
    lights:[vending.light,bar.pinkLight,bar.lanternLight,bar.entranceLight,van.light,alleyGate.light,...alley.lights],
    vendingLight:vending.light,
    barPinkLight:bar.pinkLight,
    barLanternLight:bar.lanternLight,
    barEntranceLight:bar.entranceLight,
    bike,
    van,
    pedestrian,
    umbrellas
  };
}
