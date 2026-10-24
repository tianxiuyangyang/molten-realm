import * as THREE from 'three';
import {createKonbiniMaterials} from './konbini-materials.js';
import {buildStore} from './konbini-store.js';
import {buildStreet} from './konbini-street.js';
import {buildProps} from './konbini-props.js';
import {buildAtmosphere} from './konbini-atmosphere.js';
import {addGlow} from './konbini-utils.js';

function buildNightLights(root){
  const group=new THREE.Group();group.name='konbini-lights';root.add(group);
  const hemi=new THREE.HemisphereLight(0x7795bd,0x0b1116,1.08);
  group.add(hemi);
  const ambient=new THREE.AmbientLight(0x1b2c39,.28);
  group.add(ambient);
  const moon=new THREE.DirectionalLight(0xb5cde8,1.45);
  moon.position.set(17,29,18);
  moon.target.position.set(-1,1.2,-2);
  moon.castShadow=true;
  moon.shadow.mapSize.set(2048,2048);
  Object.assign(moon.shadow.camera,{left:-21,right:21,top:25,bottom:-19,near:.5,far:76});
  moon.shadow.bias=-.00035;
  moon.shadow.normalBias=.055;
  moon.shadow.radius=2;
  group.add(moon,moon.target);
  const rim=new THREE.DirectionalLight(0x6f8fbc,.36);
  rim.position.set(-18,15,-17);
  rim.target.position.set(1,3,0);
  group.add(rim,rim.target);
  // A soft reflected-city ambience from the wet road.
  const bounce=new THREE.PointLight(0x6d9da7,11,22,2);
  bounce.position.set(0,.7,7.4);
  group.add(bounce);
  return {group,hemi,moon,rim,bounce};
}

function addSignHalo(root){
  addGlow(root,{color:0xa6e8e4,size:2.8,opacity:.055,position:[-3,4.55,-1.9]});
  addGlow(root,{color:0xff9fbe,size:1.5,opacity:.05,position:[8.2,4.0,-2.7]});
  addGlow(root,{color:0xffc88d,size:5.8,opacity:.055,position:[-2.4,2.1,-.1]});
  addGlow(root,{color:0x8edfe1,size:2.1,opacity:.05,position:[4.1,3.4,-2.5]});
}

function countBlocks(root){
  let count=0;
  root.traverse(object=>{
    if(object.isInstancedMesh)count+=object.count;
    else if(object.isMesh&&object.name!=='rain'&&!object.isSprite)count++;
  });
  return count;
}

export function buildKonbiniWorld(root,setProgress=()=>{}){
  root.name='region-konbini';
  const {materials:mats}=createKonbiniMaterials();
  setProgress('铺设雨夜街角…',16);
  const street=buildStreet(root,mats);
  setProgress('点亮玻璃橱窗与招牌…',42);
  const store=buildStore(root,mats);
  // The store is the hero of the maquette: widen and lift it a touch while
  // keeping its frontage and centreline anchored to the street.
  const storeScaleX=1.26,storeScaleY=1.1,storeScaleZ=1.035;
  store.group.scale.set(storeScaleX,storeScaleY,storeScaleZ);
  store.group.position.set(-3*(1-storeScaleX),0,-6.625*(1-storeScaleZ));
  setProgress('摆上贩卖机、单车与雨伞…',63);
  const props=buildProps(root,mats);
  setProgress('挂好电线与街灯…',79);
  const lights=buildNightLights(root);
  addSignHalo(root);
  setProgress('让雨水落进霓虹倒影…',90);
  const atmosphere=buildAtmosphere(root,mats,{planeY:.08});
  const blockCount=countBlocks(root);
  const signBase=new THREE.Color(0xf7f2e2);
  let lastElapsed=0;
  let firstFrame=true;

  function update(time,pixelRatio,renderer,scene,camera){
    const dt=Math.min(.05,Math.max(.001,time-lastElapsed));
    lastElapsed=time;
    atmosphere.update(time,dt,renderer,scene,camera);
    // A little electrical life in the corner: signage never flickers on beat.
    const flicker=.975+.015*Math.sin(time*2.7)+.008*Math.sin(time*19.3+1.2);
    mats.signFace.color.copy(signBase).multiplyScalar(flicker);
    store.canopyLight.intensity=30*(.975+.025*Math.sin(time*1.7+.4));
    store.sideLight.intensity=10*(.9+.1*Math.sin(time*2.1));
    const barFlicker=.86+.1*Math.sin(time*2.2)+.04*Math.sin(time*15.7);
    props.barPinkLight.intensity=42*barFlicker;
    props.barLanternLight.intensity=12*(.9+.1*Math.sin(time*1.3+2));
    props.barEntranceLight.intensity=16*(.92+.08*Math.sin(time*2.2+.9));
    props.vendingLight.intensity=16*(.94+.06*Math.sin(time*2.9+.7));
    lights.rim.intensity=.36*(.94+.06*Math.sin(time*.9));
    if(firstFrame){
      firstFrame=false;
      // The model's shadow casters are static; keep the map after one good bake.
      renderer.shadowMap.needsUpdate=true;
      renderer.shadowMap.autoUpdate=false;
    }
  }
  function resize(width,height){atmosphere.resize(width,height);}
  function setQuality(quality){
    atmosphere.setQuality(quality);
    lights.moon.shadow.mapSize.set(quality==='balanced'?1024:2048,quality==='balanced'?1024:2048);
    if(lights.moon.shadow.map){lights.moon.shadow.map.dispose();lights.moon.shadow.map=null;}
  }
  // The whole model is authored at one human-ish scale; this hint is used by the camera fitter.
  return {
    root,
    blockCount,
    lights,
    store,
    street,
    props,
    atmosphere,
    update,
    resize,
    setQuality,
    cameraHint:{distance:34,fov:39,targetY:2.45,min:17,max:56}
  };
}
