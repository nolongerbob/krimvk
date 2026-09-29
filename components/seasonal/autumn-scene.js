// Development-only decoration. No requests to account APIs and no DOM reparenting.
import { clearPosition, clearSegment, escapeSegment, findShelterPath, puddlePath, blowLeaves, FOOT_Y } from './autumn-motion';
import { prepareSpriteFrames } from './sprite-frames';
export function startAutumnScene(canvas, pet, sprite, lane = pet.parentElement, {petEnabled=true,seedSurfaces=true,fullPage=false}={}) {
  const ctx = canvas.getContext('2d'), sc = sprite.getContext('2d');
  if (!ctx || !sc) return () => {};
  let disposed = false, raf = 0, width = 0, height = 0, last = 0, time = 0, spawnTime = 0;
  let leaves = [], surfaces = [], protectedRects = [], frames = [], target = null;
  let x = 12, direction = 1, mode = 'idle', rake = 0, hovering = false, focused = false, serial = 0;
  let nextMeasure = true, modalOpen = false, otherModalOpen = false, lastCheck = 0;
  let ground = 0, laneWidth = 0;
  const seeded = new WeakSet();
  const size = 112;
  const bubble=pet.querySelector('[data-seasonal-bubble]');
  let bubbleSize={width:130,height:36};
  let nextBubbleSearch=0;
  let pose={x:12,y:0},bounds={left:0,right:0,top:0,bottom:0},obstacles=[],liquidFrames=[];
  let behavior='rake',phase=0,route=[],nextBlowAt=0,gust=0;
  let blockedAt=null;
  let drag=null,perch=null,swing=0,swingVelocity=0,suppressClick=false;
  let reconsiderShelter=false;
  let dragFrames=[],headerBottom=0,dragStartedAt=0,settleUntil=0;
  let dropRoute=null,dropPerch=null,retracingDrag=false;
  let homeZone=false,autumnEnd=Infinity,previousScroll=window.scrollY;
  let heroRect=null;
  const landingY=r=>r.el?.getAttribute('data-seasonal-surface')==='bottom'?r.bottom-8:r.top-8;
  const pattern = ['00001000000','00012100000','01012100100','01212201210','01222222210','00122322100','01222322210','00122322100','00012321000','00001310000','00000300000','00003000000'];
  const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}; };
  const visible = r => r.bottom>0 && r.top<height && r.right>0 && r.left<width;
  function measure() {
    const previousWidth=width;
    const previousGround=ground;
    width = document.documentElement.clientWidth || window.innerWidth; height = window.innerHeight;
    if(bubble)bubbleSize={width:bubble.offsetWidth||130,height:bubble.offsetHeight||36};
    const laneRect=lane?.getBoundingClientRect();
    const home=document.querySelector('[data-seasonal-home]');
    homeZone=!!home&&!fullPage;
    const hero=fullPage?null:home?.querySelector('[data-seasonal-hero]');
    heroRect=hero?hero.getBoundingClientRect():null;
    autumnEnd=heroRect?.bottom??Infinity;
    const header=document.querySelector('#site-header, header');
    const headerRect=header?.getBoundingClientRect();
    headerBottom=headerRect&&headerRect.bottom>0&&headerRect.top<height?Math.max(0,headerRect.bottom)+6:0;
    // Follow the visible lower edge, but stop before the footer enters it.
    // Moving this support is not itself a collision.
    ground=fullPage?height-16:Math.min(height-12,laneRect?.bottom??height-12)-10;
    if(homeZone&&Number.isFinite(autumnEnd))ground=autumnEnd-14;
    laneWidth=Math.min(laneRect?.width||width,width);
    bounds={left:6,right:laneWidth-6,top:headerBottom||Math.min(8,ground+10-FOOT_Y),bottom:ground+10};
    if(heroRect)bounds={left:heroRect.left+6,right:heroRect.right-6,top:Math.max(headerBottom,heroRect.top+6),bottom:heroRect.bottom-4};
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
    // Full-page mobile effects must not treat entire layout sections as opaque
    // cards: doing so erases every leaf inside the hero and action section.
    const surfaceSelector=fullPage?'[data-seasonal-surface]':'[data-seasonal-surface], main article, main section';
    surfaces = homeZone?[]:Array.from(document.querySelectorAll(surfaceSelector)).filter(el=>!el.closest('[data-seasonal-ui]')).map(el=>({...rect(el),el})).filter(r=>r.right>r.left&&r.bottom>r.top);
    protectedRects = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="dialog"], [role="alertdialog"]')).filter(el=>!el.closest('[data-seasonal-ui]')&&!(homeZone&&el.classList.contains('quick-action-card-link'))).map(rect).filter(visible);
    // A paragraph's box may include padding/min-height. Mask only its text
    // fragments, otherwise empty margins become invisible walls for leaves.
    for(const el of Array.from(document.querySelectorAll('main, header, footer, label, h1, h2, h3, p')).filter(el=>!el.parentElement?.closest('main, header, footer, label, h1, h2, h3, p'))){
      if(el.closest('[data-seasonal-ui]'))continue;
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode())){
        if(!node.textContent?.trim()||node.parentElement?.closest('[data-seasonal-ui], script, style'))continue;
        const range=document.createRange();range.selectNodeContents(node);
        if(typeof range.getClientRects==='function')for(const r of Array.from(range.getClientRects())){
          if(visible(r))protectedRects.push({left:r.left,top:r.top,right:r.right,bottom:r.bottom});
        }
      }
    }
    // Card backgrounds are usable space; only their actual content is solid.
    const media=Array.from(document.querySelectorAll('main img, main video, main iframe, main svg, main canvas'))
      .filter(el=>!el.closest('[data-seasonal-ui]')&&!(homeZone&&el.closest('[data-seasonal-hero]')&&el.getAttribute('aria-hidden')==='true')).map(rect).filter(visible);
    obstacles=[...protectedRects,...media].filter(r=>r.right>=bounds.left&&r.left<=bounds.right&&r.bottom>=bounds.top&&r.top<=bounds.bottom);
    // Navigation replaces card DOM nodes while the mascot simulation stays alive.
    // Release detached supports and discard routes calculated for the old page.
    const detachedSupport = perch && !perch.isConnected;
    if (detachedSupport) perch = null;
    for (const leaf of leaves) {
      if (leaf.rest === 'platform' && !leaf.surface?.isConnected) {
        leaf.rest = null; leaf.surface = null; leaf.permanent = false; leaf.age = 0;
      }
    }
    if (detachedSupport || route.some(point => !clearPosition(point, obstacles, bounds, true))) {
      route = []; dropRoute = null; dropPerch = null;
      if (behavior === 'flow' || behavior === 'relocate') { behavior = 'puddle'; phase = 0; }
    }
    if(headerBottom)obstacles.push({left:0,right:width,top:0,bottom:headerBottom-3});
    if(homeZone)protectedRects.push(...Array.from(document.querySelectorAll('[data-seasonal-home] svg')).map(rect).filter(visible));
    x=Math.max(bounds.left-6,Math.min(x,bounds.right-106));
    const shift=ground-previousGround;
    pose={x:Math.max(bounds.left-6,Math.min(pose.x,bounds.right-106)),y:behavior==='rake'?ground+10-FOOT_Y:pose.y+shift};
    if(perch?.isConnected)pose.y=perch.getBoundingClientRect().top-FOOT_Y-4;
    if(behavior==='rake')pose.x=x;
    if(blockedAt)blockedAt.y+=shift;
    route?.forEach(point=>{point.y+=shift;});
    if(heroRect&&!previousWidth){
      pose={x:bounds.right-106,y:bounds.bottom-FOOT_Y};x=pose.x;
    }
    const scrollDelta=window.scrollY-previousScroll;previousScroll=window.scrollY;
    leaves.forEach(l=>{
      if(homeZone&&!l.rest)l.y-=scrollDelta;
      // Keep floor leaves and airborne particles in view after a resize;
      // leaves resting on cards continue to follow their actual card.
      if(previousWidth&&previousWidth!==width&&l.rest!=='platform')l.x=l.x*width/previousWidth;
      if(l.rest==='ground')l.y=ground;
      if(!l.rest&&l.y>ground){l.y=ground;l.rest='ground';l.windTime=0;}
      if(l.rest==='platform'&&l.surface){const r={...rect(l.surface),el:l.surface};l.y=landingY(r);l.x=r.left+(r.right-r.left)*l.fraction;}
    });
    // Initial decoration is attached to each actual card, not only the first
    // visible card, and stays anchored while the page scrolls.
    for(const r of surfaces)if(seedSurfaces&&!seeded.has(r.el)){
      seeded.add(r.el);
      for(const fraction of [.18,.51,.82])leaves.push(makeLeaf({x:r.left+(r.right-r.left)*fraction,y:landingY(r),rest:'platform',surface:r.el,fraction,permanent:true}));
    }
    nextMeasure=false;
    reconsiderShelter=true;
  }
  function makeLeaf(extra={}) {
    const n=serial++;
    return {x:(heroRect?.left||0)+24+Math.random()*Math.max(1,(heroRect?.width||width)-48),y:heroRect?Math.max(heroRect.top,headerBottom)-16:-24,angle:Math.random()*6,speed:35+Math.random()*22,rest:null,age:0,land:n%3!==0,skip:n%3,pulled:false,dead:false,permanent:false,color:['#c7863a','#be6235','#d3a441'][n%3],...extra};
  }
  function spawn(onGround=false) {
    if(homeZone&&autumnEnd<=headerBottom)return;
    if(leaves.filter(l=>!l.permanent).length>=32)return;
    leaves.push(makeLeaf(onGround?{y:ground,rest:'ground'}:{}));
  }
  function leaf(l) {
    const turn=((Math.round(l.angle/(Math.PI/2))%4)+4)%4,colors=['','#563523',l.color,'#e8b65e'];
    for(let r=0;r<pattern.length;r++)for(let c=0;c<pattern[r].length;c++){
      const ink=+pattern[r][c];if(!ink)continue;const a=c-5,b=r-6;
      const dx=turn===0?a:turn===1?-b:turn===2?-a:b,dy=turn===0?b:turn===1?a:turn===2?-b:-a;
      ctx.fillStyle=colors[ink];ctx.fillRect(Math.round(l.x)+dx*2,Math.round(l.y)+dy*2,2,2);
    }
  }
  function contact(point) {
    blockedAt={...point};behavior='squash';phase=0;
    if(target)target.pulled=false;
    target=null;mode='idle';
  }
  function groundRoute() {
    if(dropRoute){const path=dropRoute;dropRoute=null;return path;}
    return (bubble&&findShelterPath(pose,obstacles,bounds,p=>!!bubbleSlot(p)))||findShelterPath(pose,obstacles,bounds);
  }
  const bubbleSlot=p=>findSpeechBubbleSlot(p,size,bubbleSize,{
    left:heroRect?.left??0,right:heroRect?.right??width,
    top:Math.max(headerBottom,heroRect?.top??0),bottom:Math.min(height,heroRect?.bottom??height),
  },[...obstacles,...surfaces]);
  const walkingObstacles=()=>[...surfaces,...obstacles];
  const leafDestination=l=>({x:Math.max(bounds.left-6,Math.min(bounds.right-106,l.x-size*.82)),y:ground+10-FOOT_Y});
  const availableLeaves=()=>leaves.filter(l=>l.rest==='ground'&&!l.dead&&!l.permanent&&
    (!bubble||bubbleSlot(leafDestination(l)))&&
    (!homeZone||clearSegment(pose,leafDestination(l),walkingObstacles(),bounds)));
  function update(dt) {
    time+=dt;spawnTime+=dt;if(spawnTime>.65){spawnTime=0;spawn();}
    const desiredSwing=drag?.moved?drag.lean:0;
    swingVelocity+=(desiredSwing-swing)*90*dt-swingVelocity*12*dt;
    swing+=swingVelocity*dt;
    swing=Math.max(-12,Math.min(12,swing));
    if(!drag&&Math.abs(swing)<.15&&Math.abs(swingVelocity)<.5){swing=0;swingVelocity=0;}
    for(const l of leaves){
      if(l.windTime>0){l.windTime-=dt;l.x+=l.vx*dt;l.y+=l.vy*dt;l.vy+=45*dt;l.angle+=dt*7;l.vx*=Math.exp(-dt*.35);if(l.x < -40||l.x>width+40||l.y>height+60)l.dead=true;continue;}
      if(l.permanent||l.pulled||l.rest==='ground')continue;
      if(l.rest==='platform'){l.age+=dt;if(l.age>4.5){l.rest=null;l.surface=null;l.y+=16;}continue;}
      const old=l.y;l.y+=l.speed*dt;l.x+=Math.sin(time+l.speed)*10*dt;l.angle+=.5*dt;
      if(l.land||homeZone)for(const r of surfaces){const edge=landingY(r);if(old<edge&&l.y>=edge&&l.x>r.left+12&&l.x<r.right-12){if(!homeZone&&l.skip>0){l.skip--;continue;}l.y=edge;l.rest='platform';l.age=0;l.surface=r.el;l.fraction=(l.x-r.left)/(r.right-r.left);break;}}
      if(l.y>=ground){l.y=ground;l.rest='ground';}
    }
    leaves=leaves.filter(l=>!l.dead);
    if(!petEnabled){
      if(fullPage&&time>=Math.max(12,nextBlowAt)){
        nextBlowAt=time+60;
        const corner=document.querySelector('[data-seasonal-corner-pet]')?.getBoundingClientRect();
        if(corner){
          blowLeaves(leaves,{x:corner.left+corner.width*.5,y:corner.top+corner.height*.6},-1,{width,height});
          window.dispatchEvent(new Event('kapelka-mobile-blow'));
        }
      }
      return;
    }
    if(heroRect&&(heroRect.bottom<=headerBottom||heroRect.top>=height))return;
    if(drag)return;
    // Collision recovery and shelter search must not pause under the pointer.
    gust=Math.max(0,gust-dt);
    const preferred={x,y:ground+10-FOOT_Y};
    if((behavior==='rake'||behavior==='shelter')&&!clearPosition(pose,behavior==='rake'?walkingObstacles():obstacles,bounds))contact(pose);
    // A hidden prompt is not a permanent solution: find room for both the
    // mascot and its bubble, using the same checked routes as collision recovery.
    if(bubble&&(behavior==='rake'||behavior==='shelter')&&!bubbleSlot(pose)&&time>=nextBubbleSearch){
      nextBubbleSearch=time+1;
      const path=findShelterPath(pose,obstacles,bounds,p=>!!bubbleSlot(p));
      if(path){
        if(target)target.pulled=false;
        target=null;perch=null;blockedAt=null;route=path;phase=0;
        behavior=path.every((p,i)=>clearSegment(i?path[i-1]:pose,p,walkingObstacles(),bounds))?'relocate':'flow';
        mode=behavior==='relocate'?'walk':'idle';
      }
    }
    if(behavior==='relocate'){
      const goal=route[0];
      if(!goal){behavior='shelter';mode='idle';x=pose.x;return;}
      const distance=Math.hypot(goal.x-pose.x,goal.y-pose.y),fraction=Math.min(1,180*dt/Math.max(distance,.01));
      const next={x:pose.x+(goal.x-pose.x)*fraction,y:pose.y+(goal.y-pose.y)*fraction};
      if(!clearSegment(pose,next,walkingObstacles(),bounds)){contact(pose);return;}
      if(Math.abs(next.x-pose.x)>.01)direction=next.x>pose.x?1:-1;
      pose=next;if(fraction===1)route.shift();return;
    }
    if(!homeZone&&behavior==='shelter'&&blockedAt&&clearPosition(blockedAt,walkingObstacles(),bounds)&&clearPosition(pose,walkingObstacles(),bounds)){
      // Return along a checked path, never jump vertically out of a shelter.
      const home={x:pose.x,y:preferred.y};
      if(Math.abs(home.y-pose.y)<1){behavior='rake';blockedAt=null;x=pose.x;mode='idle';}
    }
    if(behavior==='squash'){
      phase+=dt;
      if(phase>=.45){
        route=groundRoute();
        behavior=route?'flow':'puddle';phase=0;
      }
      return;
    }
    if(behavior==='puddle'){
      phase+=dt;if(phase>.2){phase=0;const path=groundRoute();if(path){route=path;behavior='flow';}}
      return;
    }
    if(behavior==='flow'){
      if(!route.length){retracingDrag=false;perch=dropPerch;dropPerch=null;behavior='rise';phase=0;return;}
      let remaining=280*dt;
      while(route.length&&remaining>.001){
        const goal=route[0],distance=Math.hypot(goal.x-pose.x,goal.y-pose.y),fraction=Math.min(1,remaining/Math.max(distance,.01));
        const next={x:pose.x+(goal.x-pose.x)*fraction,y:pose.y+(goal.y-pose.y)*fraction};
        if(!retracingDrag&&!clearSegment(pose,next,obstacles,bounds,true)&&!escapeSegment(pose,next,obstacles,bounds)){behavior='puddle';phase=0;return;}
        if(Math.abs(next.x-pose.x)>.01)direction=next.x>pose.x?1:-1;
        pose=next;remaining-=distance*fraction;if(fraction===1)route.shift();else break;
      }
      return;
    }
    if(behavior==='rise'){
      if(!clearPosition(pose,obstacles,bounds)){behavior='puddle';phase=0;return;}
      phase+=dt;if(phase>.45){behavior='shelter';x=pose.x;}
      return;
    }
    if(behavior==='shelter'){
      if(homeZone&&!perch&&Math.abs(pose.y-preferred.y)<1&&availableLeaves().length){
        behavior='rake';x=pose.x;mode='idle';blockedAt=null;return;
      }
      if(reconsiderShelter&&!perch){
        reconsiderShelter=false;
        const path=groundRoute(),goal=path?.[path.length-1];
        if(goal&&goal.x+goal.y>pose.x+pose.y+16){contact(pose);return;}
      }
      if(time>=nextBlowAt){nextBlowAt=time+60;direction=pose.x<width/2?1:-1;gust=1.2;blowLeaves(leaves,{x:pose.x+size*.5,y:pose.y+size*.6},direction,{width,height});}
      return;
    }
    if(focused&&pet.matches(':focus-visible'))return;
    const candidate={x,y:preferred.y};
    if(!clearPosition(candidate,walkingObstacles(),bounds)){contact(candidate);return;}
    pose=candidate;
    if(!target||target.dead||target.rest!=='ground'){target=availableLeaves().sort((a,b)=>Math.abs(a.x-x-size/2)-Math.abs(b.x-x-size/2))[0]||null;mode=target?'walk':'idle';}
    if(target&&mode==='walk'){
      const dest=leafDestination(target).x,distance=dest-x;
      if(Math.abs(distance)>2){
        direction=distance>0?1:-1;
        const next={x:x+Math.sign(distance)*Math.min(Math.abs(distance),75*dt),y:preferred.y};
        if(!clearSegment(pose,next,walkingObstacles(),bounds)){contact(next);return;}
        x=next.x;
      }
      else{direction=1;mode='rake';rake=0;}
    }
    if(target&&mode==='rake'){
      rake+=dt;if(rake>=.3&&rake<.9){target.pulled=true;target.x+=(x+size*.46-target.x)*Math.min(1,dt*5);target.angle+=dt*3;}
      if(rake>=1.2){target.dead=true;target=null;mode='idle';}
    }
    leaves=leaves.filter(l=>!l.dead);
    pose={x,y:preferred.y};
  }
  let heldFrame=0;
  function tick(now) {
    if(disposed)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(nextMeasure)measure();
    // The navigation drawer already sits above the decoration and blocks clicks.
    // Only that marked panel is exempt; a dialog opened inside it still pauses us.
    if(now-lastCheck>350){otherModalOpen=!!document.querySelector('[role="dialog"]:not([data-seasonal-background="continue"]):not([data-floating-assistant]), [role="alertdialog"]');lastCheck=now;}
    modalOpen=otherModalOpen||!!pet.closest('[data-assistant-open]');
    if(!document.hidden&&!modalOpen&&(!petEnabled||frames.length))update(dt);
    ctx.clearRect(0,0,width,height);
    if(!otherModalOpen){leaves.forEach(leaf);
      // Decorations never obscure text, controls, or the contents of cards.
      if(!homeZone)surfaces.forEach(r=>ctx.clearRect(r.left,r.top,r.right-r.left,r.bottom-r.top));
      protectedRects.forEach(r=>ctx.clearRect(r.left-3,r.top-3,r.right-r.left+6,r.bottom-r.top+6));
      // No seasonal drawing inside the footer or the controls beneath the lane.
      const drawingBottom=heroRect?heroRect.bottom:ground+10;
      if(drawingBottom<height)ctx.clearRect(0,Math.max(0,drawingBottom),width,height);
      if((homeZone||fullPage)&&headerBottom)ctx.clearRect(0,0,width,headerBottom);
      if(heroRect){
        ctx.clearRect(0,0,width,Math.max(0,heroRect.top));
        ctx.clearRect(0,0,Math.max(0,heroRect.left),height);
        ctx.clearRect(heroRect.right,0,width,height);
      }
    }
    if(!petEnabled){raf=requestAnimationFrame(tick);return;}
    // Scroll-aware position; all movement to another pocket uses a free route.
    pet.style.visibility=modalOpen||(heroRect&&(heroRect.bottom<=headerBottom||heroRect.top>=height))?'hidden':'visible';
    // Clip to the hero, not the mascot's box: negative insets leave room for
    // its speech bubble above while still protecting the header and footer.
    pet.style.clipPath=heroRect?`inset(${Math.max(headerBottom,heroRect.top)-pose.y}px ${pose.x+size-heroRect.right}px ${pose.y+size-heroRect.bottom}px ${heroRect.left-pose.x}px)`:'none';
    pet.style.pointerEvents='auto';
    pet.style.transform=`translate(${Math.round(pose.x)}px,${Math.round(pose.y)}px)`;
    if(bubble){
      const slot=bubbleSlot(pose);
      bubble.style.visibility=slot&&!drag&&!modalOpen&&pet.style.visibility!=='hidden'?'visible':'hidden';
      if(slot){bubble.style.left=`${slot.x-pose.x}px`;bubble.style.top=`${slot.y-pose.y}px`;bubble.style.margin='0';}
    }
    if(!document.hidden&&!modalOpen)heldFrame=mode==='rake'?4+Math.min(3,Math.floor(rake/.3)):mode==='walk'?Math.floor(time*9)%4:0;
    sc.clearRect(0,0,256,256);sc.imageSmoothingEnabled=false;
    const usingRake=behavior==='rake'&&target?.rest==='ground'&&!target.dead&&(mode==='walk'||mode==='rake');
    let picture=usingRake?frames[heldFrame]:liquidFrames[0],squish=1;
    pet.dataset.tool=usingRake?'rake':'none';
    // These frames already contain the squash. Scaling them again folds the
    // face and hat into a thin strip, unlike the intended drawn silhouette.
    if(behavior==='squash')picture=liquidFrames[phase>.2?2:1]||frames[0];
    if(behavior==='puddle')picture=liquidFrames[2]||frames[0];
    if(behavior==='flow')picture=null;
    if(behavior==='rise'){picture=liquidFrames[0];const progress=Math.min(1,phase/.45);squish=.12+.88*progress*progress*(3-2*progress);}
    if(behavior==='shelter')picture=liquidFrames[gust>.7?4:gust>0?5:nextBlowAt-time<.6?3:0]||frames[0];
    if(behavior==='drag'){
      const elapsed=time-dragStartedAt;
      const frame=elapsed<.25?0:[1,2,1,3,2,4][Math.floor(elapsed*7)%6];
      picture=dragFrames[frame]||liquidFrames[0];
      pet.dataset.expression=frame===4?'happy':frame===3?'blink':'surprised';
    }else{
      pet.dataset.expression='calm';
      if(behavior==='shelter'&&time<settleUntil)picture=dragFrames[5]||picture;
    }
    if(picture){
      if(behavior==='puddle'||(behavior==='squash'&&phase>=.3))sc.drawImage(picture,121,236,14,8);
      else sc.drawImage(picture,0,244*(1-squish),256,256*squish);
    }
    // A thin moving ribbon, not a translated flat character. Integer pixels
    // preserve the art style; the head gathers into the standing sprite.
    if(behavior==='flow'){
      for(let i=0;i<3;i++){
        const ribbonX=121+i*4,ribbonY=238+Math.round(Math.sin(time*18-i*.5));
        sc.fillStyle='#153747';sc.fillRect(ribbonX,ribbonY,5,5);
        sc.fillStyle='#55cfff';sc.fillRect(ribbonX,ribbonY+1,5,3);
        sc.fillStyle='#b8f1ff';sc.fillRect(ribbonX,ribbonY+1,3,1);
      }
    }
    // Short pixel-air strokes stay attached to the mouth and mirror with it.
    // Render on the pet canvas so blank card backgrounds cannot hide them.
    if(behavior==='shelter'&&gust>0){
      sc.fillStyle='#9bcdd8';
      for(let i=0;i<3;i++){
        const progress=((1.2-gust)*2+i*.27)%1;
        const airX=166+Math.round(progress*45/3)*3;
        const airY=143+(i-1)*10;
        sc.fillRect(airX,airY,15,3);
        sc.fillRect(airX+12,airY+(i===0?-3:3),6,3);
      }
    }
    // Clip against newly moving content as a last resort; never draw over it.
    const mirrored=behavior==='flow'||behavior==='shelter'||mode==='walk'?direction:1;
    if(!drag)for(const r of obstacles){const left=(r.left-pose.x)*256/size,right=(r.right-pose.x)*256/size;sc.clearRect(mirrored===-1?256-right:left,(r.top-pose.y)*256/size,right-left,(r.bottom-r.top)*256/size);}
    sprite.style.transformOrigin='50% 15%';
    sprite.style.transform=`rotate(${swing.toFixed(2)}deg) scaleX(${mirrored})`;
    pet.dataset.behavior=behavior;
    pet.dataset.action=mode;
    raf=requestAnimationFrame(tick);
  }
  const atlas = new Image(), liquidAtlas = new Image(), dragAtlas = new Image();
  atlas.onload=()=>{if(!disposed)frames=prepareSpriteFrames(atlas,8);};
  liquidAtlas.onload=()=>{if(!disposed)liquidFrames=prepareSpriteFrames(liquidAtlas,6,240);};
  if(petEnabled)atlas.src='/images/seasonal/kapelka-autumn.webp';
  if(petEnabled)liquidAtlas.src='/images/seasonal/kapelka-liquid.webp';
  dragAtlas.onload=()=>{if(!disposed)dragFrames=prepareSpriteFrames(dragAtlas,6,240);};
  if(petEnabled)dragAtlas.src='/images/seasonal/kapelka-drag.webp';
  const enter=()=>{hovering=true;},leave=()=>{hovering=false;},focus=()=>{focused=true;},blur=()=>{focused=false;},dirty=()=>{nextMeasure=true;};
  const down=e=>{
    if(e.button!==0||drag)return;
    suppressClick=false;
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,offsetX:e.clientX-pose.x,offsetY:e.clientY-pose.y,saved:{...pose},trail:[{...pose}],moved:false,lean:0};
    pet.setPointerCapture?.(e.pointerId);
  };
  const move=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;
    if(!drag.moved)dragStartedAt=time;
    drag.moved=true;e.preventDefault();
    drag.lean=Math.max(-10,Math.min(10,(e.clientX-drag.lastX)*.7));drag.lastX=e.clientX;
    if(target)target.pulled=false;
    target=null;mode='idle';behavior='drag';perch=null;
    pose={x:Math.max(0,Math.min(width-size,e.clientX-drag.offsetX)),y:Math.max(headerBottom,Math.min(height-size,e.clientY-drag.offsetY))};
    if(heroRect){pose.x=Math.max(heroRect.left,Math.min(heroRect.right-size,pose.x));pose.y=Math.max(Math.max(headerBottom,heroRect.top),Math.min(heroRect.bottom-size,pose.y));}
    drag.trail.push({...pose});
    pet.style.cursor='grabbing';
  };
  const up=e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const current=drag;drag=null;
    if(pet.hasPointerCapture?.(e.pointerId))pet.releasePointerCapture(e.pointerId);
    pet.style.cursor='grab';
    if(!current.moved)return;
    swingVelocity=0;
    suppressClick=true;hovering=false;focused=false;blockedAt=null;
    settleUntil=time+.8;
    const candidates=surfaces.map(r=>({p:{x:Math.max(r.left,Math.min(pose.x,r.right-size)),y:r.top-FOOT_Y-4},el:r.el}))
      .filter(c=>Math.abs(c.p.y-pose.y)<100&&Math.abs(c.p.x-pose.x)<100&&clearPosition(c.p,obstacles,bounds))
      .sort((a,b)=>Math.hypot(a.p.x-pose.x,a.p.y-pose.y)-Math.hypot(b.p.x-pose.x,b.p.y-pose.y));
    const landing=candidates[0];
    const landingPath=landing&&puddlePath(pose,landing.p,obstacles,bounds);
    if(e.type!=='pointercancel'&&!landing&&clearPosition(pose,obstacles,bounds)){
      behavior='shelter';x=pose.x;return;
    }
    dropRoute=e.type==='pointercancel'?null:landingPath||findShelterPath(pose,obstacles,bounds);
    dropPerch=landingPath&&e.type!=='pointercancel'?landing.el:null;
    retracingDrag=!dropRoute;
    // If released inside solid content, retrace the user's drag continuously
    // instead of assigning the old position. Rendering still masks all text.
    if(!dropRoute)dropRoute=current.trail.slice(0,-1).reverse();
    contact(pose);
  };
  const click=e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}};
  pet.style.touchAction='none';pet.style.cursor='grab';
  pet.addEventListener('pointerdown',down);pet.addEventListener('pointermove',move);pet.addEventListener('pointerup',up);pet.addEventListener('pointercancel',up);pet.addEventListener('click',click,true);
  pet.addEventListener('pointerenter',enter);pet.addEventListener('pointerleave',leave);pet.addEventListener('focus',focus);pet.addEventListener('blur',blur);
  window.addEventListener('resize',dirty);window.addEventListener('scroll',dirty,{passive:true,capture:true});
  const observer=new ResizeObserver(dirty);observer.observe(document.body);
  // Async account data can replace cards without changing the body's size.
  const contentObserver=new MutationObserver(records=>{
    if(records.some(record=>!record.target.parentElement?.closest('[data-seasonal-ui]')&&!(record.target instanceof Element&&record.target.closest('[data-seasonal-ui]'))))dirty();
  });
  contentObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
  measure();for(let i=0;i<8;i++)spawn(true);
  for(let i=0;i<5;i++)leaves.push(makeLeaf({x:30+(i+.5)*Math.max(1,width-60)/5,y:ground,rest:'ground',permanent:true}));
  raf=requestAnimationFrame(tick);
  return ()=>{disposed=true;contentObserver.disconnect();if(drag&&pet.hasPointerCapture?.(drag.id))pet.releasePointerCapture(drag.id);drag=null;pet.removeEventListener('pointerdown',down);pet.removeEventListener('pointermove',move);pet.removeEventListener('pointerup',up);pet.removeEventListener('pointercancel',up);pet.removeEventListener('click',click,true);cancelAnimationFrame(raf);atlas.onload=null;liquidAtlas.onload=null;observer.disconnect();window.removeEventListener('resize',dirty);window.removeEventListener('scroll',dirty,true);pet.removeEventListener('pointerenter',enter);pet.removeEventListener('pointerleave',leave);pet.removeEventListener('focus',focus);pet.removeEventListener('blur',blur);ctx.clearRect(0,0,width,height);sc.clearRect(0,0,256,256);frames=[];liquidFrames=[];leaves=[];};
}

export function findSpeechBubbleSlot(pose,size,box,bounds,obstacles) {
  for(const x of [pose.x+size+4,pose.x-box.width-4]){
    const y=pose.y+40;
    if(x<bounds.left||x+box.width>bounds.right||y<bounds.top||y+box.height>bounds.bottom)continue;
    if(obstacles.some(r=>x<r.right+4&&x+box.width>r.left-4&&y<r.bottom+4&&y+box.height>r.top-4))continue;
    return {x,y};
  }
  return null;
}

export function findPetSlot(width,height,size,preferredX,rectangles) {
  const intersects=(x,y)=>rectangles.some(r=>r.left<x+size+6&&r.right>x-6&&r.top<y+size+6&&r.bottom>y-6);
  const maxX=Math.max(0,width-size-8),start=Math.max(8,Math.min(preferredX,maxX));
  for(let y=height-size-12;y>=Math.max(8,height*.35);y-=size+12){
    if(!intersects(start,y))return {x:start,y};
    for(let x=8;x<=maxX;x+=size+12)if(!intersects(x,y))return {x,y};
  }
  return null;
}
