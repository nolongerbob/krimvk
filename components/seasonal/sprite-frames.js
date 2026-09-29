// Isolate connected silhouettes: generated cells can overlap in their bounds.
export function prepareSpriteFrames(atlas, count, threshold=64) {
  const source=document.createElement('canvas');source.width=atlas.naturalWidth;source.height=atlas.naturalHeight;
  const c=source.getContext('2d');if(!c)return [];c.drawImage(atlas,0,0);
  const w=source.width,h=source.height,data=c.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),parts=[];
  for(let seed=0;seed<w*h;seed++){
    if(seen[seed]||data[seed*4+3]<threshold)continue;const stack=[seed],members=[];seen[seed]=1;let left=w,top=h,right=0,bottom=0;
    while(stack.length){const p=stack.pop(),px=p%w,py=Math.floor(p/w);members.push(p);left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
      for(const k of [px>0?p-1:-1,px+1<w?p+1:-1,py>0?p-w:-1,py+1<h?p+w:-1])if(k>=0&&!seen[k]&&data[k*4+3]>=threshold){seen[k]=1;stack.push(k);}
    }
    if(members.length>10000)parts.push({members,left,top,right,bottom});
  }
  parts.sort((a,b)=>Math.floor(a.top/(h/2))-Math.floor(b.top/(h/2))||a.left-b.left);
  if(parts.length!==count)return [];
  return parts.map(p=>{
    const cw=p.right-p.left+1,ch=p.bottom-p.top+1,isolated=document.createElement('canvas');isolated.width=cw;isolated.height=ch;
    const ic=isolated.getContext('2d'),image=ic.createImageData(cw,ch);let foot=0;
    for(const n of p.members){const i=n*4,dest=((Math.floor(n/w)-p.top)*cw+n%w-p.left)*4;image.data.set(data.subarray(i,i+4),dest);if(data[i+2]>data[i]+40&&data[i+1]>data[i]+20)foot=Math.max(foot,Math.floor(n/w)-p.top+1);}
    ic.putImageData(image,0,0);
    const frame=document.createElement('canvas');frame.width=frame.height=256;const fc=frame.getContext('2d');fc.imageSmoothingEnabled=false;
    fc.drawImage(isolated,12,244-foot*.5,cw*.5,ch*.5);return frame;
  });
}
