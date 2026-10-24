import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const PI=Math.PI;
export const TAU=PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function makeRng(seed=0x51a7){
  return function(){
    seed|=0;seed=seed+0x6D2B79F5|0;
    let t=Math.imul(seed^seed>>>15,1|seed);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}

export function rampTexture(){
  const data=new Uint8Array([64,64,76,255,124,132,148,255,196,204,216,255,255,255,255,255]);
  const texture=new THREE.DataTexture(data,4,1,THREE.RGBAFormat);
  texture.minFilter=texture.magFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.needsUpdate=true;
  return texture;
}
export const TOON_RAMP=rampTexture();

export const OUTLINE_MATERIAL=new THREE.MeshBasicMaterial({color:0x0b111c,side:THREE.BackSide});
export const UNIT_BOX=new THREE.BoxGeometry(1,1,1);
const glowCache=new Map();

export function toon(color, options={}){
  return new THREE.MeshToonMaterial({color,gradientMap:TOON_RAMP,...options});
}
export function basic(color, options={}){
  return new THREE.MeshBasicMaterial({color,...options});
}
export function standard(color, options={}){
  return new THREE.MeshStandardMaterial({color,...options});
}
export function physical(color, options={}){
  return new THREE.MeshPhysicalMaterial({color,...options});
}
export function textureCanvas(width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  return {canvas,ctx:canvas.getContext('2d')};
}
export function canvasTexture(canvas,{srgb=true,repeat=null,filter=true}={}){
  const texture=new THREE.CanvasTexture(canvas);
  if(srgb)texture.colorSpace=THREE.SRGBColorSpace;
  if(repeat){
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(repeat[0],repeat[1]);
  }
  texture.anisotropy=8;
  if(!filter)texture.magFilter=THREE.NearestFilter;
  texture.needsUpdate=true;
  return texture;
}
export function roundRect(ctx,x,y,w,h,r){
  const radius=Math.min(r,w*.5,h*.5);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}
export function glowTexture(){
  if(glowCache.has('glow'))return glowCache.get('glow');
  const {canvas,ctx}=textureCanvas(128,128);
  const gradient=ctx.createRadialGradient(64,64,0,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.18,'rgba(255,255,255,.82)');
  gradient.addColorStop(.48,'rgba(255,255,255,.25)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  glowCache.set('glow',texture);
  return texture;
}
export function addGlow(parent,{color=0xffd9a5,size=3,opacity=.6,position=[0,0,0],depthWrite=false}={}){
  const material=new THREE.SpriteMaterial({map:glowTexture(),color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite});
  const sprite=new THREE.Sprite(material);
  sprite.position.set(...position);
  sprite.scale.set(size,size,1);
  sprite.renderOrder=8;
  parent.add(sprite);
  return sprite;
}

export function addBox(parent,dims,pos,material,{
  rotation=[0,0,0],outline=0,name='box',castShadow=true,receiveShadow=true,depthWrite=true,renderOrder=0
}={}){
  const group=new THREE.Group();
  group.name=name;
  group.position.set(...pos);
  group.rotation.set(...rotation);
  const mesh=new THREE.Mesh(UNIT_BOX,material);
  mesh.scale.set(...dims);
  mesh.castShadow=castShadow;
  mesh.receiveShadow=receiveShadow;
  mesh.renderOrder=renderOrder;
  if(depthWrite===false)mesh.material.depthWrite=false;
  group.add(mesh);
  if(outline>0){
    const shell=new THREE.Mesh(UNIT_BOX,OUTLINE_MATERIAL);
    shell.scale.set(dims[0]+outline*2,dims[1]+outline*2,dims[2]+outline*2);
    shell.castShadow=false;
    shell.receiveShadow=false;
    group.add(shell);
  }
  parent.add(group);
  return mesh;
}

export function addRounded(parent,dims,pos,material,{
  radius=.08,outline=.025,name='rounded',rotation=[0,0,0],castShadow=true,receiveShadow=true
}={}){
  const geometry=new RoundedBoxGeometry(dims[0],dims[1],dims[2],2,radius);
  const group=new THREE.Group();
  group.position.set(...pos);
  group.rotation.set(...rotation);
  group.name=name;
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=castShadow;mesh.receiveShadow=receiveShadow;
  group.add(mesh);
  if(outline>0){
    const shell=new THREE.Mesh(geometry,OUTLINE_MATERIAL);
    shell.scale.setScalar(1+outline);
    shell.castShadow=false;
    group.add(shell);
  }
  parent.add(group);
  return mesh;
}

export function addCylinder(parent,radii,height,pos,material,{
  segments=20,rotation=[0,0,0],outline=0,name='cylinder',castShadow=true,receiveShadow=true,openEnded=false
}={}){
  const geometry=new THREE.CylinderGeometry(radii[0],radii[1],height,segments,1,openEnded);
  const group=new THREE.Group();
  group.position.set(...pos);
  group.rotation.set(...rotation);
  group.name=name;
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=castShadow;mesh.receiveShadow=receiveShadow;
  group.add(mesh);
  if(outline>0){
    const shell=new THREE.Mesh(geometry,OUTLINE_MATERIAL);
    shell.scale.setScalar(1+outline);
    shell.castShadow=false;
    group.add(shell);
  }
  parent.add(group);
  return mesh;
}

export function addPlane(parent,width,height,pos,material,{
  rotation=[0,0,0],name='plane',renderOrder=0,double=false
}={}){
  const geometry=new THREE.PlaneGeometry(width,height);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(...pos);
  mesh.rotation.set(...rotation);
  mesh.name=name;
  mesh.renderOrder=renderOrder;
  if(double)material.side=THREE.DoubleSide;
  parent.add(mesh);
  return mesh;
}

export function addGroundPlane(parent,width,depth,pos,material,{rotationY=0,renderOrder=0,name='ground-plane'}={}){
  return addPlane(parent,width,depth,pos,material,{rotation:[-PI/2,0,rotationY],renderOrder,name});
}

export function addTube(parent,points,radius,material,{segments=64,radial=6}={}){
  const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
  const geometry=new THREE.TubeGeometry(curve,segments,radius,radial,false);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=false;
  parent.add(mesh);
  return mesh;
}

export function contactShadowTexture(){
  if(glowCache.has('contact'))return glowCache.get('contact');
  const {canvas,ctx}=textureCanvas(256,256);
  const gradient=ctx.createRadialGradient(128,128,10,128,128,128);
  gradient.addColorStop(0,'rgba(0,0,0,.7)');
  gradient.addColorStop(.55,'rgba(0,0,0,.36)');
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const texture=new THREE.CanvasTexture(canvas);
  glowCache.set('contact',texture);
  return texture;
}

export function makeWindow(frameParent,{width,height,x,y,z,mullions=2,frameMaterial,glassMaterial,glassOpacity=.1,frameWidth=.08,transom=false}){
  const group=new THREE.Group();
  group.position.set(x,y,z);
  group.name='window';
  const sill=.07;
  addBox(group,[width+frameWidth*2,sill,.16],[0,-height/2,0],frameMaterial,{outline:.012});
  addBox(group,[width+frameWidth*2,sill,.16],[0,height/2,0],frameMaterial,{outline:.012});
  addBox(group,[frameWidth,height,.15],[-width/2,0,0],frameMaterial,{outline:.01});
  addBox(group,[frameWidth,height,.15],[width/2,0,0],frameMaterial,{outline:.01});
  for(let i=1;i<=mullions;i++){
    const mx=-width/2+(width/(mullions+1))*i;
    addBox(group,[frameWidth*.7,height,.12],[mx,0,.005],frameMaterial,{outline:.008});
  }
  if(transom){
    addBox(group,[width,frameWidth*.8,.13],[0,height*.12,0],frameMaterial,{outline:.008});
  }
  const glass=[];
  for(let i=0;i<=mullions;i++){
    const panelWidth=width/(mullions+1)-frameWidth;
    const sx=-width/2+panelWidth/2+frameWidth*.5+(width/(mullions+1))*i;
    const material=glassMaterial.clone();
    material.opacity=glassOpacity;
    material.transparent=true;
    material.depthWrite=false;
    material.side=THREE.DoubleSide;
    const mesh=addPlane(group,panelWidth,height-frameWidth*1.25,[sx,0,.03],material,{name:'glass'});
    mesh.renderOrder=2;
    glass.push(mesh);
  }
  frameParent.add(group);
  return group;
}

export function rowOf(parent,count,step,start,fn){
  for(let i=0;i<count;i++){
    const value=start+i*step;
    fn(value,i);
  }
}
