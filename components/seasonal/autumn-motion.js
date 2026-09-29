export const PET_SIZE = 112;
export const FOOT_Y = 106.75;
export function petBox(p, puddle = false) {
  return { left:p.x+(puddle?53:6), right:p.x+(puddle?59:106), top:p.y+(puddle?103:8), bottom:p.y+FOOT_Y };
}
export function clearPosition(p, obstacles, bounds, puddle = false) {
  const b=petBox(p,puddle);
  return b.left>=bounds.left && b.right<=bounds.right && b.top>=bounds.top && b.bottom<=bounds.bottom &&
    !obstacles.some(r=>b.left<r.right+3&&b.right>r.left-3&&b.top<r.bottom+3&&b.bottom>r.top-3);
}
export function clearSegment(a,b,obstacles,bounds,puddle=false) {
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5));
  for(let i=0;i<=steps;i++)if(!clearPosition({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},obstacles,bounds,puddle))return false;
  return true;
}

// Resizing/scrolling can put an obstacle over the existing puddle. Ordinary
// routing rejects its very first point; recovery may only reduce that overlap.
export function escapeSegment(a,b,obstacles,bounds) {
  const overlap=(p,r)=>{const box=petBox(p,true);return Math.max(0,Math.min(box.right,r.right+3)-Math.max(box.left,r.left-3))*Math.max(0,Math.min(box.bottom,r.bottom+3)-Math.max(box.top,r.top-3));};
  let previous=obstacles.map(r=>overlap(a,r));
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3));
  for(let i=1;i<=steps;i++){
    const p={x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps};
    if(!clearPosition(p,[],bounds,true))return false;
    const next=obstacles.map(r=>overlap(p,r));
    if(next.some((area,j)=>area>previous[j]+.001))return false;
    previous=next;
  }
  return true;
}

function escapePath(start,obstacles,bounds,acceptGoal,deadline) {
  const xs=[start.x,bounds.right-106,bounds.left-6,...obstacles.flatMap(r=>[r.right-49,r.left-63])];
  const ys=[start.y,bounds.bottom-FOOT_Y,...obstacles.flatMap(r=>[r.top-FOOT_Y-4,r.bottom-99])];
  const candidates=xs.flatMap(x=>ys.map(y=>({x,y}))).filter(p=>clearPosition(p,obstacles,bounds,true));
  candidates.sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));
  for(const exit of candidates){
    if(performance.now()>deadline)return null;
    if(escapeSegment(start,exit,obstacles,bounds)){
    if(clearPosition(exit,obstacles,bounds)&&acceptGoal(exit))return [exit];
    const rest=findShelterPath(exit,obstacles,bounds,acceptGoal,deadline);
    if(rest)return [exit,...rest];
  }}
  return null;
}
export function findStandingPlace(preferred,obstacles,bounds) {
  if(clearPosition(preferred,obstacles,bounds))return {...preferred};
  let best=null,score=Infinity;
  for(let y=bounds.bottom-FOOT_Y;y>=bounds.top-8;y-=16)for(let x=bounds.left;x<=bounds.right-106;x+=16){
    const p={x,y},distance=Math.hypot(x-preferred.x,y-preferred.y);
    if(distance<score&&clearPosition(p,obstacles,bounds)){best=p;score=distance;}
  }
  return best;
}

// Relocation stays on the current support line, never to a higher viewport gap.
export function findGroundPlace(preferred,obstacles,bounds) {
  if(clearPosition(preferred,obstacles,bounds))return {...preferred};
  let best=null,score=Infinity;
  for(let x=bounds.left;x<=bounds.right-106;x+=8){
    const p={x,y:preferred.y},distance=Math.abs(x-preferred.x);
    if(distance<score&&clearPosition(p,obstacles,bounds)){best=p;score=distance;}
  }
  return best;
}

// A relocation must actually move the pet. Blank card background at the
// current position is not a destination after a collision with that card.
export function findRightShelterPath(start,obstacles,bounds) {
  for(let x=bounds.right-106;x>=start.x+PET_SIZE/2;x-=8){
    const goal={x,y:start.y};
    if(clearPosition(goal,obstacles,bounds)&&clearSegment(start,goal,obstacles,bounds,true))return [goal];
  }
  return null;
}

// Search reachable positions, not just the nearest empty destination: the
// nearest pocket can be separated from the puddle by an impassable barrier.
export function findShelterPath(start,obstacles,bounds,acceptGoal=(_point)=>true,deadline=performance.now()+6) {
  if(performance.now()>deadline)return null;
  if(!clearPosition(start,obstacles,bounds,true))return escapePath(start,obstacles,bounds,acceptGoal,deadline);
  const corner={x:bounds.right-106,y:bounds.bottom-FOOT_Y};
  if(clearPosition(corner,obstacles,bounds)&&acceptGoal(corner)){
    const path=puddlePath(start,corner,obstacles,bounds,deadline);
    if(path)return path;
  }
  // Use obstacle edges rather than a fixed pixel grid, which can miss narrow
  // gaps entirely and exhaust its node budget before reaching a distant exit.
  const xs=[...new Set([start.x,bounds.left-53,bounds.right-59,bounds.left-6,bounds.right-106,...obstacles.flatMap(r=>[r.left-63,r.right-49,r.left-110,r.right-2])])].sort((a,b)=>a-b);
  const ys=[...new Set([start.y,bounds.top-103,bounds.bottom-FOOT_Y,bounds.top-8,...obstacles.flatMap(r=>[r.top-FOOT_Y-4,r.bottom-99,r.bottom-4])])].sort((a,b)=>a-b);
  const queue=[{p:{...start},parent:-1}],seen=new Set([`${start.x},${start.y}`]);
  let head=0,best=-1,bestScore=-Infinity;
  while(head<queue.length){
    if(performance.now()>deadline)return null;
    const index=head++,node=queue[index];
    if(clearPosition(node.p,obstacles,bounds)&&acceptGoal(node.p)){
      const score=node.p.x+node.p.y; // Distance to the lower-right corner.
      if(score>bestScore){best=index;bestScore=score;}
    }
    const xi=xs.indexOf(node.p.x),yi=ys.indexOf(node.p.y);
    for(const p of [{x:xs[xi+1],y:node.p.y},{x:xs[xi-1],y:node.p.y},{x:node.p.x,y:ys[yi+1]},{x:node.p.x,y:ys[yi-1]}]){
      if(p.x===undefined||p.y===undefined)continue;
      const key=`${p.x},${p.y}`;
      if(seen.has(key))continue;seen.add(key);
      if(clearSegment(node.p,p,obstacles,bounds,true))queue.push({p,parent:index});
    }
  }
  if(best<0)return null;
  const path=[];
  for(let i=best;i>0;i=queue[i].parent)path.push(queue[i].p);
  return path.length?path.reverse():[{...start}];
}
// A bounded search of free corridors. No straight-line teleport through cards.
export function puddlePath(start,end,obstacles,bounds,deadline=performance.now()+6) {
  if(!clearPosition(start,obstacles,bounds,true)||!clearPosition(end,obstacles,bounds,true))return null;
  if(clearSegment(start,end,obstacles,bounds,true))return [{...end}];
  const queue=[{p:start,parent:-1}],seen=new Set(['0,0']);let head=0;
  while(head<queue.length&&queue.length<6000){
    if(performance.now()>deadline)return null;
    const index=head++,node=queue[index];
    if(Math.hypot(node.p.x-end.x,node.p.y-end.y)<34&&clearSegment(node.p,end,obstacles,bounds,true)){
      const result=[{...end}];let n=index;while(n>0){result.push(queue[n].p);n=queue[n].parent;}return result.reverse();
    }
    for(const [dx,dy] of [[16,0],[-16,0],[0,16],[0,-16]]){
      const p={x:node.p.x+dx,y:node.p.y+dy},key=`${Math.round((p.x-start.x)/16)},${Math.round((p.y-start.y)/16)}`;
      if(seen.has(key))continue;seen.add(key);
      if(clearSegment(node.p,p,obstacles,bounds,true))queue.push({p,parent:index});
    }
  }
  return null;
}

export function blowLeaves(leaves,origin,direction,viewport) {
  let count=0;
  for(const leaf of leaves){
    const dx=(leaf.x-origin.x)*direction,dy=leaf.y-origin.y;
    if(leaf.dead)continue;
    if(viewport){
      if(leaf.x < -16||leaf.x>viewport.width+16||leaf.y < -16||leaf.y>viewport.height+16)continue;
    }else if(dx < -25 || dx > 420 || Math.abs(dy)>65+Math.max(0,dx)*.4)continue;
    leaf.rest=null;leaf.surface=null;leaf.permanent=false;leaf.pulled=false;
    // Enough momentum to carry even the far edge out of a wide viewport.
    leaf.vx=direction*(viewport?Math.max(300,viewport.width*.65):190+Math.max(0,220-dx)*.5);leaf.vy=-85-Math.max(0,100-Math.abs(dy))*.5;
    leaf.windTime=2.8;leaf.age=0;count++;
  }
  return count;
}
