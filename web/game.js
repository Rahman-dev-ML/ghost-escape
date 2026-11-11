(async () => {
  "use strict";
  const $ = (s) => document.querySelector(s), KEY = "ghost-escape-house-v4";
  let save;
  try {
    let v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!v) {
      const old = JSON.parse(localStorage.getItem("ghost-escape-house-v3") || localStorage.getItem("ghost-escape-v2") || "null");
      if (old) v = { coins: old.coins, skin: old.skin, owned: old.owned, settings: old.settings };
    }
    save = GE.normalize(v);
  } catch {
    save = GE.defaults();
  }
  save.claims = save.claims || [0, 0, 0];
  const persist = () => {
    try {
      syncCheckpoint();
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
    }
  };
  const audio = new HouseAudio();
  audio.settings = save.settings;
  let scene, run, mode = "home", modal = "", tutorial = false, kind = "endless", seed = 1, escaped = 0, totalRunSeals = 0, totalRunRepels = 0, bankedSeals = 0, bankedRepels = 0, finished = false, floorReward = false, damageFade = 0, toastUntil = 0, bannerUntil = 0, guideUntil = 0, lastMap = 0, lookPointer = null, movePointer = null, beamPointer = null, joy = { x: 0, z: 0 }, keys = /* @__PURE__ */ new Set(), runHeld = false, lightHeld = false, inputPaused = false;
  let lesson=-1,lessonYaw=0,lessonSteps=0,pendingKind="endless",pendingSeed=null,joyOrigin=null,lastHud=0;
  let lastFrame = performance.now(), lastAutosave=0;
  function syncCheckpoint() {
    if(!run||mode==="home"||run.training)return;
    if(run.dead||mode==="dead"){save.checkpoint=null;return;}
    save.checkpoint={version:1,kind,house:run.snapshot(),escaped,totalRunSeals,totalRunRepels,bankedSeals,bankedRepels,floorReward};
  }
  function assignMemory(){run.page.index=GE.JOURNAL.findIndex((_,i)=>!save.journal.includes(i));if(run.page.index<0){run.page.index=0;run.page.taken=true;}}
  function continueEscape(){
    const cp=save.checkpoint, restored=cp&&GE.House.restore(cp.house);
    if(!restored){save.checkpoint=null;refreshHome();return start();}
    kind=cp.kind;seed=restored.seed;loadFloor(restored.floor);run=restored;
    escaped=cp.escaped;totalRunSeals=cp.totalRunSeals;totalRunRepels=cp.totalRunRepels;
    bankedSeals=cp.bankedSeals;bankedRepels=cp.bankedRepels;floorReward=cp.floorReward;
    scene.build(run);tutorial=false;persist();
    if(run.cleared)complete();else banner("YOUR ESCAPE CONTINUES",run.haunt.name+" · "+run.haunt.clue);
  }
  function cashout(){save.checkpoint=null;mode="home";persist();home();}
  function shareChallenge(){
    const code=GE.challengeCode(seed);
    show("challenge","Can they get further?",`<p>The same house. The same hunting order. See who escapes more floors.</p><input id="shareCode" class="challengeCode" value="${code}" readonly aria-label="Challenge code"><p>${escaped} floors escaped · ${totalRunSeals} seals recovered</p><button id="copyChallenge" class="primary">COPY CHALLENGE CODE</button><p>Enter this code in Objectives on another device running version 5.0. Scores stay on each device.</p>`);
    $("#copyChallenge").onclick=async()=>{try{await navigator.clipboard.writeText(code);toast("CHALLENGE CODE COPIED");}catch{$("#shareCode").focus();$("#shareCode").select();toast("SELECTED · COPY THIS CODE");}};
  }
  function persistStats(write = true) {
    if (!run || mode === "home" || run.training) return;
    const s = run.sealCount - bankedSeals, r = run.repels - bankedRepels;
    save.totalSeals += Math.max(0, s);
    save.totalRepels += Math.max(0, r);
    save.coins += Math.max(0, s) * 8;
    totalRunSeals += Math.max(0, s);
    totalRunRepels += Math.max(0, r);
    bankedSeals = run.sealCount;
    bankedRepels = run.repels;
    if(write)persist();
  }
  function resetInput() {
    keys.clear();
    joy = { x: 0, z: 0 };
    runHeld = false;
    lightHeld = false;
    lookPointer = movePointer = beamPointer = null;
    $("#moveKnob").style.transform = "";
    $("#movePad").classList.remove("engaged");
    run?.hold(false);
    if (document.pointerLockElement) document.exitPointerLock?.();
  }
  function toast(text) {
    $("#toast").textContent = text;
    $("#toast").style.opacity = 1;
    toastUntil = performance.now() + 2800;
  }
  function banner(title, sub) {
    $("#banner b").textContent = title;
    $("#banner span").textContent = sub;
    $("#banner").style.opacity = 1;
    bannerUntil = performance.now() + 3500;
  }
  function refreshHome() {
    const cp=save.checkpoint;
    $("#play").innerHTML=cp?"CONTINUE ESCAPE <b>→</b>":"ENTER THE HOUSE <b>→</b>";
    $("#newEscape").hidden=!cp;
    $("#newEscape").textContent=cp?"START NEW ESCAPE · SAVED FLOOR "+cp.house.floor:"START NEW ESCAPE";
    $("#wallet").textContent = save.coins + " REMNANTS";
    $("#best").textContent = save.bestFloors ? "LONGEST ESCAPE \xB7 " + save.bestFloors + " FLOORS" : "THE DOOR IS SEALED. FIND WHAT BINDS IT.";
  }
  function show(name, title, html) {
    modal = name;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modal").hidden = false;
    $("#close").hidden = false;
    resetInput();
  }
  function close() {
    modal = "";
    $("#modal").hidden = true;
    $("#close").hidden = false;
  }
  function home() {
    persistStats();
    mode = "home";
    finished = false;
    tutorial=false;lesson=-1;$("#coach").hidden=true;
    close();
    $("#mapOverlay").hidden = true;
    $("#home").hidden = false;
    $("#hud").hidden = true;
    $("#hiding").hidden = true;
    document.body.classList.remove("playing", "hiding");
    audio.active = false;
    resetInput();
    run = new GE.House(811, 1);
    scene.build(run);
    refreshHome();
  }
  function start(k = "endless", challengeSeed = null) {
    persistStats();
    kind = k;
    save.checkpoint=null;
    seed = k === "daily" ? GE.hash(GE.dateKey()) : k === "challenge" && challengeSeed!==null ? challengeSeed : crypto.getRandomValues(new Uint32Array(1))[0];
    escaped = 0;
    totalRunSeals = 0;
    totalRunRepels = 0;
    if(save.guided)save.runs++;
    loadFloor(1);
    if(!save.guided){pendingKind=k;pendingSeed=challengeSeed;beginLesson();}
    persist();
  }
  function beginLesson(){lesson=0;tutorial=false;close();mode="play";run.training=true;save.checkpoint=null;persist();run.grace=1e9;run.energy=65;run.trainingTarget=null;lessonYaw=run.player.yaw;lessonSteps=run.steps;$("#coach").hidden=false;banner("BEFORE THE HOUSE WAKES","Learn the controls here. You are safe.");}
  function endLesson(){save.guided=true;save.tutorial=true;save.hauntTips=true;lesson=-1;$("#coach").hidden=true;run.training=false;mode="home";save.checkpoint=null;persist();start(pendingKind,pendingSeed);}
  function teach(){
    if(lesson<0||!run.training)return;
    const nearest=list=>[...list].sort((a,b)=>GE.dist(a,run.player)-GE.dist(b,run.player))[0];let text="",target=null;
    if(lesson===0){text="DRAG THE RIGHT SIDE TO LOOK · Turn until you can see beside you.";if(Math.abs(run.player.yaw-lessonYaw)>.65)lesson++;}
    else if(lesson===1){text="MOVE WITH THE LEFT PAD · Drag in any direction. Push farther to move faster.";if(run.steps-lessonSteps>3)lesson++;}
    else if(lesson===2){target=nearest(run.cells.filter(o=>!o.taken));text="PICK UP LIGHT · Follow the guide to a blue flask. Approach and tap TAKE LIGHT.";if(run.cells.some(o=>o.taken))lesson++;}
    else if(lesson===3){target=nearest(run.seals.filter(o=>!o.taken));text="TAKE A SEAL · Follow the guide. Get close and tap TAKE SEAL.";if(run.sealCount>0)lesson++;}
    else if(lesson===4){target=nearest(run.hides);text="HIDE · Follow the guide to a wardrobe, then tap HIDE. Never hide while it can see you.";if(run.hidden)lesson++;}
    else if(lesson===5){text="LEAVE COVER · The breath bar is your time limit. Tap LEAVE COVER now.";if(!run.hidden){lesson++;run.trainingCombat=true;const spots=[];for(let y=1;y<GE.H-1;y++)for(let x=1;x<GE.W-1;x++){const q=GE.center(x,y),d=GE.dist(run.player,q);if(run.walkable(x,y)&&d>3&&d<7&&run.line(run.player,q))spots.push(q);}const q=spots[0]||run.spawn;Object.assign(run.ghost,{...q,state:"hunt",materialize:0,fear:0,banish:0});run.player.yaw=Math.atan2(-(q.x-run.player.x),-(q.z-run.player.z));run.player.pitch=0;run.energy=100;audio.event("manifest",run);}}
    else if(lesson===6){target=run.ghost;text="REPEL · Aim at the ghost and HOLD BEAM. Drag BEAM to aim too. This practice ghost cannot hurt you.";if(run.repels>0){lesson++;audio.event("cell",run);}}
    else{text="READY · Find 3 seals, use the exit, survive the next house. Three hits end your escape.";$("#lessonDone").hidden=false;}
    run.trainingTarget=target;$("#coachStep").textContent="SURVIVAL LESSON "+Math.min(8,lesson+1)+" / 8";$("#coachText").textContent=text;
  }
  $("#skipLesson").onclick=endLesson;$("#lessonDone").onclick=endLesson;
  function loadFloor(n) {
    lesson=-1;$("#coach").hidden=true;$("#lessonDone").hidden=true;
    const health = run && n > 1 ? Math.min(3, run.health + 1) : 3;
    run = new GE.House(seed, n);
    assignMemory();
    run.health = health;
    bankedSeals = bankedRepels = 0;
    finished = false;
    floorReward = false;
    mode = "play";
    close();
    resetInput();
    $("#home").hidden = true;
    $("#hud").hidden = false;
    $("#hiding").hidden = true;
    document.body.classList.add("playing");
    document.body.classList.remove("hiding");
    $("#hurt").style.opacity = 0;
    scene.build(run);
    audio.unlock();
    audio.active = true;
    guideUntil = performance.now() + 12e3;
    banner(GE.ENVIRONMENTS[run.layout]+" · "+run.haunt.name,run.haunt.clue);toast(run.challenge.rule);
    persist();
  }
  function acknowledge() {
    tutorial = false;
    save.tutorial = true;
    save.hauntTips = true;
    persist();
    close();
    audio.unlock();
    audio.active = true;
    run.grace = run.time + 10;
    guideUntil = performance.now() + 14e3;
  }
  function pause() {
    if (mode !== "play" || tutorial) return;
    resetInput();
    persistStats();
    mode = "pause";
    audio.active = false;
    showPause();
  }
  function showPause() {
    show("pause", "The house can wait.", `<p>Floor ${run.floor} \xB7 ${run.sealCount} of 3 seals recovered</p><button id="resume" class="primary">RETURN TO THE HOUSE <b>\u2192</b></button><button class="secondary" data-open="settings">SETTINGS</button><button class="secondary" data-open="how">CONTROLS</button><button class="secondary" data-open="journal">THE JOURNAL</button><button id="shareChallenge" class="secondary">CHALLENGE A FRIEND</button><button id="leave" class="secondary">SAVE & RETURN TO ENTRANCE</button>`);
    $("#resume").onclick = resume;
    $("#leave").onclick = home;
    $("#shareChallenge").onclick=shareChallenge;
  }
  function resume() {
    close();
    $("#mapOverlay").hidden = true;
    mode = "play";
    resetInput();
    audio.unlock();
    audio.active = true;
  }
  function complete() {
    if (!floorReward) {
      floorReward = true;
      persistStats(false);
      escaped++;
      save.totalEscapes++;
      save.bestFloors = Math.max(save.bestFloors, escaped);
      save.coins += 40;
      if (kind === "daily" && seed === GE.hash(GE.dateKey())) {
        const day = GE.dateKey();
        if (save.daily.date !== day) save.daily = { date: day, best: 0, reward: false };
        save.daily.best = Math.max(save.daily.best, escaped);
        if (!save.daily.reward) {
          save.coins += 60;
          save.daily.reward = true;
          toast("DAILY ESCAPE \xB7 +60 REMNANTS");
        }
      }
      persist();
    }
    mode = "cleared";
    resetInput();
    audio.active = false;
    show("cleared", "The door opens.", `<p class="score">${escaped}<small> FLOOR${escaped === 1 ? "" : "S"} ESCAPED</small></p><p>Beyond this door: <strong>${GE.HAUNTS[(run.floor+(seed>>>4)%GE.HAUNTS.length)%GE.HAUNTS.length].name}</strong>. ${GE.HAUNTS[(run.floor+(seed>>>4)%GE.HAUNTS.length)%GE.HAUNTS.length].clue}</p><p class="reward">+40 remnants \xB7 Light restored \xB7 +1 health</p><button id="next" class="primary">GO DEEPER <b>\u2192</b></button><button id="shareChallenge" class="secondary">CHALLENGE A FRIEND</button><button id="cashout" class="secondary">END ESCAPE & RETURN</button>`);
    $("#close").hidden = true;
    $("#next").onclick = () => loadFloor(run.floor + 1);
    $("#cashout").onclick = cashout;
    $("#shareChallenge").onclick=shareChallenge;
  }
  function finish() {
    if (!finished) {
      finished = true;
      persistStats();
    }
    mode = "dead";
    save.checkpoint=null;persist();
    setTimeout(()=>{if(mode==="dead")audio.active=false;},950);
    resetInput();
    show("results", "The house kept you.", `<p>The ghost broke your health. It moves faster than your walk. Sprint for space, then turn your beam on it. A sharp inhale warns of a rush.</p><div class="stats"><div>${escaped}<small>FLOORS ESCAPED</small></div><div>${totalRunSeals}<small>SEALS RECOVERED</small></div><div>${totalRunRepels}<small>GHOST REPELLED</small></div></div><button id="retry" class="primary">TRY ANOTHER ESCAPE <b>\u2192</b></button><button class="secondary" data-open="objectives">OBJECTIVES</button><button id="shareChallenge" class="secondary">CHALLENGE A FRIEND</button><button id="tohome" class="secondary">BACK TO ENTRANCE</button>`);
    $("#close").hidden = true;
    $("#retry").onclick = () => start(kind,seed);
    $("#shareChallenge").onclick=shareChallenge;
    $("#tohome").onclick = home;
  }
  const objectiveDefs = [["totalSeals", 6, "Recover 6 seals", 60], ["totalRepels", 5, "Repel the ghost 5 times", 50], ["totalEscapes", 3, "Escape 3 floors", 100]];
  function open(name) {
    if (mode === "play") pause();
    const row = (a, b) => `<div class="row">${a}${b}</div>`;
    if (name === "settings") {
      show(name, "Your senses. Your rules.", ["sound", "music", "haptics", "reduceMotion", "softEffects", "lowDetail", "guide", "autoSprint"].map((k) => row(`<span>${{ sound: "Sound effects", music: "Adaptive horror music", haptics: "Vibration", reduceMotion: "Reduced camera movement", softEffects: "Gentle light effects", lowDetail:"Lower graphics detail", autoSprint:"Sprint at full joystick tilt (noisy)", guide: "Guiding floor lights" }[k]}</span>`, `<button data-setting="${k}">${save.settings[k] ? "ON" : "OFF"}</button>`)).join("") + row("<span>Look sensitivity</span>", `<button id="sensitivity">${save.settings.sensitivity.toFixed(1)}\xD7</button>`) + row("<span>Control size</span>",`<button id="controlSize">${Math.round(save.settings.controlSize*100)}%</button>`)+row("<span>Sound volume</span>",`<input id="volume" aria-label="Sound volume" type="range" min="0" max="100" value="${save.settings.volume*100}">`)+`<button id="soundCheck" class="secondary">PLAY SOUND CHECK</button>` + `<button data-open="privacy" class="secondary">PRIVACY</button>`);
      document.querySelectorAll("[data-setting]").forEach((b) => b.onclick = () => {
        const k = b.dataset.setting;
        save.settings[k] = !save.settings[k];
        b.textContent = save.settings[k] ? "ON" : "OFF";
        audio.applySettings();
        persist();
      });
      $("#controlSize").onclick=()=>{save.settings.controlSize=save.settings.controlSize>=1.25?.85:Math.round((save.settings.controlSize+.15)*100)/100;$("#controlSize").textContent=Math.round(save.settings.controlSize*100)+"%";applyControls();persist();};
      $("#volume").oninput=e=>{save.settings.volume=+e.target.value/100;audio.applySettings();persist();};
      $("#soundCheck").onclick=()=>{audio.unlock();audio.active=true;audio.event("manifest",run);toast(save.settings.sound?"BREATH + FOOTSTEPS · ADJUST YOUR DEVICE VOLUME":"SOUND EFFECTS ARE OFF");setTimeout(()=>{if(mode!=="play")audio.active=false;},2500);};
      $("#sensitivity").onclick = () => {
        save.settings.sensitivity = save.settings.sensitivity >= 2 ? 0.5 : save.settings.sensitivity + 0.25;
        $("#sensitivity").textContent = save.settings.sensitivity.toFixed(2) + "\xD7";
        persist();
      };
    }
    if (name === "collection") {
      show(name, "Objects of the lost.", `<p>${save.coins} remnants. Your flashlight finish changes its brass details. Every finish is cosmetic.</p>` + GE.SKINS.map(([id, n, c, color]) => row(`<span><i class="swatch" style="background:#${color.toString(16).padStart(6, "0")}"></i>${n}</span>`, `<button data-skin="${id}" ${save.skin === id ? "disabled" : ""}>${save.skin === id ? "EQUIPPED" : save.owned.includes(id) ? "EQUIP" : c + " \u25C7"}</button>`)).join(""));
      document.querySelectorAll("[data-skin]").forEach((b) => b.onclick = () => {
        const s = GE.SKINS.find((v) => v[0] === b.dataset.skin);
        if (!save.owned.includes(s[0])) {
          if (save.coins < s[2]) return toast("Recover seals and escape floors to earn remnants.");
          save.coins -= s[2];
          save.owned.push(s[0]);
        }
        save.skin = s[0];
        persist();
        refreshHome();
        open("collection");
      });
    }
    if (name === "objectives") {
      persistStats();
      show(name, "Something worth escaping for.", objectiveDefs.map(([key, goal, label, reward], i) => {
        const progress = Math.max(0, save[key] - save.claims[i] * goal);
        return row(`<span>${label}<small>${Math.min(goal, progress)} / ${goal} \xB7 +${reward} remnants</small></span>`, `<button data-claim="${i}" ${progress < goal ? "disabled" : ""}>CLAIM</button>`);
      }).join("") + `<div class="stats"><div>${save.bestFloors}<small>BEST ESCAPE</small></div><div>${save.totalEscapes}<small>FLOORS ESCAPED</small></div><div>${save.runs}<small>ATTEMPTS</small></div></div><p>Daily record: ${save.daily.date === GE.dateKey() ? save.daily.best : 0} floors. Escape one floor for a 60-remnant reward once per UTC day.</p><div class="challengeEntry"><label for="challengeInput">HAVE A CHALLENGE CODE?</label><input id="challengeInput" class="challengeCode" maxlength="17" placeholder="GE50-…" autocapitalize="characters" spellcheck="false"><button id="startChallenge" class="secondary">ENTER THIS HOUSE</button></div>`);
      $("#startChallenge").onclick=()=>{const n=GE.parseChallenge($("#challengeInput").value);if(n===null)return toast("CHECK THE CODE · USE THE COMPLETE GE50 CODE");start("challenge",n);};
      document.querySelectorAll("[data-claim]").forEach((b) => b.onclick = () => {
        const i = +b.dataset.claim, [key, goal, label, reward] = objectiveDefs[i];
        if (save[key] - (save.claims[i] || 0) * goal >= goal) {
          save.claims[i]++;
          save.coins += reward;
          persist();
          refreshHome();
          open("objectives");
        }
      });
    }
    if(name==="journal")show(name,"What the house remembers.",`<p>${save.journal.length} / ${GE.JOURNAL.length} memories recovered. An optional page waits on every floor. Recover the full story for 300 remnants.</p><div class="journal">`+GE.JOURNAL.map(([title,body],i)=>`<article class="${save.journal.includes(i)?"read":"locked"}"><small>MEMORY ${String(i+1).padStart(2,"0")}</small><h3>${save.journal.includes(i)?title:"Still inside the house"}</h3><p>${save.journal.includes(i)?body:"Find a page while exploring. You can escape without it."}</p></article>`).join("")+"</div>");
    if (name === "how") show(name, "Learn the house.", `<div class="instruction"><b>\u2194</b><div><strong>MOVE AND LOOK</strong><p>Keyboard: WASD moves, arrow keys turn, Shift runs. Drag anywhere in the scene to look. On touch, use the left pad to move and drag the right side to look. Hold RUN to sprint.</p></div></div><div class="instruction"><b>\u2727</b><div><strong>RECOVER THREE SEALS</strong><p>Follow the pale floor lights or compass. Get close, look at the seal and press E or INTERACT. Recover all three, then use the marked exit. The next floor generates a new layout.</p></div></div><div class="instruction"><b>\u25C9</b><div><strong>LIGHT AND HIDING</strong><p>Hold Space or BEAM and aim at the ghost for a moment to drive it away. On touch, drag the held BEAM button to aim without letting go. Release to recharge. Blue flasks restore charge. Use E at a wardrobe to hide; use it again to leave. If the ghost sees you enter, it can find you. Your breath lasts about seven seconds.</p></div></div><button id="replayLesson" class="secondary">PLAY THE SURVIVAL LESSON</button><p>Each house adds a rule: restore power at the red fuse box, unbind red seals with the beam, avoid noisy glass or survive blackouts. The HUD tells you the rule.</p><p>The Drifter and Whisper can relocate when out of sight. Cold air warns you as it emerges; it cannot hit until it has formed. A sharp inhale warns of a short rush. M opens the explored map, where echoes show an old sighting or an uncertain spawn area and fade after a few seconds. Escape pauses. Three hits end the escape; reaching a new floor restores one health.</p>`);
    if(name==="how")$("#replayLesson").onclick=()=>{pendingKind="endless";pendingSeed=null;save.guided=false;start();};
    if (name === "privacy") show(name, "Your escape stays here.", "<p>This version stores progress, the journal, your active escape and settings on your device. It has no advertising, analytics, purchases, accounts or online leaderboard. Gameplay data is not sent to a server. Copying a challenge places a code on your clipboard only when you choose it.</p><p>Uninstalling or clearing data removes progress. Optional vibration uses your device vibrator.</p><p>Ghost Escape \xB7 Version 5.0.0</p>");
  }
  function closePanel() {
    if (tutorial) return;
    if (mode === "pause") showPause();
    else if (mode === "dead") finish();
    else if (mode === "cleared") complete();
    else close();
  }
  function map() {
    if (tutorial || mode === "home" || mode === "dead" || mode === "cleared") return;
    if (!$("#mapOverlay").hidden) {
      resume();
      return;
    }
    pause();
    close();
    $("#mapOverlay").hidden = false;
    toastUntil = 0;
    $("#toast").style.opacity = 0;
    drawMap();
  }
  function drawMap() {
    const c = $("#mapCanvas"), x = c.getContext("2d"), size = 26, ox = (c.width - GE.W * size) / 2, oy = (c.height - GE.H * size) / 2;
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = "#0c1712";
    x.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < GE.H; y++) for (let xx = 0; xx < GE.W; xx++) {
      const k = y * GE.W + xx;
      if (!run.visited[k]) continue;
      x.fillStyle = run.grid[k] === 1 ? "#3c4c3d" : run.grid[k] === 2 ? "#223227" : "#17271b";
      x.fillRect(ox + xx * size, oy + y * size, size - 1, size - 1);
    }
    const point = (p2, color, shape) => {
      const cc = run.cell(p2.x, p2.z);
      if (!run.visited[cc.y * GE.W + cc.x]) return;
      const px2 = ox + p2.x / GE.S * size, py2 = oy + p2.z / GE.S * size;
      x.fillStyle = color;
      x.strokeStyle = color;
      if (shape === "rect") {
        x.strokeRect(px2 - 5, py2 - 5, 10, 10);
      } else {
        x.beginPath();
        x.arc(px2, py2, shape === "player" ? 5 : 4, 0, Math.PI * 2);
        x.fill();
      }
    };
    for (const r of run.rooms) {
      const cp = GE.center(r.x+Math.floor(r.w/2),r.y+Math.floor(r.h/2)), cc = run.cell(cp.x, cp.z);
      if (run.visited[cc.y * GE.W + cc.x]) {
        x.font = "8px Arial";
        x.textAlign = "center";
        x.fillStyle = "#94a58b88";
        x.fillText(r.name, ox + cp.x / GE.S * size, oy + cp.z / GE.S * size + 22);
      }
    }
    if(!run.fuse.taken)point(run.fuse,"#ed886b","rect");
    for (const s of run.seals) if (!s.taken) point(s, "#dcc48a");
    if(run.page&&!run.page.taken)point(run.page,"#e1aa88","rect");
    for (const h of run.hides) point(h, "#92aaa0", "rect");
    point(run.exit, "#c1d4ab", "rect");
    const echo = run.mapEcho();
    if (echo) {
      const ex = ox + echo.x / GE.S * size, ey = oy + echo.z / GE.S * size, radius = echo.uncertainty / GE.S * size;
      x.save();
      x.globalAlpha = echo.opacity;
      x.fillStyle = "#bc6d4a25";
      x.strokeStyle = "#d59370";
      x.lineWidth = 1.4;
      x.setLineDash([5, 6]);
      x.beginPath();
      x.arc(ex, ey, radius, 0, Math.PI * 2);
      x.fill();
      x.stroke();
      x.setLineDash([]);
      x.strokeStyle = "#ebbea5";
      x.beginPath();
      x.arc(ex, ey, 5, 0, Math.PI * 2);
      x.stroke();
      x.beginPath();
      x.moveTo(ex - 2, ey - 2);
      x.lineTo(ex + 2, ey + 2);
      x.moveTo(ex - 2, ey + 2);
      x.lineTo(ex + 2, ey - 2);
      x.stroke();
      x.restore();
      $("#mapStatus").textContent = (echo.type === "disturbance" ? "UNCONFIRMED DISTURBANCE" : "LAST SEEN") + " \xB7 " + (echo.age < 1 ? "JUST NOW" : Math.floor(echo.age) + " SECONDS AGO");
      $("#mapStatus").classList.add("trace");
    } else {
      $("#mapStatus").textContent = "NO RECENT TRACE \xB7 LISTEN CAREFULLY";
      $("#mapStatus").classList.remove("trace");
    }
    point(run.player, "#edf1d3", "player");
    const p = run.player, px = ox + p.x / GE.S * size, py = oy + p.z / GE.S * size;
    x.strokeStyle = "#e9f0d1";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px - Math.sin(p.yaw) * 15, py - Math.cos(p.yaw) * 15);
    x.stroke();
  }
  function drain() {
    for (const e of run.events.splice(0)) {
      audio.event(e.type, run, e);
      if(e.type==="power")banner("POWER RESTORED","THE SEALS CAN NOW BE TAKEN · IT HEARD THE SWITCH");
      if(e.type==="unbound")toast("SEAL UNBOUND · APPROACH AND TAKE IT");
      if (e.type === "manifest") {
        if (!run.firstTraceShown) {
          run.firstTraceShown = true;
          toast("A COLD TRACE \xB7 CHECK YOUR MAP");
        }
        if (save.settings.haptics) navigator.vibrate?.([12, 75, 18]);
      }
      if (e.type === "rush") {
        if (save.settings.haptics) navigator.vibrate?.([18, 90, 18]);
      }
      if(e.type==="page"&&!run.training){
        if(!save.journal.includes(e.index)){
          save.journal.push(e.index);save.coins+=15;
          if(save.journal.length===GE.JOURNAL.length&&!save.journalReward){save.journalReward=true;save.coins+=300;toast("THE FULL STORY · +300 REMNANTS");}
          banner(GE.JOURNAL[e.index][0],"MEMORY "+save.journal.length+" / 12 · +15 REMNANTS · READ IN THE JOURNAL");persist();
        }
      }
      if (e.type === "seal") {
        persistStats();
        banner(e.count === 3 ? "The seal is broken." : "A seal recovered.", e.count === 3 ? "RETURN TO THE EXIT" : "RECOVERED " + e.count + " / 3 \xB7 +8 REMNANTS");
        if (save.settings.haptics) navigator.vibrate?.(35);
      }
      if (e.type === "cell") toast("LIGHT RESTORED \xB7 +45 CHARGE");
      if (e.type === "repel") {
        persistStats();
        banner("Driven into the dark.", "KEEP MOVING. IT WILL RETURN.");
      }
      if (e.type === "hide") toast(e.seen ? "IT SAW YOU HIDE. GET OUT." : "Stay quiet. Watch your breath.");
      if (e.type === "breath") toast("OUT OF BREATH \xB7 YOU LEFT COVER");
      if (e.type === "empty") toast("LIGHT EMPTY \xB7 RELEASE TO RECHARGE");
      if (e.type === "hint") toast(e.text);
      if (e.type === "hit") {
        $("#hurt").style.opacity = 1;
        damageFade = performance.now() + 180;
        if (save.settings.haptics) navigator.vibrate?.([50, 40, 80]);
        if (!run.dead) toast("HEALTH LOST \xB7 " + run.health + " REMAINING");
      }
      if (e.type === "escape") complete();
      if (e.type === "death") finish();
    }
  }
  function hud(now) {
    $("#floor").textContent = String(run.floor).padStart(2, "0");
    $("#sealCount").textContent = run.sealCount + " / 3";
    $("#seals").querySelectorAll("i").forEach((e, i) => e.classList.toggle("found", i < run.sealCount));
    $("#missionTitle").textContent = run.sealCount === 3 ? "THE WAY OUT IS OPEN" : "BREAK THE SEAL";
    $("#missionText").textContent=run.sealCount===3?"Return to the exit. Open the door.":run.challenge.rule;
    $("#houseName").textContent=GE.ENVIRONMENTS[run.layout]+" · "+run.challenge.name;
    $("#noiseMeter").style.width=(run.noise*100)+"%";$("#healthLabel").textContent="HEALTH "+run.health+" / 3";
    $("#charge").textContent = Math.floor(run.energy) + "%";
    $("#energy").style.width = run.energy + "%";
    $("#light").classList.toggle("lit", run.light);
    $("#light").classList.toggle("empty", run.empty);
    $("#stamina").style.width = run.stamina + "%";
    $("#health").querySelectorAll("i").forEach((e, i) => e.classList.toggle("lost", i >= run.health));
    $("#presence").textContent=run.haunt.name;
    const o = run.focus(), names = { fuse:"RESTORE POWER", page:"TAKE PAGE", seal: "TAKE SEAL", cell: "TAKE LIGHT", hide: "HIDE", leave: "LEAVE COVER", exit: run.sealCount === 3 ? "OPEN EXIT" : "SEALED EXIT" };
    $("#actionName").textContent = o ? names[o.type] : "INTERACT";
    $("#interact").classList.toggle("ready", !!o);
    $("#reticle").classList.toggle("active", !!o);
    $("#contextName").textContent = o ? { fuse:"DEAD CIRCUIT · RESTORE POWER", page:"A MEMORY · OPTIONAL", seal: "A SEAL OF THE HOUSE", cell: "A CHARGE OF LIGHT", hide: "AN EMPTY WARDROBE", leave: "YOU ARE HIDDEN", exit: run.sealCount === 3 ? "THE WAY OUT" : "THREE SEALS BIND THIS DOOR" }[o.type] : "";
    $("#contextHint").textContent = o ? matchMedia("(pointer:coarse)").matches ? "TAP " + names[o.type] : "[ E ] " + names[o.type] : "";
    $("#hiding").hidden = !run.hidden;
    document.body.classList.toggle("hiding", !!run.hidden);
    $("#breath").style.width = run.breath + "%";
    $("#hideMessage").textContent = run.ghost.seenHide ? "It saw you enter. Leave now." : "Stay quiet. Let it pass.";
    const target = run.objective(), dx = target.x - run.player.x, dz = target.z - run.player.z, bearing = Math.atan2(dx, -dz) + run.player.yaw;
    $("#bearing").style.transform = "rotate(" + bearing + "rad)";
    $("#targetName").textContent=target.type==="fuse"?"POWER":run.training?"LESSON":run.sealCount===3?"EXIT":"SEAL";
    $("#targetDistance").textContent = Math.round(GE.dist(run.player, target)) + "m";
    const g = run.ghost, d = GE.dist(g, run.player), text = g.state === "repelled" ? "KEEP THE BEAM ON IT" : g.windup > 0 ? "IT IS DRAWING BREATH" : g.burst > 0 ? "MOVE. NOW." : g.state === "materializing" ? "THE AIR WENT COLD" : g.state === "phasing" ? "IT MOVED INTO THE DARK" : g.state === "hunt" && d < 9 ? "DON\u2019T LET IT REACH YOU" : g.state === "banished" ? "A MOMENT TO BREATHE" : g.state !== "dormant" && d < 12 ? "LISTEN TO THE BREATH" : now < guideUntil ? "FOLLOW THE PALE LIGHTS" : "";
    const cue=run.time<run.cueUntil?run.cue:text;
    $("#threat span").textContent=cue;
    $("#threat").style.opacity=cue&&now>bannerUntil&&lesson<0?1:0;
    $("#lookHint").style.opacity = now < guideUntil ? 0.7 : 0;
  }
  function act() {
    if (mode === "play" && !modal && !tutorial) {
      run.interact();
      drain();
      persist();
    }
  }
  function hold(on) {
    if (mode === "play" && !modal && !tutorial) {
      lightHeld = on;
      audio.unlock();
      run.hold(on);
    }
  }
  $("#play").onclick = () => save.checkpoint ? continueEscape() : start();
  $("#newEscape").onclick=()=>start();
  $("#presence").onclick=()=>toast(run.haunt.clue);
  $("#daily").onclick = () => start("daily");
  $("#pause").onclick = pause;
  $("#mapButton").onclick = map;
  $("#mapClose").onclick = resume;
  $("#close").onclick = closePanel;
  $("#interact").onclick = act;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) open(b.dataset.open);
  });
  for (const [id, down, up] of [["light", () => hold(true), () => {
    lightHeld = false;
    run?.hold(false);
  }], ["sprint", () => {
    runHeld = true;
  }, () => {
    runHeld = false;
  }]]) {
    const b = $("#" + id);
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      if (id === "light") beamPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
      down();
    };
    if (id === "light") b.onpointermove = (e) => {
      if (!beamPointer || beamPointer.id !== e.pointerId || mode !== "play" || modal) return;
      const sens=(e.pointerType==="mouse"?.0045:Math.PI/Math.max(260,innerWidth*.48))*save.settings.sensitivity;
      run.look((e.clientX - beamPointer.x) * sens, (e.clientY - beamPointer.y) * sens);
      beamPointer.x = e.clientX;
      beamPointer.y = e.clientY;
    };
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, () => {
      if (id === "light") beamPointer = null;
      up();
    });
  }
  const pad = $("#movePad");
  pad.onpointerdown = (e) => {
    if (mode !== "play" || modal || tutorial || movePointer!==null) return;
    e.preventDefault();
    pad.setPointerCapture(e.pointerId);
    movePointer=e.pointerId;joyOrigin={x:e.clientX,y:e.clientY};pad.classList.add("engaged");
    updateJoy(e);
  };
  pad.onpointermove = (e) => {
    if (e.pointerId === movePointer) updateJoy(e);
  };
  function updateJoy(e) {
    const r=pad.getBoundingClientRect(),radius=Math.min(58,r.width*.32),dx=e.clientX-joyOrigin.x,dy=e.clientY-joyOrigin.y,len=Math.hypot(dx,dy),strength=Math.max(0,Math.min(1,(len-4)/(radius-4)));
    joy={x:len?dx/len*strength:0,z:len?dy/len*strength:0};$("#moveKnob").style.transform=`translate(${joy.x*radius}px,${joy.z*radius}px)`;
  }
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) pad.addEventListener(ev, () => {
    movePointer=null;joyOrigin=null;pad.classList.remove("engaged");
    joy = { x: 0, z: 0 };
    $("#moveKnob").style.transform = "";
  });
  $("#world").onpointerdown = (e) => {
    if (mode !== "play" || modal || tutorial) return;
    if(e.pointerType==="touch"&&e.clientX<innerWidth*.4&&e.clientY>innerHeight*.4){pad.onpointerdown(e);return;}
    if(lookPointer)return;
    e.preventDefault();
    lookPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
    $("#world").setPointerCapture(e.pointerId);
  };
  $("#world").onpointermove = (e) => {
    if(e.pointerId===movePointer){updateJoy(e);return;}
    if (!lookPointer || lookPointer.id !== e.pointerId || mode !== "play" || modal) return;
    const sens=(e.pointerType==="mouse"?.0045:Math.PI/Math.max(260,innerWidth*.48))*save.settings.sensitivity;
    run.look((e.clientX - lookPointer.x) * sens, (e.clientY - lookPointer.y) * sens);
    lookPointer.x = e.clientX;
    lookPointer.y = e.clientY;
  };
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) $("#world").addEventListener(ev, () => lookPointer = null);
  addEventListener("keydown", (e) => {
    if(e.target.matches("input,textarea"))return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "e", "m", " ", "escape", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    if (k === "escape") {
      back();
      return;
    }
    if (k === "m" && !e.repeat) {
      map();
      return;
    }
    if (mode !== "play" || modal || tutorial) return;
    keys.add(k);
    if (k === "e" && !e.repeat) act();
    if (k === " " && !e.repeat) hold(true);
  });
  addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
    if (e.key === " ") hold(false);
  });
  function back() {
    if (tutorial) return;
    if (!$("#mapOverlay").hidden) {
      resume();
      return;
    }
    if (mode === "play") pause();
    else if (mode === "pause") {
      if (modal === "pause") resume();
      else showPause();
    } else if (mode === "dead") {
      if (modal === "results") home();
      else finish();
    } else if (mode === "cleared") complete();
    else if (modal) close();
    else if (window.GhostEscapeExit) {
      show("exit", "Leave the house?", `<button id="exit" class="primary">EXIT GAME</button>`);
      $("#exit").onclick = () => window.GhostEscapeExit();
    }
  }
  window.GhostEscapeBack = back;
  window.GhostEscapePause = () => {
    resetInput();
    pause();
  };
  addEventListener("blur", () => {
    resetInput();
    pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      resetInput();
      pause();
    }
  });
  addEventListener("pagehide", persistStats);
  addEventListener("resize", () => scene?.resize());
  $("#world").addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    pause();
    toast("Graphics interrupted. Reopen the game to continue.");
  });
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1e3);
    lastFrame = now;
    if (mode === "play" && !tutorial && !modal && !inputPaused) {
      const x = joy.x + (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0), z = joy.z + (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
      if (keys.has("arrowleft")) run.look(-1.65 * dt, 0);
      if (keys.has("arrowright")) run.look(1.65 * dt, 0);
      for(let remaining=dt;remaining>0;remaining-=1/60)run.step(Math.min(remaining,1/60),{x,z,sprint:runHeld||keys.has("shift")||save.settings.autoSprint&&Math.hypot(joy.x,joy.z)>.96});
      drain();teach();
      audio.update(run);
      if(now-lastAutosave>5000){lastAutosave=now;persistStats();}
    }
    if(run&&mode!=="home"&&now-lastHud>65){hud(now);lastHud=now;}
    if (scene && run) scene.render(run, save, mode, now / 1e3);
    if (now > toastUntil) $("#toast").style.opacity = 0;
    if (now > bannerUntil) $("#banner").style.opacity = 0;
    if (now > damageFade) $("#hurt").style.opacity = 0;
    requestAnimationFrame(frame);
  }
  function applyControls(){document.documentElement.style.setProperty("--control-scale",save.settings.controlSize);}
  applyControls();document.addEventListener("pointerdown",()=>{if(mode==="play")audio.unlock();},{passive:true});
  try {
    scene = new EscapeScene($("#world"));
    await scene.ready;
    home();
    $("#loading").hidden = true;
    requestAnimationFrame(frame);
  } catch (e) {
    $("#loadStatus").textContent = "The 3D scene could not load. Use a current browser or update Android System WebView. " + e.message;
    console.error(e);
  }
  persist();
  if (["localhost", "127.0.0.1"].includes(location.hostname) && !window.Capacitor?.isNativePlatform?.()) window.__qa = { get run() {
    return run;
  }, get mode() {
    return mode;
  }, get save() {
    return save;
  }, scene, audio, get lesson(){return lesson;}, beginLesson, endLesson, teach, start, continueEscape, shareChallenge, home, pause, resume, open, finish, complete, loadFloor, drain, acknowledge, act, persistStats, get objectiveDefs() {
    return objectiveDefs;
  }, freeze(v) {
    inputPaused = v;
  } };
})();
