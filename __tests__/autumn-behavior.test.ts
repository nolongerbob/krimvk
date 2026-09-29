import { startAutumnScene } from '@/components/seasonal/autumn-scene';
import * as motion from '@/components/seasonal/autumn-motion';
jest.mock('@/components/seasonal/autumn-motion',()=>{
  const actual=jest.requireActual('@/components/seasonal/autumn-motion');
  return {...actual,blowLeaves:jest.fn(actual.blowLeaves)};
});
jest.mock('@/components/seasonal/sprite-frames',()=>({prepareSpriteFrames:(_image: unknown,count:number)=>Array.from({length:count},()=>({}))}));

describe('autumn behavior transitions',()=>{
  it('squashes, flows, rises and shelters; returns to raking when space is restored',()=>{
    let callback:FrameRequestCallback=()=>{};const images:any[]=[];
    const blow=jest.mocked(motion.blowLeaves);blow.mockClear();
    const originalImage=global.Image,originalResize=global.ResizeObserver;
    global.Image=class { onload:(()=>void)|null=null;src='';constructor(){images.push(this);} } as unknown as typeof Image;
    global.ResizeObserver=class {observe(){}disconnect(){}unobserve(){}};
    jest.spyOn(window,'requestAnimationFrame').mockImplementation(fn=>{callback=fn;return 1;});
    jest.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});
    jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({setTransform(){},clearRect(){},fillRect(){},drawImage(){}} as unknown as CanvasRenderingContext2D);
    const lane=document.createElement('div'),pet=document.createElement('button'),canvas=document.createElement('canvas'),sprite=document.createElement('canvas');
    lane.dataset.seasonalUi='';lane.append(pet);document.body.append(lane);
    let laneBottom=544,laneWidth=800;
    lane.getBoundingClientRect=()=>({left:0,right:laneWidth,top:laneBottom-144,bottom:laneBottom,width:laneWidth,height:144} as DOMRect);
    const cleanup=startAutumnScene(canvas,pet,sprite,lane);images.forEach(image=>image.onload?.());
    const states=new Set<string|undefined>();let t=0;
    const advance=(n:number)=>{for(let i=0;i<n;i++){t+=50;callback(t);states.add(pet.dataset.behavior);}};
    advance(3);
    expect(pet.dataset.tool).toBe('rake'); // Initial floor leaves are available.
    // Follow the viewport when the document lane is below it, without squash.
    laneWidth=320;laneBottom=1500;window.dispatchEvent(new Event('scroll'));advance(12);
    expect(pet.dataset.behavior).toBe('rake');expect(pet.style.transform).toContain(`${Math.round(window.innerHeight-12-106.75)}px`);
    const previousHeight=window.innerHeight;
    Object.defineProperty(window,'innerHeight',{configurable:true,value:480});
    window.dispatchEvent(new Event('resize'));advance(3);
    expect(pet.dataset.behavior).toBe('rake');expect(pet.style.transform).toContain('361px');
    Object.defineProperty(window,'innerHeight',{configurable:true,value:previousHeight});
    // Never follow the viewport down into the footer.
    laneBottom=-120;window.dispatchEvent(new Event('scroll'));advance(12);
    expect(pet.dataset.behavior).toBe('rake');expect(pet.style.transform).toContain('-227px');
    laneWidth=800;laneBottom=544;window.dispatchEvent(new Event('resize'));advance(2);
    expect(states.has('squash')).toBe(false);
    const obstacle=document.createElement('section');obstacle.dataset.seasonalSurface='';
    obstacle.getBoundingClientRect=()=>({left:0,right:300,top:400,bottom:508,width:300,height:108} as DOMRect);document.body.append(obstacle);
    const control=document.createElement('button');obstacle.append(control);
    control.getBoundingClientRect=()=>({left:0,right:120,top:400,bottom:508,width:120,height:108} as DOMRect);
    window.dispatchEvent(new Event('resize'));advance(1);
    pet.dispatchEvent(new Event('pointerenter'));advance(25);
    expect(pet.dataset.behavior).not.toBe('squash');
    pet.dispatchEvent(new Event('pointerleave'));advance(174);
    expect(states.has('squash')).toBe(true);expect(states.has('flow')).toBe(true);expect(states.has('rise')).toBe(true);expect(pet.dataset.behavior).toBe('shelter');
    expect(pet.style.transform).toContain('437px');
    // Prefer the furthest reachable right-hand pocket, beyond the control.
    const shelterX=Number(pet.style.transform.match(/translate\((\d+)px/)?.[1]);
    expect(shelterX).toBe(688);
    expect(pet.dataset.tool).toBe('none');
    expect(blow).toHaveBeenCalledTimes(1);
    advance(1000); // Fifty seconds still must not trigger another gust.
    expect(blow).toHaveBeenCalledTimes(1);
    advance(220);
    expect(blow).toHaveBeenCalledTimes(2);
    expect(pet.dataset.tool).toBe('none');
    obstacle.remove();window.dispatchEvent(new Event('resize'));advance(70);expect(pet.dataset.behavior).toBe('rake');
    const card=document.createElement('section');card.dataset.seasonalSurface='';
    card.getBoundingClientRect=()=>({left:200,right:750,top:300,bottom:450,width:550,height:150} as DOMRect);document.body.append(card);
    const header=document.createElement('header');header.id='site-header';
    header.getBoundingClientRect=()=>({left:0,right:800,top:0,bottom:90,width:800,height:90} as DOMRect);document.body.append(header);
    window.dispatchEvent(new Event('resize'));advance(1);
    const position=pet.style.transform.match(/translate\(([-\d]+)px,([-\d]+)px/)!;
    const pointer=(type:string,clientX:number,clientY:number)=>{
      const event=new Event(type,{bubbles:true,cancelable:true});
      Object.assign(event,{pointerId:1,button:0,clientX,clientY});pet.dispatchEvent(event);
    };
    pointer('pointerdown',Number(position[1])+56,Number(position[2])+56);
    pointer('pointermove',456,0);advance(1);
    expect(pet.style.transform).toContain('96px');
    expect(pet.dataset.expression).toBe('surprised');
    pointer('pointermove',456,245);advance(5);
    expect(pet.dataset.behavior).toBe('drag');expect(pet.dataset.tool).toBe('none');
    expect(sprite.style.transform).toMatch(/rotate\(-?\d+\.\d+deg\)/);
    expect(sprite.style.transform).not.toContain('rotate(0.00deg)');
    const releasedAt=pet.style.transform;
    pointer('pointerup',456,245);advance(1);
    expect(pet.style.transform).toBe(releasedAt);
    expect(pet.dataset.behavior).toBe('squash');
    advance(40);
    expect(pet.dataset.behavior).toBe('shelter');expect(pet.style.transform).toContain('189px');
    advance(40);expect(sprite.style.transform).toContain('rotate(0.00deg)');
    const click=new MouseEvent('click',{bubbles:true,cancelable:true});pet.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    card.remove();header.remove();
    cleanup();
    const home=document.createElement('main');home.dataset.seasonalHome='';
    const hero=document.createElement('section');hero.dataset.seasonalHero='';
    hero.getBoundingClientRect=()=>({left:0,right:800,top:100,bottom:500,width:800,height:400} as DOMRect);
    home.append(hero);document.body.append(home);
    jest.spyOn(Math,'random').mockReturnValue(.8);
    blow.mockClear();
    const cleanupHero=startAutumnScene(canvas,pet,sprite,lane);images.forEach(image=>image.onload?.());
    const actions=new Set<string|undefined>();
    for(let i=0;i<100;i++){advance(1);actions.add(pet.dataset.action);expect(pet.dataset.behavior).toBe('rake');}
    expect(actions.has('walk')).toBe(true);expect(actions.has('rake')).toBe(true);
    expect(pet.dataset.tool).toBe('rake');expect(blow).not.toHaveBeenCalled();
    const beforeResize=pet.style.transform;
    window.dispatchEvent(new Event('resize'));advance(1);
    expect(pet.style.transform).not.toBe('translate(688px,389px)');
    expect(beforeResize).toContain('389px');
    cleanupHero();
    const cta=document.createElement('button');hero.append(cta);
    cta.getBoundingClientRect=()=>({left:20,right:420,top:330,bottom:372,width:400,height:42} as DOMRect);
    jest.mocked(Math.random).mockReturnValue(.04);
    const cleanupWalk=startAutumnScene(canvas,pet,sprite,lane);images.forEach(image=>image.onload?.());
    pet.dispatchEvent(new Event('pointerenter'));
    let minX=Infinity;
    for(let i=0;i<260;i++){
      advance(1);
      expect(pet.dataset.behavior).toBe('rake');
      minX=Math.min(minX,Number(pet.style.transform.match(/translate\(([-\d]+)px/)?.[1]));
    }
    expect(minX).toBeLessThan(10);
    expect(sprite.style.transform).toContain('rotate(0.00deg)');
    cleanupWalk();home.remove();
    jest.restoreAllMocks();global.Image=originalImage;global.ResizeObserver=originalResize;lane.remove();
  });
});
