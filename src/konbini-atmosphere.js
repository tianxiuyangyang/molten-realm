import * as THREE from 'three';
import {PI,basic,makeRng,glowTexture} from './konbini-utils.js';

const fbmGLSL=`
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vnoise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return v;}
`;

function buildSky(parent,seed=7193){
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{uTime:{value:0}},
    vertexShader:`
      varying vec3 vDir;
      void main(){
        vDir=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`,
    fragmentShader:`
      precision highp float;
      varying vec3 vDir;
      uniform float uTime;
      ${fbmGLSL}
      void main(){
        vec3 d=normalize(vDir);
        float h=clamp(d.y*0.5+0.5,0.0,1.0);
        vec3 top=vec3(0.0015,0.0042,0.0095);
        vec3 low=vec3(0.012,0.036,0.048);
        vec3 haze=vec3(0.032,0.058,0.066);
        vec3 col=mix(low,top,smoothstep(0.44,0.88,h));
        col=mix(col,haze,pow(1.0-smoothstep(0.38,0.60,h),3.0)*0.58);
        // Cloud decks, lit faintly from the city.
        vec2 p=normalize(d.xz+vec2(0.0001))*1.0;
        float horizon=1.0-clamp(abs(d.y)*2.6,0.0,1.0);
        vec2 cloudUv=vec2(atan(d.z,d.x)*1.1,(d.y+0.16)*2.4)+vec2(uTime*0.004,0.0);
        float clouds=fbm(cloudUv*2.3+fbm(cloudUv*1.1)*0.6);
        float cloudMask=smoothstep(0.41,0.73,clouds)*smoothstep(0.02,0.35,h)*smoothstep(1.02,0.55,h);
        col=mix(col,vec3(0.031,0.052,0.063),cloudMask*0.82);
        // A vaguely moonlit break in the rain clouds behind the block.
        vec3 moonDir=normalize(vec3(-0.42,0.35,-0.72));
        float moon=pow(max(dot(d,moonDir),0.0),42.0);
        float moonHalo=pow(max(dot(d,moonDir),0.0),7.0);
        col+=vec3(0.11,0.145,0.16)*moonHalo*0.17;
        col+=vec3(0.24,0.3,0.28)*moon*0.38;
        col=mix(col,vec3(0.042,0.024,0.030),smoothstep(0.60,0.9,1.0-h)*0.42);
        // A very faint wet grain keeps the gradient from looking like a flat CSS panel.
        col+=vec3(vnoise(d.xz*280.0+d.y*31.0))*0.004;
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(210,40,24),material);
  sky.name='konbini-sky';
  sky.frustumCulled=false;
  parent.add(sky);
  return {mesh:sky,material};
}

function buildRain(parent,seed=4412){
  const rng=makeRng(seed);
  const count=680;
  const positions=new Float32Array(count*6);
  const data=[];
  for(let i=0;i<count;i++){
    const x=(rng()-.5)*33;
    const y=.6+rng()*18;
    const z=(rng()-.5)*33;
    const length=.24+rng()*.55;
    const speed=10+rng()*12;
    data.push({x,y,z,length,speed,windX:.45+rng()*.4,windZ:.1+rng()*.22});
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.LineBasicMaterial({
    color:0x86acbf,transparent:true,opacity:.17,depthWrite:false,fog:true
  });
  const lines=new THREE.LineSegments(geometry,material);
  lines.name='rain';
  lines.frustumCulled=false;
  lines.renderOrder=9;
  parent.add(lines);
  function update(dt){
    for(let i=0;i<count;i++){
      const drop=data[i];
      drop.y-=drop.speed*dt;
      drop.x+=drop.windX*dt;
      drop.z+=drop.windZ*dt;
      if(drop.y<.06){
        drop.y=14+rng()*5;
        drop.x=(rng()-.5)*33;
        drop.z=(rng()-.5)*33;
      }
      if(drop.x>17)drop.x=-17; else if(drop.x<-17)drop.x=17;
      if(drop.z>17)drop.z=-17; else if(drop.z<-17)drop.z=17;
      const idx=i*6;
      positions[idx]=drop.x;
      positions[idx+1]=drop.y;
      positions[idx+2]=drop.z;
      positions[idx+3]=drop.x+drop.windX*.035;
      positions[idx+4]=drop.y+drop.length;
      positions[idx+5]=drop.z+drop.windZ*.035;
    }
    geometry.attributes.position.needsUpdate=true;
  }
  return {lines,material,update};
}

function buildSplashes(parent,seed=901){
  const rng=makeRng(seed);
  const count=170;
  const positions=new Float32Array(count*3);
  const seeds=new Float32Array(count);
  const sizes=new Float32Array(count);
  for(let i=0;i<count;i++){
    let x,z;
    if(i<120){
      x=(rng()-.5)*24.5;
      z=.9+rng()*7.0;
    }else{
      x=3.5+rng()*3.3;
      z=-11.9+rng()*10.5;
    }
    positions[i*3]=x;
    positions[i*3+1]=.092+rng()*.03;
    positions[i*3+2]=z;
    seeds[i]=rng();
    sizes[i]=.6+rng()*.8;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
  geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0}},
    vertexShader:`
      attribute float aSeed;
      attribute float aSize;
      varying float vCycle;
      varying float vSeed;
      uniform float uTime;
      void main(){
        float cycle=fract(uTime*(.72+aSeed*.4)+aSeed*7.31);
        vCycle=cycle;
        vSeed=aSeed;
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        float size=(7.0+cycle*32.0)*aSize*(12.0/max(1.0,-mvPosition.z));
        gl_PointSize=clamp(size,1.0,34.0);
        gl_Position=projectionMatrix*mvPosition;
      }`,
    fragmentShader:`
      precision highp float;
      varying float vCycle;
      varying float vSeed;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float d=length(p);
        float radius=.34;
        float ring=1.0-smoothstep(.012,.042,abs(d-radius));
        float dash=.7+.3*sin(atan(p.y,p.x)*9.0+vSeed*20.0);
        float alpha=ring*dash*pow(1.0-vCycle,1.8)*.32;
        if(d>.5||alpha<.01)discard;
        gl_FragColor=vec4(vec3(.62,.86,.92),alpha);
      }`
  });
  const points=new THREE.Points(geometry,material);
  points.name='rain-splashes';
  points.renderOrder=8;
  points.frustumCulled=false;
  parent.add(points);
  return {points,material};
}

function makeWetOverlay(mats,textureTarget){
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,
    uniforms:{
      tReflection:{value:textureTarget},
      uTextureMatrix:{value:new THREE.Matrix4()},
      uTime:{value:0},
      uOpacity:{value:.86}
    },
    vertexShader:`
      uniform mat4 uTextureMatrix;
      varying vec4 vCoord;
      varying vec3 vWorld;
      varying vec2 vLocal;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        vWorld=world.xyz;
        vLocal=vec2(position.x,-position.y);
        vCoord=uTextureMatrix*world;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      precision highp float;
      uniform sampler2D tReflection;
      uniform float uTime;
      uniform float uOpacity;
      varying vec4 vCoord;
      varying vec3 vWorld;
      varying vec2 vLocal;
      ${fbmGLSL}
      float puddleEllipse(vec2 p,vec2 center,vec2 radii,float angle,float warp){
        vec2 d=p-center;
        float c=cos(angle),s=sin(angle);
        d=mat2(c,-s,s,c)*d;
        d/=radii;
        float roughness=(fbm(p*1.45+vec2(7.0,2.0))-.5)*.22;
        return 1.0-smoothstep(.82+warp,.99+warp,length(d)+roughness);
      }
      void main(){
        vec2 uv=vCoord.xy/vCoord.w;
        float broad=fbm(vLocal*.3+vec2(3.2,7.7));
        float detail=fbm(vLocal*1.6+vec2(-1.4,2.6));
        float ambientWet=smoothstep(.45,.7,broad*.78+detail*.34)*.6;
        float p1=puddleEllipse(vLocal,vec2(-4.6,2.9),vec2(3.9,1.55),-.08,0.0);
        float p2=puddleEllipse(vLocal,vec2(2.9,5.7),vec2(3.0,1.25),.12,0.04);
        float p3=puddleEllipse(vLocal,vec2(9.4,2.5),vec2(1.45,1.85),.22,0.03);
        float p4=puddleEllipse(vLocal,vec2(5.25,-6.2),vec2(1.15,3.0),.04,0.02);
        float p5=puddleEllipse(vLocal,vec2(-9.6,6.9),vec2(1.9,1.2),-.2,0.03);
        float puddle=clamp(max(max(max(p1,p2),max(p3,p4)),p5),0.0,1.0);
        float sheen=clamp(.08+ambientWet*.52+puddle*.55,0.0,1.0);
        float ripple=sin(vLocal.x*8.4+uTime*1.7)*sin(vLocal.y*7.1-uTime*1.35);
        float ripple2=sin((vLocal.x+vLocal.y)*18.0-uTime*3.2)*.5+.5;
        vec2 distort=vec2(ripple*.0007+ripple2*.00018,cos(vLocal.y*6.2+uTime*2.0)*.0008)*(.25+puddle);
        vec3 reflection=vec3(0.0);
        float total=0.0;
        for(int i=-1;i<=1;i++){
          for(int j=-1;j<=1;j++){
            vec2 sampleUv=uv+distort+vec2(float(i),float(j))*.0017;
            float w=1.0/(1.0+float(abs(i)+abs(j)));
            reflection+=texture2D(tReflection,clamp(sampleUv,vec2(.001),vec2(.999))).rgb*w;
            total+=w;
          }
        }
        reflection/=total;
        vec3 viewDir=normalize(cameraPosition-vWorld);
        float fresnel=pow(1.0-clamp(viewDir.y,0.0,1.0),2.0);
        float reflectivity=.07+ambientWet*.24+puddle*.55;
        float alpha=reflectivity*(.62+.38*fresnel)*uOpacity;
        vec3 tint=reflection*vec3(.76,.93,1.06)*(.76+fresnel*.48);
        tint+=vec3(.004,.013,.016)*puddle;
        float rim=smoothstep(.4,.78,puddle)*(1.0-smoothstep(.82,1.05,puddle));
        tint+=vec3(.05,.12,.13)*rim*.45;
        gl_FragColor=vec4(tint,clamp(alpha,0.0,.78));
      }`
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(27.1,27.1),material);
  mesh.rotation.x=-PI/2;
  mesh.position.y=.081;
  mesh.name='wet-ground-reflection';
  mesh.renderOrder=3;
  mesh.receiveShadow=false;
  return mesh;
}

class PlanarReflection{
  constructor(parent,renderer=null,camera=null,planeY=.08){
    this.renderer=renderer;
    this.camera=camera;
    this.planeY=planeY;
    this.target=new THREE.WebGLRenderTarget(720,405,{
      type:THREE.HalfFloatType,
      minFilter:THREE.LinearFilter,
      magFilter:THREE.LinearFilter,
      depthBuffer:true,
      stencilBuffer:false
    });
    this.target.texture.colorSpace=THREE.NoColorSpace;
    this.mirrorCamera=new THREE.PerspectiveCamera();
    this.textureMatrix=new THREE.Matrix4();
    this.clipPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-planeY);
    this.overlay=makeWetOverlay(null,this.target.texture);
    this.overlay.material.uniforms.uTextureMatrix.value=this.textureMatrix;
    parent.add(this.overlay);
    this._savedTarget=null;
    this._savedClipping=[];
    this._savedAutoUpdate=true;
    this._count=0;
  }
  setSize(width,height){
    const scale=Math.min(1,1280/Math.max(width,1));
    const w=Math.min(1024,Math.max(480,Math.round(width*scale*.72)));
    const h=Math.min(768,Math.max(300,Math.round(height*scale*.72)));
    this.target.setSize(w,h);
  }
  update(time,scene,camera,rendererArg=null){
    const renderer=rendererArg||this.renderer;
    if(!renderer||!camera)return;
    const mirror=this.mirrorCamera;
    this.planeY=.08;
    mirror.fov=camera.fov;mirror.aspect=camera.aspect;mirror.near=.15;mirror.far=800;
    mirror.position.set(camera.position.x,this.planeY*2-camera.position.y,camera.position.z);
    const direction=new THREE.Vector3();camera.getWorldDirection(direction);
    const target=mirror.position.clone().add(new THREE.Vector3(direction.x,-direction.y,direction.z));
    mirror.up.set(0,-1,0);
    mirror.lookAt(target);
    mirror.updateMatrixWorld(true);
    mirror.updateProjectionMatrix();
    this.textureMatrix.set(
      .5,0,0,.5,
      0,.5,0,.5,
      0,0,.5,.5,
      0,0,0,1
    );
    this.textureMatrix.multiply(mirror.projectionMatrix);
    this.textureMatrix.multiply(mirror.matrixWorldInverse);
    this.overlay.material.uniforms.uTextureMatrix.value.copy(this.textureMatrix);
    this.overlay.material.uniforms.uTime.value=time;
    this.overlay.visible=false;
    const savedTarget=renderer.getRenderTarget();
    const savedClipping=renderer.clippingPlanes;
    const savedAutoUpdate=renderer.shadowMap.autoUpdate;
    renderer.clippingPlanes=[this.clipPlane];
    renderer.shadowMap.autoUpdate=false;
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene,mirror);
    renderer.setRenderTarget(savedTarget);
    renderer.clippingPlanes=savedClipping;
    renderer.shadowMap.autoUpdate=savedAutoUpdate;
    this.overlay.visible=true;
  }
  dispose(){
    this.target.dispose();this.overlay.geometry.dispose();this.overlay.material.dispose();
  }
}

function mistTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=768;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,768,768);
  const rng=makeRng(8231);
  for(let i=0;i<120;i++){
    const x=rng()*768,y=rng()*768;
    const r=20+rng()*130;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    const a=.055+rng()*.16;
    g.addColorStop(0,`rgba(255,255,255,${a})`);
    g.addColorStop(.55,`rgba(255,255,255,${a*.45})`);
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const fade=ctx.createRadialGradient(384,384,70,384,384,384);
  fade.addColorStop(0,'rgba(0,0,0,0)');
  fade.addColorStop(.62,'rgba(0,0,0,.06)');
  fade.addColorStop(1,'rgba(0,0,0,.92)');
  ctx.globalCompositeOperation='destination-out';
  ctx.fillStyle=fade;ctx.fillRect(0,0,768,768);
  ctx.globalCompositeOperation='source-over';
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

export function buildAtmosphere(parent,mats,{renderer,camera,planeY=.08}={}){
  const group=new THREE.Group();group.name='konbini-atmosphere';parent.add(group);
  const sky=buildSky(group);
  const rain=buildRain(group);
  const splashes=buildSplashes(group);
  const reflection=new PlanarReflection(group,renderer,camera,planeY);
  const reflectionGroupUpdated=reflection.overlay;
  // Ground light-pool under the floating base.
  const poolScore=new THREE.Mesh(new THREE.PlaneGeometry(46,46),new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0x2a6a75,transparent:true,opacity:.3,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  poolScore.rotation.x=-PI/2;poolScore.position.y=-1.58;poolScore.renderOrder=0;group.add(poolScore);
  const poolWarm=new THREE.Mesh(new THREE.PlaneGeometry(28,28),new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0x7f4b55,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  poolWarm.rotation.x=-PI/2;poolWarm.position.set(3,-1.57,2);poolWarm.renderOrder=0;group.add(poolWarm);
  const poolCool=new THREE.Mesh(new THREE.PlaneGeometry(34,34),new THREE.MeshBasicMaterial({
    map:glowTexture(),color:0x1e5864,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending
  }));
  poolCool.rotation.x=-PI/2;poolCool.position.set(-6,-1.56,-2);poolCool.renderOrder=0;group.add(poolCool);
  // Soft city-light halos sit behind the block like bokeh in the rain.
  function haze(color,x,y,z,sx,sy,opacity){
    const material=new THREE.SpriteMaterial({
      map:glowTexture(),color,transparent:true,opacity,depthWrite:false,
      blending:THREE.AdditiveBlending,fog:false
    });
    const sprite=new THREE.Sprite(material);
    sprite.position.set(x,y,z);sprite.scale.set(sx,sy,1);sprite.renderOrder=1;
    group.add(sprite);
    return sprite;
  }
  haze(0x2c6f7b,-3.5,4.4,-11.6,21,13,.2);
  haze(0x7f455c,7.2,3.7,-12.2,15,10,.13);
  haze(0xb77942,7.8,1.5,-7.5,8,5,.09);
  // Low cloud bank: the maquette appears to float above a pool of night fog.
  const mistMap=mistTexture();
  // Painterly backlight clouds, kept abstract so the model stays the subject.
  for(const [color,x,y,z,sx,sy,opacity] of [
    [0x1f5862,-3.5,6.0,-14.0,30,18,.42],
    [0x6d3348,8.2,4.5,-14.5,18,12,.28],
    [0x8f5d36,10.5,2.0,-12.0,12,8,.18]
  ]){
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({
      map:mistMap,color,transparent:true,opacity,depthWrite:false,fog:false,
      blending:THREE.AdditiveBlending
    }));
    halo.position.set(x,y,z);halo.scale.set(sx,sy,1);halo.renderOrder=2;
    group.add(halo);
  }
  const mistMaterial=new THREE.MeshBasicMaterial({
    map:mistMap,color:0x3a7580,transparent:true,opacity:.34,
    depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  });
  const mistPlane=new THREE.Mesh(new THREE.PlaneGeometry(62,62),mistMaterial);
  mistPlane.rotation.x=-PI/2;mistPlane.position.set(-2,-1.68,0);mistPlane.renderOrder=0;
  group.add(mistPlane);
  const mistWarmMat=new THREE.MeshBasicMaterial({
    map:mistMap,color:0x8e5f58,transparent:true,opacity:.16,
    depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  });
  const mistWarm=new THREE.Mesh(new THREE.PlaneGeometry(40,40),mistWarmMat);
  mistWarm.rotation.x=-PI/2;mistWarm.position.set(5,-1.66,3);mistWarm.renderOrder=0;
  group.add(mistWarm);

  let elapsed=0;
  function update(time,dt,rendererArg,scene,cameraArg){
    elapsed+=dt;
    sky.material.uniforms.uTime.value=elapsed;
    rain.update(dt);
    splashes.material.uniforms.uTime.value=elapsed;
    if(rendererArg&&scene&&cameraArg){
      reflection.update(elapsed,scene,cameraArg,rendererArg);
    }
  }
  function resize(width,height){reflection.setSize(width,height);}
  return {
    group,sky,rain,splashes,reflection,overlay:reflectionGroupUpdated,
    update,resize,
    setQuality(quality){reflection.target.setSize(quality==='ultra'?1024:720,quality==='ultra'?576:405);}
  };
}
