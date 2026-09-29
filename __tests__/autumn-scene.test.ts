import { startAutumnScene, findPetSlot, findSpeechBubbleSlot } from '@/components/seasonal/autumn-scene';

describe('mascot speech bubble placement',()=>{
  const box={width:130,height:36},bounds={left:0,right:800,top:80,bottom:600};
  it('places the prompt beside the body rather than above it',()=>{
    expect(findSpeechBubbleSlot({x:200,y:450},112,box,bounds,[])).toEqual({x:316,y:490});
  });
  it('switches to the left at the right edge',()=>{
    expect(findSpeechBubbleSlot({x:680,y:450},112,box,bounds,[])).toEqual({x:546,y:490});
  });
  it('avoids cards and hides the prompt if neither side fits',()=>{
    const right={left:310,right:500,top:480,bottom:550};
    expect(findSpeechBubbleSlot({x:200,y:450},112,box,bounds,[right])).toEqual({x:66,y:490});
    expect(findSpeechBubbleSlot({x:200,y:450},112,box,bounds,[right,{left:0,right:200,top:480,bottom:550}])).toBeNull();
  });
});

describe('pet visibility',()=>{
  it('keeps the original position when free',()=>expect(findPetSlot(800,600,112,20,[])).toEqual({x:20,y:476}));
  it('moves above a full-width bottom banner instead of disappearing',()=>{
    const slot=findPetSlot(800,600,112,20,[{left:0,top:460,right:800,bottom:600}]);
    expect(slot).not.toBeNull();expect(slot!.y+112).toBeLessThan(460);
  });
  it('does not cover controls if there is no safe place',()=>expect(findPetSlot(320,600,112,20,[{left:0,top:0,right:320,bottom:600}])).toBeNull());
});

describe('autumn scene lifecycle', () => {
  let callback: FrameRequestCallback;
  let disconnect: jest.Mock;
  beforeEach(() => {
    disconnect=jest.fn();
    Object.defineProperty(global,'ResizeObserver',{configurable:true,value:class { observe() {} disconnect=disconnect; }});
    jest.spyOn(window,'requestAnimationFrame').mockImplementation(fn=>{callback=fn;return 7;});
    jest.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});
    jest.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({setTransform:jest.fn(),clearRect:jest.fn(),fillRect:jest.fn(),drawImage:jest.fn()} as unknown as CanvasRenderingContext2D);
  });
  afterEach(()=>{jest.restoreAllMocks();document.body.innerHTML='';});
  it('cleans up animation and observers on unmount',()=>{
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button');
    document.body.append(canvas,sprite,pet);
    const cleanup=startAutumnScene(canvas,pet,sprite);
    callback(100);cleanup();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);expect(disconnect).toHaveBeenCalled();
    const n=(window.requestAnimationFrame as jest.Mock).mock.calls.length;callback(200);
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(n);
  });
  it('keeps decorations visible behind navigation but hides them for a nested dialog',()=>{
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button');
    const menu=document.createElement('div');
    menu.setAttribute('role','dialog');
    menu.setAttribute('data-seasonal-background','continue');
    document.body.append(canvas,sprite,pet,menu);
    const cleanup=startAutumnScene(canvas,pet,sprite);
    callback(400);
    expect(pet.style.visibility).toBe('visible');
    const draw=canvas.getContext('2d')!.fillRect as jest.Mock;
    expect(draw).toHaveBeenCalled();
    draw.mockClear();
    const dialog=document.createElement('div');dialog.setAttribute('role','dialog');menu.append(dialog);
    callback(800);
    expect(pet.style.visibility).toBe('hidden');
    expect(draw).not.toHaveBeenCalled();
    dialog.remove();callback(1200);
    expect(pet.style.visibility).toBe('visible');
    cleanup();
  });
  it('does not start when canvas is unavailable',()=>{
    (HTMLCanvasElement.prototype.getContext as jest.Mock).mockReturnValue(null);
    const cleanup=startAutumnScene(document.createElement('canvas'),document.createElement('button'),document.createElement('canvas'));
    cleanup();expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
  it('renders leaves without pet frames or a visible mascot in public mode',()=>{
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button'),lane=document.createElement('div');
    document.body.append(lane);
    const cleanup=startAutumnScene(canvas,pet,sprite,lane,{petEnabled:false});
    callback(100);callback(150);
    expect(canvas.getContext('2d')!.fillRect).toHaveBeenCalled();
    expect(pet.dataset.behavior).toBeUndefined();
    expect(pet.style.transform).toBe('');
    cleanup();
  });
  it('limits autumn to the hero image, ignoring quick cards and about',()=>{
    const home=document.createElement('main');home.dataset.seasonalHome='';
    const hero=document.createElement('section');hero.dataset.seasonalHero='';
    const quick=document.createElement('div');quick.className='quick-action-card';
    const about=document.createElement('div');about.dataset.seasonalEnd='';
    const box=(left:number,top:number,right:number,bottom:number)=>({left,top,right,bottom,width:right-left,height:bottom-top} as DOMRect);
    hero.getBoundingClientRect=()=>box(0,100,800,350);
    quick.getBoundingClientRect=()=>box(20,430,300,550);
    about.getBoundingClientRect=()=>box(0,600,800,700);
    home.append(hero,quick,about);document.body.append(home);
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button'),lane=document.createElement('div');document.body.append(lane);
    const cleanup=startAutumnScene(canvas,pet,sprite,lane,{petEnabled:false});
    callback(100);
    const ctx=canvas.getContext('2d')!;
    expect(ctx.clearRect).not.toHaveBeenCalledWith(0,100,800,250);
    expect(ctx.clearRect).not.toHaveBeenCalledWith(20,430,280,120);
    expect(ctx.clearRect).toHaveBeenCalledWith(0,350,window.innerWidth,window.innerHeight);
    expect(ctx.clearRect).toHaveBeenCalledWith(0,0,window.innerWidth,100);
    const ys=(ctx.fillRect as jest.Mock).mock.calls.map(call=>call[1]);
    expect(ys.some(y=>y>330&&y<355)).toBe(true);
    expect(ys.some(y=>y>410&&y<430)).toBe(false);
    cleanup();
  });
  it('places the home mascot bottom-right inside the hero and hides it after scrolling past',()=>{
    const home=document.createElement('main');home.dataset.seasonalHome='';
    const hero=document.createElement('section');hero.dataset.seasonalHero='';
    let top=100;
    hero.getBoundingClientRect=()=>({left:0,right:800,top,bottom:top+400,width:800,height:400} as DOMRect);
    home.append(hero);document.body.append(home);
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button'),lane=document.createElement('div');document.body.append(lane);
    const cleanup=startAutumnScene(canvas,pet,sprite,lane);
    callback(100);
    expect(pet.style.transform).toBe('translate(688px,389px)');
    expect(pet.style.visibility).toBe('visible');
    expect(pet.style.clipPath).toBe('inset(-289.25px 0px 1.25px -688px)');
    top=-500;window.dispatchEvent(new Event('scroll'));callback(150);
    expect(pet.style.visibility).toBe('hidden');
    cleanup();
  });
  it('masks every marked card, including small cards beyond the old limit',()=>{
    const cards=Array.from({length:18},()=>{
      const card=document.createElement('div');card.dataset.seasonalSurface='';
      card.getBoundingClientRect=()=>({left:20,top:100,right:100,bottom:200,width:80,height:100} as DOMRect);
      document.body.append(card);return card;
    });
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button');
    const cleanup=startAutumnScene(canvas,pet,sprite,document.body,{petEnabled:false});
    callback(100);
    const clears=(canvas.getContext('2d')!.clearRect as jest.Mock).mock.calls.filter(args=>args.join(',')==='20,100,80,100');
    expect(clears).toHaveLength(cards.length);
    cleanup();
  });
  it('remeasures asynchronously inserted account cards before drawing',async()=>{
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button');
    const cleanup=startAutumnScene(canvas,pet,sprite,document.body,{petEnabled:false});
    callback(100);
    const card=document.createElement('div');card.dataset.seasonalSurface='';
    card.getBoundingClientRect=()=>({left:30,top:110,right:230,bottom:210,width:200,height:100} as DOMRect);
    document.body.append(card);await Promise.resolve();callback(150);
    expect(canvas.getContext('2d')!.clearRect).toHaveBeenCalledWith(30,110,200,100);
    cleanup();
  });
  it('starts with only floor leaves but still lets falling leaves rest on cards',()=>{
    jest.spyOn(Math,'random').mockReturnValue(.5);
    const card=document.createElement('div');card.dataset.seasonalSurface='';
    card.getBoundingClientRect=()=>({left:0,top:100,right:1000,bottom:200,width:1000,height:100} as DOMRect);
    document.body.append(card);
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button');
    const lane=document.createElement('div');
    lane.getBoundingClientRect=()=>({left:0,top:700,right:1024,bottom:768,width:1024,height:68} as DOMRect);
    const cleanup=startAutumnScene(canvas,pet,sprite,lane,{petEnabled:false,seedSurfaces:false});
    callback(100);
    const fill=canvas.getContext('2d')!.fillRect as jest.Mock;
    expect(fill.mock.calls.length).toBeGreaterThan(0);
    expect(fill.mock.calls.every(([,y])=>y>200)).toBe(true);
    let restingFrames=0;
    for(let i=1;i<=160;i++){
      fill.mockClear();callback(100+i*50);
      if(fill.mock.calls.some(([,y])=>y>=80&&y<=96))restingFrames++;
    }
    expect(restingFrames).toBeGreaterThan(20);
    cleanup();
  });
  it('masks text lines without masking paragraph padding',()=>{
    const canvas=document.createElement('canvas'),sprite=document.createElement('canvas'),pet=document.createElement('button'),p=document.createElement('p');
    p.textContent='Тестовая подпись';document.body.append(canvas,sprite,pet,p);
    p.getBoundingClientRect=()=>({left:20,top:100,right:320,bottom:400,width:300,height:300} as DOMRect);
    jest.spyOn(document,'createRange').mockReturnValue({selectNodeContents:jest.fn(),getClientRects:()=>[{left:20,top:100,right:140,bottom:118}]} as unknown as Range);
    const context=canvas.getContext('2d')!;
    const cleanup=startAutumnScene(canvas,pet,sprite);callback(100);
    expect(context.clearRect).toHaveBeenCalledWith(17,97,126,24);
    expect(context.clearRect).not.toHaveBeenCalledWith(17,97,306,306);
    cleanup();
  });
});
