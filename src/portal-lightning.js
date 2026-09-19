import * as THREE from 'three';
import {Blocks, randomSource} from './rendering.js';

// Animate only the energy geometry. Architectural runes and lantern materials
// stay separate even when they use the same cyan/gold palette.
export function buildPortalLightning(parent,branches,palette){
  const group=new THREE.Group();group.name='Flowing portal lightning';parent.add(group);
  const clock={value:0},rng=randomSource(33917),materials={};
  for(const [index,kind] of [...new Set(branches.map(branch=>branch.k))].entries()){
    const source=palette[kind];
    const material=new THREE.MeshBasicMaterial({color:source.emissive.clone().multiplyScalar(source.emissiveIntensity),fog:false});
    material.onBeforeCompile=shader=>{
      shader.uniforms.portalTime=clock;
      shader.uniforms.portalPhase={value:index*.79};
      const declarations='uniform float portalTime;uniform float portalPhase;varying vec3 vPortalRest;\n';
      shader.vertexShader=declarations+shader.vertexShader;
      // Warp the common local coordinate field after the instance transform:
      // neighbouring segments move together, retaining continuous branches.
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
        THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',`
          vPortalRest=mvPosition.xyz;
          float height=mvPosition.y;
          float freedom=smoothstep(4.6,9.0,height);
          float wave=sin(height*.86-portalTime*2.3+portalPhase*.25)*.38;
          wave+=sin(height*3.7+portalTime*5.1)*.10;
          wave+=sin(height*8.2-portalTime*7.3)*.045;
          mvPosition.x+=wave*freedom;
          mvPosition.y+=sin(height*1.45-portalTime*2.9)*.13*freedom;
          float y=mvPosition.y;
          float halfWidth=y<5.6?2.65:y<7.2?4.12:y<8.8?5.37:y<18.4?6.43:y<20.0?5.35:y<21.6?4.0:2.3;
          mvPosition.x=clamp(mvPosition.x,-halfWidth,halfWidth);
          mvPosition.z+=sin(height*.91-portalTime*1.65)*.10*freedom;
          mvPosition = modelViewMatrix * mvPosition;
        `));
      shader.fragmentShader=declarations+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float surge=pow(.5+.5*sin((vPortalRest.y-4.4)*.86-portalTime*4.3+portalPhase),10.);
        float filament=.5+.5*sin(vPortalRest.y*3.1-portalTime*7.7+portalPhase);
        diffuseColor.rgb*=.58+surge*1.02+filament*.19;
      `);
    };
    material.customProgramCacheKey=()=> 'portal-lightning-flow-v1';
    materials[kind]=material;
  }
  const blocks=new Blocks(group,materials);
  function add(kind,x,y,z,w,h,d,tone){blocks.add(kind,x,y,z,w,h,d,tone);}
  branches.forEach(({p:points,k:kind,w:thickness},index)=>{
    const depth=-.02+(index%5)*.09;
    for(let segment=1;segment<points.length;segment++){
      const a=points[segment-1],b=points[segment];
      const steps=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.21));
      let px=a[0],py=a[1];
      for(let step=1;step<=steps;step++){
        const t=step/steps;
        const x=step===steps?b[0]:Math.round((a[0]+(b[0]-a[0])*t+(rng()-.5)*.25)/.105)*.105;
        const y=step===steps?b[1]:Math.round((a[1]+(b[1]-a[1])*t)/.105)*.105;
        add(kind,(x+px)/2,py,depth,Math.abs(x-px)+thickness,thickness,.095,.82+rng()*.28);
        add(kind,x,(y+py)/2,depth,thickness,Math.abs(y-py)+thickness,.11,.82+rng()*.28);
        px=x;py=y;
      }
    }
  });
  blocks.finish();
  group.traverse(mesh=>{
    if(!mesh.isInstancedMesh)return;
    mesh.castShadow=false;mesh.receiveShadow=false;
    // Shader movement exceeds the rest pose by less than one local unit.
    mesh.boundingSphere.radius+=1;
  });
  return{count:blocks.count,update(t){clock.value=t;}};
}
