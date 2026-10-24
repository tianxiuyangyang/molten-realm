import * as THREE from 'three';
import {toon,basic,standard,physical} from './konbini-utils.js?v=4';
import {
  makeAsphaltTextures,makePavingTexture,makeGravelTexture,makeStoreSignTexture,makeBladeSignTexture,
  makeVendingTexture,makeWindowDecalTexture,makeDoormatTexture,makeMenuBoardTexture,makePosterBoardTexture,
  makePosterTexture,makeBinLabelTexture,makeShutterTexture,makeBarSignTexture,makeBarCurtainTexture,
  makeAframeTexture,makeRoadMarkTexture,makeStreetSignTexture,makeBasePlaqueTexture,makeAwningStripeTexture,
  makeBadgeTexture,makeSaleStickerTexture,makeInteriorHangingTexture,makeFridgePanelTexture,makeGlassSheenTexture,
  makeReflectionStreakTexture,makeSnowDustTexture
} from './konbini-textures.js?v=4';

export function createKonbiniMaterials(){
  const asphaltTextures=makeAsphaltTextures();
  const paving=makePavingTexture();
  const gravel=makeGravelTexture();
  const storeSign=makeStoreSignTexture();
  const bladeSign=makeBladeSignTexture();
  const vending=makeVendingTexture(0);
  const vendingWarm=makeVendingTexture(1);
  const windowDecal=makeWindowDecalTexture();
  const doormat=makeDoormatTexture();
  const menu=makeMenuBoardTexture();
  const posterBoard=makePosterBoardTexture();
  const posters=Array.from({length:6},(_,index)=>makePosterTexture(index));
  const binLabel=makeBinLabelTexture();
  const shutter=makeShutterTexture();
  const barSign=makeBarSignTexture();
  const barCurtain=makeBarCurtainTexture();
  const aframe=makeAframeTexture();
  const roadTomare=makeRoadMarkTexture('tomare');
  const roadP=makeRoadMarkTexture('p');
  const stopSign=makeStreetSignTexture('stop');
  const parkingSign=makeStreetSignTexture('parking');
  const streetSign=makeStreetSignTexture('street');
  const addressSign=makeStreetSignTexture('address');
  const basePlaque=makeBasePlaqueTexture();
  const awningStripe=makeAwningStripeTexture();
  const doorBadge=makeBadgeTexture('自動ドア','AUTO DOOR','#2d686c','#fff4db','#e8b96b');
  const atmBadge=makeBadgeTexture('ATM','COPIER ・ DELIVERY','#315c62','#f4edd8','#6fc9ce');
  const saleSticker=makeSaleStickerTexture();
  const hangingBanners=[0,1,2].map(i=>makeInteriorHangingTexture(i));
  const fridgePanel=makeFridgePanelTexture();
  const glassSheen=makeGlassSheenTexture();
  const reflectionStreak=makeReflectionStreakTexture();
  const snowDust=makeSnowDustTexture();

  const materials={
    base:standard(0x0d171e,{roughness:.54,metalness:.32}),
    baseDark:standard(0x070d13,{roughness:.64,metalness:.46}),
    baseRim:standard(0x2b3b40,{roughness:.37,metalness:.56,emissive:0x0e2a2e,emissiveIntensity:.28}),
    guardrail:standard(0xd7d5c8,{roughness:.32,metalness:.24}),
    reflector:basic(0x8ae4dc),
    warning:toon(0xc6a451),
    insulator:standard(0xd8d2bd,{roughness:.44,metalness:.12}),
    planter:toon(0x545b57),
    terracotta:toon(0x9b6752),
    soil:standard(0x2a211b,{roughness:1,metalness:0}),
    orangePaint:toon(0xd47c4e),
    mirror:basic(0x8fb5bd),
    utilityBox:toon(0x526d68),
    paper:toon(0xd8d3c1),
    asphalt:new THREE.MeshStandardMaterial({
      map:asphaltTextures.color,roughnessMap:asphaltTextures.roughness,
      color:0xaeb9c3,roughness:.34,metalness:.22,envMapIntensity:.8
    }),
    paving:new THREE.MeshStandardMaterial({map:paving,color:0xaab2b3,roughness:.48,metalness:.13}),
    pavingLight:new THREE.MeshStandardMaterial({map:paving,color:0xc6ccc9,roughness:.4,metalness:.11}),
    curb:standard(0x9ca5a3,{roughness:.55,metalness:.08}),
    gravel:new THREE.MeshStandardMaterial({map:gravel,color:0xffffff,roughness:.65,metalness:.1,emissive:0x334a53,emissiveIntensity:.72}),
    wall:toon(0xeee7d7),
    wallShade:toon(0xded7c7),
    wallWarm:toon(0xeadcc4),
    wallDark:toon(0x263b42),
    trim:toon(0x1c4b52),
    trimLight:toon(0x67bdc0),
    trimWarm:toon(0xd77c69),
    metalDark:standard(0x1f2c33,{roughness:.38,metalness:.72}),
    metal:standard(0x8b989b,{roughness:.3,metalness:.78}),
    metalWarm:standard(0xa9815d,{roughness:.35,metalness:.68}),
    dark:toon(0x18272e),
    black:standard(0x111a20,{roughness:.45,metalness:.5}),
    concrete:toon(0x858b86),
    concreteDark:toon(0x555f60),
    wood:toon(0x6c4d3b),
    woodLight:toon(0xac8257),
    interiorFloor:standard(0xbab7a5,{roughness:.3,metalness:.12}),
    interiorWall:toon(0xe7dfcb),
    interiorCeiling:toon(0xf0eadb),
    ceilingLight:basic(0xfff4d4),
    coolLight:basic(0xd8fbff),
    fridgeGlow:basic(0xdff9ff),
    glass:new THREE.MeshPhysicalMaterial({
      color:0xb9dce0,transparent:true,opacity:.12,roughness:.08,metalness:.05,
      clearcoat:.7,clearcoatRoughness:.12,side:THREE.DoubleSide,depthWrite:false
    }),
    glassWarm:new THREE.MeshPhysicalMaterial({
      color:0xe4d0b4,transparent:true,opacity:.1,roughness:.1,metalness:.03,
      clearcoat:.5,side:THREE.DoubleSide,depthWrite:false
    }),
    glassSheen:new THREE.MeshBasicMaterial({
      map:glassSheen,transparent:true,depthWrite:false,opacity:.72,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide
    }),
    reflectionStreak:new THREE.MeshBasicMaterial({
      map:reflectionStreak,transparent:true,depthWrite:false,opacity:.5,
      blending:THREE.AdditiveBlending,color:0xffffff
    }),
    snowCap:new THREE.MeshStandardMaterial({
      map:snowDust,color:0xe9f4f7,transparent:true,opacity:0,roughness:.9,metalness:0,
      side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2
    }),
    snowSolid:new THREE.MeshStandardMaterial({
      color:0xe5f1f4,transparent:true,opacity:0,roughness:.88,metalness:0,
      side:THREE.DoubleSide,depthWrite:false
    }),
    frosted:new THREE.MeshStandardMaterial({
      color:0xb7d5d5,roughness:.6,metalness:.05,transparent:true,opacity:.48,
      emissive:0x416363,emissiveIntensity:.18,side:THREE.DoubleSide
    }),
    paintWhite:new THREE.MeshStandardMaterial({color:0xc7d3d0,roughness:.34,metalness:.02}),
    paintYellow:new THREE.MeshStandardMaterial({color:0xcfac5d,roughness:.38,metalness:.02}),
    roadPaint:new THREE.MeshStandardMaterial({color:0xcdd8d2,roughness:.3,metalness:.02,transparent:true,opacity:.88}),
    stopRed:new THREE.MeshStandardMaterial({color:0xba4e4b,roughness:.5}),
    leaf:toon(0x2a5042),
    leafDark:toon(0x1b372f),
    leafLight:toon(0x4e7354),
    bark:toon(0x5b4a3c),
    blackRubber:standard(0x12181a,{roughness:.8,metalness:.02}),
    bikeFrame:toon(0x547f78),
    bikeCream:toon(0xcfc3a5),
    basket:standard(0x5b665f,{roughness:.5,metalness:.4}),
    redPaint:toon(0xa24f4c),
    postRed:standard(0xb74337,{roughness:.5,metalness:.18}),
    bluePaint:toon(0x416679),
    warmBulb:basic(0xffd28e),
    neonPink:new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,.72,1.65)}),
    neonCyan:new THREE.MeshBasicMaterial({color:new THREE.Color(.5,3.1,2.9)}),
    neonAmber:new THREE.MeshBasicMaterial({color:new THREE.Color(3.0,1.35,.35)}),
    signFace:new THREE.MeshBasicMaterial({map:storeSign.map,color:new THREE.Color(1.06,1.02,.94)}),
    signSide:toon(0xd8d4c1),
    bladeSign:new THREE.MeshBasicMaterial({map:bladeSign,color:new THREE.Color(1.2,1.16,1.03)}),
    bladeSide:toon(0xe3ddc7),
    vending:new THREE.MeshBasicMaterial({map:vending,color:new THREE.Color(1.08,1.11,1.08)}),
    vendingWarm:new THREE.MeshBasicMaterial({map:vendingWarm}),
    vendingBody:toon(0xe7ece5),
    vendingBodyWarm:toon(0xe3d4c8),
    posterBoard:new THREE.MeshToonMaterial({map:posterBoard}),
    posters:posters.map(map=>new THREE.MeshToonMaterial({map})),
    binLabel:new THREE.MeshBasicMaterial({map:binLabel}),
    doormat:new THREE.MeshToonMaterial({map:doormat}),
    menu:new THREE.MeshBasicMaterial({map:menu}),
    windowDecal:new THREE.MeshBasicMaterial({map:windowDecal,transparent:true,depthWrite:false,opacity:.94,side:THREE.DoubleSide}),
    doorBadge:new THREE.MeshBasicMaterial({map:doorBadge,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
    atmBadge:new THREE.MeshBasicMaterial({map:atmBadge,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
    saleSticker:new THREE.MeshBasicMaterial({map:saleSticker,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
    hangingBanners:hangingBanners.map(map=>new THREE.MeshBasicMaterial({map})),
    fridgePanel:new THREE.MeshBasicMaterial({map:fridgePanel}),
    shutter:new THREE.MeshToonMaterial({map:shutter}),
    barSign:new THREE.MeshBasicMaterial({
      map:barSign,color:new THREE.Color(2.0,1.45,1.75),transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide
    }),
    barCurtain:new THREE.MeshBasicMaterial({map:barCurtain,transparent:true,depthWrite:false,side:THREE.DoubleSide}),
    aframe:new THREE.MeshBasicMaterial({map:aframe}),
    awning:new THREE.MeshToonMaterial({map:awningStripe}),
    stopSign:new THREE.MeshBasicMaterial({map:stopSign}),
    parkingSign:new THREE.MeshBasicMaterial({map:parkingSign}),
    streetSign:new THREE.MeshBasicMaterial({map:streetSign}),
    addressSign:new THREE.MeshBasicMaterial({map:addressSign}),
    plaque:new THREE.MeshBasicMaterial({map:basePlaque,color:new THREE.Color(1.14,1.1,1.03)}),
    roadTomare:new THREE.MeshBasicMaterial({map:roadTomare,transparent:true,depthWrite:false,opacity:.82}),
    roadP:new THREE.MeshBasicMaterial({map:roadP,transparent:true,depthWrite:false,opacity:.72}),
  };
  // Toon materials with maps need the shared ramp as well.
  materials.posterBoard=new THREE.MeshToonMaterial({map:posterBoard,gradientMap:materials.wall.gradientMap});
  materials.posters=posters.map(map=>new THREE.MeshToonMaterial({map,gradientMap:materials.wall.gradientMap}));

  const productPalette=[0xe47468,0xf0ca6e,0x6dc4c7,0x7cad72,0x879bdf,0xe98eb8,0xf0e6cf,0xd56f50,0x9ad6cc,0xcb9f6a];
  materials.products=new THREE.MeshToonMaterial({
    color:0xffffff,gradientMap:materials.wall.gradientMap
  });
  materials.productPalette=productPalette;

  return {materials,textures:{asphaltTextures,paving,gravel,storeSign,bladeSign,vending,windowDecal,doormat,menu,posterBoard,posters,binLabel,shutter,barSign,barCurtain,aframe,basePlaque,awningStripe,roadTomare,roadP,stopSign,parkingSign,streetSign,addressSign,fridgePanel,glassSheen,reflectionStreak,snowDust}};
}
