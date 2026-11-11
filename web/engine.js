(function(root, make) {
  if (typeof module === "object") module.exports = make();
  else root.GE = make();
})(this, function() {
  "use strict";
  const S = 2.2, W = 19, H = 17, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  function rng(s) {
    const next = () => {
      s |= 0;
      s = s + 1831565813 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    next.getState = () => s >>> 0;
    next.setState = v => { s = v >>> 0; };
    return next;
  }
  function hash(s) {
    let h = 2166136261;
    for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  const dateKey = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const center = (x, y) => ({ x: (x + 0.5) * S, z: (y + 0.5) * S });
  const THEMES = [{ name: "THE WEST WING", color: 11970702, fog: 463122 }, { name: "THE LONG GALLERY", color: 11116454, fog: 1051922 }, { name: "THE CHAPEL", color: 10598836, fog: 660502 }, { name: "THE EAST WING", color: 12690840, fog: 1314573 }, { name: "THE ATTIC", color: 9939389, fog: 593945 }];
  const SKINS = [["wanderer", "Weathered brass", 0, 12162648], ["mint", "Verdigris", 120, 6326140], ["violet", "Midnight steel", 260, 5399939], ["rose", "Oxidised copper", 450, 10509382], ["frost", "Silver ash", 700, 11384251], ["gold", "Gilded survivor", 1100, 14924904]];
  const HAUNTS = [
    {id:"widow",name:"THE WIDOW",clue:"Her inhale warns of a rush. Turn your beam on her.",color:0xc1d0c8,echo:8.5,warp:17,spread:11},
    {id:"listener",name:"THE LISTENER",clue:"Running gives you away. Walk quietly and break her line of sight.",color:0xd5b89b,echo:8.5,warp:23,spread:12},
    {id:"drifter",name:"THE DRIFTER",clue:"She moves through the dark. Her map echoes fade faster.",color:0xa5b8e3,echo:5.5,warp:10,spread:7},
    {id:"watcher",name:"THE WATCHER",clue:"Watching freezes it. Back away while keeping it in view.",color:0xc7b4a4,echo:7,warp:99,spread:20},
    {id:"whisper",name:"THE WHISPER",clue:"Its voice drains your beam in sight. Break sight or repel it.",color:0xadbbdb,echo:6,warp:15,spread:9}
  ];
  const JOURNAL = [
    ["The invitation", "Mother's handwriting was on the envelope. Mother had been dead for eleven years. I came anyway."],
    ["A room for one", "The caretaker gave me a key and asked who I missed most. I thought he was being kind."],
    ["Behind the wallpaper", "There are names beneath the paper. Thousands of them, written over one another. Mine is still wet."],
    ["The first seal", "Three seals hold each door. They do not keep us in. Someone put them there to keep her out."],
    ["The borrowed voice", "She called from the gallery in my mother's voice. Then she forgot how my name ended."],
    ["Quiet feet", "One of them listens through the floorboards. I stopped running. For a moment, so did she."],
    ["The cold room", "The air froze before she arrived. I learned to trust the cold more than my eyes."],
    ["A faulty map", "I marked the place where I saw her. By the time the ink dried, she was breathing behind me."],
    ["The lantern", "Light makes her remember what she is. Hold it steady. Fear makes the hand shake."],
    ["Someone else's room", "Every door opens into another room I almost remember. The house is building itself out of us."],
    ["The keeper", "There was never a caretaker. Only a coat on a hook, and a voice that knew what I needed to hear."],
    ["The house remembers", "It cannot bring back the dead. It can only borrow their shape. I will not give it mine."]
  ];
  function challengeCode(seed) {
    const body = (seed >>> 0).toString(36).toUpperCase();
    return "GE50-" + body + "-" + (hash(body) % 1296).toString(36).toUpperCase().padStart(2,"0");
  }
  function parseChallenge(text) {
    const m = String(text).trim().toUpperCase().match(/^GE50-([0-9A-Z]{1,7})-([0-9A-Z]{2})$/);
    if (!m) return null;
    const seed = parseInt(m[1],36);
    return seed <= 0xffffffff && challengeCode(seed) === m[0] ? seed : null;
  }
  class House {
    constructor(seed, floor = 1) {
      this.seed = seed;
      this.floor = floor;
      this.haunt = HAUNTS[(floor - 1 + (seed >>> 4) % HAUNTS.length) % HAUNTS.length];
      this.random = rng(seed + floor * 7919);
      this.grid = Array(W * H).fill(0);
      this.layout=(floor-1+(seed>>>0)%5)%5;
      const plans=[[[1,10,7,5],[11,10,7,5],[11,1,7,5],[1,1,7,5]],[[1,11,5,5],[1,1,5,6],[8,1,4,6],[14,1,4,6],[9,10,9,6]],[[6,10,7,6],[1,3,4,9],[6,1,7,6],[14,3,4,9]],[[1,11,6,5],[1,1,6,7],[10,1,8,4],[10,8,4,8],[15,8,3,8]],[[1,10,5,6],[1,1,6,6],[9,1,9,4],[13,8,5,8],[7,9,4,7]]];
      const labels=[["THE ENTRANCE","DINING ROOM","PORTRAIT GALLERY","THE LIBRARY"],["ADMISSIONS","ISOLATION","OBSERVATION","OPERATING ROOM","THE WARD"],["VESTIBULE","WEST AISLE","THE ALTAR","EAST AISLE"],["THE LANDING","FORGOTTEN STORAGE","THE NURSERY","THE EAVES","THE LOCKED ROOM"],["BOILER ROOM","THE CISTERN","THE WORKSHOP","THE ARCHIVE","THE CELLAR"]];
      this.rooms=plans[this.layout].map(([x,y,w,h],i)=>({x,y,w:w-(w>5&&this.random()<.45?1:0),h:h-(h>5&&this.random()<.45?1:0),name:labels[this.layout][i]}));
      const carve=(x,y)=>{if(x>0&&y>0&&x<W-1&&y<H-1)this.grid[y*W+x]=1;};
      for(const r of this.rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)carve(x,y);
      const roomCell=r=>({x:r.x+1+Math.floor(this.random()*(r.w-2)),y:r.y+1+Math.floor(this.random()*(r.h-2))});
      const link=(a,b)=>{let q=roomCell(a),v=roomCell(b);const horizontal=()=>{while(q.x!==v.x){carve(q.x,q.y);q.x+=Math.sign(v.x-q.x);}carve(q.x,q.y);};const vertical=()=>{while(q.y!==v.y){carve(q.x,q.y);q.y+=Math.sign(v.y-q.y);}carve(q.x,q.y);};if(this.random()<.5){horizontal();vertical();}else{vertical();horizontal();}};
      this.rooms.forEach((r,i)=>link(r,this.rooms[(i+1)%this.rooms.length]));if(this.random()<.65)link(this.rooms[0],this.rooms[2]);
      this.props=[];this.hides=[];this.seals=[];this.cells=[];this.visited=Array(W*H).fill(false);
      const entry=this.rooms[0],ex=entry.x+Math.floor(entry.w/2),ey=entry.y+entry.h-1;
      this.spawn=center(ex,ey-1);this.exit={...center(ex,ey),z:(ey+.68)*S,type:"exit",id:"exit",wallZ:(ey+1)*S-.08};
      const occupied=[this.spawn,this.exit];
      const available=r=>{const cells=[];for(let y=r.y+1;y<r.y+r.h-1;y++)for(let x=r.x+1;x<r.x+r.w-1;x++){const q=center(x,y);if(this.walkable(x,y)&&occupied.every(o=>dist(o,q)>2.1))cells.push(q);}return cells;};
      const pick=r=>{const a=available(r);const q=a[Math.floor(this.random()*a.length)]||center(r.x+1,r.y+1);occupied.push(q);return q;};
      for(let i=0;i<this.rooms.length;i++){const r=this.rooms[i],wx=r.x,wy=r.y;this.grid[wy*W+wx]=2;this.props.push({type:"wardrobe",...center(wx,wy),room:i});const hide={type:"hide",id:"hide"+i,...center(wx,wy+1),z:(wy+.5)*S+1.4,cabinet:center(wx,wy)};this.hides.push(hide);occupied.push(hide);this.cells.push({id:"cell"+i,type:"cell",...pick(r),taken:false});if(i>0&&i<=3)this.seals.push({id:"seal"+i,type:"seal",...pick(r),taken:false,charge:1});}
      // Reject furniture placements that disconnect any walkable tile.
      for(let i=0;i<this.rooms.length;i++){const r=this.rooms[i];for(let n=0;n<3;n++){const spots=available(r);if(!spots.length)break;const q=spots[Math.floor(this.random()*spots.length)],c=this.cell(q.x,q.z),k=c.y*W+c.x;this.grid[k]=2;const open=[];for(let j=0;j<this.grid.length;j++)if(this.grid[j]===1)open.push(center(j%W,Math.floor(j/W)));if(open.some(v=>dist(v,this.spawn)>.1&&!this.path(this.spawn,v).length)){this.grid[k]=1;continue;}occupied.push(q);this.props.push({type:n===0?"shelf":this.layout===1?"bed":this.layout===2?"pew":this.layout===4?"pipes":n===1?"table":"sofa",...q,room:i,side:"east"});}}
      const challenges=[{id:"search",name:"THE FIRST THRESHOLD",rule:"Find three seals. Your beam buys time; it cannot kill."},{id:"fuse",name:"DEAD CIRCUIT",rule:"Find the red fuse box and restore power before taking seals."},{id:"ritual",name:"BOUND IN LIGHT",rule:"Hold your beam on each red seal until its ring turns gold."},{id:"glass",name:"WATCH YOUR STEP",rule:"Glass carries your footsteps. Walk around it to stay quiet."},{id:"blackout",name:"THE DYING LIGHT",rule:"The house goes dark in waves. Your flashlight still works."}];
      this.challenge=challenges[(floor-1)%5];this.seals.forEach(o=>o.charge=this.challenge.id==="ritual"?0:1);this.powerOn=this.challenge.id!=="fuse";
      this.fuse={id:"fuse",type:"fuse",...pick(this.rooms[this.rooms.length-1]),taken:this.powerOn};this.hazards=[];
      if(this.challenge.id==="glass"||floor>5)for(let i=1;i<this.rooms.length;i++)this.hazards.push({...pick(this.rooms[i]),cooldown:0});
      this.blackout=0;this.nextBlackout=16+this.random()*8;this.noise=0;this.cue="";this.cueUntil=0;
      this.player = { ...this.spawn, yaw: 0, pitch: 0 };
      this.ghost = { ...center(this.rooms[2].x+1,this.rooms[2].y+1), state: "dormant", fear: 0, banish: 0, alert: 0, path: [], repath: 0, target: {...this.spawn}, seenHide: false };
      this.time = 0;
      this.health = 3;
      this.energy = 100;
      this.stamina = 100;
      this.breath = 100;
      this.light = false;
      this.held = false;
      this.empty = false;
      this.hidden = null;
      this.hideTime = 0;
      this.invulnerable = 0;
      this.sealCount = 0;
      this.repels = 0;
      this.escapes = 0;
      this.steps = 0;
      this.dead = false;
      this.cleared = false;
      this.events = [];
      this.moving = 0;
      this.sprinting = false;
      this.grace=Math.max(7,17-floor);
      this.dread = 0;
      this.powerDip = 0;
      this.storm = 0;
      this.echo = null;
      this.nextStorm = 20 + this.random() * 18;
      this.nextCreak = 11 + this.random() * 10;
      Object.assign(this.ghost, { materialize: 0, phase: 0, windup: 0, burst: 0, nextBurst: 18, nextWarp: 28, lastSeen: 0, lastSighting: -99, wasVisible: false, memory: { ...this.spawn } });
      const places = [];
      for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) {
        const q=center(x,y);
        if(this.walkable(x,y) && this.path(this.spawn,q).length && [...this.seals,...this.cells,...this.hides,this.exit,this.fuse].every(o=>dist(o,q)>2.3)) places.push(q);
      }
      places.sort((a,b)=>dist(b,this.spawn)-dist(a,this.spawn));
      this.page={...places[(floor-1)%Math.min(12,places.length)],type:"page",id:"page",index:(floor-1)%JOURNAL.length,taken:false};
      this.reveal();
    }
    snapshot() {
      const data = {version:2,powerOn:this.powerOn,charges:this.seals.map(o=>o.charge),blackout:this.blackout,nextBlackout:this.nextBlackout,seed:this.seed,floor:this.floor,random:this.random.getState(),player:{...this.player},ghost:JSON.parse(JSON.stringify(this.ghost)),echo:this.echo&&{...this.echo},visited:[...this.visited],seals:this.seals.map(o=>o.taken),cells:this.cells.map(o=>o.taken),page:{index:this.page.index,taken:this.page.taken},hidden:this.hidden?.id||null};
      for(const k of ["time","health","energy","stamina","breath","hideTime","invulnerable","sealCount","repels","escapes","steps","grace","dread","powerDip","storm","nextStorm","nextCreak","dead","cleared","firstTraceShown"]) data[k]=this[k];
      return data;
    }
    static restore(data) {
      if(!data||data.version!==2||!Number.isInteger(data.seed)||data.seed<0||data.seed>0xffffffff||!Number.isInteger(data.floor)||data.floor<1||data.floor>1000000||data.dead) return null;
      const r=new House(data.seed,data.floor);
      const num=(v,a,b,f)=>Number.isFinite(v)?clamp(v,a,b):f;
      const point=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z)&&!r.solid(q.x,q.z,.18);
      if(!point(data.player)||!point(data.ghost))return null;
      r.player={x:data.player.x,z:data.player.z,yaw:num(data.player.yaw,-1e6,1e6,0),pitch:num(data.player.pitch,-.85,.85,0)};
      for(const k of ["time","hideTime","steps","nextStorm","nextCreak","grace"])r[k]=num(data[k],0,1e9,r[k]);
      for(const k of ["energy","stamina","breath"])r[k]=num(data[k],0,100,100);
      for(const k of ["repels","escapes"])r[k]=Math.floor(num(data[k],0,1e9,0));
      r.health=Math.floor(num(data.health,1,3,3));r.invulnerable=Math.max(2,num(data.invulnerable,0,4,0));
      for(const k of ["dread","powerDip","storm"])r[k]=num(data[k],0,4,0);
      r.seals.forEach((o,i)=>o.taken=data.seals?.[i]===true);r.cells.forEach((o,i)=>o.taken=data.cells?.[i]===true);
      r.powerOn=!!data.powerOn;r.fuse.taken=r.powerOn;r.blackout=num(data.blackout,0,10,0);r.nextBlackout=num(data.nextBlackout,0,1e9,r.time+20);r.seals.forEach((o,i)=>o.charge=num(data.charges?.[i],0,1,1));
      r.sealCount=r.seals.filter(o=>o.taken).length;r.cleared=!!data.cleared&&r.sealCount===3;
      r.page.index=Math.floor(num(data.page?.index,0,JOURNAL.length-1,0));r.page.taken=data.page?.taken===true;
      r.visited=r.visited.map((_,i)=>data.visited?.[i]===true);r.hidden=r.hides.find(o=>o.id===data.hidden)||null;
      const g=r.ghost, v=data.ghost;
      g.x=v.x;g.z=v.z;
      if(["dormant","banished","materializing","phasing","repelled","hunt","patrol"].includes(v.state))g.state=v.state;
      for(const k of ["fear","banish","alert","repath","materialize","phase","windup","burst","nextBurst","nextWarp","lastSeen","lastSighting"])g[k]=num(v[k],-100,1e9,g[k]);
      for(const k of ["seenHide","wasVisible"])g[k]=v[k]===true;
      for(const k of ["target","memory"])if(point(v[k]))g[k]={x:v[k].x,z:v[k].z};
      g.path=Array.isArray(v.path)?v.path.filter(point).slice(0,W*H).map(q=>({x:q.x,z:q.z})):[];
      const e=data.echo;if(e&&Number.isFinite(e.x)&&Number.isFinite(e.z)&&Number.isFinite(e.time))r.echo={x:clamp(e.x,0,W*S),z:clamp(e.z,0,H*S),time:clamp(e.time,0,r.time),type:e.type==="disturbance"?"disturbance":"sighting"};
      r.firstTraceShown=!!data.firstTraceShown;r.random.setState(data.random);r.hold(false);r.events=[];r.reveal();return r;
    }
    cell(x, z) {
      return { x: Math.floor(x / S), y: Math.floor(z / S) };
    }
    walkable(x, y) {
      return x >= 0 && y >= 0 && x < W && y < H && this.grid[y * W + x] === 1;
    }
    solid(x, z, r = 0.24) {
      for (const dx of [-r, r]) for (const dz of [-r, r]) {
        const c = this.cell(x + dx, z + dz);
        if (!this.walkable(c.x, c.y)) return true;
      }
      return false;
    }
    moveBody(body, dx, dz, r = 0.24) {
      if (!this.solid(body.x + dx, body.z, r)) body.x += dx;
      if (!this.solid(body.x, body.z + dz, r)) body.z += dz;
    }
    path(a, b) {
      const aa = this.cell(a.x, a.z), bb = this.cell(b.x, b.z), start = aa.y * W + aa.x, end = bb.y * W + bb.x;
      if (!this.walkable(aa.x, aa.y) || !this.walkable(bb.x, bb.y)) return [];
      const q = [start], prev = new Int16Array(W * H).fill(-1);
      prev[start] = start;
      for (let i = 0; i < q.length; i++) {
        const n2 = q[i];
        if (n2 === end) break;
        const x = n2 % W, y = Math.floor(n2 / W);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, k = ny * W + nx;
          if (this.walkable(nx, ny) && prev[k] === -1) {
            prev[k] = n2;
            q.push(k);
          }
        }
      }
      if (prev[end] === -1) return [];
      const out = [];
      let n = end;
      while (n !== start) {
        out.push(center(n % W, Math.floor(n / W)));
        n = prev[n];
      }
      return out.reverse();
    }
    line(a, b) {
      const d = dist(a, b);
      for (let s = 0.25; s < d; s += 0.25) {
        const t = s / d, c = this.cell(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
        if (!this.walkable(c.x, c.y)) return false;
      }
      return true;
    }
    look(dx, dy) {
      if (this.hidden) return;
      this.player.yaw -= dx;
      this.player.pitch = clamp(this.player.pitch - dy, -0.85, 0.85);
    }
    hold(on) {
      this.held = !!on;
      if (!on) {
        this.empty = false;
        this.light = false;
      } else if (this.energy < 8) {
        this.empty = true;
        this.events.push({ type: "empty" });
      }
    }
    focus() {
      if (this.hidden) return { type: "leave", name: "LEAVE HIDING PLACE", id: "leave" };
      let best = null, bestDist = Infinity;
      for (const o of [...(!this.fuse.taken?[this.fuse]:[]), ...(this.page&&!this.page.taken?[this.page]:[]), ...this.seals.filter((s) => !s.taken), ...this.cells.filter((s) => !s.taken), ...this.hides, this.exit]) {
        const d = dist(this.player, o);
        if (d > 2.25 || d >= bestDist) continue;
        const dir = { x: -Math.sin(this.player.yaw), z: -Math.cos(this.player.yaw) };
        const dot = ((o.x - this.player.x) * dir.x + (o.z - this.player.z) * dir.z) / Math.max(0.01, d);
        if (dot < 0.35 && d > 0.9) continue;
        if (!this.line(this.player, o)) continue;
        best = o;
        bestDist = d;
      }
      return best;
    }
    interact() {
      if (this.dead || this.cleared) return false;
      const o = this.focus();
      if (!o) {
        this.events.push({ type: "hint", text: "Move closer and look at a glowing object." });
        return false;
      }
      if(o.type==="fuse"){this.powerOn=true;o.taken=true;this.noise=1;this.ghost.alert=8;this.ghost.memory={...this.player};this.events.push({type:"power"});return true;}
      if (o.type === "page") {o.taken=true;this.events.push({type:"page",index:o.index});return true;}
      if (o.type === "seal") {
        if(!this.powerOn||o.charge<1){this.events.push({type:"hint",text:!this.powerOn?"Restore power at the red fuse box first.":"Hold BEAM on this seal to release its binding."});return false;}
        o.taken = true;
        this.sealCount++;
        this.energy = Math.min(100, this.energy + 18);
        this.ghost.alert = 10;
        this.ghost.memory = {x:this.player.x,z:this.player.z};
        this.powerDip = 2.1;
        this.ghost.nextWarp = Math.min(this.ghost.nextWarp, this.time + 5);
        this.events.push({ type: "seal", count: this.sealCount });
        return true;
      }
      if (o.type === "cell") {
        o.taken = true;
        this.energy = Math.min(100, this.energy + 45);
        this.events.push({ type: "cell" });
        return true;
      }
      if (o.type === "hide") {
        const g = this.ghost;
        g.seenHide = dist(g, this.player) < 6 && this.line(g, this.player) && g.state === "hunt";
        this.hidden = o;
        this.player.x = o.x;
        this.player.z = o.z;
        this.player.yaw = Math.PI;
        this.player.pitch = 0;
        this.hideTime = 0;
        this.hold(false);
        this.events.push({ type: "hide", seen: g.seenHide });
        return true;
      }
      if (o.type === "leave") {
        this.hidden = null;
        this.events.push({ type: "leave" });
        return true;
      }
      if (o.type === "exit") {
        if(this.training){this.events.push({type:"hint",text:"Finish or skip the survival lesson to begin an escape."});return false;}
        if (this.sealCount < 3) {
          this.events.push({ type: "hint", text: 3 - this.sealCount + " seals still bind this door." });
          return false;
        }
        this.cleared = true;
        this.light = false;
        this.held = false;
        this.events.push({ type: "escape" });
        return true;
      }
      return false;
    }
    objective() {
      if(this.trainingTarget)return this.trainingTarget;
      if(!this.powerOn)return this.fuse;
      const list = this.seals.filter((s) => !s.taken);
      if (!list.length) return this.exit;
      let best = list[0], len = Infinity;
      for (const s of list) {
        const p = this.path(this.player, s);
        if (p.length < len) {
          len = p.length;
          best = s;
        }
      }
      return best;
    }
    reveal() {
      const c = this.cell(this.player.x, this.player.z);
      for (let y = c.y - 3; y <= c.y + 3; y++) for (let x = c.x - 3; x <= c.x + 3; x++) if (x >= 0 && y >= 0 && x < W && y < H) this.visited[y * W + x] = true;
    }
    hit() {
      if (this.invulnerable > 0 || this.dead) return;
      this.health--;
      this.invulnerable = 3.5;
      this.energy = Math.min(100, this.energy + 20);
      this.hidden = null;
      this.ghost.banish = 3.5;
      this.ghost.state = "banished";
      this.ghost.materialize = 0;
      this.ghost.phase = 0;
      this.ghost.windup = 0;
      this.ghost.burst = 0;
      this.echo = null;
      this.events.push({ type: "hit" });
      if (this.health <= 0) {
        this.dead = true;
        this.light = false;
        this.held = false;
        this.events.push({ type: "death" });
      }
    }
    chaseSpeed() {
      return Math.min(4.65, 3.7 + (this.floor - 1) * 0.14 + this.sealCount * 0.12);
    }
    seenByPlayer() {
      const g = this.ghost, p = this.player, d = dist(g, p);
      return !["dormant", "banished", "phasing"].includes(g.state) && d < 17 && this.line(p, g) && (-Math.sin(p.yaw) * (g.x - p.x) + -Math.cos(p.yaw) * (g.z - p.z)) / Math.max(0.01, d) > 0.53 && Math.abs(p.pitch) < 0.7;
    }
    recordEcho(type = "sighting") {
      const g = this.ghost, jitter = type === "disturbance" ? 1.25 : 0;
      this.echo = { x: g.x + (this.random() - 0.5) * 2 * jitter, z: g.z + (this.random() - 0.5) * 2 * jitter, time: this.time, type };
      g.lastSighting = this.time;
    }
    mapEcho() {
      if (!this.echo) return null;
      const age = this.time - this.echo.time;
      if (age > this.haunt.echo) return null;
      return { ...this.echo, age, uncertainty: (this.echo.type === "disturbance" ? 3.3 : 1.1) + age * 0.65, opacity: Math.max(0, 1 - age / this.haunt.echo) };
    }
    manifest() {
      const p = this.player, g = this.ghost, candidates = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (!this.walkable(x, y)) continue;
        const q2 = center(x, y), d = dist(q2, p);
        if (d < 6.5 || d > 12.5) continue;
        const route = this.path(p, q2);
        if (!route.length || route.length * S > 22) continue;
        const dot = (-Math.sin(p.yaw) * (q2.x - p.x) + -Math.cos(p.yaw) * (q2.z - p.z)) / d;
        const hidden = !this.line(p, q2);
        if (!hidden && dot > 0.15) continue;
        if (this.hides.some((h) => dist(h, q2) < 1.4)) continue;
        candidates.push({ ...q2, weight: this.random() * 3 + (hidden ? 2 : 0) + (dot < -0.4 ? 2 : 0) - Math.abs(d - 8) * 0.15 });
      }
      candidates.sort((a, b) => b.weight - a.weight);
      const fallback=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const v=center(x,y);if(this.walkable(x,y)&&dist(v,p)>=6.5&&this.path(p,v).length)fallback.push(v);}
      const q=candidates[0]||fallback.sort((a,b)=>dist(b,p)-dist(a,p))[0];if(!q){g.banish=2;return;}
      Object.assign(g, { x: q.x, z: q.z, state: "materializing", materialize: 1.75, phase: 0, banish: 0, fear: 0, alert: this.haunt.id === "listener" ? 2 : 10, seenHide: false, path: [], repath: 0, windup: 0, burst: 0, nextBurst: this.time + 5 + this.random() * 4, nextWarp: this.time + this.haunt.warp + this.random() * this.haunt.spread, lastSeen: this.time, wasVisible: false, memory: { ...p } });
      this.powerDip = 1.8;
      this.recordEcho("disturbance");
      this.events.push({ type: "manifest", x: g.x, z: g.z });
    }
    banish() {
      const g = this.ghost;
      g.banish=Math.max(4.2,8-this.floor*.35)+this.random()*2;
      g.state = "banished";
      g.materialize = 0;
      g.phase = 0;
      g.windup = 0;
      g.burst = 0;
      this.echo = null;
      this.repels++;
      this.events.push({ type: "repel" });
    }
    stepHaunt(dt) {
      const p = this.player, g = this.ghost;
      if(this.training){if(this.trainingCombat&&this.light&&this.line(p,g)&&dist(p,g)<11&&(-Math.sin(p.yaw)*(g.x-p.x)-Math.cos(p.yaw)*(g.z-p.z))/Math.max(.01,dist(p,g))>.84){g.state="repelled";g.fear+=dt;if(g.fear>1.1&&!g.banish)this.banish();}else if(!this.trainingCombat)g.state="dormant";return;}
      this.powerDip = Math.max(0, this.powerDip - dt);
      this.storm = Math.max(0, this.storm - dt);
      if (this.time > this.nextStorm) {
        this.storm = 1.8;
        this.nextStorm = this.time + 24 + this.random() * 23;
        this.events.push({ type: "thunder" });
      }
      if (this.time > this.nextCreak) {
        this.nextCreak = this.time + 10 + this.random() * 13;
        this.events.push({ type: "creak", pan: this.random() * 2 - 1 });
        if (g.state === "hunt") this.powerDip = Math.max(this.powerDip, 1.3);
      }
      const near = 1 - clamp((dist(g, p) - 2) / 15, 0, 1), danger = ["hunt", "repelled", "materializing"].includes(g.state) ? near : near * 0.4;
      this.dread += (danger - this.dread) * Math.min(1, dt * 2.2);
      if (g.banish > 0) {
        g.banish = Math.max(0, g.banish - dt);
        g.state = "banished";
        if (g.banish === 0) this.manifest();
        return;
      }
      if (this.time < this.grace) {
        g.state = "dormant";
        return;
      }
      if (g.state === "dormant") {
        this.manifest();
        return;
      }
      if (g.phase > 0) {
        g.phase = Math.max(0, g.phase - dt);
        g.state = "phasing";
        if (g.phase === 0) this.manifest();
        return;
      }
      const distance = dist(g, p), los = this.line(g, p), facing = (-Math.sin(p.yaw) * (g.x - p.x) + -Math.cos(p.yaw) * (g.z - p.z)) / Math.max(1e-3, distance);
      const visible = this.seenByPlayer();
      if (visible) {
        g.lastSeen = this.time;
        if (!g.wasVisible || this.time - g.lastSighting > 5.5) this.recordEcho("sighting");
      }
      g.wasVisible = visible;
      const emerging = g.materialize > 0;
      g.materialize = Math.max(0, g.materialize - dt);
      const lit = this.light && distance < 11 && los && facing > 0.84 && Math.abs(p.pitch) < 0.6;
      if (lit) {
        g.state = "repelled";
        g.fear += dt;
        g.alert = 9;
        g.windup = 0;
        g.burst = 0;
        if (!emerging && distance > 0.01) this.moveBody(g, (g.x - p.x) / distance * 1.7 * dt, (g.z - p.z) / distance * 1.7 * dt, 0.2);
        if (g.fear > 1.1) this.banish();
        return;
      }
      g.fear = Math.max(0, g.fear - dt * 0.75);
      if (emerging) {
        g.state = "materializing";
        return;
      }
      if (!this.hidden && (los && distance < (this.haunt.id === "listener" ? (this.light ? 15 : 5) : (this.light ? 19 : 15)) || this.sprinting && distance < (this.haunt.id === "listener" ? 26 : 18))) {
        if(g.alert<=0){this.events.push({type:"detected"});this.signal(this.sprinting?"IT HEARD YOU RUN":"IT SAW YOU",2);}
        g.alert=this.haunt.id==="listener"?6:8;
        g.memory = { x: p.x, z: p.z };
      } else g.alert = Math.max(0, g.alert - dt);
      if (this.hidden && !g.seenHide) g.alert = Math.max(0, g.alert - dt * 4);
      g.state = g.alert > 0 ? "hunt" : "patrol";
      if (["drifter","whisper"].includes(this.haunt.id) && !this.hidden && g.windup <= 0 && g.burst <= 0 && this.time > g.nextWarp && (distance > 14 || this.time - g.lastSeen > (this.haunt.id === "drifter" ? 3.5 : 5) && distance > 5.8)) {
        g.phase = 0.85;
        g.state = "phasing";
        this.powerDip = 2.4;
        this.echo = null;
        this.events.push({ type: "vanish" });
        return;
      }
      if (this.haunt.id==="widow" && g.state === "hunt" && !this.hidden && los && distance > 3.8 && distance < 8.5 && g.windup <= 0 && g.burst <= 0 && this.time > g.nextBurst) {
        g.windup = 0.85;
        g.nextBurst = this.time + 10 + this.random() * 4;
        this.events.push({ type: "rush", x: g.x, z: g.z });
      }
      let speed = g.state === "hunt" ? this.chaseSpeed() : 2.25;
      if (g.windup > 0) {
        g.windup = Math.max(0, g.windup - dt);
        speed = 0.4;
        if (g.windup === 0) g.burst = 0.7;
      } else if (g.burst > 0) {
        g.burst = Math.max(0, g.burst - dt);
        speed = 5.7;
      }
      if(this.haunt.id==="watcher"&&visible&&!this.hidden){speed=0;this.signal("IT STOPS WHEN YOU WATCH",1);}
      if(this.haunt.id==="watcher"&&!visible)speed*=1.12;
      if(this.haunt.id==="whisper"&&distance<10&&los&&!this.hidden){this.energy=Math.max(0,this.energy-dt*14);if(this.energy===0&&this.held&&!this.empty){this.empty=true;this.events.push({type:"empty"});}this.signal("THE WHISPER DRAINS YOUR LIGHT · BREAK SIGHT",1);}
      let target;
      if (g.state === "hunt") target=g.memory;
      else {
        target = g.target;
        if (dist(g, target) < 0.8) {
          const choices = this.cells.filter(v=>dist(v,g)>6);
          g.target = choices[Math.floor(this.random() * choices.length)] || this.spawn;
          target = g.target;
        }
      }
      g.repath -= dt;
      if (g.repath <= 0 || !g.path.length) {
        g.path = this.path(g, target);
        g.repath = g.state === "hunt" ? 0.25 : 0.5;
      }
      const next = g.path[0] || (g.state === "hunt" && los ? target : null);
      if (next) {
        const d = dist(g, next), v = speed * dt;
        if (d < v) {
          g.x = next.x;
          g.z = next.z;
          g.path.shift();
        } else if (d > 1e-3) this.moveBody(g, (next.x - g.x) / d * v, (next.z - g.z) / d * v, 0.18);
      }
      if (!this.hidden && dist(g, p) < 0.9) this.hit();
    }
    signal(text,duration=2){this.cue=text;this.cueUntil=this.time+duration;}
    step(dt, input = {}) {
      if (this.dead || this.cleared) return;
      dt = clamp(dt, 0, 0.05);
      this.time += dt;
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      const p = this.player, g = this.ghost;
      this.light = this.held && !this.empty && this.energy > 0 && !this.hidden;
      this.energy = clamp(this.energy + (this.light ? -17 : this.hidden ? 10 : 5.5) * dt, 0, 100);
      if (this.light && this.energy === 0) {
        this.light = false;
        this.empty = true;
        this.events.push({ type: "empty" });
      }
      let mx = +input.x || 0, mz = +input.z || 0;
      const l = Math.hypot(mx, mz);
      if (l > 1) {
        mx /= l;
        mz /= l;
      }
      this.moving = this.hidden ? 0 : Math.min(1, l);
      this.sprinting = !!input.sprint && this.stamina > 3 && !this.hidden && l > 0.1;
      const speed = this.sprinting ? 5.2 : 3.35;
      this.stamina = clamp(this.stamina + (this.sprinting ? -25 : 16) * dt, 0, 100);
      if (!this.hidden) {
        const dx = (Math.cos(p.yaw) * mx + Math.sin(p.yaw) * mz) * speed * dt, dz = (-Math.sin(p.yaw) * mx + Math.cos(p.yaw) * mz) * speed * dt;
        this.moveBody(p, dx, dz);
        this.steps += Math.hypot(dx, dz);
        this.breath = Math.min(100, this.breath + 25 * dt);
      } else {
        this.hideTime += dt;
        this.breath = Math.max(0, this.breath - 13 * dt);
        if (g.seenHide && this.hideTime > 2 && dist(g, p) < 3) this.hit();
        if (this.breath === 0) {
          this.hidden = null;
          this.events.push({ type: "breath" });
        }
      }
      this.noise=Math.max(0,this.noise-dt*.65);if(this.sprinting)this.noise=Math.max(this.noise,.7);
      this.blackout=Math.max(0,this.blackout-dt);
      if(this.challenge.id==="blackout"&&this.time>this.nextBlackout&&!this.training){this.blackout=4;this.nextBlackout=this.time+16+this.random()*15;this.events.push({type:"blackout"});this.signal("POWER FAILING · KEEP YOUR LIGHT READY",3);}
      for(const h of this.hazards){h.cooldown=Math.max(0,h.cooldown-dt);if(this.moving>.1&&dist(p,h)<.85&&h.cooldown===0){h.cooldown=2;this.noise=1;g.alert=9;g.memory={...p};this.signal("GLASS · IT HEARD YOU",3);this.events.push({type:"glass"});}}
      if(this.light&&this.powerOn)for(const o of this.seals){const d=dist(p,o);if(!o.taken&&o.charge<1&&d<7&&this.line(p,o)&&(-Math.sin(p.yaw)*(o.x-p.x)-Math.cos(p.yaw)*(o.z-p.z))/Math.max(.01,d)>.9){o.charge=Math.min(1,o.charge+dt/1.8);this.signal("UNBINDING SEAL · "+Math.round(o.charge*100)+"%",.3);if(o.charge===1)this.events.push({type:"unbound"});}}
      this.reveal();this.stepHaunt(dt);
    }
  }
  function defaults() {
    return { version: 5, guided:false, checkpoint:null, journal:[], journalReward:false, hauntTips: false, coins: 0, bestFloors: 0, totalSeals: 0, totalRepels: 0, totalEscapes: 0, runs: 0, skin: "wanderer", owned: ["wanderer"], tutorial: false, claims: [0, 0, 0], settings: { sound: true, music: true, haptics: true, reduceMotion: false, softEffects: false, lowDetail:false, guide: true, sensitivity: 1.25, controlSize: 1, autoSprint:false, volume: .85 }, daily: { date: "", best: 0, reward: false } };
  }
  function normalize(v) {
    const d = defaults();
    if (!v || typeof v !== "object") return d;
    for (const k of ["coins", "bestFloors", "totalSeals", "totalRepels", "totalEscapes", "runs"]) d[k] = Math.max(0, Number.isFinite(+v[k]) ? +v[k] : 0);
    d.owned = SKINS.filter((s) => s[0] === "wanderer" || Array.isArray(v.owned) && v.owned.includes(s[0])).map((s) => s[0]);
    d.skin = d.owned.includes(v.skin) ? v.skin : "wanderer";
    for (const k in d.settings) if (typeof v.settings?.[k] === typeof d.settings[k]) d.settings[k] = v.settings[k];
    d.settings.sensitivity = clamp(d.settings.sensitivity, 0.5, 2);
    d.tutorial = !!v.tutorial;
    d.hauntTips=!!v.hauntTips;d.guided=!!v.guided;d.settings.controlSize=clamp(d.settings.controlSize,.85,1.3);d.settings.volume=clamp(d.settings.volume,0,1);
    if (Array.isArray(v.claims) && v.claims.length === 3) d.claims = v.claims.map((n) => Math.max(0, Math.floor(+n) || 0));
    if (v.daily && typeof v.daily.date === "string") d.daily = { date: v.daily.date, best: Math.max(0, +v.daily.best || 0), reward: !!v.daily.reward };
    d.journal=Array.isArray(v.journal)?[...new Set(v.journal.filter(n=>Number.isInteger(n)&&n>=0&&n<JOURNAL.length))]:[];
    d.journalReward=!!v.journalReward;
    const cp=v.checkpoint;
    if(cp&&cp.version===1&&House.restore(cp.house)) {
      const n=k=>Number.isFinite(cp[k])?Math.max(0,Math.floor(cp[k])):0;
      d.checkpoint={version:1,kind:["endless","daily","challenge"].includes(cp.kind)?cp.kind:"endless",house:House.restore(cp.house).snapshot(),escaped:n("escaped"),totalRunSeals:n("totalRunSeals"),totalRunRepels:n("totalRunRepels"),bankedSeals:n("bankedSeals"),bankedRepels:n("bankedRepels"),floorReward:!!cp.floorReward};
    }
    return d;
  }
  return { ENVIRONMENTS:["ASHWOOD MANOR","SAINT MERCY WARD","THE CHAPEL","THE FORGOTTEN ATTIC","THE FLOODED CELLAR"], House, S, W, H, THEMES, SKINS, HAUNTS, JOURNAL, challengeCode, parseChallenge, rng, hash, dateKey, dist, center, defaults, normalize };
});
