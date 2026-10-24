import * as THREE from 'three';
import {
  PI,addBox,addCylinder,addPlane,addRounded,toon,basic,standard,makeRng,addGlow
} from './konbini-utils.js';

const X0=-8.8;
const X1=2.8;
const Z0=-11.0;
const Z1=-2.25;
const W=X1-X0;
const D=Z1-Z0;
const ROOF=5.36;
const GLASS_TOP=3.08;
const CENTER_X=(X0+X1)/2;

function windowPanel(parent,mats,{x0,x1,y0,y1,z,divisions=2,glassMaterial='glass',opacity=.11,frame=.075,decal=null,decalScale=1}){
  const width=x1-x0;
  const height=y1-y0;
  const frameMat=mats.trim;
  addBox(parent,[width+frame*2,frame,.18],[(x0+x1)/2,y0-frame*.5,z],frameMat,{outline:.012,castShadow:false});
  addBox(parent,[width+frame*2,frame,.18],[(x0+x1)/2,y1+frame*.5,z],frameMat,{outline:.012,castShadow:false});
  for(let i=0;i<=divisions+1;i++){
    const xx=x0+width/(divisions+1)*i;
    addBox(parent,[frame*1.12,height+frame*1.8,.17],[xx,(y0+y1)/2,z],frameMat,{outline:.01,castShadow:false});
  }
  const spacing=width/(divisions+1);
  for(let i=0;i<=divisions;i++){
    const px=x0+spacing*(i+.5);
    const material=mats[glassMaterial].clone();
    material.opacity=opacity;
    material.transparent=true;
    material.depthWrite=false;
    const mesh=addPlane(parent,spacing-frame*.8,height-.02,[px,(y0+y1)/2,z+.06],material,{name:'shop-window-glass'});
    mesh.renderOrder=4;
  }
  const sheen=addPlane(parent,width,height,[(x0+x1)/2,(y0+y1)/2,z+.075],mats.glassSheen,{name:'window-sheen'});
  sheen.renderOrder=3;
  if(decal){
    const plane=addPlane(parent,width*decalScale,height*decalScale,[(x0+x1)/2,(y0+y1)/2,z+.088],decal,{name:'window-decal'});
    plane.renderOrder=6;
  }
  // A thin wet neon catch along the sill.
  addBox(parent,[width,.025,.03],[(x0+x1)/2,y0+.01,z+.12],mats.trimLight,{outline:0,castShadow:false});
}

function makeProductMesh(parent,mats,items){
  if(!items.length)return null;
  const geometry=new THREE.BoxGeometry(1,1,1);
  const mesh=new THREE.InstancedMesh(geometry,mats.products,items.length);
  const dummy=new THREE.Object3D();
  const color=new THREE.Color();
  items.forEach((item,index)=>{
    dummy.position.set(item.x,item.y,item.z);
    dummy.scale.set(item.w,item.h,item.d);
    dummy.rotation.set(0,item.ry||0,0);
    dummy.updateMatrix();
    mesh.setMatrixAt(index,dummy.matrix);
    color.setHex(item.color);
    mesh.setColorAt(index,color);
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  mesh.name='instanced-products';
  parent.add(mesh);
  return mesh;
}

function buildInterior(store,mats){
  const interior=new THREE.Group();
  interior.name='store-interior';
  store.add(interior);
  const floorY=.31;

  addBox(interior,[W-.3,.12,D-.3],[CENTER_X,floorY-.06,(Z0+Z1)/2],mats.interiorFloor,{outline:0,receiveShadow:true});
  addBox(interior,[W-.35,.1,D-.35],[CENTER_X,3.17,(Z0+Z1)/2],mats.interiorCeiling,{outline:0,castShadow:false});
  addBox(interior,[.16,3,D-.2],[X0+.08,1.7,(Z0+Z1)/2],mats.interiorWall,{outline:0});
  addBox(interior,[W-.2,3,.16],[CENTER_X,1.7,Z0+.08],mats.interiorWall,{outline:0});

  // Ceiling fluorescent light lines.
  for(let i=0;i<3;i++){
    const x=-6.4+i*3.15;
    addBox(interior,[.16,.055,4.8],[x,3.11,-7.35],mats.ceilingLight,{outline:0,castShadow:false});
    addBox(interior,[.28,.07,4.92],[x,3.16,-7.35],mats.interiorCeiling,{outline:0,castShadow:false});
  }
  for(let i=0;i<2;i++){
    const x=-7.2+i*4.9;
    addBox(interior,[1.9,.04,.16],[x,3.11,-3.2],mats.ceilingLight,{outline:0,castShadow:false});
  }

  // Back-wall refrigerators.
  const fridgeX0=-5.7,fridgeX1=2.45,fridgeZ=Z0+.35;
  const bays=5,bayWidth=(fridgeX1-fridgeX0)/bays,fridgeH=2.45;
  addBox(interior,[fridgeX1-fridgeX0+.2,.18,.7],[(fridgeX0+fridgeX1)/2,floorY+.55,fridgeZ-.1],mats.metalDark,{outline:.02});
  addBox(interior,[fridgeX1-fridgeX0,fridgeH,.12],[(fridgeX0+fridgeX1)/2,floorY+1.35,fridgeZ-.38],mats.fridgePanel,{outline:0,castShadow:false});
  addBox(interior,[fridgeX1-fridgeX0+.1,.14,.25],[(fridgeX0+fridgeX1)/2,floorY+fridgeH+.05,fridgeZ-.24],mats.metalDark,{outline:.012});
  for(let i=0;i<=bays;i++){
    const x=fridgeX0+bayWidth*i;
    addBox(interior,[.07,fridgeH+.05,.28],[x,floorY+1.35,fridgeZ-.17],mats.metalDark,{outline:.008});
    if(i<bays){
      const center=x+bayWidth/2;
      addBox(interior,[bayWidth-.13,.035,.06],[center,floorY+1.2,fridgeZ-.28],mats.ceilingLight,{outline:0,castShadow:false});
      addBox(interior,[bayWidth-.13,.035,.06],[center,floorY+1.75,fridgeZ-.28],mats.ceilingLight,{outline:0,castShadow:false});
      addBox(interior,[bayWidth-.13,.035,.06],[center,floorY+2.28,fridgeZ-.28],mats.ceilingLight,{outline:0,castShadow:false});
      for(let s=0;s<3;s++){
        addBox(interior,[bayWidth-.13,.035,.3],[center,floorY+.94+s*.55,fridgeZ-.22],mats.metal,{outline:.006,castShadow:false});
      }
      addBox(interior,[.035,.6,.08],[x+bayWidth-.19,floorY+1.4,fridgeZ+.03],mats.metal,{outline:0,castShadow:false});
      const planeMat=mats.glass.clone();planeMat.opacity=.09;planeMat.depthWrite=false;
      addPlane(interior,bayWidth-.18,fridgeH-.1,[center,floorY+1.35,fridgeZ+.1],planeMat,{name:'fridge-glass'});
    }
  }

  const products=[];
  const palette=mats.productPalette;
  const rng=makeRng(8239);
  const addProduct=(x,y,z,w,h,d,color,ry=0)=>products.push({x,y,z,w,h,d,color,ry});
  for(let bay=0;bay<bays;bay++){
    const bx=fridgeX0+bayWidth*bay+bayWidth/2;
    for(let shelf=0;shelf<3;shelf++){
      const shelfY=floorY+.96+shelf*.55;
      for(let row=0;row<2;row++){
        for(let col=0;col<6;col++){
          const w=.12+rng()*.025;
          const h=.21+rng()*.1;
          const d=.11;
          addProduct(
            bx-(bayWidth-.27)/2+.1+col*(bayWidth-.35)/5,
            shelfY+h/2,
            fridgeZ-.12-row*.14,
            w,h,d,palette[Math.floor(rng()*palette.length)],
            (rng()-.5)*.12
          );
        }
      }
    }
  }

  // Centre gondola shelving: two long islands with visible package rows.
  const islands=[
    {cx:-5.9,cz:-6.45,w:1.25,d:4.25},
    {cx:-1.55,cz:-6.55,w:1.3,d:4.05}
  ];
  for(const island of islands){
    const x0=island.cx-island.w/2,x1=island.cx+island.w/2;
    const z0=island.cz-island.d/2,z1=island.cz+island.d/2;
    addBox(interior,[island.w,.18,island.d],[island.cx,floorY+.16,island.cz],mats.metalDark,{outline:.015});
    addBox(interior,[.07,1.65,island.d],[island.cx,floorY+.92,island.cz],mats.trim,{outline:.01,castShadow:false});
    for(let side=-1;side<=1;side+=2){
      const sx=island.cx+side*(island.w/2-.18);
      for(let level=0;level<4;level++){
        const sy=floorY+.28+level*.38;
        addBox(interior,[island.w-.1,.055,island.d-.16],[island.cx,sy,island.cz],mats.ceilingLight,{outline:0,castShadow:false});
        for(let row=0;row<8;row++){
          for(let col=0;col<3;col++){
            const w=.16+rng()*.06,h=.16+rng()*.15,d=.11+rng()*.04;
            addProduct(
              sx+(side===1?-1:1)*(.03+col*.17),
              sy+.03+h/2,
              z0+.35+row*((island.d-.7)/7)+(rng()-.5)*.04,
              w,h,d,palette[Math.floor(rng()*palette.length)],
              (rng()-.5)*.12
            );
          }
        }
      }
    }
  }

  // Wall shelves along the right-hand interior.
  for(let level=0;level<4;level++){
    const y=floorY+.4+level*.52;
    addBox(interior,[.34,.05,3.3],[X1-.38,y,-6.9],mats.ceilingLight,{outline:.008,castShadow:false});
    for(let row=0;row<11;row++){
      for(let col=0;col<2;col++){
        const h=.18+rng()*.2;
        addProduct(X1-.55-col*.22,y+.03+h/2,Z0+2.2+row*.28,.2,h,.2,palette[Math.floor(rng()*palette.length)],(rng()-.5)*.2);
      }
    }
  }

  // Checkout counter and register.
  const counterX=-7.1,counterZ=-3.7;
  addBox(interior,[1.75,.92,.9],[counterX,floorY+.48,counterZ],mats.wood,{outline:.022});
  addBox(interior,[1.82,.07,1.0],[counterX,floorY+1.0,counterZ],mats.woodLight,{outline:.015});
  addBox(interior,[1.55,.36,.04],[counterX,floorY+.42,counterZ+.47],mats.trim,{outline:.01});
  addBox(interior,[1.4,.06,.04],[counterX-1.58,floorY+.82,counterZ+.03],mats.metal,{outline:.01});
  const registerX=counterX-.4,registerZ=counterZ+.02;
  addBox(interior,[.54,.26,.42],[registerX,floorY+1.17,registerZ],mats.black,{outline:.015});
  addBox(interior,[.46,.34,.03],[registerX,floorY+1.43,registerZ+.19],mats.black,{outline:.008,rotation:[-.22,0,0]});
  addPlane(interior,.37,.25,[registerX,floorY+1.44,registerZ+.215],basic(0x7df4ce),{rotation:[-.22,0,0],name:'register-screen'});
  addBox(interior,[.3,.11,.23],[registerX+.05,floorY+1.11,registerZ+.35],mats.metal,{outline:.006});
  addBox(interior,[.26,.12,.36],[counterX+.55,floorY+1.09,counterZ+.18],mats.metalDark,{outline:.008});
  addBox(interior,[.48,.02,.34],[counterX-.45,floorY+1.05,counterZ-.12],mats.dark,{outline:0,castShadow:false});
  const counterLamp=addGlow(interior,{color:0xffd8a2,size:.7,opacity:.3,position:[counterX,floorY+1.6,counterZ-.1]});
  counterLamp.renderOrder=7;

  // Magazine rack by the front window.
  const rackX=.6,rackZ=-3.1;
  addBox(interior,[1.8,.62,.7],[rackX,floorY+.31,rackZ],mats.wood,{outline:.018});
  for(let row=0;row<3;row++){
    for(let col=0;col<5;col++){
      const w=.25,h=.33,d=.035;
      addBox(interior,[w,h,d],[rackX-.68+col*.34,floorY+.39+row*.31,rackZ+.31],mats.wallWarm,{outline:0,castShadow:false,rotation:[-.3,0,0]});
      addProduct(rackX-.68+col*.34,floorY+.39+row*.31,rackZ+.33,w*.9,h*.8,.03,palette[Math.floor(rng()*palette.length)],0);
    }
  }

  // Front promo hangers.
  const banners=[mats.hangingBanners[0],mats.hangingBanners[1],mats.hangingBanners[2]];
  banners.forEach((material,index)=>{
    const x=-5.9+index*3.1;
    addPlane(interior,.82,.42,[x,2.58,-3.12],material,{name:'hanging-banner'});
    addBox(interior,[.012,.46,.012],[x-.34,2.98,-3.12],mats.metal,{outline:0,castShadow:false});
    addBox(interior,[.012,.46,.012],[x+.34,2.98,-3.12],mats.metal,{outline:0,castShadow:false});
  });

  // A few boxes and a stool in the back corner.
  addBox(interior,[.5,.34,.4],[X0+1.0,floorY+.17,-9.7],mats.woodLight,{outline:.015,rotation:[0,.25,0]});
  addBox(interior,[.4,.28,.36],[X0+.55,floorY+.45,-9.75],mats.wallWarm,{outline:.012,rotation:[0,-.1,0]});
  addCylinder(interior,[.18,.2],.52,[-4.7,floorY+.26,-9.3],mats.metalDark,{outline:.015,segments:14});

  makeProductMesh(interior,mats,products);

  const warm=new THREE.PointLight(0xffd59a,32,11,2);
  warm.position.set(-3.2,2.72,-4.7);interior.add(warm);
  const warmBack=new THREE.PointLight(0xffcc90,21,10,2);
  warmBack.position.set(-6.7,2.45,-8.3);interior.add(warmBack);
  const cool=new THREE.PointLight(0xa8efff,27,10,2);
  cool.position.set(1.2,2.65,-8.65);interior.add(cool);
  const fridgeLight=new THREE.PointLight(0xbdf9ff,18,6,2);
  fridgeLight.position.set(-1.5,1.7,-10.1);interior.add(fridgeLight);

  return {interior,productsCount:products.length};
}

function fan(parent,mats,position,radius=.36,facing='up'){
  const group=new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  const ringMat=mats.metalDark;
  const torus=new THREE.Mesh(new THREE.TorusGeometry(radius,radius*.035,8,28),ringMat);
  if(facing==='up')torus.rotation.x=PI/2; else torus.rotation.y=PI/2;
  group.add(torus);
  const small=new THREE.Mesh(new THREE.TorusGeometry(radius*.67,radius*.018,6,24),mats.metal);
  if(facing==='up')small.rotation.x=PI/2; else small.rotation.y=PI/2;
  group.add(small);
  for(let i=0;i<4;i++){
    const blade=addBox(group,[radius*.82,radius*.035,.08],[0,0,0],mats.metalDark,{rotation:[0,i*PI/2,0],outline:0,castShadow:false,receiveShadow:false});
    blade.position.x=Math.cos(i*PI/2)*radius*.38;
    blade.position.z=Math.sin(i*PI/2)*radius*.38;
    blade.scale.z*=.7;
  }
  if(facing==='up'){
    for(let i=0;i<4;i++){
      const bar=new THREE.Mesh(new THREE.BoxGeometry(radius*2.05,.015,.02),mats.metal);
      bar.position.y=.012;bar.rotation.y=i*PI/4;group.add(bar);
    }
  }else{
    for(let i=0;i<4;i++){
      const bar=new THREE.Mesh(new THREE.BoxGeometry(.015,radius*2.05,.02),mats.metal);
      bar.rotation.x=i*PI/4;group.add(bar);
    }
    group.rotation.y=PI/2;
  }
  return group;
}

function buildRoof(store,mats){
  const roof=new THREE.Group();
  roof.name='store-roof';
  store.add(roof);
  addBox(roof,[W+.35,.2,D+.15],[CENTER_X,ROOF-.1,(Z0+Z1)/2],mats.trim,{outline:.03});
  addBox(roof,[W+.15,.05,D-.05],[CENTER_X,ROOF+.025,(Z0+Z1)/2],mats.gravel,{outline:0,receiveShadow:true,castShadow:false});
  // Parapet along visible roof edges.
  addBox(roof,[W+.38,.42,.18],[CENTER_X,ROOF+.21,Z0-.02],mats.trim,{outline:.02});
  addBox(roof,[.18,.42,D+.18],[X0-.06,ROOF+.21,(Z0+Z1)/2],mats.trim,{outline:.02});
  addBox(roof,[.18,.42,D+.18],[X1+.06,ROOF+.21,(Z0+Z1)/2],mats.trim,{outline:.02});
  addBox(roof,[W+.38,.1,.08],[CENTER_X,ROOF+.4,Z0-.08],mats.trimLight,{outline:0,castShadow:false});

  // Rooftop AC condensers.
  function condenser(x,z,scale=1){
    const y=ROOF+.05;
    addBox(roof,[1.35*scale,.68,.92*scale],[x,y+.38,z],mats.wall,{outline:.025,rotation:[0,(x>0?-.08:.04),0]});
    addBox(roof,[1.43*scale,.1,.98*scale],[x,y+.75,z],mats.metal,{outline:.015});
    fan(roof,mats,[x,y+.78,z],.3*scale,'up');
    addBox(roof,[.12,.38,.74*scale],[x-1.05*scale,y+.33,z],mats.metalDark,{outline:.012});
    for(let i=0;i<5;i++)addBox(roof,[.72*scale,.02,.02],[x-.35,y+.37+i*.08,z+.47*scale],mats.metal,{outline:0,castShadow:false});
    addCylinder(roof,[.035,.035],.45,[x+.6*scale,y+.22,z-.18],mats.metal,{segments:8,outline:0});
  }
  condenser(-5.2,-8.6,1.02);
  condenser(.35,-8.8,.82);

  // Stair / plant enclosure near the back.
  addBox(roof,[1.8,1.45,2.0],[X0+1.6,ROOF+.73,Z0+1.4],mats.wallShade,{outline:.03});
  addBox(roof,[1.9,.12,2.12],[X0+1.6,ROOF+1.48,Z0+1.4],mats.trim,{outline:.015});
  addBox(roof,[.55,1.3,.08],[X0+1.1,ROOF+.7,Z0+2.42],mats.metalDark,{outline:.01});
  addBox(roof,[.5,.08,.06],[X0+1.1,ROOF+.95,Z0+2.48],mats.metal,{outline:0,castShadow:false});
  addCylinder(roof,[.075,.075],.65,[X0+3.0,ROOF+.35,Z0+2.6],mats.metal,{segments:10,outline:.008});
  addCylinder(roof,[.1,.1],.18,[X0+3.0,ROOF+.72,Z0+2.6],mats.metalDark,{segments:10,outline:.008});
  addCylinder(roof,[.035,.035],2.4,[X1-1.1,ROOF+1.2,Z0+1.0],mats.metal,{segments:8,outline:0});
  addBox(roof,[.9,.035,.035],[X1-1.55,ROOF+2.1,Z0+1.0],mats.metal,{outline:0,castShadow:false});
  addBox(roof,[.9,.035,.035],[X1-1.55,ROOF+1.9,Z0+1.0],mats.metal,{outline:0,castShadow:false});
  addBox(roof,[.5,.18,.34],[X1-1.0,ROOF+.13,Z0+1.2],mats.metalDark,{outline:.01});
  // Roof puddle / wet patch.
  const puddleMat=standard(0x162e36,{roughness:.08,metalness:.55,transparent:true,opacity:.64});
  addBox(roof,[1.25,.015,.62],[X0+4.5,ROOF+.045,-5.2],puddleMat,{outline:0,castShadow:false,receiveShadow:false,rotation:[0,.2,0]});
  addBox(roof,[1.9,.013,.74],[X0+8.1,ROOF+.043,-8.3],puddleMat,{outline:0,castShadow:false,receiveShadow:false,rotation:[0,-.35,0]});

  // Maintenance walkway, skylight and rain-dark ventilation.
  addBox(roof,[W-.5,.05,.32],[CENTER_X,ROOF+.056,Z0+.5],mats.concreteDark,{outline:0,castShadow:false});
  addBox(roof,[.32,.05,D-.9],[X1-.45,ROOF+.056,(Z0+Z1)/2],mats.concreteDark,{outline:0,castShadow:false});
  addBox(roof,[1.75,.15,1.08],[-5.2,ROOF+.1,-3.4],mats.metalDark,{outline:.018});
  addBox(roof,[1.52,.045,.88],[-5.2,ROOF+.19,-3.4],mats.frosted,{outline:0,castShadow:false});
  addBox(roof,[1.62,.03,.06],[-5.2,ROOF+.225,-3.4],mats.trimLight,{outline:0,castShadow:false});
  for(let i=0;i<4;i++){
    addBox(roof,[.055,.19,.86],[-5.82+i*.42,ROOF+.11,-3.4],mats.metal,{outline:.004,castShadow:false});
  }
  addBox(roof,[.52,.34,.42],[1.3,ROOF+.22,-4.0],mats.metalDark,{outline:.012});
  addBox(roof,[.36,.12,.3],[1.3,ROOF+.42,-4.0],mats.metal,{outline:.006,castShadow:false});
  addCylinder(roof,[.06,.06],.42,[1.3,ROOF+.5,-3.75],mats.metal,{segments:8,outline:.004});
  addCylinder(roof,[.14,.14],.06,[1.3,ROOF+.72,-3.75],mats.metalDark,{segments:10,outline:0,castShadow:false});
  // Duct run between the two condensers.
  addBox(roof,[2.4,.16,.22],[-2.2,ROOF+.22,-7.2],mats.metal,{outline:.012,castShadow:false});
  for(const x of [-2.9,-1.5]){
    addBox(roof,[.1,.3,.1],[x,ROOF+.08,-7.2],mats.metalDark,{outline:0,castShadow:false});
  }
  // A small roof hatch with a warm work light.
  addBox(roof,[1.5,.28,1.45],[X0+4.2,ROOF+.19,-9.0],mats.metalDark,{outline:.02});
  addBox(roof,[1.62,.07,1.57],[X0+4.2,ROOF+.37,-9.0],mats.trim,{outline:.012});
  addCylinder(roof,[.05,.05],.95,[X0+3.4,ROOF+.52,-9.65],mats.metal,{segments:6,outline:0,castShadow:false});
  addBox(roof,[.2,.25,.16],[X0+3.4,ROOF+.95,-9.65],mats.metalDark,{outline:.006});
  addCylinder(roof,[.14,.18],.16,[X0+3.4,ROOF+.78,-9.65],mats.warmBulb,{segments:10,outline:0,castShadow:false});
  addGlow(roof,{color:0xffc27e,size:.8,opacity:.22,position:[X0+3.4,ROOF+.78,-9.5]});
  addCylinder(roof,[.09,.11],.52,[X0+7.2,ROOF+.28,-3.0],mats.metal,{segments:8,outline:.006});
  addCylinder(roof,[.14,.14],.05,[X0+7.2,ROOF+.56,-3.0],mats.metalDark,{segments:8,outline:0,castShadow:false});
  return roof;
}

function buildFacade(store,mats){
  const fa=new THREE.Group();
  fa.name='store-facade';
  store.add(fa);
  // Main wall masses and the glazed shopfront podium.
  addBox(fa,[W,.34,.3],[CENTER_X,.39,Z1+.01],mats.wall,{outline:.025});
  addBox(fa,[W,.24,.3],[CENTER_X,.18,Z1+.04],mats.trim,{outline:.02});
  addBox(fa,[4.42,.33,.22],[-6.14,.39,Z1+.11],mats.trim,{outline:.016,castShadow:false});
  addBox(fa,[3.06,.33,.22],[.79,.39,Z1+.11],mats.trim,{outline:.016,castShadow:false});
  addBox(fa,[W,.42,.3],[CENTER_X,GLASS_TOP+.2,Z1+.01],mats.trim,{outline:.02});
  addBox(fa,[W,.86,.22],[CENTER_X,3.73,Z1+.08],mats.wallShade,{outline:.02});
  addBox(fa,[.4,3.3,.32],[X0+.2,1.78,Z1+.03],mats.wall,{outline:.025});
  addBox(fa,[.4,3.3,.32],[X1-.2,1.78,Z1+.03],mats.wall,{outline:.025});
  addBox(fa,[.28,3.3,.28],[-3.78,1.78,Z1+.02],mats.wallShade,{outline:.018});
  addBox(fa,[.22,2.4,.28],[-.86,1.58,Z1+.02],mats.trim,{outline:.012});

  windowPanel(fa,mats,{x0:-8.35,x1:-3.95,y0:.48,y1:GLASS_TOP,z:Z1+.15,divisions:2});
  windowPanel(fa,mats,{x0:-.68,x1:2.35,y0:.48,y1:GLASS_TOP,z:Z1+.15,divisions:2});

  // Entrance frame and dual sliding doors.
  const dx0=-3.66,dx1=-.98;
  addBox(fa,[dx1-dx0,.28,.48],[(dx0+dx1)/2,.14,Z1+.02],mats.concrete,{outline:.02});
  addBox(fa,[.14,2.82,.3],[dx0,1.52,Z1+.02],mats.trim,{outline:.012});
  addBox(fa,[.14,2.82,.3],[dx1,1.52,Z1+.02],mats.trim,{outline:.012});
  addBox(fa,[dx1-dx0,.18,.3],[(dx0+dx1)/2,2.93,Z1+.02],mats.trim,{outline:.012});
  const doorTop=2.82;
  const doorPanels=[{x:-3.05,w:1.16,offset:-.03},{x:-1.56,w:1.16,offset:.03}];
  for(const panel of doorPanels){
    const center=panel.x+panel.offset;
    addBox(fa,[panel.w,.085,.1],[center,doorTop-.28,Z1+.16],mats.metalDark,{outline:.008,castShadow:false});
    addBox(fa,[panel.w,.08,.1],[center,.48,Z1+.16],mats.metalDark,{outline:.008,castShadow:false});
    addBox(fa,[.08,2.24,.1],[center-panel.w/2,1.65,Z1+.16],mats.metalDark,{outline:.008,castShadow:false});
    addBox(fa,[.08,2.24,.1],[center+panel.w/2,1.65,Z1+.16],mats.metalDark,{outline:.008,castShadow:false});
    const pane=mats.glass.clone();pane.opacity=.13;pane.depthWrite=false;
    addPlane(fa,panel.w-.13,2.1,[center,1.63,Z1+.18],pane,{name:'auto-door-pane'}).renderOrder=5;
    const doorSheen=addPlane(fa,panel.w-.2,2.05,[center,1.63,Z1+.202],mats.glassSheen,{name:'door-sheen'});
    doorSheen.renderOrder=4;
    addBox(fa,[.045,1.0,.06],[center+(panel.offset<0?panel.w*.34:-panel.w*.34),1.58,Z1+.24],mats.metal,{outline:0,castShadow:false});
  }
  const doorBadge=addPlane(fa,.78,.39,[-2.3,2.55,Z1+.245],mats.doorBadge,{name:'auto-door-sticker'});
  doorBadge.renderOrder=7;
  const atm=addPlane(fa,1.9,.95,[-4.9,2.32,Z1+.255],mats.atmBadge,{name:'atm-sticker'});
  atm.renderOrder=7;
  const sale=addPlane(fa,1.02,1.02,[-7.55,1.32,Z1+.245],mats.saleSticker,{name:'sale-sticker'});
  sale.renderOrder=7;

  // Entry step and mat.
  addBox(fa,[3.6,.14,1.0],[-2.32,.07,Z1+.6],mats.concrete,{outline:.02,receiveShadow:true});
  const mat=addPlane(fa,2.32,.9,[-2.32,.152,Z1+.68],mats.doormat,{rotation:[-PI/2,0,0],name:'entrance-mat'});
  mat.receiveShadow=true;

  // Deep eave / rain canopy over the entire frontage.
  addBox(fa,[W+.6,.12,1.42],[CENTER_X,3.39,Z1+.64],mats.trim,{outline:.022,rotation:[.035,0,0]});
  addBox(fa,[W+.62,.035,.07],[CENTER_X,3.31,Z1+1.31],mats.neonCyan,{outline:0,castShadow:false});
  addBox(fa,[W+.62,.018,.05],[CENTER_X,3.29,Z1+1.28],mats.neonCyan,{outline:0,castShadow:false});
  for(let i=0;i<5;i++){
    const x=-7.6+i*2.3;
    addCylinder(fa,[.11,.13],.1,[x,3.3,Z1+.35],mats.wallWarm,{segments:16,outline:.006,castShadow:false});
    addCylinder(fa,[.085,.085],.025,[x,3.245,Z1+.35],mats.ceilingLight,{segments:16,outline:0,castShadow:false});
  }
  // Thin support struts.
  for(const x of [-7.45,2.2]){
    addCylinder(fa,[.022,.022],1.0,[x,3.92,Z1+.58],mats.metal,{segments:6,rotation:[-.4,0,0],outline:0});
  }

  // Illuminated fascia sign.
  addBox(fa,[11.0,1.86,.32],[CENTER_X,4.43,Z1+.13],mats.trim,{outline:.028});
  addBox(fa,[11.16,.08,.38],[CENTER_X,5.37,Z1+.13],mats.trimLight,{outline:0,castShadow:false});
  const signPlane=addPlane(fa,10.92,1.77,[CENTER_X,4.43,Z1+.295],mats.signFace,{name:'konbini-sign'});
  signPlane.renderOrder=5;
  addBox(fa,[10.9,.028,.028],[CENTER_X,3.52,Z1+.3],mats.neonCyan,{outline:0,castShadow:false});
  addBox(fa,[7.8,.024,.026],[CENTER_X,5.33,Z1+.3],mats.neonPink,{outline:0,castShadow:false});
  addGlow(fa,{color:0x9de6e6,size:3.3,opacity:.15,position:[CENTER_X,4.8,Z1+.55]});

  // Neon-framed side shopfront and a projecting 24H blade sign.
  const sideGlassX=X1+.03;
  addBox(fa,[.18,.12,3.12],[sideGlassX,.5,-3.63],mats.trim,{outline:.012,castShadow:false});
  addBox(fa,[.18,.12,3.12],[sideGlassX,3.03,-3.63],mats.trim,{outline:.012,castShadow:false});
  addBox(fa,[.03,.04,3.0],[sideGlassX+.11,3.015,-3.63],mats.neonCyan,{outline:0,castShadow:false});
  for(let i=0;i<4;i++){
    addBox(fa,[.18,2.6,.1],[sideGlassX,1.75,-5.13+i*1.02],mats.trim,{outline:.01,castShadow:false});
  }
  const sideGlass=mats.glass.clone();sideGlass.opacity=.1;sideGlass.depthWrite=false;
  addPlane(fa,2.98,2.44,[sideGlassX+.1,1.76,-3.62],sideGlass,{rotation:[0,PI/2,0],name:'side-window'}).renderOrder=5;
  const sideSheen=addPlane(fa,2.95,2.4,[sideGlassX+.14,1.76,-3.62],mats.glassSheen,{rotation:[0,PI/2,0],name:'side-sheen'});
  sideSheen.renderOrder=4;
  addBox(fa,[.9,.1,1.35],[X1+.48,3.25,-4.58],mats.trim,{outline:.02,rotation:[0,0,-.03]});
  addBox(fa,[.06,.028,1.26],[X1+.9,3.18,-4.58],mats.neonCyan,{outline:0,castShadow:false});
  addGlow(fa,{color:0xbfe9dc,size:1.1,opacity:.18,position:[X1+.8,2.6,-3.6]});

  const blade=new THREE.Group();
  blade.name='blade-sign';
  store.add(blade);
  addBox(blade,[.13,2.78,.8],[X1+.48,3.78,-2.5],mats.trim,{outline:.022});
  const faceA=addPlane(blade,.78,2.68,[X1+.551,3.78,-2.5],mats.bladeSign,{rotation:[0,PI/2,0],name:'blade-sign-face'});
  faceA.renderOrder=5;
  const faceB=addPlane(blade,.78,2.68,[X1+.409,3.78,-2.5],mats.bladeSign,{rotation:[0,-PI/2,0],name:'blade-sign-back'});
  faceB.renderOrder=5;
  addBox(blade,[.72,.034,.034],[X1+.48,5.18,-2.5],mats.neonCyan,{outline:0,castShadow:false});
  addBox(blade,[.72,.034,.034],[X1+.48,2.38,-2.5],mats.neonPink,{outline:0,castShadow:false});
  for(const y of [2.7,4.9]){
    addBox(blade,[.55,.045,.045],[X1+.25,y,-2.5],mats.metal,{outline:0,castShadow:false});
  }
  const bladeLight=new THREE.PointLight(0xffe2a9,9,3.5,2);
  bladeLight.position.set(X1+.7,3.55,-2.45);blade.add(bladeLight);
  return {fa,blade,bladeLight};
}

function buildSideAndService(store,mats){
  const side=new THREE.Group();
  side.name='store-service-side';
  store.add(side);
  addBox(side,[.26,5.2,5.85],[X1+.03,2.62,-8.0],mats.wallShade,{outline:.028});
  addBox(side,[.34,.35,5.7],[X1+.08,.2,-8.0],mats.trim,{outline:.02});
  addBox(side,[.34,.14,5.8],[X1+.06,4.7,-8.0],mats.trim,{outline:.012});
  addBox(side,[.12,.85,5.78],[X1+.2,3.15,-8.0],mats.wallWarm,{outline:.012});
  for(let i=0;i<4;i++){
    addBox(side,[.04,5.0,.03],[X1+.155,2.58,-10.4+i*1.35],mats.wall,{outline:0,castShadow:false});
  }

  // Service door.
  addBox(side,[.16,2.2,1.06],[X1+.14,1.28,-7.9],mats.metalDark,{outline:.018});
  addBox(side,[.05,1.86,.8],[X1+.23,1.34,-7.9],mats.metal,{outline:.01});
  addBox(side,[.05,.38,.56],[X1+.27,1.77,-7.9],mats.trim,{outline:0,castShadow:false});
  addBox(side,[.06,1.9,.08],[X1+.27,1.3,-8.38],mats.metal,{outline:0,castShadow:false});
  addBox(side,[.06,.08,.34],[X1+.29,1.26,-8.1],mats.metal,{outline:0,castShadow:false});
  addBox(side,[.8,.12,1.35],[X1+.42,.06,-7.9],mats.concrete,{outline:.015});
  addCylinder(side,[.11,.11],.16,[X1+.2,2.55,-7.9],mats.metal,{segments:12,outline:0});
  addBox(side,[.32,.06,.16],[X1+.14,2.47,-7.9],mats.metalDark,{outline:0,castShadow:false});
  addCylinder(side,[.06,.07],.1,[X1+.22,2.38,-7.9],mats.warmBulb,{segments:10,outline:0,castShadow:false});
  addGlow(side,{color:0xffd29b,size:.72,opacity:.28,position:[X1+.34,2.35,-7.9]});

  // Wall-mounted AC condensers.
  function wallAC(z,y){
    addBox(side,[.48,.72,1.0],[X1+.28,y,z],mats.wall,{outline:.02});
    addBox(side,[.03,.62,.9],[X1+.54,y,z],mats.metal,{outline:.008,castShadow:false});
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.26,.022,6,24),mats.metalDark);
    ring.rotation.y=PI/2;ring.position.set(X1+.57,y,z);side.add(ring);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(.16,.015,6,20),mats.metalDark);
    inner.rotation.y=PI/2;inner.position.set(X1+.57,y,z);side.add(inner);
    for(let i=0;i<4;i++){
      addBox(side,[.02,.02,.5],[X1+.59,y,z],mats.metal,{outline:0,castShadow:false,rotation:[i*PI/4,0,0]});
    }
    addBox(side,[.5,.05,.08],[X1+.27,y+.38,z-.38],mats.metal,{outline:0,castShadow:false});
    addBox(side,[.5,.05,.08],[X1+.27,y+.38,z+.38],mats.metal,{outline:0,castShadow:false});
    addCylinder(side,[.025,.025],1.5,[X1+.16,y-1.2,z+.34],mats.wallShade,{segments:6,outline:0});
    addCylinder(side,[.025,.025],.35,[X1+.16,1.02,z+.34],mats.metal,{segments:6,outline:0});
  }
  wallAC(-9.5,2.2);
  wallAC(-10.4,3.3);

  // Drain pipes and utility boxes.
  for(const z of [-10.85,-5.42]){
    addCylinder(side,[.07,.07],4.3,[X1+.17,2.35,z],mats.metal,{segments:9,outline:.006});
    for(let i=0;i<3;i++)addBox(side,[.19,.06,.16],[X1+.17,.7+i*1.5,z],mats.metalDark,{outline:0,castShadow:false});
    addCylinder(side,[.07,.07],.36,[X1+.31,.36,z],mats.metal,{segments:9,rotation:[0,0,PI/2],outline:.006});
  }
  addBox(side,[.2,.55,.42],[X1+.23,1.65,-9.8],mats.metal,{outline:.014});
  addBox(side,[.05,.3,.28],[X1+.34,1.67,-9.8],mats.metalDark,{outline:0,castShadow:false});
  addBox(side,[.15,.28,.22],[X1+.23,1.03,-9.15],mats.wallWarm,{outline:.01});
  addBox(side,[.03,.18,.15],[X1+.32,1.04,-9.15],mats.black,{outline:0,castShadow:false});
  addCylinder(side,[.17,.17],.24,[X1+.27,1.9,-6.4],mats.metal,{segments:12,outline:0});

  // Cork notice board under a tiny rain hood.
  addBox(side,[.12,1.05,1.5],[X1+.2,1.58,-6.25],mats.wood,{outline:.025});
  const board=addPlane(side,1.36,.91,[X1+.27,1.58,-6.25],mats.posterBoard,{rotation:[0,PI/2,0],name:'notice-board'});
  board.castShadow=false;
  addBox(side,[.42,.06,1.7],[X1+.34,2.17,-6.25],mats.trim,{outline:.012,rotation:[0,0,.07]});
  addBox(side,[.06,.34,.06],[X1+.31,2.01,-6.95],mats.metal,{outline:0,castShadow:false});
  addBox(side,[.06,.34,.06],[X1+.31,2.01,-5.55],mats.metal,{outline:0,castShadow:false});
  const boardLight=new THREE.PointLight(0xffd9a0,7,3.2,2);
  boardLight.position.set(X1+.85,2.0,-6.25);side.add(boardLight);

  // Side fascia sign, readable as the shop is circled from the corner.
  addBox(side,[.12,.74,3.5],[X1+.17,4.08,-7.45],mats.metalDark,{outline:.02,castShadow:false});
  addBox(side,[.06,.06,3.35],[X1+.245,4.43,-7.45],mats.neonCyan,{outline:0,castShadow:false});
  const sideSign=addPlane(side,3.28,.575,[X1+.245,4.08,-7.45],mats.signFace,{rotation:[0,PI/2,0],name:'side-fascia-sign'});
  sideSign.renderOrder=4;
  addGlow(side,{color:0x9ee5df,size:1.5,opacity:.08,position:[X1+.4,4.1,-7.45]});

  addBox(side,[.24,2.2,.18],[X1+.12,1.4,Z0+.3],mats.metalDark,{outline:.012});
  addBox(side,[.15,.18,.24],[X1+.12,2.55,Z0+.3],mats.wallWarm,{outline:0,castShadow:false});
  // Small crates and bin near service door.
  addBox(side,[.58,.36,.5],[X1+.48,.18,-9.1],mats.woodLight,{outline:.018,rotation:[0,.25,0]});
  addBox(side,[.52,.3,.42],[X1+.6,.48,-9.05],mats.wallWarm,{outline:.015,rotation:[0,-.1,0]});
  addCylinder(side,[.28,.3],.83,[X1+.65,.42,-5.6],mats.metalDark,{segments:14,outline:.018});
  addBox(side,[.5,.14,.04],[X1+.65,.79,-5.9],mats.wallWarm,{outline:0,castShadow:false});
  return side;
}

export function buildStore(parent,mats){
  const store=new THREE.Group();
  store.name='konbini-store';
  parent.add(store);

  // Shell. The right side stays open for the glazed corner shopfront.
  addBox(store,[.28,5.12,8.86],[X0+.14,2.56,(Z0+Z1)/2],mats.wallShade,{outline:.03});
  addBox(store,[W,5.12,.28],[CENTER_X,2.56,Z0+.14],mats.wall,{outline:.03});
  addBox(store,[W,1.06,.24],[CENTER_X,4.81,Z1+.05],mats.wallShade,{outline:.02});
  addBox(store,[.28,2.22,2.88],[X1-.1,4.16,-3.66],mats.wallShade,{outline:.025});
  addBox(store,[W+.42,.24,.34],[CENTER_X,.12,Z1+.08],mats.concrete,{outline:.02});

  const {interior}=buildInterior(store,mats);
  const facade=buildFacade(store,mats);
  buildSideAndService(store,mats);
  const roof=buildRoof(store,mats);

  // Roof face visibility and its wet lip.
  addBox(store,[W+.18,.08,.12],[CENTER_X,ROOF+.31,Z1-.03],mats.trim,{outline:0,castShadow:false});

  // Canopy spill light and storefront bounce.
  const canopyLight=new THREE.PointLight(0xffdea9,30,8.5,2);
  canopyLight.position.set(-2.6,2.95,-.95);store.add(canopyLight);
  const sideSpill=new THREE.PointLight(0xa8e5dc,10,5,2);
  sideSpill.position.set(X1+1.2,2.3,-3.4);store.add(sideSpill);
  const streetSpill=new THREE.SpotLight(0xffcc90,145,14,Math.PI*.42,.9,1.6);
  streetSpill.position.set(-2.2,3.1,-.7);
  streetSpill.target.position.set(-1.7,0,3.6);
  store.add(streetSpill,streetSpill.target);
  const shopWash=new THREE.PointLight(0xffc78e,44,10,2);
  shopWash.position.set(-1.4,1.35,.8);store.add(shopWash);

  return {
    group:store,
    sign:facade.fa.children.find(child=>child.name==='konbini-sign'),
    bladeLight:facade.bladeLight,
    canopyLight,
    sideLight:sideSpill,
    streetSpill,
    shopWash,
    interior,
    roof,
    signPlane:facade.fa.children.find(child=>child.name==='konbini-sign')
  };
}
