import { clearPosition, clearSegment, escapeSegment, findStandingPlace, findGroundPlace, findRightShelterPath, findShelterPath, puddlePath, blowLeaves } from '@/components/seasonal/autumn-motion';

const bounds={left:0,right:800,top:0,bottom:600};
describe('autumn collision and wind',()=>{
  // Geometry must not depend on CPU contention with the production build.
  // Check the real search deadline separately with a controlled clock below.
  beforeEach(()=>{ jest.spyOn(performance,'now').mockReturnValue(1000); });
  afterEach(()=>{ jest.restoreAllMocks(); });
  it('abandons a costly route after the 6ms search budget',()=>{
    jest.mocked(performance.now).mockReturnValueOnce(1000).mockReturnValue(1007);
    expect(puddlePath({x:20,y:20},{x:500,y:20},[{left:250,top:0,right:310,bottom:320}],bounds)).toBeNull();
    expect(findShelterPath({x:20,y:20},[],bounds,()=>true,1006)).toBeNull();
  });
  it('flows out through a 16px side margin and rebuilds above full-width cards',()=>{
    const smallBounds={left:6,right:1194,top:80,bottom:748};
    const walls=[{left:16,right:1184,top:250,bottom:650},{left:16,right:1184,top:665,bottom:800}];
    const start={x:12,y:641.25};
    const path=findShelterPath(start,walls,smallBounds);
    expect(path).not.toBeNull();
    let previous=start;
    for(const point of path!){
      expect(clearSegment(previous,point,walls,smallBounds,true)||escapeSegment(previous,point,walls,smallBounds)).toBe(true);
      previous=point;
    }
    expect(clearPosition(previous,walls,smallBounds)).toBe(true);
    expect(previous.y+106.75).toBeLessThan(250);
  });
  it('escapes when a resized card already overlaps the flattened starting position',()=>{
    const start={x:100,y:400},walls=[{left:0,right:300,top:300,bottom:510}];
    expect(clearPosition(start,walls,bounds,true)).toBe(false);
    const path=findShelterPath(start,walls,bounds);
    expect(path).not.toBeNull();
    const goal=path![path!.length-1];
    expect(clearPosition(goal,walls,bounds)).toBe(true);
    expect(escapeSegment(start,goal,walls,bounds)).toBe(true);
    expect(goal).not.toEqual(start);
  });
  it('does not enter another obstacle while escaping an existing overlap',()=>{
    const start={x:100,y:400};
    expect(escapeSegment(start,{x:500,y:400},[{left:0,right:300,top:300,bottom:500},{left:350,right:400,top:0,bottom:600}],bounds)).toBe(false);
    expect(escapeSegment({x:290,y:400},{x:100,y:400},[{left:0,right:300,top:300,bottom:510}],bounds)).toBe(false);
  });
  it('continues searching when the pet fits but its speech bubble does not',()=>{
    const start={x:680,y:400};
    const path=findShelterPath(start,[],bounds,(p:{x:number;y:number})=>p.x<500);
    expect(path).not.toBeNull();
    expect(path![path!.length-1].x).toBeLessThan(500);
    expect(path![path!.length-1]).not.toEqual(start);
    let previous=start;
    for(const point of path!){expect(clearSegment(previous,point,[],bounds,true)).toBe(true);previous=point;}
  });
  it('prefers the bottom-right corner instead of staying at the same height',()=>{
    const path=findShelterPath({x:20,y:100},[],bounds);
    expect(path?.[path.length-1]).toEqual({x:694,y:493.25});
  });
  it('escapes upwards around a barrier to a reachable full-height shelter',()=>{
    const start={x:20,y:400},walls=[{left:0,top:395,right:200,bottom:470},{left:210,top:300,right:250,bottom:600}];
    const path=findShelterPath(start,walls,bounds);
    expect(path).not.toBeNull();
    let previous=start;
    for(const point of path!){expect(clearSegment(previous,point,walls,bounds,true)).toBe(true);previous=point;}
    expect(clearPosition(previous,walls,bounds)).toBe(true);
  });
  it('blows all visible leaves across the screen, including behind the pet',()=>{
    const leaves=[{x:10,y:20,rest:'platform',permanent:true},{x:1800,y:900,rest:'ground'},{x:900,y:2000,rest:'platform'}];
    expect(blowLeaves(leaves,{x:1000,y:800},1,{width:1920,height:1080})).toBe(2);
    expect(leaves[0]).toMatchObject({rest:null,permanent:false,windTime:2.8});
    expect(leaves[1]).toMatchObject({rest:null,windTime:2.8});
    expect(leaves[2].rest).toBe('platform');
    expect((leaves[0] as any).vx).toBeGreaterThan(1000);
  });
  it('moves right even when the starting card background is empty',()=>{
    const start={x:20,y:400};
    const path=findRightShelterPath(start,[],bounds);
    expect(path).toEqual([{x:694,y:400}]);
  });
  it('chooses a whole free space to the right of text without crossing it',()=>{
    const start={x:20,y:400},text=[{left:0,right:200,top:400,bottom:470}];
    const path=findRightShelterPath(start,text,bounds);
    expect(path).not.toBeNull();expect(path![0].x).toBeGreaterThan(190);
    expect(clearPosition(path![0],text,bounds)).toBe(true);
    expect(findRightShelterPath(start,[{left:150,right:200,top:0,bottom:600}],bounds)).toBeNull();
    expect(findRightShelterPath({x:690,y:400},[],bounds)).toBeNull();
  });
  it('only relocates horizontally along the support, never into a higher gap',()=>{
    const p=findGroundPlace({x:20,y:400},[{left:0,top:400,right:200,bottom:480}],bounds);
    expect(p).not.toBeNull();expect(p!.y).toBe(400);expect(p!.x).toBeGreaterThan(190);
    expect(findGroundPlace({x:20,y:400},[{left:0,top:400,right:800,bottom:600}],bounds)).toBeNull();
  });
  it('fits below an obstacle as a puddle but not upright',()=>{
    const p={x:20,y:100},obstacles=[{left:0,top:100,right:300,bottom:170}];
    expect(clearPosition(p,obstacles,bounds)).toBe(false);
    expect(clearPosition(p,obstacles,bounds,true)).toBe(true);
  });
  it('finds a standing place outside controls',()=>{
    const obstacles=[{left:0,top:400,right:300,bottom:600}],p=findStandingPlace({x:20,y:450},obstacles,bounds);
    expect(p).not.toBeNull();expect(clearPosition(p!,obstacles,bounds)).toBe(true);
  });
  it('routes around a card instead of crossing it',()=>{
    const start={x:20,y:20},end={x:500,y:20},obstacles=[{left:250,top:0,right:310,bottom:320}];
    const path=puddlePath(start,end,obstacles,bounds);expect(path).not.toBeNull();
    let previous=start;for(const point of path!){expect(clearSegment(previous,point,obstacles,bounds,true)).toBe(true);previous=point;}
    expect(previous).toEqual(end);
  });
  it('does not teleport across a full barrier',()=>{
    expect(puddlePath({x:20,y:20},{x:500,y:20},[{left:250,top:0,right:310,bottom:600}],bounds)).toBeNull();
  });
  it('gives nearby leaves velocity, including resting leaves, without deleting them',()=>{
    const leaves=[{x:150,y:110,rest:'platform',permanent:true},{x:20,y:110,rest:'ground',permanent:true}];
    expect(blowLeaves(leaves,{x:100,y:100},1)).toBe(1);
    expect(leaves[0]).toMatchObject({rest:null,permanent:false,windTime:2.8});
    expect((leaves[0] as any).vx).toBeGreaterThan(0);expect((leaves[0] as any).vy).toBeLessThan(0);
    expect(leaves[1].rest).toBe('ground');expect(leaves).toHaveLength(2);
  });
});
