import * as THREE from 'three';
import {makeRng,roundRect,textureCanvas,canvasTexture} from './konbini-utils.js?v=4';

const JP='"Yu Gothic UI","Yu Gothic","Hiragino Kaku Gothic ProN","Meiryo","Noto Sans JP",sans-serif';
const SERIF='"Yu Mincho","YuMincho","Hiragino Mincho ProN","Noto Serif JP",serif';

function noiseFill(ctx,width,height,rng,amount=16,alpha=.2){
  const image=ctx.getImageData(0,0,width,height);
  for(let i=0;i<image.data.length;i+=4){
    const n=(rng()-.5)*amount;
    image.data[i]=Math.max(0,Math.min(255,image.data[i]+n));
    image.data[i+1]=Math.max(0,Math.min(255,image.data[i+1]+n));
    image.data[i+2]=Math.max(0,Math.min(255,image.data[i+2]+n));
  }
  ctx.putImageData(image,0,0);
}
function softBlotches(ctx,width,height,rng,count,colors,radius=80,alpha=.12){
  ctx.save();
  for(let i=0;i<count;i++){
    const x=rng()*width,y=rng()*height,r=radius*(.35+rng());
    const gradient=ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,colors[Math.floor(rng()*colors.length)]);
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=alpha*(.4+rng());
    ctx.fillStyle=gradient;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  ctx.restore();
}
function spacedText(ctx,text,x,y,spacing){
  let cursor=x;
  for(const char of text){
    ctx.fillText(char,cursor,y);
    cursor+=ctx.measureText(char).width+spacing;
  }
}

export function makeAsphaltTextures(){
  const rng=makeRng(9217);
  const size=1024;
  const {canvas,ctx}=textureCanvas(size,size);
  ctx.fillStyle='#202833';ctx.fillRect(0,0,size,size);
  const grad=ctx.createLinearGradient(0,0,size,size);
  grad.addColorStop(0,'rgba(51,65,80,.45)');
  grad.addColorStop(.45,'rgba(23,30,41,0)');
  grad.addColorStop(1,'rgba(10,16,26,.3)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,size,size);
  for(let i=0;i<28000;i++){
    const shade=rng()>.5?255:0;
    ctx.fillStyle=`rgba(${shade},${shade},${shade},${rng()*.075})`;
    const s=rng()*2.4+.4;
    ctx.fillRect(rng()*size,rng()*size,s,s);
  }
  softBlotches(ctx,size,size,rng,34,['#0a111c','#3e4750','#162431'],150,.18);
  ctx.lineCap='round';
  for(let i=0;i<22;i++){
    let x=rng()*size,y=rng()*size;
    ctx.beginPath();ctx.moveTo(x,y);
    for(let j=0;j<7;j++){
      x+=rng()*45-22;y+=rng()*28-8;
      ctx.lineTo(x,y);
    }
    ctx.strokeStyle=`rgba(7,12,19,${.12+rng()*.25})`;
    ctx.lineWidth=.7+rng()*1.5;ctx.stroke();
  }
  for(let i=0;i<9;i++){
    const x=rng()*size,y=rng()*size,w=90+rng()*260,h=12+rng()*44;
    ctx.strokeStyle='rgba(120,137,146,.09)';
    ctx.lineWidth=1.4;
    roundRect(ctx,x,y,w,h,8);ctx.stroke();
  }
  ctx.globalAlpha=.1;
  for(let i=0;i<10;i++){
    const y=rng()*size;
    const g=ctx.createLinearGradient(0,y,size,y+120);
    g.addColorStop(0,'rgba(130,145,155,0)');
    g.addColorStop(.5,'rgba(130,145,155,.24)');
    g.addColorStop(1,'rgba(130,145,155,0)');
    ctx.fillStyle=g;ctx.fillRect(0,y,size,120+rng()*120);
  }
  ctx.globalAlpha=1;
  const color=canvasTexture(canvas,{repeat:[5.4,5.4]});
  const {canvas:roughCanvas,ctx:roughCtx}=textureCanvas(512,512);
  const rough=roughCtx.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const i=(y*512+x)*4;
    const n=90+(Math.sin(x*.03+Math.cos(y*.02)*2.4)*30)+(rng()-.5)*40;
    rough.data[i]=Math.max(30,Math.min(200,n));
    rough.data[i+1]=rough.data[i];rough.data[i+2]=rough.data[i];
    rough.data[i+3]=255;
  }
  roughCtx.putImageData(rough,0,0);
  const roughness=canvasTexture(roughCanvas,{srgb:false,repeat:[5.4,5.4]});
  return {color,roughness};
}

export function makePavingTexture(){
  const rng=makeRng(4302);
  const {canvas,ctx}=textureCanvas(1024,1024);
  ctx.fillStyle='#747d82';ctx.fillRect(0,0,1024,1024);
  const grad=ctx.createLinearGradient(0,0,1024,1024);
  grad.addColorStop(0,'rgba(186,194,199,.3)');
  grad.addColorStop(.52,'rgba(112,122,128,.1)');
  grad.addColorStop(1,'rgba(72,83,89,.3)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,1024,1024);
  for(let i=0;i<30000;i++){
    const light=rng()>.5?255:10;
    ctx.fillStyle=`rgba(${light},${light},${light},${rng()*.055})`;
    ctx.fillRect(rng()*1024,rng()*1024,rng()*2+.3,rng()*2+.3);
  }
  ctx.strokeStyle='rgba(30,40,48,.48)';ctx.lineWidth=2;
  for(let x=0;x<=1024;x+=256){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}
  for(let y=0;y<=1024;y+=256){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
  ctx.strokeStyle='rgba(217,225,226,.16)';ctx.lineWidth=1;
  for(let x=2;x<=1024;x+=256){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1024);ctx.stroke();}
  for(let y=2;y<=1024;y+=256){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
  softBlotches(ctx,1024,1024,rng,30,['#202b31','#939b9d','#3d4b52'],110,.16);
  for(let i=0;i<18;i++){
    const x=rng()*1024,y=rng()*1024,r=20+rng()*80;
    const p=ctx.createRadialGradient(x,y,0,x,y,r);
    p.addColorStop(0,'rgba(20,30,37,.28)');
    p.addColorStop(1,'rgba(20,30,37,0)');
    ctx.fillStyle=p;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  return canvasTexture(canvas,{repeat:[5,2]});
}

export function makeGravelTexture(){
  const rng=makeRng(613);
  const {canvas,ctx}=textureCanvas(512,512);
  ctx.fillStyle='#4b5760';ctx.fillRect(0,0,512,512);
  for(let i=0;i<17000;i++){
    const v=Math.floor(40+rng()*118);
    ctx.fillStyle=`rgba(${v},${v+5},${v+9},${.25+rng()*.4})`;
    const s=.6+rng()*2.4;
    ctx.fillRect(rng()*512,rng()*512,s,s);
  }
  for(let i=0;i<28;i++){
    ctx.strokeStyle='rgba(20,27,34,.25)';ctx.lineWidth=.8+rng();
    ctx.beginPath();let x=rng()*512,y=rng()*512;ctx.moveTo(x,y);
    for(let j=0;j<5;j++){x+=rng()*30-15;y+=rng()*20-10;ctx.lineTo(x,y);}
    ctx.stroke();
  }
  return canvasTexture(canvas,{repeat:[3,3]});
}

export function makeStoreSignTexture(){
  const {canvas,ctx}=textureCanvas(2048,360);
  const bg=ctx.createLinearGradient(0,0,0,360);
  bg.addColorStop(0,'#fbf6df');bg.addColorStop(.55,'#f4f0dc');bg.addColorStop(1,'#e5ecdf');
  ctx.fillStyle=bg;ctx.fillRect(0,0,2048,360);
  const wash=ctx.createLinearGradient(0,0,2048,360);
  wash.addColorStop(0,'rgba(130,220,220,.14)');
  wash.addColorStop(.52,'rgba(255,255,255,0)');
  wash.addColorStop(1,'rgba(242,142,115,.1)');
  ctx.fillStyle=wash;ctx.fillRect(0,0,2048,360);
  ctx.strokeStyle='rgba(31,67,70,.16)';ctx.lineWidth=4;
  ctx.strokeRect(17,17,2014,326);
  // Brand roundel.
  ctx.fillStyle='#1d656a';ctx.beginPath();ctx.arc(112,158,78,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(112,158,64,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#f8f1d8';
  ctx.beginPath();ctx.moveTo(69,177);ctx.lineTo(112,118);ctx.lineTo(157,177);ctx.lineTo(141,177);ctx.lineTo(112,143);ctx.lineTo(85,177);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(84,185);ctx.lineTo(140,185);ctx.lineTo(140,200);ctx.lineTo(84,200);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ee8d78';
  ctx.beginPath();ctx.arc(112,160,10,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1d656a';
  ctx.font=`700 102px ${JP}`;
  ctx.fillText('まちかどマート',214,177);
  ctx.font=`600 29px ${JP}`;
  ctx.fillStyle='#4c6a68';
  ctx.letterSpacing='10px';
  ctx.fillText('MACHIKADO MART',218,237);
  ctx.letterSpacing='0px';
  ctx.font=`500 20px ${JP}`;
  ctx.fillStyle='#78918a';
  ctx.fillText('ATM ・ コピー ・ 宅配便 ・ 雨宿りできます',218,286);
  // 24h badge.
  const badge=ctx.createLinearGradient(1580,45,1890,280);
  badge.addColorStop(0,'#ee8876');badge.addColorStop(1,'#e4605e');
  ctx.fillStyle=badge;
  roundRect(ctx,1578,44,306,232,24);ctx.fill();
  ctx.fillStyle='#fff8e8';ctx.textAlign='center';
  ctx.font=`800 116px ${JP}`;
  ctx.fillText('24',1716,174);
  ctx.font=`800 61px ${JP}`;
  ctx.fillText('H',1830,174);
  ctx.font=`600 23px ${JP}`;
  ctx.letterSpacing='5px';
  ctx.fillText('OPEN ALL NIGHT',1729,218);
  ctx.letterSpacing='0px';
  ctx.fillStyle='#f8f0dc';ctx.fillRect(60,305,1420,11);
  ctx.fillStyle='#6fc9ce';ctx.fillRect(60,305,370,11);
  ctx.fillStyle='#ea8a73';ctx.fillRect(430,305,220,11);
  ctx.fillStyle='#f1c56d';ctx.fillRect(1950,55,20,222);
  ctx.textAlign='left';
  for(let i=0;i<9;i++){
    ctx.fillStyle='rgba(33,69,71,.11)';
    ctx.fillRect(220+i*175,330,70,3);
  }
  const texture=canvasTexture(canvas);
  const emissive=texture.clone();emissive.needsUpdate=true;
  return {map:texture,emissive};
}

export function makeBladeSignTexture(){
  const {canvas,ctx}=textureCanvas(512,1536);
  const grad=ctx.createLinearGradient(0,0,512,1536);
  grad.addColorStop(0,'#f7f4df');grad.addColorStop(1,'#dce9e4');
  ctx.fillStyle=grad;ctx.fillRect(0,0,512,1536);
  ctx.strokeStyle='#1e666c';ctx.lineWidth=18;ctx.strokeRect(16,16,480,1504);
  ctx.fillStyle='#1e666c';ctx.beginPath();ctx.arc(256,198,112,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f6f0d9';
  ctx.beginPath();ctx.moveTo(178,228);ctx.lineTo(256,128);ctx.lineTo(334,228);ctx.lineTo(306,228);ctx.lineTo(256,162);ctx.lineTo(206,228);ctx.closePath();ctx.fill();
  ctx.fillRect(194,242,124,27);
  ctx.fillStyle='#e87566';ctx.beginPath();ctx.arc(256,193,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e66f63';ctx.textAlign='center';
  ctx.font=`800 210px ${JP}`;
  ctx.fillText('24',256,580);ctx.fillText('H',256,778);
  ctx.fillStyle='#1d5b62';
  ctx.font=`700 58px ${JP}`;
  ctx.fillText('まちかど',256,925);
  ctx.fillText('マート',256,1003);
  ctx.font=`500 30px ${JP}`;
  ctx.letterSpacing='6px';
  ctx.fillText('MACHIKADO',256,1080);
  ctx.fillText('MART',256,1124);
  ctx.letterSpacing='0px';
  ctx.fillStyle='#69c5c9';ctx.fillRect(85,1180,342,20);
  ctx.fillStyle='#e88673';ctx.fillRect(85,1214,212,20);
  ctx.strokeStyle='rgba(28,84,88,.18)';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(256,1380,74,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#476c6c';ctx.font=`600 25px ${JP}`;
  ctx.fillText('雨の日も、いつもの場所で。',256,1384);
  return canvasTexture(canvas);
}

export function makeVendingTexture(variant=0){
  const {canvas,ctx}=textureCanvas(640,1280);
  const rng=makeRng(122+variant*47);
  const body=ctx.createLinearGradient(0,0,640,0);
  body.addColorStop(0,variant?'#e9d9cc':'#e8f1ed');
  body.addColorStop(.45,variant?'#fff3e4':'#ffffff');
  body.addColorStop(1,variant?'#cdb7ab':'#c9d9d7');
  ctx.fillStyle=body;ctx.fillRect(0,0,640,1280);
  ctx.fillStyle=variant?'#bb645b':'#29787e';ctx.fillRect(0,0,640,169);
  ctx.fillStyle='#f8f4df';ctx.font=`800 62px ${JP}`;
  ctx.fillText(variant?'あまやどり':'つゆしずく',52,93);
  ctx.font=`500 26px ${JP}`;
  ctx.letterSpacing='5px';
  ctx.fillText(variant?'AMA YADORI DRINKS':'TSUYUSHIZUKU DRINK',54,135);
  ctx.letterSpacing='0px';
  ctx.fillStyle='#f0c86a';ctx.beginPath();ctx.arc(548,82,52,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#434f44';ctx.font=`700 24px ${JP}`;ctx.textAlign='center';ctx.fillText('COLD',548,78);ctx.fillText('HOT',548,105);ctx.textAlign='left';
  // Display case.
  const caseGrad=ctx.createLinearGradient(0,188,0,977);
  caseGrad.addColorStop(0,'#0d2d38');caseGrad.addColorStop(1,'#15343c');
  ctx.fillStyle=caseGrad;roundRect(ctx,35,190,570,784,22);ctx.fill();
  ctx.strokeStyle='rgba(180,248,255,.5)';ctx.lineWidth=4;ctx.stroke();
  const shelfColors=['#61d4df','#f1d66a','#e88271','#77bb85','#f0a9cf','#8ba9e6'];
  for(let row=0;row<3;row++){
    const y=267+row*230;
    ctx.fillStyle='rgba(204,249,252,.55)';ctx.fillRect(58,y+118,522,7);
    for(let col=0;col<7;col++){
      const x=70+col*73;
      const color=shelfColors[Math.floor(rng()*shelfColors.length)];
      ctx.fillStyle=color;roundRect(ctx,x,y,53,108,10);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.65)';ctx.fillRect(x+10,y+38,33,7);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x,y+58,53,28);
      ctx.fillStyle='#fff4da';ctx.font=`700 16px ${JP}`;ctx.fillText(String(120+rng()*80|0),x+8,y+143-row*2);
    }
    ctx.fillStyle='#f1d777';ctx.font=`600 17px ${JP}`;
    ctx.fillText(['つめた〜い','あったか〜い','おすすめ'][row],486,y+143);
  }
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(58,208,14,748);
  // Buttons and payment panel.
  ctx.fillStyle='#dfe7de';ctx.fillRect(35,1003,570,101);
  for(let i=0;i<7;i++){
    ctx.fillStyle=i===2?'#e98469':'#576562';
    roundRect(ctx,64+i*73,1022,48,23,6);ctx.fill();
  }
  ctx.fillStyle='#82d9df';ctx.font=`600 21px ${JP}`;
  ctx.fillText('IC かざしてね',68,1079);
  ctx.fillStyle='#34423e';ctx.fillRect(438,1018,124,51);
  ctx.fillStyle='#98f0df';ctx.font=`700 24px ${JP}`;ctx.fillText('¥ 130',462,1053);
  // Dispenser.
  ctx.fillStyle='#24312f';roundRect(ctx,35,1121,570,105,13);ctx.fill();
  ctx.fillStyle='#0d1414';roundRect(ctx,68,1150,390,47,7);ctx.fill();
  ctx.fillStyle='#b9c5be';ctx.font=`600 19px ${JP}`;ctx.fillText('PUSH',480,1160);
  ctx.fillStyle='#26332f';ctx.beginPath();ctx.arc(490,1183,23,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f6f3df';ctx.font=`700 25px ${JP}`;ctx.fillText('つめた〜い　180ml',61,1255);
  const texture=canvasTexture(canvas);
  return texture;
}

export function makePosterTexture(kind=0){
  const {canvas,ctx}=textureCanvas(512,720);
  const rng=makeRng(501+kind*77);
  const base=['#e8d7ae','#bb3734','#1d3d56','#f1c453','#f3eee4','#294942'][kind%6];
  const ink=['#243e40','#f9e8c3','#f5dfc0','#213537','#25353c','#f3e5d1'][kind%6];
  ctx.fillStyle=base;ctx.fillRect(0,0,512,720);
  if(kind===0){
    // Ramen poster.
    ctx.fillStyle='#8e2327';ctx.fillRect(30,28,452,80);
    ctx.fillStyle='#f8e7c4';ctx.textAlign='center';ctx.font=`800 49px ${JP}`;ctx.fillText('ラーメン',256,88);
    ctx.fillStyle='#f0c768';ctx.beginPath();ctx.arc(256,315,150,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#94462f';ctx.beginPath();ctx.arc(256,315,112,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f3d79b';ctx.beginPath();ctx.ellipse(256,320,93,68,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f4e3b1';ctx.lineWidth=11;ctx.beginPath();
    for(let i=0;i<4;i++){ctx.moveTo(195+i*40,275);ctx.bezierCurveTo(215+i*40,235,190+i*40,205,210+i*40,165);}
    ctx.stroke();
    ctx.fillStyle='#5c803f';ctx.fillRect(197,303,45,22);ctx.fillRect(277,291,38,19);
    ctx.fillStyle='#8f2728';ctx.font=`700 34px ${JP}`;ctx.fillText('雨の日は、あったかく。',256,524);
    ctx.font=`500 24px ${JP}`;ctx.fillText('町角食堂　夜10時まで',256,586);
    ctx.strokeStyle='rgba(255,245,214,.65)';ctx.lineWidth=3;ctx.strokeRect(17,17,478,686);
  }else if(kind===1){
    // Festival poster.
    ctx.fillStyle='#0a1427';ctx.fillRect(0,0,512,720);
    const grad=ctx.createRadialGradient(110,150,0,110,150,280);
    grad.addColorStop(0,'rgba(244,195,90,.5)');grad.addColorStop(1,'rgba(10,20,39,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,512,500);
    for(let i=0;i<20;i++){
      ctx.fillStyle=['#f3c66b','#e88b73','#77c5c5','#f3eee4'][i%4];
      ctx.beginPath();
      for(let p=0;p<10;p++){
        const a=Math.PI*2*p/10,r=p%2?4:12;
        ctx.lineTo(90+rng()*340+Math.cos(a)*r,55+rng()*240+Math.sin(a)*r);
      }
      ctx.closePath();ctx.fill();
    }
    ctx.textAlign='center';ctx.fillStyle='#f7e9c7';ctx.font=`800 82px ${SERIF}`;ctx.fillText('夏まつり',256,343);
    ctx.fillStyle='#eab76b';ctx.fillRect(144,379,224,4);
    ctx.font=`500 28px ${JP}`;ctx.fillText('八月二十四日　夕暮れから',256,438);
    ctx.fillText('町角商店街　雨宮神社',256,486);
    ctx.strokeStyle='rgba(245,231,198,.4)';ctx.lineWidth=3;ctx.strokeRect(22,22,468,676);
  }else if(kind===2){
    // Lost cat poster.
    ctx.fillStyle='#f5e9c8';ctx.fillRect(0,0,512,720);
    ctx.fillStyle='#3b332c';ctx.textAlign='center';ctx.font=`800 39px ${JP}`;ctx.fillText('さがしています',256,82);
    ctx.fillStyle='#6f6758';ctx.font=`500 23px ${JP}`;ctx.fillText('ねこが いなくなりました',256,128);
    ctx.fillStyle='#d3a365';ctx.beginPath();ctx.ellipse(256,332,118,142,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(158,246);ctx.lineTo(188,145);ctx.lineTo(236,228);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(354,246);ctx.lineTo(324,145);ctx.lineTo(276,228);ctx.closePath();ctx.fill();
    ctx.fillStyle='#392f29';ctx.beginPath();ctx.arc(215,315,10,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(297,315,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff3df';ctx.beginPath();ctx.ellipse(256,378,63,45,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#42362d';ctx.beginPath();ctx.moveTo(246,370);ctx.lineTo(266,370);ctx.lineTo(256,383);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#41362d';ctx.lineWidth=8;ctx.beginPath();ctx.arc(256,398,40,.2,Math.PI-.2);ctx.stroke();
    ctx.fillStyle='#5b5144';ctx.font=`600 25px ${JP}`;ctx.fillText('茶トラ　「こむぎ」　オス',256,552);
    ctx.font=`500 20px ${JP}`;ctx.fillText('雨の日、駅前のコンビニ付近で',256,600);
    ctx.fillText('見かけたという情報がありました。',256,630);
    ctx.fillStyle='#bb6f56';ctx.fillRect(76,664,360,3);
    ctx.fillStyle='#6e6253';ctx.font=`500 18px ${JP}`;ctx.fillText('090-xxxx-xxxx',256,700);
  }else if(kind===3){
    // Hiring poster, pop colors.
    ctx.fillStyle='#f3efd9';ctx.fillRect(0,0,512,720);
    ctx.fillStyle='#dd6d64';ctx.beginPath();ctx.arc(470,84,153,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1d575c';ctx.fillRect(0,438,512,146);
    ctx.fillStyle='#1d3b40';ctx.textAlign='left';ctx.font=`800 58px ${JP}`;ctx.fillText('スタッフ',52,162);ctx.fillText('募集',52,231);
    ctx.fillStyle='#e87469';ctx.font=`600 25px ${JP}`;ctx.fillText('雨の日も、はたらく。',54,286);
    ctx.fillStyle='#fff4df';ctx.font=`800 48px ${JP}`;ctx.fillText('時給 1,250円〜',50,511);
    ctx.font=`500 23px ${JP}`;ctx.fillText('深夜・早朝 歓迎 / 交通費支給',54,554);
    ctx.fillStyle='#1c4c51';ctx.font=`700 27px ${JP}`;ctx.fillText('まちかどマート 店長まで',54,663);
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=4;ctx.strokeRect(20,20,472,680);
  }else if(kind===4){
    // Coffee poster.
    ctx.fillStyle='#2f3f3b';ctx.fillRect(0,0,512,720);
    ctx.fillStyle='#f0e7d0';ctx.textAlign='center';ctx.font=`800 54px ${SERIF}`;ctx.fillText('雨音に',256,132);ctx.fillText('コーヒーを。',256,199);
    ctx.fillStyle='#cea96f';ctx.beginPath();ctx.ellipse(256,383,135,86,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#56412e';ctx.beginPath();ctx.ellipse(256,375,112,61,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ede4d0';ctx.beginPath();ctx.ellipse(256,371,94,48,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#6c4b34';ctx.beginPath();ctx.ellipse(256,371,72,35,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#e9ddc5';ctx.lineWidth=13;ctx.beginPath();ctx.arc(397,382,54,-1.2,1.2);ctx.stroke();
    ctx.strokeStyle='rgba(244,235,216,.55)';ctx.lineWidth=8;ctx.beginPath();
    ctx.moveTo(220,248);ctx.bezierCurveTo(190,203,250,185,223,140);
    ctx.moveTo(282,248);ctx.bezierCurveTo(255,201,308,184,286,135);ctx.stroke();
    ctx.font=`500 30px ${JP}`;ctx.fillStyle='#e9dcc0';ctx.fillText('HOT COFFEE   ¥150',256,543);
    ctx.font=`500 22px ${JP}`;ctx.fillText('町角マート店内',256,596);
  }else{
    // Rain memory / photo poster.
    ctx.fillStyle='#d8d6bd';ctx.fillRect(0,0,512,720);
    ctx.fillStyle='#8f3b45';ctx.fillRect(46,46,420,264);
    ctx.fillStyle='#cbb391';ctx.fillRect(62,62,388,232);
    ctx.fillStyle='#424b4f';ctx.beginPath();ctx.arc(330,145,55,0,Math.PI*2);ctx.fill();
    for(let i=0;i<7;i++){
      ctx.strokeStyle='rgba(34,45,50,.6)';ctx.lineWidth=8;
      ctx.beginPath();ctx.moveTo(62+i*60,294);ctx.lineTo(62+i*60,62);ctx.stroke();
    }
    ctx.fillStyle='#303b40';ctx.fillRect(62,204,388,90);
    ctx.fillStyle='#f4e8d0';ctx.font=`800 55px ${JP}`;ctx.textAlign='center';ctx.fillText('雨の記憶',256,414);
    ctx.font=`500 25px ${JP}`;ctx.fillText('写真展　九月二日 - 三十日',256,475);
    ctx.fillText('旧雨宮写真館',256,521);
    ctx.strokeStyle='#68494b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(126,560);ctx.lineTo(386,560);ctx.stroke();
  }
  return canvasTexture(canvas);
}

export function makePosterBoardTexture(){
  const {canvas,ctx}=textureCanvas(1024,1024);
  ctx.fillStyle='#5a4432';ctx.fillRect(0,0,1024,1024);
  ctx.fillStyle='#a98658';ctx.fillRect(28,28,968,968);
  const rng=makeRng(7782);
  for(let i=0;i<12000;i++){
    ctx.fillStyle=`rgba(${rng()>.5?70:255},${rng()>.5?60:235},${rng()>.5?40:190},${rng()*.05})`;
    ctx.fillRect(rng()*1024,rng()*1024,2,2);
  }
  const cards=[
    {x:54,y:52,w:290,h:414,c:'#f2e8c9',ink:'#25383b',title:'まちかど',sub:'ラジオ体操',accent:'#d56e61'},
    {x:370,y:64,w:280,h:380,c:'#213e4e',ink:'#f4e6c8',title:'夏祭り',sub:'8.24 SUN',accent:'#e9bc66'},
    {x:676,y:42,w:282,h:402,c:'#ddd1ac',ink:'#40352e',title:'ねこ',sub:'さがしています',accent:'#dc9d63'},
    {x:68,y:514,w:294,h:418,c:'#de6d61',ink:'#fff0d3',title:'バイト',sub:'募集しています',accent:'#f4d281'},
    {x:390,y:500,w:272,h:446,c:'#f2efe3',ink:'#293b3a',title:'商店街',sub:'防災訓練',accent:'#5f9ba0'},
    {x:690,y:484,w:266,h:424,c:'#2e4b41',ink:'#f0e3c6',title:'珈琲',sub:'雨音ブレンド',accent:'#d6ac70'}
  ];
  for(const card of cards){
    ctx.save();
    ctx.translate(card.x+card.w/2,card.y+card.h/2);
    ctx.rotate((rng()-.5)*.04);
    ctx.fillStyle='rgba(44,29,20,.3)';ctx.fillRect(-card.w/2+8,-card.h/2+10,card.w,card.h);
    ctx.fillStyle=card.c;ctx.fillRect(-card.w/2,-card.h/2,card.w,card.h);
    ctx.strokeStyle=card.accent;ctx.lineWidth=7;
    ctx.strokeRect(-card.w/2+12,-card.h/2+12,card.w-24,card.h-24);
    ctx.fillStyle=card.accent;ctx.fillRect(-card.w/2+24,-card.h/2+24,card.w-48,8);
    ctx.fillStyle=card.ink;ctx.textAlign='center';ctx.font=`800 55px ${JP}`;
    ctx.fillText(card.title,0,-card.h/2+120);
    ctx.font=`600 26px ${JP}`;ctx.fillText(card.sub,0,-card.h/2+170);
    ctx.strokeStyle=card.ink;ctx.globalAlpha=.5;ctx.lineWidth=2;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-card.w/2+35,20+i*26);ctx.lineTo(card.w/2-35,20+i*26);ctx.stroke();}
    ctx.globalAlpha=1;
    if(card.title==='ねこ'){
      ctx.fillStyle='#caa36d';ctx.beginPath();ctx.ellipse(0,30,58,70,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(-55,8);ctx.lineTo(-35,-48);ctx.lineTo(-9,2);ctx.fill();
      ctx.beginPath();ctx.moveTo(55,8);ctx.lineTo(35,-48);ctx.lineTo(9,2);ctx.fill();
      ctx.fillStyle='#3a3029';ctx.beginPath();ctx.arc(-21,18,5,0,Math.PI*2);ctx.arc(21,18,5,0,Math.PI*2);ctx.fill();
    }else if(card.title==='夏祭り'){
      for(let i=0;i<8;i++){
        ctx.fillStyle=['#e6b65e','#e78370','#77b6b7','#f2e4c3'][i%4];
        ctx.beginPath();ctx.arc(-90+rng()*180,-card.h/2+240+rng()*100,4+rng()*5,0,Math.PI*2);ctx.fill();
      }
    }else if(card.title==='珈琲'){
      ctx.fillStyle='#d6ac70';ctx.beginPath();ctx.ellipse(0,40,65,35,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#4b3528';ctx.beginPath();ctx.ellipse(0,32,49,21,0,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-30+i*31,-card.h/2+80,4,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  // Push pins.
  for(const card of cards){
    ctx.fillStyle=['#d95f5c','#5b8cb6','#e9c15f','#6f9b7a'][Math.floor(rng()*4)];
    ctx.beginPath();ctx.arc(card.x+card.w/2,card.y+22,9,0,Math.PI*2);ctx.fill();
  }
  return canvasTexture(canvas);
}

export function makeBinLabelTexture(){
  const {canvas,ctx}=textureCanvas(512,512);
  ctx.fillStyle='#f0eee1';ctx.fillRect(0,0,512,512);
  ctx.fillStyle='#28565a';ctx.fillRect(0,0,512,98);
  ctx.fillStyle='#f7f2df';ctx.textAlign='center';ctx.font=`700 38px ${JP}`;ctx.fillText('分別してお願いします',256,64);
  const items=[
    {icon:'缶',label:'かん・びん',color:'#3c7d8c',x:88},
    {icon:'紙',label:'ペットボトル',color:'#547d52',x:256},
    {icon:'燃',label:'もえるごみ',color:'#b66a5e',x:424}
  ];
  for(const item of items){
    ctx.fillStyle=item.color;ctx.beginPath();ctx.arc(item.x,223,61,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff6df';ctx.font=`800 58px ${JP}`;ctx.fillText(item.icon,item.x,244);
    ctx.fillStyle='#263c3c';ctx.font=`700 26px ${JP}`;ctx.fillText(item.label,item.x,324);
  }
  ctx.fillStyle='#3d5452';ctx.font=`500 22px ${JP}`;ctx.fillText('まちかどマート',256,420);
  ctx.strokeStyle='rgba(43,81,81,.3)';ctx.lineWidth=3;ctx.strokeRect(22,22,468,468);
  return canvasTexture(canvas);
}

export function makeDoormatTexture(){
  const {canvas,ctx}=textureCanvas(512,256);
  ctx.fillStyle='#2f4848';ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='#cfbf99';ctx.lineWidth=7;ctx.strokeRect(15,15,482,226);
  ctx.strokeStyle='rgba(232,222,198,.3)';ctx.lineWidth=2;
  for(let x=30;x<500;x+=22){ctx.beginPath();ctx.moveTo(x,28);ctx.lineTo(x,228);ctx.stroke();}
  ctx.fillStyle='#f1e7cd';ctx.textAlign='center';
  ctx.font=`700 58px ${SERIF}`;ctx.fillText('ようこそ',256,118);
  ctx.font=`500 24px ${JP}`;ctx.letterSpacing='7px';ctx.fillText('MACHIKADO MART',256,170);
  ctx.letterSpacing='0px';
  ctx.fillStyle='#d5a96d';ctx.fillRect(204,190,104,3);
  return canvasTexture(canvas);
}

export function makeMenuBoardTexture(){
  const {canvas,ctx}=textureCanvas(512,720);
  ctx.fillStyle='#26363a';ctx.fillRect(0,0,512,720);
  ctx.strokeStyle='#d7c49e';ctx.lineWidth=5;ctx.strokeRect(20,20,472,680);
  ctx.fillStyle='#f0e5c9';ctx.textAlign='center';
  ctx.font=`700 44px ${SERIF}`;ctx.fillText('本日のおすすめ',256,97);
  ctx.fillStyle='#d3b274';ctx.fillRect(122,122,268,3);
  const rows=[['ホットコーヒー','¥ 150'],['からあげ','¥ 240'],['おにぎり','¥ 130'],['雨宿りセット','¥ 390']];
  rows.forEach((row,i)=>{
    const y=206+i*103;
    ctx.textAlign='left';ctx.font=`600 32px ${JP}`;ctx.fillStyle='#f2e9d3';ctx.fillText(row[0],62,y);
    ctx.textAlign='right';ctx.fillStyle='#e7c681';ctx.font=`700 30px ${JP}`;ctx.fillText(row[1],450,y);
    ctx.strokeStyle='rgba(233,220,190,.2)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(62,y+30);ctx.lineTo(450,y+30);ctx.stroke();
  });
  ctx.textAlign='center';
  ctx.fillStyle='#77cbd0';ctx.font=`600 22px ${JP}`;
  ctx.fillText('雨の日は店内でどうぞ',256,636);
  ctx.fillStyle='#dbbf8b';ctx.font=`500 19px ${JP}`;ctx.fillText('OPEN 6:00 - 24:00',256,678);
  return canvasTexture(canvas);
}

export function makeWindowDecalTexture(){
  const {canvas,ctx}=textureCanvas(1024,512);
  ctx.clearRect(0,0,1024,512);
  // Big sale sticker on the lower left.
  ctx.save();
  ctx.translate(158,380);
  ctx.rotate(-.04);
  ctx.fillStyle='#f5eee0';ctx.beginPath();ctx.arc(0,0,118,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d8685e';ctx.lineWidth=8;ctx.stroke();
  ctx.fillStyle='#c94f48';ctx.textAlign='center';ctx.font=`800 38px ${JP}`;ctx.fillText('からあげ',0,-19);
  ctx.font=`800 61px ${JP}`;ctx.fillText('20%OFF',0,41);
  ctx.fillStyle='#45605e';ctx.font=`600 20px ${JP}`;ctx.fillText('本日限り',0,78);
  ctx.restore();
  // ATM / copy badges.
  const badges=[
    {x:568,y:72,w:168,h:64,c:'#1e666c',text:'ATM'},
    {x:752,y:72,w:186,h:64,c:'#3a5654',text:'コピー'},
    {x:568,y:156,w:210,h:64,c:'#536e4b',text:'宅配便受付'},
    {x:238,y:54,w:178,h:57,c:'#e07764',text:'自動ドア'}
  ];
  for(const badge of badges){
    ctx.fillStyle=badge.c;roundRect(ctx,badge.x,badge.y,badge.w,badge.h,13);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#fff5e0';ctx.font=`700 30px ${JP}`;ctx.textAlign='center';
    ctx.fillText(badge.text,badge.x+badge.w/2,badge.y+42);
  }
  // Hours strip.
  ctx.fillStyle='rgba(31,71,74,.78)';
  roundRect(ctx,564,254,360,52,8);ctx.fill();
  ctx.fillStyle='#f6eedb';ctx.font=`600 25px ${JP}`;ctx.textAlign='center';
  ctx.fillText('24時間 営業中',744,289);
  // Raindrop decals in the corner.
  ctx.strokeStyle='rgba(237,246,239,.45)';ctx.lineWidth=3;
  for(let i=0;i<9;i++){
    const x=790+(i%3)*38,y=330+Math.floor(i/3)*42;
    ctx.beginPath();ctx.arc(x,y,8,Math.PI*.1,Math.PI*.9);ctx.stroke();
  }
  return canvasTexture(canvas);
}

export function makeShutterTexture(){
  const {canvas,ctx}=textureCanvas(640,768);
  const grad=ctx.createLinearGradient(0,0,0,768);
  grad.addColorStop(0,'#4e5151');grad.addColorStop(1,'#343b3d');
  ctx.fillStyle=grad;ctx.fillRect(0,0,640,768);
  for(let y=18;y<768;y+=28){
    ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(0,y,640,4);
    ctx.fillStyle='rgba(10,13,15,.3)';ctx.fillRect(0,y+4,640,8);
  }
  // Faded old poster remnants.
  ctx.save();ctx.rotate(-.02);
  ctx.fillStyle='rgba(214,205,176,.32)';ctx.fillRect(54,104,208,256);
  ctx.fillStyle='rgba(41,73,77,.55)';ctx.font=`700 33px ${JP}`;ctx.fillText('純喫茶',80,164);
  ctx.font=`500 22px ${JP}`;ctx.fillText('雨音',84,202);
  ctx.restore();
  ctx.save();ctx.rotate(.03);
  ctx.fillStyle='rgba(171,73,66,.28)';ctx.fillRect(360,310,218,170);
  ctx.fillStyle='rgba(243,227,194,.44)';ctx.font=`700 29px ${JP}`;ctx.fillText('営業中',392,372);
  ctx.restore();
  ctx.fillStyle='rgba(227,213,185,.45)';ctx.fillRect(76,586,220,6);
  ctx.fillRect(76,610,160,4);
  const texture=canvasTexture(canvas);
  return texture;
}

export function makeBarSignTexture(){
  const {canvas,ctx}=textureCanvas(512,1536);
  ctx.fillStyle='#2b1e25';ctx.fillRect(0,0,512,1536);
  ctx.strokeStyle='rgba(240,153,183,.3)';ctx.lineWidth=5;ctx.strokeRect(18,18,476,1500);
  ctx.textAlign='center';
  ctx.fillStyle='#ffd9e3';
  ctx.font=`800 102px ${SERIF}`;
  ctx.shadowColor='#ff4b8a';ctx.shadowBlur=34;
  const chars='スナック雨';
  for(let i=0;i<chars.length;i++)ctx.fillText(chars[i],256,156+i*146);
  ctx.shadowBlur=22;
  ctx.fillStyle='#ff7aa9';ctx.font=`600 36px ${JP}`;ctx.letterSpacing='7px';
  ctx.fillText('BAR  AME',256,890);
  ctx.letterSpacing='0px';
  ctx.strokeStyle='#ff8eb3';ctx.lineWidth=5;ctx.beginPath();
  ctx.moveTo(120,948);ctx.lineTo(392,948);ctx.stroke();
  ctx.shadowBlur=17;ctx.fillStyle='#ffdce5';ctx.font=`500 28px ${JP}`;
  ctx.fillText('お酒と、雨の音。',256,1028);
  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,210,225,.22)';ctx.lineWidth=2;
  for(let i=0;i<6;i++){
    ctx.beginPath();ctx.arc(128+i*51,1170,9,0,Math.PI*2);ctx.stroke();
  }
  ctx.fillStyle='#ff8fb4';ctx.font=`600 25px ${JP}`;ctx.fillText('18:00 - 2:00',256,1322);
  ctx.fillStyle='rgba(255,222,231,.3)';ctx.font=`500 18px ${JP}`;ctx.fillText('2F  STREET CORNER',256,1412);
  return canvasTexture(canvas);
}

export function makeBarCurtainTexture(){
  const {canvas,ctx}=textureCanvas(512,512);
  ctx.clearRect(0,0,512,512);
  const panels=4;
  for(let i=0;i<panels;i++){
    ctx.fillStyle=i%2?'#3f4f58':'#33444c';
    ctx.fillRect(i*(512/panels)+3,0,512/panels-6,430);
    ctx.fillStyle='rgba(255,255,255,.05)';
    ctx.fillRect(i*(512/panels)+9,0,7,430);
  }
  ctx.fillStyle='#e5ddca';ctx.textAlign='center';ctx.font=`700 65px ${SERIF}`;
  ctx.fillText('雨',154,155);
  ctx.fillText('音',358,155);
  ctx.fillStyle='#b96f67';ctx.font=`500 23px ${JP}`;
  ctx.fillText('お　し　ら　せ',256,236);
  ctx.strokeStyle='rgba(231,219,192,.5)';ctx.lineWidth=2;
  ctx.strokeRect(96,270,320,92);
  ctx.fillStyle='#e9dfc9';ctx.font=`500 20px ${JP}`;
  ctx.fillText('本日 18:00 より',256,310);
  ctx.fillText('営業しております',256,340);
  return canvasTexture(canvas);
}

export function makeAframeTexture(){
  const {canvas,ctx}=textureCanvas(512,640);
  ctx.fillStyle='#26383b';ctx.fillRect(0,0,512,640);
  ctx.strokeStyle='#d8c7a1';ctx.lineWidth=5;ctx.strokeRect(18,18,476,604);
  ctx.textAlign='center';ctx.fillStyle='#f2e6c9';ctx.font=`700 47px ${SERIF}`;ctx.fillText('雨宿り',256,115);
  ctx.fillStyle='#70c7c8';ctx.font=`600 24px ${JP}`;ctx.fillText('COFFEE & SNACK',256,159);
  ctx.strokeStyle='rgba(235,220,187,.28)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(92,190);ctx.lineTo(420,190);ctx.stroke();
  ctx.font=`600 29px ${JP}`;ctx.textAlign='left';ctx.fillStyle='#efe4cc';
  const items=[['ブレンド',380],['カフェラテ',420],['からあげ',380],['おにぎり',140]];
  items.forEach((item,i)=>{
    const y=254+i*72;
    ctx.fillText(item[0],72,y);
    ctx.textAlign='right';ctx.fillStyle='#e8c57f';ctx.fillText('¥ '+item[1],438,y);ctx.textAlign='left';ctx.fillStyle='#efe4cc';
  });
  ctx.textAlign='center';ctx.fillStyle='#a9cdd0';ctx.font=`500 21px ${JP}`;
  ctx.fillText('店内でゆっくりお召し上がりください',256,570);
  return canvasTexture(canvas);
}

export function makeRoadMarkTexture(kind='tomare'){
  const {canvas,ctx}=textureCanvas(1024,512);
  ctx.clearRect(0,0,1024,512);
  ctx.fillStyle='rgba(216,224,218,.82)';
  ctx.textAlign='center';
  if(kind==='tomare'){
    ctx.font=`800 260px ${JP}`;
    ctx.save();ctx.translate(512,345);ctx.transform(1,0,-.22,1,0,0);ctx.fillText('止まれ',0,0);ctx.restore();
  }else if(kind==='p'){
    ctx.font=`800 390px ${JP}`;ctx.fillText('P',512,400);
    ctx.font=`600 64px ${JP}`;ctx.fillText('PARKING',512,478);
  }else if(kind==='slow'){
    ctx.font=`800 250px ${JP}`;ctx.fillText('30',512,365);
  }
  ctx.globalCompositeOperation='destination-out';
  const rng=makeRng(kind==='p'?88:22);
  for(let i=0;i<150;i++){
    ctx.globalAlpha=.2+rng()*.55;
    ctx.beginPath();ctx.arc(rng()*1024,rng()*512,rng()*10+1,0,Math.PI*2);ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  return canvasTexture(canvas);
}

export function makeStreetSignTexture(kind='parking'){
  const {canvas,ctx}=textureCanvas(512,512);
  if(kind==='parking'){
    ctx.fillStyle='#245f9b';ctx.fillRect(0,0,512,512);
    ctx.strokeStyle='#f2e9d3';ctx.lineWidth=18;ctx.strokeRect(18,18,476,476);
    ctx.fillStyle='#f2e9d3';ctx.textAlign='center';ctx.font=`800 310px ${JP}`;ctx.fillText('P',256,376);
    ctx.font=`600 46px ${JP}`;ctx.fillText('PARKING',256,456);
  }else if(kind==='street'){
    ctx.fillStyle='#1f5e69';roundRect(ctx,20,80,472,352,45);ctx.fill();
    ctx.strokeStyle='#e9e1cb';ctx.lineWidth=8;ctx.stroke();
    ctx.fillStyle='#e9e1cb';ctx.textAlign='center';ctx.font=`700 75px ${JP}`;ctx.fillText('雨宮通り',256,220);
    ctx.font=`500 35px ${JP}`;ctx.letterSpacing='5px';ctx.fillText('AMEAMI STREET',256,290);
    ctx.fillStyle='#e5bd6d';ctx.fillRect(91,330,330,10);
    ctx.font=`600 30px ${JP}`;ctx.fillText('商店街 →',256,390);
    ctx.letterSpacing='0px';
  }else if(kind==='stop'){
    ctx.fillStyle='#c94b45';
    ctx.beginPath();ctx.moveTo(28,38);ctx.lineTo(484,38);ctx.lineTo(256,486);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#f4eee0';ctx.lineWidth=12;ctx.stroke();
    ctx.fillStyle='#f7f0df';ctx.textAlign='center';ctx.font=`800 132px ${JP}`;ctx.fillText('止まれ',256,290);
    ctx.font=`600 43px ${JP}`;ctx.fillText('STOP',256,356);
  }else{
    ctx.fillStyle='#f0e9d8';ctx.fillRect(0,0,512,512);
    ctx.strokeStyle='#315c63';ctx.lineWidth=22;ctx.strokeRect(11,11,490,490);
    ctx.fillStyle='#315c63';ctx.textAlign='center';ctx.font=`700 58px ${JP}`;
    ctx.fillText('雨宮',256,170);ctx.fillText('二丁目',256,240);
    ctx.fillStyle='#b5665f';ctx.font=`700 90px ${JP}`;ctx.fillText('8',256,362);
    ctx.font=`500 28px ${JP}`;ctx.fillText('AMEAMI 2',256,418);
  }
  return canvasTexture(canvas);
}

export function makeBasePlaqueTexture(){
  const {canvas,ctx}=textureCanvas(1024,256);
  const grad=ctx.createLinearGradient(0,0,1024,256);
  grad.addColorStop(0,'#101923');grad.addColorStop(.5,'#1c2a32');grad.addColorStop(1,'#101923');
  ctx.fillStyle=grad;ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='rgba(194,158,108,.55)';ctx.lineWidth=3;ctx.strokeRect(13,13,998,230);
  ctx.fillStyle='#d4b27a';ctx.textAlign='center';
  ctx.font=`600 54px ${SERIF}`;ctx.fillText('雨夜のまちかど',512,97);
  ctx.font=`500 23px ${JP}`;ctx.letterSpacing='12px';ctx.fillStyle='#9ab8b4';ctx.fillText('RAINY KONBINI CORNER',512,150);
  ctx.letterSpacing='0px';
  ctx.fillStyle='rgba(205,177,128,.5)';ctx.fillRect(352,178,320,2);
  ctx.fillStyle='#8ba19e';ctx.font=`500 18px ${JP}`;ctx.fillText('1:64 COLLECTIBLE DIORAMA  ·  NIGHT 03',512,216);
  return canvasTexture(canvas);
}

export function makeAwningStripeTexture(){
  const {canvas,ctx}=textureCanvas(512,128);
  ctx.fillStyle='#204d53';ctx.fillRect(0,0,512,128);
  for(let i=0;i<16;i++){
    ctx.fillStyle=i%4===0?'#d98777':i%4===1?'#e7ded0':'#2c676d';
    ctx.fillRect(i*32,0,16,128);
  }
  ctx.fillStyle='rgba(9,23,29,.25)';ctx.fillRect(0,95,512,33);
  return canvasTexture(canvas,{repeat:[4,1]});
}

export function makeCorkboardTexture(){
  const base=makePosterBoardTexture();
  return base;
}

export function makeBadgeTexture(label,sub,bg='#245f67',fg='#fff5df',accent='#e58a72'){
  const {canvas,ctx}=textureCanvas(512,256);
  const radius=28;
  ctx.clearRect(0,0,512,256);
  ctx.fillStyle=bg;roundRect(ctx,6,6,500,244,radius);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.62)';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle=accent;roundRect(ctx,24,26,12,204,6);ctx.fill();
  ctx.fillStyle=fg;ctx.textAlign='center';
  ctx.font=`700 76px ${JP}`;ctx.fillText(label,270,116);
  if(sub){
    ctx.fillStyle='rgba(255,248,226,.72)';ctx.font=`500 26px ${JP}`;
    ctx.letterSpacing='3px';ctx.fillText(sub,270,178);ctx.letterSpacing='0px';
  }
  return canvasTexture(canvas);
}

export function makeSaleStickerTexture(){
  const {canvas,ctx}=textureCanvas(512,512);
  ctx.clearRect(0,0,512,512);
  ctx.fillStyle='#f6eedc';ctx.beginPath();ctx.arc(256,256,236,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d6645e';ctx.lineWidth=18;ctx.stroke();
  ctx.fillStyle='#ca4f49';ctx.textAlign='center';
  ctx.font=`800 70px ${JP}`;ctx.fillText('からあげ',256,214);
  ctx.font=`800 97px ${JP}`;ctx.fillText('20%OFF',256,325);
  ctx.fillStyle='#365b5b';ctx.font=`600 32px ${JP}`;ctx.fillText('本日限り',256,391);
  ctx.strokeStyle='rgba(202,79,73,.4)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(256,256,205,0,Math.PI*2);ctx.stroke();
  return canvasTexture(canvas);
}

export function makeInteriorHangingTexture(kind=0){
  const {canvas,ctx}=textureCanvas(512,256);
  const bg=kind===0?'#e6e0cb':kind===1?'#c9695e':'#2d5f66';
  const ink=kind===0?'#2c4b4d':kind===1?'#fff0d6':'#f6ebd0';
  ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=5;ctx.strokeRect(14,14,484,228);
  ctx.fillStyle=ink;ctx.textAlign='center';
  const title=kind===0?'おにぎり':kind===1?'できたて':'つめたい';
  const sub=kind===0?'お米は国産':'からあげ'; 
  ctx.font=`700 74px ${JP}`;ctx.fillText(title,256,118);
  ctx.font=`600 38px ${JP}`;ctx.fillText(kind===2?'のみもの':'おすすめ',256,181);
  ctx.fillStyle=kind===1?'#f3c465':kind===2?'#91d4d4':'#d77c6a';
  ctx.fillRect(136,205,240,7);
  return canvasTexture(canvas);
}

export function makeFridgePanelTexture(){
  const {canvas,ctx}=textureCanvas(512,1024);
  ctx.fillStyle='#d8ecea';ctx.fillRect(0,0,512,1024);
  const grad=ctx.createLinearGradient(0,0,512,1024);
  grad.addColorStop(0,'rgba(255,255,255,.8)');grad.addColorStop(.5,'rgba(198,232,232,.3)');grad.addColorStop(1,'rgba(120,179,180,.2)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,512,1024);
  for(let i=0;i<44;i++){
    const x=(i*73)%512,y=80+(i*137)%860;
    ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(x,y,35,90);
  }
  return canvasTexture(canvas);
}

export function makeSnowDustTexture(){
  const {canvas,ctx}=textureCanvas(512,512);
  const rng=makeRng(4701);
  ctx.clearRect(0,0,512,512);
  for(let i=0;i<64;i++){
    const x=rng()*512,y=rng()*512;
    const r=18+rng()*92;
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    const a=.22+rng()*.58;
    g.addColorStop(0,`rgba(255,255,255,${a})`);
    g.addColorStop(.62,`rgba(252,255,255,${a*.62})`);
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  for(let i=0;i<240;i++){
    ctx.fillStyle=`rgba(255,255,255,${.2+rng()*.7})`;
    const s=.6+rng()*2.4;
    ctx.beginPath();ctx.arc(rng()*512,rng()*512,s,0,Math.PI*2);ctx.fill();
  }
  const fade=ctx.createRadialGradient(256,256,30,256,256,300);
  fade.addColorStop(0,'rgba(0,0,0,0)');
  fade.addColorStop(.72,'rgba(0,0,0,.06)');
  fade.addColorStop(1,'rgba(0,0,0,.9)');
  ctx.globalCompositeOperation='destination-out';
  ctx.fillStyle=fade;ctx.fillRect(0,0,512,512);
  ctx.globalCompositeOperation='source-over';
  return canvasTexture(canvas);
}

export function makeReflectionStreakTexture(){
  const {canvas,ctx}=textureCanvas(256,1024);
  const rng=makeRng(722);
  ctx.clearRect(0,0,256,1024);
  const glow=ctx.createRadialGradient(128,300,4,128,360,320);
  glow.addColorStop(0,'rgba(255,255,255,.62)');
  glow.addColorStop(.22,'rgba(255,255,255,.25)');
  glow.addColorStop(.7,'rgba(255,255,255,.045)');
  glow.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,256,1024);
  for(let i=0;i<40;i++){
    const x=70+rng()*116;
    const y=180+rng()*680;
    const w=8+rng()*94;
    const h=2+rng()*14;
    const a=.015+rng()*.1;
    const band=ctx.createLinearGradient(x,0,x+w,0);
    band.addColorStop(0,'rgba(255,255,255,0)');
    band.addColorStop(.5,`rgba(255,255,255,${a})`);
    band.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=band;ctx.fillRect(x,y,w,h);
  }
  // Broken vertical shimmer.
  for(let i=0;i<6;i++){
    const x=92+i*14;
    ctx.strokeStyle=`rgba(255,255,255,${.03+rng()*.08})`;
    ctx.lineWidth=2+rng()*3;
    ctx.beginPath();ctx.moveTo(x,220);ctx.bezierCurveTo(x+20,420,x-16,650,x+12,900);ctx.stroke();
  }
  return canvasTexture(canvas);
}

export function makeGlassSheenTexture(){
  const {canvas,ctx}=textureCanvas(1024,512);
  ctx.clearRect(0,0,1024,512);
  const diagonal=ctx.createLinearGradient(0,512,1024,0);
  diagonal.addColorStop(0,'rgba(179,225,231,0)');
  diagonal.addColorStop(.31,'rgba(207,244,245,.02)');
  diagonal.addColorStop(.43,'rgba(211,247,247,.24)');
  diagonal.addColorStop(.47,'rgba(180,230,234,.07)');
  diagonal.addColorStop(.56,'rgba(141,214,222,.02)');
  diagonal.addColorStop(.64,'rgba(210,240,242,.18)');
  diagonal.addColorStop(.68,'rgba(190,228,232,.03)');
  diagonal.addColorStop(1,'rgba(147,208,219,0)');
  ctx.fillStyle=diagonal;ctx.fillRect(0,0,1024,512);
  const vertical=ctx.createLinearGradient(0,0,0,512);
  vertical.addColorStop(0,'rgba(236,255,250,.15)');
  vertical.addColorStop(.3,'rgba(236,255,250,.015)');
  vertical.addColorStop(.72,'rgba(182,238,239,.04)');
  vertical.addColorStop(1,'rgba(131,205,214,.11)');
  ctx.fillStyle=vertical;ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle='rgba(237,255,252,.2)';ctx.lineWidth=2;
  for(let i=0;i<6;i++){
    ctx.beginPath();
    const x=92+i*166;
    ctx.moveTo(x,0);ctx.bezierCurveTo(x+34,144,x-22,328,x+42,512);ctx.stroke();
  }
  return canvasTexture(canvas);
}
