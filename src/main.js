import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {buildWorld} from './world.js?v=9';
import {buildPortalWorld} from './portal-world.js';
import {buildSciFiWorld} from './scifi-world.js';

window.__sceneBooted=true;

const $=selector=>document.querySelector(selector);
const regions={
  citadel:{name:'熔火王座',english:'THE OBSIDIAN CITADEL',number:'01',symbol:'♜',intro:'玄武岩长桥连接着熔岩之上的古老王国。',caption:'在灰烬之中，秩序仍然矗立。',label:'THE LAVA ABYSS',origin:[0,0,0],position:[49,76,151],target:[-8,23,0],fov:45,fog:0x4b2424,density:.0035,exposure:1.02,min:28,max:270},
  portal:{name:'赤境之门',english:'THE CRIMSON THRESHOLD',number:'02',symbol:'◈',intro:'循着熔岩流光，抵达赤色菌林深处的秘门。',caption:'余烬落下，另一重世界正在苏醒。',label:'THE CRIMSON THRESHOLD',origin:[420,0,0],position:[0,14.45,58],target:[0,11.7,0],fov:49,fog:0x512033,density:.010,exposure:.96,min:17,max:145},
  scifi:{name:'星渊回廊',english:'THE EVENT HORIZON',number:'03',symbol:'✦',intro:'穿过静默星尘，绿色潮汐在引力深渊边缘缓慢流动。',caption:'光在深处折返，时间沿着星流旋转。',label:'THE EVENT HORIZON',origin:[840,0,0],position:[0,10,58],target:[12,17,-38],fov:52,fog:0x071116,density:.0018,exposure:1.08,min:18,max:190},
};
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(49,innerWidth/innerHeight,.15,1100);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
$('#viewport').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
Object.assign(controls,{enableDamping:true,dampingFactor:.055,enablePan:true,panSpeed:.36,rotateSpeed:.38,minPolarAngle:.11,maxPolarAngle:Math.PI*.485});
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.38,.42,1.05);
composer.addPass(bloom);composer.addPass(new OutputPass());
const built=new Map();
let activeId,active,quality='high',switching=false,animationId=0,disposed=false,paused=false;
let last=performance.now(),frames=0,fpsTime=last,elapsed=0,toastTimer;
const setProgress=(detail,percent)=>{$('#load-detail').textContent=detail;$('#progress').style.width=percent+'%';};
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function resetCamera(){
  controls.enableDamping=false;controls.update();
  const spec=regions[activeId],origin=new THREE.Vector3(...spec.origin);
  camera.position.copy(origin).add(new THREE.Vector3(...spec.position));controls.target.copy(origin).add(new THREE.Vector3(...spec.target));
  // Fit the full monument on portrait screens instead of cropping its sides.
  camera.fov=activeId==='scifi'?spec.fov:camera.aspect<1.2?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(spec.fov/2))*1.2/camera.aspect)):spec.fov;
  if(activeId==='scifi'){
    const localCamera=new THREE.Vector3(...spec.position),core=new THREE.Vector3(42,16,-72),targetZ=-38;
    const verticalHalf=THREE.MathUtils.degToRad(camera.fov/2),horizontalHalf=Math.atan(Math.tan(verticalHalf)*camera.aspect);
    const coreYaw=Math.atan2(core.x-localCamera.x,localCamera.z-core.z);
    const wantedYawOffset=Math.atan((2*.86-1)*Math.tan(horizontalHalf));
    const targetYaw=coreYaw-wantedYawOffset,depth=localCamera.z-targetZ;
    const targetX=localCamera.x+Math.tan(targetYaw)*depth;
    const corePitch=Math.atan2(core.y-localCamera.y,Math.hypot(core.x-localCamera.x,core.z-localCamera.z));
    const wantedPitchOffset=Math.atan((1-2*.52)*Math.tan(verticalHalf));
    const targetPitch=corePitch-wantedPitchOffset;
    const targetY=localCamera.y+Math.tan(targetPitch)*Math.hypot(targetX-localCamera.x,depth);
    controls.target.set(origin.x+targetX,origin.y+targetY,origin.z+targetZ);
  }
  camera.updateProjectionMatrix();controls.minDistance=spec.min;controls.maxDistance=spec.max;controls.update();controls.saveState();controls.enableDamping=true;
  active?.setView?.(camera,origin);
}
function citadelLights(root){
  // Cool skylight reveals basalt grain; the broad lava fill warms undersides.
  root.add(new THREE.HemisphereLight(0xb9c5de,0xc34716,1.3));
  const key=new THREE.DirectionalLight(0xe9edf6,2.2);
  key.position.set(-46,105,65);key.target.position.set(5,15,8);key.castShadow=true;
  key.name='citadel-key';key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-105,right:100,top:110,bottom:-88,near:1,far:300});
  key.shadow.bias=-.00015;key.shadow.normalBias=.11;key.shadow.radius=2;
  root.add(key,key.target);
  const bounce=new THREE.DirectionalLight(0xff6b18,1.25);
  bounce.position.set(-40,-40,95);bounce.target.position.set(13,15,0);root.add(bounce,bounce.target);
  const rim=new THREE.DirectionalLight(0xff924b,1.7);
  rim.position.set(-45,40,-100);rim.target.position.set(13,28,0);root.add(rim,rim.target);
  for(const [x,y,z,intensity,range,color] of [[13,23,25,210,32,0xff790f],[-13,-14,21,700,115,0xff6010],[50,-22,20,560,95,0xff5010],[-43,-20,38,410,100,0xff6818],[13,45,10,75,28,0xff8e24]]){
    const light=new THREE.PointLight(color,intensity,range,2);light.position.set(x,y,z);root.add(light);
  }
}
async function switchRegion(id,updateUrl=true){
  if(switching||!regions[id]||id===activeId)return;
  switching=true;for(const button of document.querySelectorAll('[data-region]'))button.disabled=true;
  const spec=regions[id];$('#load-title').textContent='正在构建'+spec.name;$('#loading').classList.remove('done');$('#status').textContent='正在准备区域';setProgress('准备场景与参考视角…',8);
  try{
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(!built.has(id)){
      const root=new THREE.Group();root.name='region-'+id;root.position.set(...spec.origin);root.visible=false;scene.add(root);
      try{let world;if(id==='citadel'){citadelLights(root);world=buildWorld(root,setProgress);}else if(id==='portal')world=buildPortalWorld(root,setProgress);else world=await buildSciFiWorld(root,setProgress);built.set(id,{root,...world});}
      catch(error){scene.remove(root);disposeTree(root);throw error;}
    }
    for(const [key,region] of built)region.root.visible=key===id;
    activeId=id;active=built.get(id);scene.fog=new THREE.FogExp2(spec.fog,spec.density);renderer.toneMappingExposure=spec.exposure;resetCamera();
    $('#scene-title').textContent=spec.name;$('#scene-number').textContent=spec.number;$('#scene-english').textContent=spec.english;$('#scene-symbol').textContent=spec.symbol;$('#scene-intro').textContent=spec.intro;
    $('#caption-label').textContent=spec.number+' / '+spec.label;$('#caption-text').textContent=spec.caption;
    document.title=spec.name+' · 熔火世界';$('#viewport').setAttribute('aria-label',spec.name+'三维参考观察场景');document.body.dataset.region=id;
    for(const button of document.querySelectorAll('[data-region]'))button.setAttribute('aria-pressed',String(button.dataset.region===id));
    if(updateUrl){const url=new URL(location.href);url.searchParams.set('region',id);history.replaceState(null,'',url);}
    applyQuality();active.update(elapsed,renderer.getPixelRatio());composer.render();setProgress('场景已就绪',100);
    $('#status').textContent=spec.name+' · 参考观察模式';$('#stats').textContent=active.blockCount.toLocaleString()+' 个精细构件';$('#loading').classList.add('done');
  }catch(error){console.error(error);window.reportSceneError(error.message||error);}
  finally{switching=false;for(const button of document.querySelectorAll('[data-region]'))button.disabled=false;}
}
function applyQuality(){
  renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='ultra'?2:quality==='balanced'?1.1:1.65));composer.setPixelRatio(renderer.getPixelRatio());
  renderer.shadowMap.enabled=quality!=='balanced';bloom.strength=activeId==='portal'?(quality==='ultra'?.46:.36):activeId==='scifi'?(quality==='ultra'?.44:.34):(quality==='ultra'?.34:.27);bloom.threshold=activeId==='portal'?1.1:activeId==='scifi'?.86:1.2;bloom.radius=activeId==='portal'?.46:activeId==='scifi'?.58:.38;
}
function resize(){camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);if(activeId)resetCamera();else camera.updateProjectionMatrix();$('#hint').innerHTML=innerWidth<700?'单指环绕 <em>·</em> 双指缩放与平移':'拖动环绕 <em>·</em> 滚轮靠近 <em>·</em> 右键平移';}
function loop(now){
  if(disposed)return;animationId=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(paused||!active||switching)return;
  elapsed+=dt;controls.update();active.update(elapsed,renderer.getPixelRatio());if(quality==='balanced')renderer.render(scene,camera);else composer.render(dt);
  frames++;if(now-fpsTime>900){$('#fps').textContent=Math.round(frames*1000/(now-fpsTime))+' FPS';frames=0;fpsTime=now;}
}
for(const button of document.querySelectorAll('[data-region]'))button.onclick=()=>switchRegion(button.dataset.region);
$('#reset').onclick=resetCamera;
$('#collapse').onclick=()=>{const collapsed=$('#console').classList.toggle('collapsed');$('#collapse').textContent=collapsed?'+':'−';$('#collapse').setAttribute('aria-label',collapsed?'展开控制台':'收起控制台');};
$('#fullscreen').onclick=async()=>{if(!document.fullscreenEnabled){toast('当前窗口不支持全屏，可在浏览器中打开预览');return;}try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前窗口不支持全屏，可在浏览器中打开预览');}};
$('#shot').onclick=()=>{
  if(!active)return;if(quality==='balanced')renderer.render(scene,camera);else composer.render();
  renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.download=activeId+'-'+Date.now()+'.png';link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('已导出当前三维画面');},'image/png');
};
$('#quality').onchange=event=>{quality=event.target.value;applyQuality();toast('已切换：'+event.target.selectedOptions[0].textContent);};
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=performance.now();frames=0;fpsTime=last;});
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();paused=true;window.reportSceneError('图形上下文已丢失');});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
function disposeTree(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])materials.add(material);if(object.isLight&&object.shadow)object.shadow.dispose();});
  for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);for(const uniform of Object.values(material.uniforms||{}))if(uniform.value?.isTexture)textures.add(uniform.value);material.dispose();}
  for(const geometry of geometries)geometry.dispose();for(const texture of textures)texture.dispose();
}
addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;cancelAnimationFrame(animationId);clearTimeout(toastTimer);controls.dispose();disposeTree(scene);for(const pass of composer.passes)pass.dispose?.();composer.dispose();renderer.dispose();});
if(innerWidth<700){$('#hint').innerHTML='单指环绕 <em>·</em> 双指缩放与平移';$('#console').classList.add('collapsed');$('#collapse').textContent='+';$('#collapse').setAttribute('aria-label','展开控制台');}
const requested=new URLSearchParams(location.search).get('region');switchRegion(regions[requested]?requested:'portal');animationId=requestAnimationFrame(loop);
