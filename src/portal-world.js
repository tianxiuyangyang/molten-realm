import * as THREE from 'three';
import {randomSource} from './rendering.js';
import {buildPortalGate} from './portal-gate.js';
import {buildPortalLandscape} from './portal-landscape.js';

// A second, spatially separate region; all coordinates here are local to its root.
export function buildPortalWorld(root,progress){
  progress('塑造赤色天幕与峡谷光照…',16);
  const hemisphere=new THREE.HemisphereLight(0xd8c9ee,0x621527,2.15);
  // Three derives the sky direction from world position, so compensate the region offset.
  hemisphere.position.set(-root.position.x,1-root.position.y,-root.position.z);root.add(hemisphere);
  const key=new THREE.DirectionalLight(0xdec8e9,2.7);
  key.position.set(-24,55,35);key.target.position.set(0,7,0);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-50,right:50,top:49,bottom:-43,near:1,far:160});
  key.shadow.bias=-.0003;key.shadow.normalBias=.07;key.shadow.radius=2;
  root.add(key,key.target);
  const rim=new THREE.DirectionalLight(0xff1c25,.85);rim.position.set(12,23,-45);root.add(rim,rim.target);
  for(const x of [-11,11]){const lavaLight=new THREE.PointLight(0xff4607,135,45,2);lavaLight.position.set(x,2.7,23);root.add(lavaLight);}

  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},
    vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;varying vec3 vDirection;uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=n(p)*a;p=p*2.07+vec2(11.7,3.9);a*=.5;}return v;}
    void main(){vec3 d=normalize(vDirection);float h=d.y;vec2 p=d.xz/(abs(h)+.38);float clouds=fbm(p*vec2(2.4,5.)+vec2(time*.002,0.));
      vec3 horizon=vec3(.72,.020,.031),zenith=vec3(.036,.003,.013);
      vec3 color=mix(horizon,zenith,smoothstep(-.10,.48,h));
      float dark=smoothstep(.35,.72,clouds+sin(d.y*31.+fbm(p*3.1)*4.)*.06);
      color=mix(color,vec3(.068,.004,.017),dark*.70);
      color+=vec3(.15,.008,.013)*pow(1.-abs(sin(h*20.+clouds*3.)),12.)*(1.-smoothstep(.1,.6,h));
      if(h<-.06)color=mix(color,vec3(.08,.004,.011),1.-smoothstep(-.45,-.06,h));
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(550,40,24),skyMaterial);sky.name='crimson-cloud-sky';root.add(sky);
  progress('铺设熔岩溪流、石路与多层菌林…',28);
  const landscape=buildPortalLandscape(root);
  progress('雕刻黑曜石门、符文和能量枝脉…',62);
  const gate=buildPortalGate(root);
  progress('散布空中余烬与熔火陨石…',85);
  const rng=randomSource(333);
  const count=1050,positions=new Float32Array(count*3),speeds=new Float32Array(count),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){positions[i*3]=(rng()-.5)*140;positions[i*3+1]=rng()*72;positions[i*3+2]=-80+rng()*132;speeds[i]=.15+rng()*.6;sizes[i]=.5+rng()*1.6;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('speed',new THREE.BufferAttribute(speeds,1));geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1));
  const emberMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},ratio:{value:1}},
    vertexShader:`attribute float speed;attribute float size;uniform float time;uniform float ratio;varying float vHeat;void main(){vec3 p=position;p.y=mod(p.y+time*speed,72.);p.x+=sin(time*.2+position.y)*.45;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*ratio*100./-mv.z,.6,4.);vHeat=size;}`,
    fragmentShader:`varying float vHeat;void main(){float a=1.-smoothstep(.12,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(1.6,.11+vHeat*.08,.035,a*.65);}`});
  const embers=new THREE.Points(geometry,emberMaterial);embers.frustumCulled=false;root.add(embers);
  return{blockCount:landscape.blockCount+gate.blockCount,update(t,dpr){landscape.update(t,dpr);gate.update(t,dpr);skyMaterial.uniforms.time.value=t;emberMaterial.uniforms.time.value=t;emberMaterial.uniforms.ratio.value=dpr;}};
}
