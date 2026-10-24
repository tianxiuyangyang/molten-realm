import * as THREE from 'three';
import {createKonbiniMaterials} from './konbini-materials.js?v=4';
import {buildStore} from './konbini-store.js?v=4';
import {buildStreet} from './konbini-street.js?v=4';
import {buildProps} from './konbini-props.js?v=4';
import {buildAtmosphere} from './konbini-atmosphere.js?v=4';
import {addGlow} from './konbini-utils.js?v=4';

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
  const flash=new THREE.DirectionalLight(0xdcecff,0);
  flash.position.set(-8,34,10);
  flash.target.position.set(0,2,-1);
  group.add(flash,flash.target);
  return {group,hemi,ambient,moon,rim,bounce,flash};
}

function addSignHalo(root){
  addGlow(root,{color:0xa6e8e4,size:2.8,opacity:.055,position:[-3,4.55,-1.9]});
  addGlow(root,{color:0xff9fbe,size:1.5,opacity:.05,position:[8.2,4.0,-2.7]});
  addGlow(root,{color:0xffc88d,size:5.8,opacity:.055,position:[-2.4,2.1,-.1]});
  addGlow(root,{color:0x8edfe1,size:2.1,opacity:.05,position:[4.1,3.4,-2.5]});
}

function buildSnowCaps(root,mats){
  const group=new THREE.Group();
  group.name='snow-cover';
  group.visible=false;
  root.add(group);
  const planeGeo=new THREE.PlaneGeometry(1,1);
  const addSnowPlane=(w,d,x,y,z,rot=0)=>{
    const mesh=new THREE.Mesh(planeGeo,mats.snowCap);
    mesh.rotation.x=-Math.PI/2;
    mesh.rotation.z=rot;
    mesh.position.set(x,y,z);
    mesh.scale.set(w,d,1);
    mesh.renderOrder=7;
    group.add(mesh);
    return mesh;
  };
  const addSnowBox=(w,h,d,x,y,z)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats.snowSolid);
    mesh.position.set(x,y,z);
    mesh.renderOrder=7;
    group.add(mesh);
    return mesh;
  };
  const addSolidPlane=(w,d,x,y,z,rot=0)=>{
    const mesh=new THREE.Mesh(planeGeo,mats.snowSolid);
    mesh.rotation.x=-Math.PI/2;
    mesh.rotation.z=rot;
    mesh.position.set(x,y,z);
    mesh.scale.set(w,d,1);
    mesh.renderOrder=7;
    group.add(mesh);
    return mesh;
  };
  // Roofs, signs and awnings.
  addSolidPlane(13.72,8.12,-3,6.005,-6.63,.01);
  addSnowPlane(13.7,8.1,-3,6.02,-6.63,.01);
  addSolidPlane(14.7,1.22,-3,3.82,-1.44,0);
  addSnowPlane(14.75,1.28,-3,3.835,-1.44,0);
  addSnowBox(13.9,.035,.12,-3,5.935,-1.84);
  addSolidPlane(5.02,7.2,10.47,6.305,-7.7,-.01);
  addSnowPlane(5.02,7.2,10.47,6.32,-7.7,-.01);
  addSnowBox(4.3,.035,.52,10.4,3.795,-3.47);
  addSnowPlane(1.14,.62,-8.05,2.235,-1.32,0);
  addSnowBox(1.62,.035,.45,.42,1.135,-1.76);
  addSnowPlane(2.25,.94,3.35,1.985,6.15,0);
  addSnowBox(.62,.07,.62,-2.85,1.54,9.55);
  addSnowBox(.88,.055,.45,11.8,1.395,9.95);
  // Ground dusting on sidewalks, curbs and wet lane edges.
  for(const [x,z,w,d,r] of [
    [-10.4,-1.2,1.7,.72,.18],[-6.15,-1.6,2.0,.66,-.12],[-2.4,-1.25,1.55,.6,.3],
    [2.2,-1.35,1.8,.62,.1],[8.65,-1.25,1.6,.62,-.2],[11.0,-1.05,1.35,.55,.1],
    [-7.4,9.35,2.8,.9,.08],[-.9,9.4,2.2,.76,-.1],[5.3,9.3,2.3,.86,.16],
    [5.5,-5.7,1.0,2.0,.02],[-10.4,4.7,2.15,.88,.12],[-2.1,6.05,1.9,.82,-.15],[6.4,4.15,2.2,.92,.25]
  ]){
    const isRoad=z>3;
    addSnowPlane(w,d,x,isRoad?.093:.152,z,r);
  }
  // Guardrail tops.
  addSnowBox(5.0,.024,.07,10.75,.772,.39);
  addSnowBox(4.9,.024,.07,-10.75,.772,8.35);
  addSnowBox(9.4,.024,.07,2.15,.772,8.35);
  // Soft caps on the tree canopy.
  for(const [x,y,z,sx,sy,sz] of [
    [-12.35,3.9,9.85,1.4,.32,1.0],[-10.95,3.85,9.95,1.2,.28,.85],
    [-11.55,4.18,10.4,1.15,.3,.95],[-11.05,3.55,9.35,1.0,.24,.8]
  ]){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,9,6),mats.snowSolid);
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.renderOrder=7;
    group.add(mesh);
  }
  return {group,materials:[mats.snowCap,mats.snowSolid]};
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
  const snowCaps=buildSnowCaps(root,mats);
  setProgress('让雨水落进霓虹倒影…',90);
  const atmosphere=buildAtmosphere(root,mats,{planeY:.08});
  const blockCount=countBlocks(root);
  const signBase=new THREE.Color(0xf7f2e2);
  let lastElapsed=0;
  let firstFrame=true;
  const weatherLooks={
    rain:{
      hemi:1.08,ambient:.28,moon:1.45,rim:.36,exposure:.98,fog:.0065,
      hemiColor:new THREE.Color(0x7795bd),groundColor:new THREE.Color(0x0b1116),
      ambientColor:new THREE.Color(0x1b2c39),moonColor:new THREE.Color(0xb5cde8),
      rimColor:new THREE.Color(0x6f8fbc),fogColor:new THREE.Color(0x05111a),
      skyBrightness:1,skyTint:new THREE.Color(0x000000),cloudSpeed:1,snow:0
    },
    clear:{
      hemi:1.24,ambient:.34,moon:1.55,rim:.46,exposure:1,fog:.0048,
      hemiColor:new THREE.Color(0x859fc1),groundColor:new THREE.Color(0x111a23),
      ambientColor:new THREE.Color(0x223644),moonColor:new THREE.Color(0xc3d8ee),
      rimColor:new THREE.Color(0x7e9cc6),fogColor:new THREE.Color(0x06121b),
      skyBrightness:1.08,skyTint:new THREE.Color(0x010508),cloudSpeed:.7,snow:0
    },
    snow:{
      hemi:1.8,ambient:.52,moon:1.12,rim:.27,exposure:1.055,fog:.0088,
      hemiColor:new THREE.Color(0xb2cbdd),groundColor:new THREE.Color(0x2b3f49),
      ambientColor:new THREE.Color(0x385463),moonColor:new THREE.Color(0xd8eaf5),
      rimColor:new THREE.Color(0x8eaec8),fogColor:new THREE.Color(0x0c202a),
      skyBrightness:1.46,skyTint:new THREE.Color(0x07131b),cloudSpeed:.46,snow:1
    },
    typhoon:{
      hemi:.64,ambient:.16,moon:.78,rim:.52,exposure:.9,fog:.012,
      hemiColor:new THREE.Color(0x5d7692),groundColor:new THREE.Color(0x050b0f),
      ambientColor:new THREE.Color(0x122430),moonColor:new THREE.Color(0x92b7d7),
      rimColor:new THREE.Color(0x6688b0),fogColor:new THREE.Color(0x03080d),
      skyBrightness:.68,skyTint:new THREE.Color(0x01050a),cloudSpeed:3.5,snow:0
    }
  };
  const currentWeather={
    hemi:1.08,ambient:.28,moon:1.45,rim:.36,exposure:.98,fog:.0065,
    hemiColor:weatherLooks.rain.hemiColor.clone(),groundColor:weatherLooks.rain.groundColor.clone(),
    ambientColor:weatherLooks.rain.ambientColor.clone(),moonColor:weatherLooks.rain.moonColor.clone(),
    rimColor:weatherLooks.rain.rimColor.clone(),fogColor:weatherLooks.rain.fogColor.clone(),
    skyBrightness:1,skyTint:new THREE.Color(0x000000),cloudSpeed:1
  };
  let weatherMode='rain';
  let snowCapAmount=0;
  let lightningCooldown=3.2;
  let lightningFlash=0;

  function applyWeather(mode){
    if(!weatherLooks[mode])return;
    weatherMode=mode;
    atmosphere.setWeather(mode);
    if(mode==='typhoon')lightningCooldown=.8+Math.random()*1.6;
  }

  function updateWeather(dt,renderer,scene){
    const target=weatherLooks[weatherMode];
    const ease=1-Math.exp(-dt*2.1);
    for(const key of ['hemi','ambient','moon','rim','exposure','fog','skyBrightness','cloudSpeed']){
      currentWeather[key]+=(target[key]-currentWeather[key])*ease;
    }
    currentWeather.hemiColor.lerp(target.hemiColor,ease);
    currentWeather.groundColor.lerp(target.groundColor,ease);
    currentWeather.ambientColor.lerp(target.ambientColor,ease);
    currentWeather.moonColor.lerp(target.moonColor,ease);
    currentWeather.rimColor.lerp(target.rimColor,ease);
    currentWeather.fogColor.lerp(target.fogColor,ease);
    currentWeather.skyTint.lerp(target.skyTint,ease);
    lights.hemi.intensity=currentWeather.hemi;
    lights.hemi.color.copy(currentWeather.hemiColor);
    lights.hemi.groundColor.copy(currentWeather.groundColor);
    lights.ambient.intensity=currentWeather.ambient;
    lights.ambient.color.copy(currentWeather.ambientColor);
    lights.moon.intensity=currentWeather.moon;
    lights.moon.color.copy(currentWeather.moonColor);
    lights.rim.intensity=currentWeather.rim;
    lights.rim.color.copy(currentWeather.rimColor);
    if(scene.fog){
      scene.fog.color.copy(currentWeather.fogColor);
      scene.fog.density=currentWeather.fog;
    }
    renderer.toneMappingExposure=currentWeather.exposure;
    atmosphere.setSkyMood(currentWeather.skyBrightness,currentWeather.skyTint,currentWeather.cloudSpeed);

    // Snow caps ease in and out with the weather.
    snowCapAmount+=(target.snow-snowCapAmount)*(1-Math.exp(-dt*2.5));
    mats.snowCap.opacity=snowCapAmount*.88;
    mats.snowSolid.opacity=snowCapAmount*.93;
    snowCaps.group.visible=snowCapAmount>.006;

    // Rare, brief sheet-lightning in typhoon mode.
    if(weatherMode==='typhoon'){
      lightningCooldown-=dt;
      if(lightningCooldown<=0){
        lightningFlash=1;
        lightningCooldown=3.4+Math.random()*4.8;
      }
    }else{
      lightningCooldown=Math.min(lightningCooldown,2.5);
    }
    lightningFlash=Math.max(0,lightningFlash-dt*4.6);
    lights.flash.intensity=lightningFlash*8.5;
    atmosphere.setFlash(lightningFlash*.9);
  }

  function update(time,pixelRatio,renderer,scene,camera){
    const dt=Math.min(.05,Math.max(.001,time-lastElapsed));
    lastElapsed=time;
    atmosphere.update(time,dt,renderer,scene,camera);
    updateWeather(dt,renderer,scene);
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
    lights.rim.intensity=currentWeather.rim*(.94+.06*Math.sin(time*.9));
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
    snowCaps,
    update,
    resize,
    setQuality,
    setWeather:applyWeather,
    getWeather:()=>weatherMode,
    cameraHint:{distance:34,fov:39,targetY:2.45,min:17,max:56}
  };
}
