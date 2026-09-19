import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function randomSource(seed=71821) {return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function noise(x,z){return Math.sin(x*.39+Math.cos(z*.23)*2)*.46+Math.sin(z*.7+x*.21)*.25+Math.cos(x*1.25-z*.81)*.16;}
export class Blocks {
 constructor(scene,materials){this.scene=scene;this.materials=materials;this.pools=new Map();this.count=0;this.geometries={box:new THREE.BoxGeometry(1,1,1),bevel:new RoundedBoxGeometry(1,1,1,1,.035)};}
 add(kind,x,y,z,w,h,d,color=1,angle=0,bevel=false){if(w<=0||h<=0||d<=0)return;const key=kind+(bevel?'_bevel':'');if(!this.pools.has(key))this.pools.set(key,{kind,bevel,items:[]});this.pools.get(key).items.push([x,y,z,w,h,d,color,angle]);this.count++;}
 finish(){const dummy=new THREE.Object3D(),col=new THREE.Color();for(const {kind,bevel,items} of this.pools.values()){const mesh=new THREE.InstancedMesh(this.geometries[bevel?'bevel':'box'],this.materials[kind],items.length);mesh.name=kind;for(let i=0;i<items.length;i++){const [x,y,z,w,h,d,c,a]=items[i];dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,a,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);col.setRGB(c,c*.97,c*.94);mesh.setColorAt(i,col);}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!['hot','magma','ember','red'].includes(kind);mesh.receiveShadow=true;mesh.computeBoundingSphere();this.scene.add(mesh);}this.pools.clear();}
}
function stoneMap(rng,type){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const image=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){let k=(y*512+x)*4;let n=125+(rng()-.5)*75+noise(x*.07,y*.07)*24; if(type==='red')n+=15;image.data[k]=n;image.data[k+1]=n;image.data[k+2]=n;image.data[k+3]=255;}ctx.putImageData(image,0,0);for(let i=0;i<75;i++){ctx.beginPath();let x=rng()*512,y=rng()*512;ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=rng()*35-13;y+=rng()*28-8;ctx.lineTo(x,y);}ctx.strokeStyle=i%3?'rgba(12,9,8,.30)':'rgba(240,231,217,.23)';ctx.lineWidth=rng()*1.6+.5;ctx.stroke();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
export function materials(){const rng=randomSource(44),rock=stoneMap(rng),red=stoneMap(rng,'red');const base={map:rock,bumpMap:rock,bumpScale:.12,roughness:.88,metalness:.12};return {
 stone:new THREE.MeshStandardMaterial({...base,color:0x625b5b}),
 dark:new THREE.MeshStandardMaterial({...base,color:0x3b3437,roughness:.84}),
 edge:new THREE.MeshStandardMaterial({...base,color:0x766c68,metalness:.22}),
 rock:new THREE.MeshStandardMaterial({...base,color:0x4b4240,bumpScale:.24}),
 ore:new THREE.MeshStandardMaterial({...base,color:0x401817,emissive:0x581006,emissiveIntensity:.23}),
 red:new THREE.MeshStandardMaterial({...base,map:red,color:0xb82931,emissive:0x410408,emissiveIntensity:.2}),
 stem:new THREE.MeshStandardMaterial({...base,color:0x856048}),
 hot:new THREE.MeshStandardMaterial({color:0xffcd51,emissive:0xff6a04,emissiveIntensity:3.2,roughness:.42}),
 magma:new THREE.MeshStandardMaterial({color:0xff5d06,emissive:0xff3500,emissiveIntensity:2.8}),
 ember:new THREE.MeshStandardMaterial({color:0xff9b0a,emissive:0xff5a00,emissiveIntensity:4})
};}

const shaderNoise=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise2(p);p=p*2.03+17.1;a*=.5;}return v;}
`;
export function lavaMaterial(fall=false){return new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms:{time:{value:0},fall:{value:fall?1:0}},vertexShader:`varying vec3 vWorld;varying vec2 vUv;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
precision highp float;uniform float time;uniform float fall;varying vec3 vWorld;varying vec2 vUv;${shaderNoise}
void main(){
vec2 p=mix(vWorld.xz*.19,vec2(vUv.x*4.8,vWorld.y*.1+time*.48),fall);
p+=vec2(fbm(p*.6+time*.035),fbm(p*.7-time*.026))*1.6;
float n=fbm(p*2.8+vec2(time*.038,0));
float ridge=abs(sin(p.x*3.1+fbm(p*1.7)*8.)*sin(p.y*2.7+fbm(p*1.3+4.)*7.));
float aa=max(fwidth(ridge),.006);float heat=1.-smoothstep(.018-aa,.06+aa,ridge);
float islands=smoothstep(.35,.67,n);
vec3 crust=mix(vec3(.07,.008,.002),vec3(.54,.047,.004),islands);
vec3 glow=mix(vec3(1.6,.075,.001),vec3(3.6,1.1,.018),heat);
vec3 col=mix(crust,glow,clamp(heat*.88+smoothstep(.57,.72,n)*.55,.0,1.));
if(fall>.5){float streak=fbm(vec2(vUv.x*27.,vWorld.y*.09+time*1.2));col=mix(vec3(2.0,.12,.003),vec3(3.8,1.25,.05),smoothstep(.24,.68,streak));col*=.62+.38*sin(vUv.x*30.+fbm(p)*5.);}
float dist=length(cameraPosition-vWorld);float fog=1.-exp(-dist*dist*.000012);col=mix(col,vec3(.50,.055,.006),fog*.76);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
export function sky(scene){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision highp float;varying vec3 vDir;uniform float time;${shaderNoise}
void main(){vec3 d=normalize(vDir);float h=d.y;vec2 p=d.xz/(abs(h)+.17);float cloud=fbm(p*2.4+vec2(time*.005,0));float thin=fbm(p*7.);vec3 col=mix(vec3(.65,.055,.006),vec3(.065,.004,.009),smoothstep(-.02,.40,h));col=mix(col,vec3(.075,.008,.015),smoothstep(.40,.73,cloud)*.78);col+=vec3(.19,.014,.003)*smoothstep(.47,.7,thin)*(1.-smoothstep(.06,.4,h));if(h<-.03)col=mix(col,vec3(.27,.025,.004),(1.-smoothstep(-.5,-.02,h)));gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const mesh=new THREE.Mesh(new THREE.SphereGeometry(700,48,32),m);scene.add(mesh);return m;}
