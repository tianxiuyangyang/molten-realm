import * as THREE from 'three';
import { Blocks, randomSource, noise } from './rendering.js';
import { citadelMaterials } from './citadel-materials.js?v=2';
import { createCitadelLavaMaterial, createCitadelSky, addCitadelAtmosphere } from './citadel-atmosphere.js?v=4';
import { addCitadelDetails } from './citadel-details.js?v=3';

export function buildWorld(scene,progress){
 const rng=randomSource(),mats=citadelMaterials(),blocks=new Blocks(scene,mats);
 const B=(k,x,y,z,w,h,d,c=.8+rng()*.4,a=0,bevel=false)=>blocks.add(k,x,y,z,w,h,d,c,a,bevel);
 const flameSites=[],fallSites=[],terrainTiles=[];
 const glowTime={value:0};
 for(const kind of ['magma','hot']){
   mats[kind].onBeforeCompile=shader=>{
     shader.uniforms.citadelGlowTime=glowTime;
     shader.vertexShader='varying vec3 vCitadelGlow;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
       vec4 glowPoint=vec4(position,1.);
       #ifdef USE_INSTANCING
         glowPoint=instanceMatrix*glowPoint;
       #endif
       vCitadelGlow=(modelMatrix*glowPoint).xyz;
     `);
     shader.fragmentShader='uniform float citadelGlowTime;varying vec3 vCitadelGlow;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
       float thermal=.5+.5*sin(vCitadelGlow.y*2.8-citadelGlowTime*3.8+sin(vCitadelGlow.x*6.2+citadelGlowTime*.7)*1.6);
       thermal*=.7+.3*sin(vCitadelGlow.y*9.2-citadelGlowTime*5.1);
       totalEmissiveRadiance*=.70+thermal*.47;
     `);
   };
   mats[kind].customProgramCacheKey=()=> 'citadel-window-heat-v1';
 }
 const detailRng=randomSource(8821);
 const matLava=createCitadelLavaMaterial(),matFall=createCitadelLavaMaterial(true),skyMat=createCitadelSky(scene);
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),matLava);plane.rotation.x=-Math.PI/2;plane.position.y=-49;scene.add(plane);
 function fall(x,z,top,bottom,width,angle=0){fallSites.push({x,z,top,bottom,width,angle});const g=new THREE.PlaneGeometry(width,top-bottom,12,24);const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setZ(i,Math.sin(y*.48)*.15+Math.sin(y*.11)*.35);}g.computeVertexNormals();const mesh=new THREE.Mesh(g,matFall);mesh.position.set(x,(top+bottom)/2,z);mesh.rotation.y=angle;scene.add(mesh);}
 function flame(x,y,z,s=1){
   flameSites.push([x,y,z,s]);
   // Preserve the terrain's seeded random sequence when replacing fixed flame sticks.
   for(let i=0;i<7;i++){rng();rng();rng();rng();}
   B('dark',x,y-.14,z,1.5*s,.35,1.5*s,1,0,true);
 }

 function mushroom(x,y,z,r=3.8,allowLedge=true){
   const surface=terrainTiles.findLast(tile=>Math.abs(tile.x-x)<tile.half&&Math.abs(tile.z-z)<tile.half);
   if(surface&&y>surface.y-4)y=surface.y+.02;
   else if(!allowLedge)return;
   else {
     B('rock',x,y-.8,z,r*1.3,1.6,r*1.16,.6);
     B('ore',x+.1,y-1.9,z-.2,r*.92,.7,r*.84,.62);
     B('rock',x-.1,y-2.7,z-.4,r*.63,1,r*.68,.57);
   }
   const h=r*(1.35+rng()*.45),cell=Math.max(.34,r/11),stem=r*.3;
   for(let j=0;j<h;j+=.65){
     B('stem',x+Math.sin(j*.22)*.13,y+j+.31,z,stem,.66,stem,.65+rng()*.42);
     for(const side of [-1,1])if(rng()<.4)B('ore',x+(rng()-.5)*stem*.7,y+j+.18,z+side*(stem*.5+.012),stem*(.08+rng()*.16),.11+rng()*.13,.035,.65);
   }
   for(let ix=-r;ix<=r;ix+=cell)for(let iz=-r;iz<=r;iz+=cell){
     const dist=Math.hypot(ix,iz)/r;if(dist>1+.02*noise(ix,iz))continue;
     const rise=Math.floor((1-dist*dist)*r*.24/(cell*.55))*cell*.55,thickness=.38+rise;
     B('red',x+ix,y+h+thickness*.5,z+iz,cell*.99,thickness,cell*.99,.52+rng()*.75);
     if(dist>.8)B('stem',x+ix,y+h-.05,z+iz,cell*.85,.13,cell*.85,.46+rng()*.18);
     if(rng()<.24)B(rng()<.25?'ore':'red',x+ix,y+h+thickness+.02,z+iz,cell*.6,.065,cell*.58,.43+rng()*.65);
   }
 }

 function island(cx,cz,rx,rz,top,depth,step=2.5){
   for(let x=-rx;x<=rx;x+=step)for(let z=-rz;z<=rz;z+=step){let r=Math.sqrt((x/rx)**2+(z/rz)**2),edge=1+noise(x*.9,z*.9)*.05;if(r>edge)continue;
     let length=depth*Math.pow(Math.max(.035,1-r*.94),.63)+rng()*4;
     let surface=top+Math.floor(noise(x*.4,z*.4)*.7)*.42;
     B('rock',cx+x,surface-length/2,cz+z,step*.99,length,step*.99,.5+rng()*.45);
     B('stone',cx+x,surface-.2,cz+z,step,.45,step,.65+rng()*.45);terrainTiles.push({x:cx+x,z:cz+z,y:surface+.025,half:step*.51});
     for(let y=surface-2;y>surface-length;y-=2.5){if(r>.75||y<top-length+4||rng()<.08){B(rng()<.22?'ore':'rock',cx+x+(rng()-.5)*.6,y,cz+z+(rng()-.5)*.6,step*(.85+rng()*.28),2.3,step*(.85+rng()*.28),.4+rng()*.65);}}
     if(r>.8){for(let j=0;j<18;j++){let yy=surface-rng()*length,ox=(rng()-.5)*step*1.4,oz=(rng()-.5)*step*1.4;B(rng()<.16?'ore':'dark',cx+x+ox,yy,cz+z+oz,.35+rng()*.7,.3+rng()*.75,.35+rng()*.7,.55+rng()*.3);if(j%6===0)B('magma',cx+x+ox+.22,yy,cz+z+oz+.25,.05,.25+rng()*.5,.06,.35);}}
     if(r>.85&&rng()<.13){fall(cx+x,cz+z,surface-1,surface-length-7,.18+rng()*.4,rng()*Math.PI);}
   }
 }
 progress('雕刻玄武岩浮岛与峡谷',25);
 island(13,0,32,26,18,54,2.25);
 // Ground terraces frame, rather than obscure, the suspended castle and diagonal bridge.
 function cliff(cx,cz,rx,rz,top){for(let x=-rx;x<=rx;x+=4)for(let z=-rz;z<=rz;z+=4){let r=(x/rx)**2+(z/rz)**2;if(r>1+noise(x*.2,z*.2)*.09)continue;let h=top+Math.floor(noise(x*.35,z*.35)*3)*1.8;let deep=h+47;B('rock',cx+x,h-deep/2,cz+z,4,deep,4,.45+rng()*.5);B('stone',cx+x,h-.35,cz+z,4,.8,4,.7+rng()*.3);terrainTiles.push({x:cx+x,z:cz+z,y:h+.05,half:2.04});
       for(let chip=0;chip<3;chip++)B(chip===0?'edge':'dark',cx+x+(detailRng()-.5)*3.1,h+.07,cz+z+(detailRng()-.5)*3.1,.35+detailRng()*.65,.04,.17+detailRng()*.34,.3+detailRng()*.38);
if(r>.75)for(let y=h-2;y>-45;y-=4){
       B(rng()<.11?'ore':'rock',cx+x+.5,y,cz+z+.5,4.7,3.8,4.7,.35+rng()*.6);
       if(r>.83&&z>0)for(let chip=0;chip<4;chip++)B(chip%3?'rock':'ore',cx+x+(detailRng()-.5)*3.5,y+(detailRng()-.5)*2.9,cz+z+2.9,.3+detailRng()*.8,.18+detailRng()*.7,.13+detailRng()*.3,.4+detailRng()*.4);
     }if(r>.84&&rng()<.035)fall(cx+x,cz+z,h,-49,1+rng()*1.8);if(rng()<.007)flame(cx+x,h+.2,cz+z,.7);}}
 cliff(-76,88,32,36,14);cliff(93,29,22,43,10);cliff(-74,-52,38,39,10);cliff(65,-66,38,30,8);
 fall(-46,61,14,-49,4.2,.3);fall(-52,-17,10,-49,2.7,-.4);fall(76,28,10,-49,5.3,1.1);fall(70,-41,8,-49,3.3);fall(19,24,17,-49,1.6);
 for(const [x,y,z,w,a] of [[-46,14,61,4.2,.3],[-52,10,-17,2.7,-.4],[76,10,28,5.3,1.1],[70,8,-41,3.3,0],[19,17,24,1.6,0]]){
   for(let segment=0;segment<5;segment++){
     const xx=x-Math.sin(a)*(segment*.65+.24),zz=z-Math.cos(a)*(segment*.65+.24);
     B('rock',xx,y-.65,zz,w+1.2,1.2,.72,.6,a);
     B('magma',xx,y+.01,zz,w*.82,.08,.69,.7,a);
     for(const side of [-1,1])B('dark',xx+side*Math.cos(a)*(w*.5+.28),y+.12,zz-side*Math.sin(a)*(w*.5+.28),.5,.37,.74,.68,a);
   }
 }
 // Thin basalt crust on the lava floor breaks the otherwise flat sea.
 for(let i=0;i<150;i++){let x=(rng()-.5)*245,z=(rng()-.5)*200;if(rng()<.5)B('dark',x,-48.5+rng()*.6,z,1+rng()*4,.6,1+rng()*4,.4+rng()*.35,rng()*3);}
 // Castle construction: individual chamfered masonry courses with true voids for windows and gates.
 function wall(cx,z,base,w,h,depth=1.05,open=null,angle=0){let rowH=.95;for(let row=0;row<Math.ceil(h/rowH);row++){let yy=base+(row+.5)*rowH;if(yy>base+h+.2)continue;let pitch=1.65,offset=row%2?pitch*.5:0;for(let u=-w/2+offset;u<w/2;u+=pitch){let uu=Math.min(w/2-.2,u+pitch/2);if(open&&open(uu,yy-base))continue;let wx=cx+Math.cos(angle)*uu,wz=z-Math.sin(angle)*uu;B('stone',wx,yy,wz,pitch-.055,rowH-.055,depth,.48+rng()*.57,angle,true);}}}
 function trim(cx,y,cz,w,d){B('dark',cx,y-.14,cz,w+.65,.65,d+.65,.95,0,true);B('edge',cx,y+.22,cz,w+1,.18,d+1,.6,0,true);}
 function battlement(cx,cy,cz,w,d){trim(cx,cy-.8,cz,w,d);for(let x=-w/2;x<=w/2;x+=2.2)for(const z of [-d/2,d/2]){B('dark',cx+x,cy,cz+z,1.2,1.75,1.25,.9,0,true);B('edge',cx+x,cy+.86,cz+z,1.35,.22,1.4,.6,0,true);}for(let z=-d/2+2;z<d/2;z+=2.2)for(const x of [-w/2,w/2])B('dark',cx+x,cy,cz+z,1.25,1.75,1.2,.8,0,true);}
 function slit(cx,base,cz,w,h,angle=0){
   const transform=(u,y,d)=>[cx+u*Math.cos(angle)+d*Math.sin(angle),base+y,cz-u*Math.sin(angle)+d*Math.cos(angle)];
   // The glow is recessed behind a stepped pointed arch, not pasted over a wall.
   for(let y=.3;y<h;y+=.5){let width=w;if(y>h-w*.9)width=Math.max(.3,w-(y-(h-w*.9))*1.15);let p=transform(0,y,-.5);B('magma',...p,width,.54,.15,.7);p=transform(0,y,-.39);B('hot',...p,width*.2,.52,.15,.7);}
   for(let y=0;y<h;y+=.7){let narrowing=y>h-w*.8?(y-(h-w*.8))*.55:0;for(const s of [-1,1]){let p=transform(s*(w/2+.25-narrowing),y,.08);B('dark',...p,.6,.73,.65,.9,angle,true);}}
   for(const s of [-1,1]){let p=transform(s*(w/2+.65),h*.46,.15);B('edge',...p,.24,h*.92,.45,.58,angle,true);}let p=transform(0,-.12,.15);B('edge',...p,w+1.3,.3,1.1,.64,angle,true);
 }
 function keep(cx,cz,base,w,d,h,gate=false,monumental=false){let levels=monumental?[4]:gate?[3]:[4,13,22].filter(v=>v+6<h);let wins=gate||monumental?[0]:[-w*.28,0,w*.28];let opening=(u,y)=>wins.some(v=>Math.abs(u-v)<(gate?2.7:monumental?2.0:1.05)&&levels.some(l=>y>l&&y<l+(gate?9:monumental?11.8:6)));
   wall(cx,cz+d/2,base,w,h,1.25,opening);wall(cx,cz-d/2,base,w,h,1.25,opening);wall(cx+w/2,cz,base,d,h,1.25,null,Math.PI/2);wall(cx-w/2,cz,base,d,h,1.25,null,Math.PI/2);
   B('dark',cx,base+.2,cz,w,.5,d,.8);B('dark',cx,base+h-.25,cz,w,.55,d,.8);
   for(const y of levels)for(const x of wins){slit(cx+x,base+y,cz+d/2,gate?4.5:monumental?3.6:1.4,gate?9:monumental?11.8:6);slit(cx+x,base+y,cz-d/2,gate?4.5:monumental?3.6:1.4,gate?9:monumental?11.8:6,Math.PI);}
   for(let yy=base;yy<base+h;yy+=5.7){
     const crossesOpening=wins.some(x=>opening(x,yy-base)||opening(x,yy-base+.35));
     if(!crossesOpening){trim(cx,yy,cz,w,d);continue;}
     // A cornice ends at a window reveal; no solid slab may cross the fire alcove.
     const pitch=.75;
     for(let x=-w/2;x<w/2;x+=pitch){
       const u=Math.min(w/2-.18,x+pitch*.5);
       if(opening(u,yy-base)||opening(u,yy-base+.35))continue;
       for(const side of [-1,1]){
         B('dark',cx+u,yy-.14,cz+side*d*.5,pitch,.65,1.65,.86,0,true);
         B('edge',cx+u,yy+.22,cz+side*d*.5,pitch,.18,1.95,.5,0,true);
       }
     }
     for(const side of [-1,1]){
       B('dark',cx+side*w*.5,yy-.14,cz,1.65,.65,d+.65,.86,0,true);
       B('edge',cx+side*w*.5,yy+.22,cz,1.95,.18,d+1,.5,0,true);
     }
   }
   for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){B('dark',cx+x,base+h/2,cz+z,1.8,h,1.8,.85,0,true);for(let yy=base;yy<base+h;yy+=3.2)B('edge',cx+x,yy,cz+z,2.0,.35,2,.55,0,true);}
   battlement(cx,base+h+.5,cz,w,d);
 }
 function tower(cx,cz,base,w,h){
   keep(cx,cz,base,w,w,h,false,cx===13&&base===54);
   // Slender pilasters and asymmetric stepped crowns.
   for(const dx of [-w*.5,w*.5])for(const dz of [-w*.5,w*.5]){B('dark',cx+dx,base+h*.54,cz+dz,1.2,h+2,1.2,.82,0,true);B('edge',cx+dx,base+h+1.2,cz+dz,1.6,.35,1.6,.65);}
   let y=base+h+1;for(let j=0;j<5;j++){let ww=w+1-j*w*.145;B('dark',cx,y+j*.82,cz,ww,.84,ww,.8,0,true);B('edge',cx,y+j*.82+.39,cz,ww+.12,.13,ww+.12,.4);}
   B('dark',cx,y+5,cz,1.8,3,1.8,.7,0,true);flame(cx,y+6.7,cz,1.1);
 }
 progress('砌筑城堡砖石、尖拱与塔楼',45);
 // Raised court has an independently tiled floor.
 for(let x=-13;x<40;x+=1.9)for(let z=-21;z<23;z+=1.9)if((x-13)**2/29**2+z*z/24**2<1)B('stone',x,18.2,z,1.84,.45,1.84,.6+rng()*.6,0,true);
 keep(13,0,19,30,25,14,true);
 keep(13,-3,33,21,19,21,false,true);
 tower(13,-6,54,11,19);
 // The upper nave now has a true monumental void cut into its masonry.
 for(let y=58;y<70;y+=1){B('dark',10.8,y,.8,.9,.98,1.1,.75,0,true);B('dark',15.2,y,.8,.9,.98,1.1,.75,0,true);}
 tower(-3,-9,32,6.5,20);tower(29,-9,32,6.5,20);
 tower(-8,8,19,6.7,19);tower(34,8,19,6.7,19);
 tower(-10,-15,19,6.3,24);tower(36,-15,19,6.3,24);
 tower(-9,19,18,4.8,13);tower(35,19,18,4.8,13);
 // Flying buttresses, side aisles, ribs and carved horizontal cornices.
 for(const side of [-1,1])for(let z=-12;z<=9;z+=4.2){let x=13+side*16.4;B('dark',x,25,z,2,13,2,.7,0,true);for(let j=0;j<6;j++)B('stone',x-side*j*.65,32+j*1.6,z,1.9,2.4,1.8,.57+rng()*.2,0,true);B('edge',x,19,z,2.8,.6,2.8,.65);}
 // Front gatehouse and monumental stair joining upper doorway.
 keep(13,15,18.5,11,7,13,true);
 for(let i=0;i<17;i++){let y=31.5+i*.56,z=10-i*.51;B('dark',13,y-.4,z,8.2,.8,1,.85,0,true);B('edge',13,y+.02,z+.25,8.25,.13,.44,.6);for(const s of [-1,1])B('dark',13+s*4.5,y+.6,z,.6,1.5,.6,.9,0,true);}
 // Fluted basalt pilasters articulate the tall central nave.
 for(const x of [3.1,7.6,18.4,22.9]){for(let y=33;y<54;y+=1.4){B('dark',x,y,7.4,.68,1.37,1.1,.69,0,true);B('edge',x+.23,y,8,.13,1.32,.14,.5);}for(let j=0;j<3;j++)B('dark',x,54+j*.8,7.2,.8-j*.2,.85,1.2,.7);}
 for(const x of [8,18]){B('dark',x,65.3,-.05,.8,21,1.1,.78,0,true);for(let y=56;y<75;y+=2.3)B('edge',x,y,.1,1,.25,1.4,.6);}
 // Buttress foot fires light the lower faces rather than filling the whole frame with bloom.
 for(const z of [-8,-3,2,7])for(const x of [-3.4,29.4]){flame(x,19.5,z,.55);B('magma',x,20,z,.12,3,.17,.35);}
 // Carved rosette with radial inset stones above the nave's upper door.
 for(let i=0;i<16;i++){let a=i*Math.PI/8,x=13+Math.cos(a)*1.6,y=48+Math.sin(a)*1.6;B('edge',x,y,7.1,.45,.45,.45,.7,0,true);if(i%2===0)B('ember',13+Math.cos(a)*1.15,48+Math.sin(a)*1.15,7.4,.25,.25,.16,.55);}
 // Diamond sigil over the entrance, made of inset glowing voxel tesserae.
 for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)if(Math.abs(x)+Math.abs(y)===3||Math.abs(x)+Math.abs(y)===1)B('ember',13+x*.37,30+y*.37,19,.28,.28,.15,.72);
 // Courtyard balustrades and braziers.
 for(let x=-13;x<=39;x+=2.1){for(const z of [-22,22]){if(z>0&&Math.abs(x-13)<5)continue;B('dark',x,19.2,z,1.3,1.65,1.4,.75,0,true);B('edge',x,20.1,z,1.5,.24,1.6,.7);}}
 for(const x of [-11,-2,28,37])for(const z of [-19,20])flame(x,19.7,z,.85);
 // Long diagonal bridge, with stone paving, lava cracks, parapets, and deep arches.
 const start=new THREE.Vector3(-62,16,99),end=new THREE.Vector3(13,18.4,23),delta=end.clone().sub(start),len=Math.hypot(delta.x,delta.z),dir=delta.clone().normalize();const angle=Math.atan2(-dir.z,dir.x),normal=new THREE.Vector3(-dir.z,0,dir.x);
 function bridgePoint(s,offset=0){return start.clone().lerp(end,s).addScaledVector(normal,offset);}
 const parts=Math.ceil(len/1.4);
 for(let i=0;i<parts;i++){const t=i/(parts-1),p=bridgePoint(t);for(let j=-3;j<=3;j++){let q=p.clone().addScaledVector(normal,j*1.05);B('stone',q.x,p.y-.35,q.z,1.34,.7,1.01,.55+rng()*.55,angle,true);if(rng()<.065)B('magma',q.x,p.y+.02,q.z,.35,.025,.7,.6,angle);}
 for(const s of [-1,1]){const q=bridgePoint(t,s*4);B('dark',q.x,p.y-.2,q.z,1.4,1.2,.8,.6,angle,true);if(i%2===0){B('dark',q.x,p.y+1.02,q.z,.8,1.3,1,.8,angle,true);B('edge',q.x,p.y+1.73,q.z,.9,.19,1.1,.65,angle);}const depth=3+4*(1-Math.abs(Math.sin(t*Math.PI*4)));B('dark',q.x,p.y-depth/2-1,q.z,1.38,depth,1.2,.65+rng()*.35,angle);}
 if(i%12===3)for(const s of [-1,1]){const q=bridgePoint(t,s*4.5);B('dark',q.x,p.y+1,q.z,1.9,2,1.9,.8,angle,true);flame(q.x,p.y+2.1,q.z,.7);}}
 for(let i=0;i<parts;i++){let t=i/(parts-1),p=bridgePoint(t);for(const s of [-1,1]){let q=bridgePoint(t,s*4.65);for(let row=0;row<3;row++)B('stone',q.x,p.y-1.5-row*.85,q.z,1.25,.76,.4,.4+rng()*.25,angle,true);}}
 for(const t of [.17,.47,.76]){const p=bridgePoint(t);for(let y=-39;y<p.y-3;y+=2.1){let w=y>p.y-11?6.8:4.1;B('rock',p.x,y,p.z,w,2.05,5,.5+rng()*.4,angle);if(rng()<.25)B('magma',p.x+2,y,p.z+2,.22,.7,.1,.55);}for(let j=0;j<7;j++){const q=bridgePoint(t+(j-3)*.014);B('dark',q.x,p.y-4-Math.abs(j-3)*.8,q.z,1.5,3.5,7.7,.62,angle);}}
 progress('构建菌林、远景石柱与火山碎屑',68);
 // Foreground and island fungi: tessellated stepped caps instead of primitive cylinders.
 for(const [x,y,z,r] of [[-62,16,99,6],[-76,14,60,7],[-59,14,65,3.5],[-90,14,65,6],[85,12,57,7.8],[80,12,38,5.8],[76,10,11,3.6],[80,9,-10,5],[-57,12,-27,3.6],[-70,11,-44,5],[-78,11,-68,3.6],[-14,18,15,2.3],[41,15,2,2.8],[33,9,23,2.4],[8,-13,24,2.5],[-6,3,21,2.1]])mushroom(x,y,z,r);
 for(let i=0;i<22;i++){let x=(i%2?-1:1)*(50+rng()*55),z=-40-rng()*65;mushroom(x,8,z,1.6+rng()*2,false);}
 // Distant inverted basalt columns, stepped tapering silhouettes.
 function monolith(x,z,h,w){for(let y=-45;y<h;y+=2.5){let ww=w*(.24+.76*(Math.max(0,y)/h)**2);for(let j=0;j<5;j++){let xx=x+(j-2)*ww*.22;B('rock',xx,y,z+noise(j*4,y)*1.4,ww*.25,2.4,ww*.8,.24+rng()*.2);}if(rng()<.15)B('ore',x+ww*.4,y,z+ww*.4,.45,.6,.3,.6);}for(let j=0;j<16;j++){let dx=(rng()-.5)*w,dz=(rng()-.5)*w;B('dark',x+dx,h-2+rng()*4,z+dz,w*.22,3+rng()*3,w*.22,.5);}}
 for(const [x,z,h,w] of [[-82,-86,73,17],[-44,-110,46,13],[30,-120,39,11],[86,-87,60,15],[111,-43,95,22],[-115,-14,105,25],[-21,-146,39,9],[113,-154,44,16]])monolith(x,z,h,w);
 // Distant serrated volcanic ridge.
 for(let i=0;i<110;i++){let x=-220+i*4;let h=10+Math.abs(noise(x*.11,17))*22;B('rock',x,(h-49)/2,-175-rng()*20,5,h+49,12,.27+rng()*.18);}
 for(let i=0;i<120;i++){let x=(rng()-.5)*170,y=-34+rng()*126,z=(rng()-.5)*125;if(Math.abs(x-13)<29&&z>-30&&z<25&&y>10&&y<78)continue;let size=.25+rng()*.85;B('stone',x,y,z,size,size*.8,size,.9,rng()*3);if(i%4===0)B('ember',x,y-.2*size,z,size*.5,.15,size*.45,.4);}
 blocks.finish();
 progress('刻画风化石券、桥面与热流薄雾',84);
 const details=addCitadelDetails(scene,mats);
 const atmosphere=addCitadelAtmosphere(scene,flameSites,fallSites);
 // Slow rising embers on the GPU, with near/far size attenuation and no per-frame allocation.
 const count=950,p=new Float32Array(count*3),speeds=new Float32Array(count),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){p[i*3]=(rng()-.5)*195;p[i*3+1]=-43+rng()*154;p[i*3+2]=(rng()-.5)*180;speeds[i]=.6+rng()*2.2;sizes[i]=rng()*2+.5;}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(p,3));geom.setAttribute('speed',new THREE.BufferAttribute(speeds,1));geom.setAttribute('size',new THREE.BufferAttribute(sizes,1));
 const particleMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},ratio:{value:1}},vertexShader:`attribute float speed;attribute float size;uniform float time;uniform float ratio;varying float vHeat;void main(){vec3 p=position;p.y=mod(p.y+43.+time*speed,154.)-43.;p.x+=sin(time*.25+position.z)*1.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*ratio*145./-mv.z,.8,5.);vHeat=size*.3;}`,fragmentShader:`varying float vHeat;void main(){float d=length(gl_PointCoord-.5);float a=1.-smoothstep(.1,.5,d);gl_FragColor=vec4(1.,.28+vHeat*.25,.025,a*.85);}`});scene.add(new THREE.Points(geom,particleMat));
 return {blockCount:blocks.count+details.blockCount+atmosphere.count,flameSites,update(t,dpr){glowTime.value=t;atmosphere.update(t,dpr);matLava.uniforms.time.value=t;matFall.uniforms.time.value=t;skyMat.uniforms.time.value=t;particleMat.uniforms.time.value=t;particleMat.uniforms.ratio.value=dpr;}};
}
