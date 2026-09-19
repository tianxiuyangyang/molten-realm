import * as THREE from 'three';
import {randomSource} from './rendering.js';

const field = `
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 hash22(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise2(p);p=mat2(1.65,1.13,-1.13,1.65)*p+11.7;a*=.5;}return v;}
vec2 cellular(vec2 p){vec2 cell=floor(p),f=fract(p);float first=8.,second=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 q=o+.17+.66*hash22(cell+o)-f;float d=dot(q,q);if(d<first){second=first;first=d;}else second=min(second,d);}return sqrt(vec2(first,second));}
`;

// World-sized plates keep the molten surface legible from the reference camera.
// Cooling crust drifts with the same flow field as its incandescent boundaries.
export function createCitadelLavaMaterial(fall=false){
  return new THREE.ShaderMaterial({
    name:fall?'citadel-lava-falls':'citadel-lava-crust',
    side:THREE.DoubleSide,transparent:!fall,
    uniforms:{time:{value:0}},
    defines:fall?{LAVA_FALL:1}:{},
    vertexShader:`varying vec3 vWorld;varying vec2 vUv;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
    fragmentShader:`precision highp float;
uniform float time;varying vec3 vWorld;varying vec2 vUv;
${field}
void main(){
  vec3 color;
  #ifdef LAVA_FALL
    float edge=.025+.075*noise2(vec2(vWorld.y*.35+time*.72,1.7));
    if(vUv.x<edge||vUv.x>1.-edge*.82)discard;
    vec2 flow=vec2(vUv.x*8.,vWorld.y*.095+time*.78);
    float fold=fbm(flow*vec2(1.35,.75));
    float filament=noise2(vec2(vUv.x*22.+fold*3.,vWorld.y*.1+time*1.6));
    float heat=smoothstep(.34,.74,fold*.67+filament*.44);
    float edgeCooling=pow(abs(vUv.x-.5)*2.,2.4);
    float cooling=smoothstep(.41,.68,fbm(flow*vec2(1.4,.25)+4.));
    cooling=max(cooling*.84,edgeCooling*(.55+.35*fold));
    color=mix(vec3(1.35,.075,.003),vec3(3.1,.78,.025),heat);
    color=mix(color,vec3(.16,.013,.006),cooling*.88);
    float lip=smoothstep(.78,1.,vUv.y);
    color*=.88+lip*.14;
  #else
    vec2 p=vWorld.xz*.10+vec2(time*.021,-time*.014);
    vec2 warp=vec2(fbm(p*.57+5.7),fbm(p*.49-13.2));
    vec2 q=p+(warp-.5)*2.8;
    q+=vec2(noise2(p*1.7),noise2(p*1.6+7.))*.42;
    float coarse=fbm(q*.78+vec2(5.7,-time*.007));
    float detail=fbm(q*2.65);
    float cooling=coarse*.72+detail*.28;
    float aa=max(fwidth(cooling),.003);
    float molten=1.-smoothstep(.385-aa,.495+aa,cooling);
    float stream=abs(fbm(q*.84+vec2(fbm(q*.36)*2.5,0.))-.46);
    float core=(1.-smoothstep(.005,.030,stream))*molten;
    float hotEdge=1.-smoothstep(.008,.030,abs(cooling-.423));
    float rough=fbm(q*7.);
    vec3 crust=mix(vec3(.025,.007,.005),vec3(.17,.021,.007),rough);
    crust+=vec3(.15,.012,.001)*smoothstep(.48,.61,detail);
    vec3 lava=mix(vec3(1.35,.11,.002),vec3(3.4,.95,.035),max(core,hotEdge*.72));
    lava*=.78+noise2(q*1.6+time*.045)*.34;
    // Fine cooled fragments and incandescent ripples give the pools surface texture.
    vec2 tessera=floor(vWorld.xz*7.)/7.;
    float grain=fbm(tessera*2.3+vec2(time*.16,-time*.13));
    float shards=smoothstep(.59,.73,grain)*molten;
    lava*=.76+grain*.65;
    color=mix(crust,lava,molten);
    color=mix(color,crust*1.5,shards*.58);
    color+=vec3(.30,.075,.004)*pow(max(0.,grain-.42)*2.3,3.)*molten;
    float smallCrack=1.-smoothstep(.008,.022,abs(noise2(q*5.4)-.51));
    color+=vec3(.45,.035,.001)*smallCrack*(1.-molten)*smoothstep(.54,.64,detail);
  #endif
  float distanceToCamera=length(cameraPosition-vWorld);
  float aerial=1.-exp(-distanceToCamera*distanceToCamera*.0000045);
  float horizonFade=smoothstep(210.,540.,distanceToCamera);
  color=mix(color,vec3(.30,.041,.022),max(aerial*.64,horizonFade));
  float alpha=1.;
  #ifndef LAVA_FALL
    alpha=1.-smoothstep(280.,590.,distanceToCamera);
  #endif
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

export function createCitadelSky(group){
  const material=new THREE.ShaderMaterial({
    name:'citadel-volcanic-sky',side:THREE.BackSide,depthWrite:false,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;varying vec3 vDir;uniform float time;
${field}
void main(){
  vec3 d=normalize(vDir);float h=d.y;
  vec3 horizon=vec3(.70,.070,.012);
  vec3 upper=vec3(.040,.005,.012);
  vec3 color=mix(horizon,upper,smoothstep(-.18,.20,h));
  vec2 p=d.xz/(max(h,0.)+.35);
  p=p*vec2(1.3,2.7)+vec2(time*.003,time*.0015);
  float layers=fbm(p*1.5+vec2(fbm(p*.48),0.));
  float cloud=smoothstep(.30,.68,layers);
  float overhead=smoothstep(-.12,.12,h);
  color=mix(color,vec3(.026,.006,.014),cloud*(.28+.62*overhead));
  float cloudEdge=smoothstep(.34,.43,layers)*(1.-smoothstep(.43,.54,layers));
  color+=vec3(.052,.009,.007)*cloudEdge*(1.-smoothstep(.04,.24,h));
  float glow=exp(-pow((h+.14)*14.,2.));
  color+=vec3(.16,.036,.007)*glow;
  color=mix(color,vec3(.30,.041,.022),1.-smoothstep(-.37,-.13,h));
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(700,48,32),material);
  sky.name='citadel-sky';sky.renderOrder=-20;group.add(sky);
  return material;
}

function instancedGeometry(base,attributes,count){
  const geometry=new THREE.InstancedBufferGeometry();
  geometry.index=base.index;
  for(const [key,value] of Object.entries(base.attributes))geometry.setAttribute(key,value);
  for(const [name,[array,size]] of Object.entries(attributes))geometry.setAttribute(name,new THREE.InstancedBufferAttribute(new Float32Array(array),size));
  geometry.instanceCount=count;
  return geometry;
}

export function addCitadelAtmosphere(group,flameSites,fallSites=[]){
  const rng=randomSource(230919),origins=[],parts=[];
  for(const [x,y,z,scale] of flameSites){
    // Individually phased tongues built from actual little 3D blocks.
    for(let tongue=0;tongue<6;tongue++){
      const dx=(rng()-.5)*.9,dz=(rng()-.5)*.9,phase=rng()*6.283;
      const height=.76+rng()*.9;
      for(let tier=0;tier<5;tier++){
        origins.push(x+dx*scale,y,z+dz*scale,scale);
        parts.push(tier,height,phase,rng());
      }
    }
  }
  const flameMaterial=new THREE.ShaderMaterial({
    name:'citadel-living-flames',uniforms:{time:{value:0}},
    vertexShader:`attribute vec4 origin;attribute vec4 part;uniform float time;varying float vHeight;varying float vLight;
void main(){
  float tier=part.x/5.;float phase=part.z;
  float flicker=.79+.15*sin(time*5.6+phase)+.11*sin(time*9.3+phase*2.1);
  float height=part.y*flicker;float taper=1.-tier*.76;
  vec3 p=position*vec3(.27*taper,.37*height,.27*taper)*origin.w;
  p.y+=(part.x+.5)*.30*height*origin.w;
  p.x+=sin(time*3.9+phase+tier*1.6)*tier*tier*.29*origin.w;
  p.z+=cos(time*3.3+phase+tier)*tier*tier*.20*origin.w;
  p+=origin.xyz;vHeight=tier;vLight=normal.y*.10+normal.x*.07+part.w*.08;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`,
    fragmentShader:`varying float vHeight;varying float vLight;void main(){
  vec3 color=mix(vec3(4.5,2.25,.39),vec3(2.6,.22,.009),smoothstep(.05,.86,vHeight));
  color*=.91+vLight;gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const flameGeometry=instancedGeometry(new THREE.BoxGeometry(1,1,1),{origin:[origins,4],part:[parts,4]},parts.length/4);
  const flames=new THREE.Mesh(flameGeometry,flameMaterial);flames.frustumCulled=false;flames.name='citadel-animated-voxel-flames';group.add(flames);

  // Only waterfalls reaching the basin throw impact droplets, so small cliff
  // seepages do not create floating splashes partway down the canyon.
  const impacts=fallSites.filter(site=>site.width>1&&site.bottom<-45).sort((a,b)=>b.width-a.width).slice(0,12);
  const positions=[],velocities=[],parameters=[];
  for(const site of impacts){
    const count=Math.ceil(24+site.width*10);
    for(let i=0;i<count;i++){
      const angle=rng()*Math.PI*2,spread=.5+rng()*2.2;
      positions.push(site.x+(rng()-.5)*site.width,site.bottom+.35,site.z+(rng()-.5)*.6);
      velocities.push(Math.cos(angle)*spread,3.4+rng()*5.2,Math.sin(angle)*spread);
      parameters.push(rng(),1.3+rng()*.7,.6+rng()*.9,0);
    }
  }
  for(const [x,y,z,s] of flameSites)for(let i=0;i<3;i++){
    positions.push(x+(rng()-.5)*s,y+s,z+(rng()-.5)*s);
    velocities.push((rng()-.5)*.55,.8+rng()*1.2,(rng()-.5)*.55);
    parameters.push(rng(),1.8+rng()*1.2,.35+rng()*.4,1);
  }
  const sparkGeometry=new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  sparkGeometry.setAttribute('velocity',new THREE.Float32BufferAttribute(velocities,3));
  sparkGeometry.setAttribute('life',new THREE.Float32BufferAttribute(parameters,4));
  const sparkMaterial=new THREE.ShaderMaterial({
    name:'citadel-lava-droplets',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},ratio:{value:1}},
    vertexShader:`attribute vec3 velocity;attribute vec4 life;uniform float time;uniform float ratio;varying float vFade;
void main(){float age=fract(time/life.y+life.x);float t=age*life.y;vec3 p=position+velocity*t;p.y-=mix(2.5,0.,life.w)*t*t;p.x+=sin(time*1.3+life.x*12.)*.2*age;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(life.z*ratio*205./max(1.,-mv.z),.7,5.);vFade=smoothstep(0.,.06,age)*(1.-smoothstep(.45,1.,age));}`,
    fragmentShader:`varying float vFade;void main(){float glow=1.-smoothstep(.10,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(2.2,.65,.035,glow*vFade*.85);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const sparks=new THREE.Points(sparkGeometry,sparkMaterial);sparks.frustumCulled=false;sparks.name='citadel-fall-impact-sparks';group.add(sparks);

  const hazeOrigins=[],hazeSizes=[];
  for(const site of impacts.slice(0,8)){
    hazeOrigins.push(site.x,site.bottom+5.5,site.z,rng()*6.28);
    hazeSizes.push(3.5+site.width*.7,5+rng()*2,3+site.width*.6);
  }
  for(const [x,z,sx,sz] of [[-37,27,23,14],[45,17,19,16],[13,-40,25,13]]){
    hazeOrigins.push(x,-38,z,rng()*6.28);hazeSizes.push(sx,4.2,sz);
  }
  const hazeMaterial=new THREE.ShaderMaterial({
    name:'citadel-basin-heat-haze',transparent:true,depthWrite:false,
    uniforms:{time:{value:0}},
    vertexShader:`attribute vec4 origin;attribute vec3 extent;uniform float time;varying vec3 vSurface;varying vec3 vNormal;varying vec3 vView;
void main(){vec3 p=position*extent+origin.xyz;p.x+=sin(time*.16+origin.w)*1.3;p.z+=cos(time*.12+origin.w)*.8;vSurface=position;vec4 mv=modelViewMatrix*vec4(p,1.);vView=-mv.xyz;vNormal=normalize(normalMatrix*(normal/extent));gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform float time;varying vec3 vSurface;varying vec3 vNormal;varying vec3 vView;
${field}
void main(){float face=max(0.,dot(normalize(vNormal),normalize(vView)));float wisps=fbm(vSurface.xz*3.+vec2(time*.025,vSurface.y*2.-time*.04));float alpha=pow(face,1.5)*smoothstep(.16,.65,wisps)*.125;vec3 color=mix(vec3(.36,.077,.025),vec3(.47,.13,.045),vSurface.y*.5+.5);gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const hazeGeometry=instancedGeometry(new THREE.SphereGeometry(1,16,10),{origin:[hazeOrigins,4],extent:[hazeSizes,3]},hazeOrigins.length/4);
  const haze=new THREE.Mesh(hazeGeometry,hazeMaterial);haze.frustumCulled=false;haze.name='citadel-basin-haze';haze.renderOrder=2;group.add(haze);
  return {
    count:parts.length/4+positions.length/3+hazeOrigins.length/4,
    update(t,dpr){flameMaterial.uniforms.time.value=t;sparkMaterial.uniforms.time.value=t;sparkMaterial.uniforms.ratio.value=dpr;hazeMaterial.uniforms.time.value=t;},
  };
}
