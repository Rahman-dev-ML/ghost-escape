window.HouseAudio = class {
  constructor() {
    this.settings = { sound: true, music: true };
    this._active = false;
    this.voices = /* @__PURE__ */ new Set();
    this.nextBar = 0;
    this.nextStep = 0;
    this.nextBreath = 0;
    this.nextBeat = 0;
    this.bar = 0;
  }
  get active() {
    return this._active;
  }
  set active(value) {
    this._active = !!value;
    clearTimeout(this.suspendTimer);
    if (!this.ctx) return;
    if (value) {
      this.ctx.resume().catch(() => {
      });
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(this.settings.sound || this.settings.music ? (this.settings.volume??.85) : 0, this.ctx.currentTime, 0.035);
    } else {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.012);
      this.suspendTimer = setTimeout(() => {
        if (!this.active && this.ctx.state === "running") this.ctx.suspend().catch(() => {
        });
      }, 65);
    }
  }
  unlock() {
    if (this.ctx) {
      if (this.active) this.ctx.resume().catch(() => {
      });
      return;
    }
    try {
      this.init(new (window.AudioContext || window.webkitAudioContext)());
    } catch {
    }
  }
  init(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.active ? (this.settings.volume??.85) : 0;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -14;
    this.limiter.knee.value = 14;
    this.limiter.ratio.value = 5;
    this.limiter.attack.value = 6e-3;
    this.limiter.release.value = 0.22;
    this.master.connect(this.limiter);
    this.analyser=ctx.createAnalyser();this.analyser.fftSize=1024;this.limiter.connect(this.analyser);this.analyser.connect(ctx.destination);
    this.music = ctx.createGain();
    this.fx = ctx.createGain();
    this.music.connect(this.master);
    this.fx.connect(this.master);
    this.reverb = ctx.createConvolver();
    const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.4), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.4) * 0.34;
    }
    this.reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.16;
    this.music.connect(wet);
    this.fx.connect(wet);
    wet.connect(this.reverb);
    this.reverb.connect(this.master);
    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const n = Math.random() * 2 - 1;
      brown = (brown + n * 0.035) / 1.035;
      data[i] = n * 0.65 + brown * 3;
    }
    this.wind = ctx.createBufferSource();
    this.wind.buffer = this.noiseBuffer;
    this.wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 240;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.07;
    this.wind.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.music);
    this.wind.start();
    this.strings = ctx.createGain();
    this.strings.gain.value = 0.022;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 460;
    this.strings.connect(low);
    low.connect(this.music);
    for (const [f, detune] of [[55, -6], [55, 5], [82.41, -3], [110.35, 3]]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(this.strings);
      o.start();
    }
    this.applySettings();ctx.resume().catch(()=>{});
  }
  applySettings() {
    if (!this.ctx) return;
    const mix = (this.settings.volume??.85)*100 + (this.active ? 4 : 0) + (this.settings.sound ? 2 : 0) + (this.settings.music ? 1 : 0);
    if (mix === this.lastMix) return;
    this.lastMix = mix;
    this.master.gain.setTargetAtTime(this.active && (this.settings.sound || this.settings.music) ? (this.settings.volume??.85) : 0, this.ctx.currentTime, 0.025);
    this.music.gain.setTargetAtTime(this.settings.music ? 0.7 : 0, this.ctx.currentTime, 0.03);
    this.fx.gain.setTargetAtTime(this.settings.sound ? 1.2 : 0, this.ctx.currentTime, 0.03);
  }
  voice(source, envelope, pan, music = false, filter = null) {
    if (this.voices.size >= 36) {
      source.disconnect();
      return false;
    }
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan || 0));
    source.connect(filter || envelope);
    if (filter) filter.connect(envelope);
    envelope.connect(p);
    p.connect(music ? this.music : this.fx);
    this.voices.add(source);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
      p.disconnect();
      filter?.disconnect();
      this.voices.delete(source);
    };
    return true;
  }
  tone(f, d = 0.5, type = "sine", vol = 0.1, end = f, pan = 0, music = false, delay = 0) {
    if (!this.ctx || !this.active || !(music ? this.settings.music : this.settings.sound)) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(18, end), t + d);
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), t + Math.min(d * 0.25, 0.25));
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    if (this.voice(o, g, pan, music)) {
      o.start(t);
      o.stop(t + d + 0.02);
    }
  }
  noise(d = 0.5, vol = 0.1, cut = 900, pan = 0, type = "bandpass", delay = 0) {
    if (!this.ctx || !this.active || !this.settings.sound) return;
    const t = this.ctx.currentTime + delay, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuffer;
    s.playbackRate.value = 0.8 + Math.random() * 0.35;
    f.type = type;
    f.frequency.setValueAtTime(cut, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(70, cut * 0.55), t + d);
    f.Q.value = type === "bandpass" ? 1.8 : 0.5;
    g.gain.setValueAtTime(1e-4, t);
    g.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), t + d * 0.3);
    g.gain.exponentialRampToValueAtTime(1e-4, t + d);
    if (this.voice(s, g, pan, false, f)) {
      s.start(t, Math.random() * 0.7);
      s.stop(t + d + 0.02);
    }
  }
  direction(run) {
    if (!run) return 0;
    return Math.sin(Math.atan2(run.ghost.x - run.player.x, -(run.ghost.z - run.player.z)) + run.player.yaw);
  }
  breathe(run, strong = false) {
    const pan = this.direction(run);
    this.noise(strong?1.25:.85,strong?.4:.22,1050,pan);
    this.noise(strong ? 1.5 : 1.1, strong ? 0.09 : 0.045, 2200, pan, "bandpass", 0.25);
    this.tone(67, 0.85, "sine", strong ? 0.06 : 0.025, 45, pan);
  }
  event(n, run, e = {}) {
    if (!this.ctx || !this.active) return;
    const pan = this.direction(run);
    if(n==="glass"){for(let i=0;i<5;i++){this.noise(.16,.28,2800+i*310,pan,"highpass",i*.035);this.tone(1600+i*190,.2,"sine",.045,800+i*70,pan,false,i*.02);}return;}
    if(n==="power"||n==="blackout"){this.noise(.28,.42,680,0,"lowpass");this.tone(130,.4,"sawtooth",.09,45);return;}
    if(n==="detected"){this.tone(188,.85,"sawtooth",.055,196,pan);this.noise(.45,.2,1300,pan);return;}
    if(n==="unbound"){this.tone(587,1.2,"sine",.13,440);return;}
    if (n === "manifest") {
      this.breathe(run, true);
      this.tone(196, 1.7, "triangle", 0.055, 92, pan);
      this.noise(1.5, 0.1, 1500, -pan, "bandpass", 0.15);
    } else if (n === "vanish") {
      this.noise(0.9, 0.16, 520, pan);
      this.tone(88, 1.1, "sine", 0.08, 32, pan);
    } else if (n === "rush") {
      this.noise(0.65, 0.27, 1100, pan);
      this.tone(72, 0.85, "sawtooth", 0.045, 140, pan);
      this.tone(280, 0.9, "sine", 0.04, 315, -pan);
    } else if (n === "thunder") {
      this.noise(2.7, 0.2, 180, -0.45, "lowpass", 0.35);
      this.tone(40, 2.5, "sine", 0.11, 22, 0.4, false, 0.4);
    } else if (n === "creak") {
      this.tone(175, 0.8, "triangle", 0.04, 122, e.pan);
      this.noise(0.7, 0.07, 450, e.pan);
    } else if (n === "page") {
      this.noise(.45,.07,1600,0);this.tone(329.63,.9,"sine",.05,293.66);
    } else if (n === "seal") {
      for (const f of [196, 294, 392]) this.tone(f, 2, "sine", 0.13, f * 0.998);
      this.noise(1.5, 0.08, 1400, 0.2);
    } else if (n === "escape") {
      for (const f of [130.8, 196, 261.6]) this.tone(f, 2.5, "sine", 0.13);
    } else if (n === "hit" || n === "death") {
      this.noise(0.55, 0.38, 950, pan);
      this.tone(110, 0.85, "sawtooth", 0.09, 26, pan);
      this.tone(390, 0.5, "triangle", 0.035, 215, -pan);
    } else if (n === "repel") {
      this.noise(0.7, 0.18, 1600, pan);
      this.tone(140, 0.9, "triangle", 0.1, 32, pan);
    } else if (n === "cell") this.tone(440, 0.35, "sine", 0.1, 660);
    else if (n === "hide" || n === "leave") {
      this.noise(0.3, 0.14, 300);
      this.tone(90, 0.3, "triangle", 0.06, 42);
    } else if (n === "empty") this.noise(0.15, 0.1, 1800);
  }
  update(run) {
    if (!this.ctx || !this.active) return;
    const now = this.ctx.currentTime;
    this.applySettings();
    if (this.run !== run) {
      this.run = run;
      for (const v of this.voices) {
        try {
          v.stop();
        } catch {
        }
      }
      this.nextBar = now;
      this.nextStep = now;
      this.nextBreath = now + 2;
      this.nextBeat = now + 1;
      this.bar = 0;
    }
    const dread = run.dread || 0, g = run.ghost, d = GE.dist(run.player, g), present = !["banished", "dormant", "phasing"].includes(g.state);
    this.strings.gain.setTargetAtTime(0.018 + dread * 0.046, now, 0.6);
    this.windGain.gain.setTargetAtTime(0.06 + dread * 0.06, now, 0.7);
    if (now >= this.nextBar) {
      this.nextBar = now + 6.4;
      const chord = [[55, 82.41, 116.54], [51.91, 77.78, 110], [49, 73.42, 103.83], [55, 82.41, 117.1]][this.bar++ % 4];
      for (let i = 0; i < 3; i++) this.tone(chord[i], 6.8, "triangle", 0.035 + dread * 0.025, chord[i] * 1.003, (i - 1) * 0.65, true);
      if (dread > 0.35) {
        const n = [293.66, 311.13, 220, 207.65][this.bar % 4];
        this.tone(n, 3.2, "sine", 0.025 + dread * 0.025, n * 0.985, -0.5, true, 0.4);
        this.tone(n * 1.008, 2.8, "sine", 0.02, n * 1.025, 0.6, true, 1.3);
      }
    }
    if (run.moving > 0.1 && !run.hidden && now >= this.nextStep) {
      this.noise(.16,run.sprinting?.3:.18,run.layout===1?950:680, this.bar % 2 ? 0.15 : -0.15, "lowpass");
      this.tone(150,.12,"triangle",.065,80);
      this.nextStep = now + (run.sprinting ? 0.3 : 0.48);
    }
    if ((dread > 0.18 || run.hidden) && now >= this.nextBeat) {
      const stress = run.hidden ? Math.max(dread, 1 - run.breath / 100) : dread;
      const v = 0.035 + stress * 0.09;
      this.tone(49, 0.18, "sine", v, 38);
      this.tone(44, 0.16, "sine", v * 0.65, 34, 0, false, 0.18);
      this.nextBeat = now + 1.22 - stress * 0.64;
    }
    if(present&&d<18&&now>=(this.nextGhostStep||0)&&g.state!=="repelled"){this.noise(.22,.18*Math.max(.2,1-d/22),run.haunt.id==="listener"?1450:480,this.direction(run));this.nextGhostStep=now+(g.state==="hunt"?.42:.85);if(run.haunt.id==="whisper")this.noise(1.3,.17,1800,this.direction(run));}
    if (present && d < 16 && now >= this.nextBreath) {
      this.breathe(run, d < 6);
      if(run.haunt.id==="listener")this.tone(740,.08,"triangle",.025,350,this.direction(run));
      if(run.haunt.id==="drifter")this.noise(.8,.045,1900,-this.direction(run),"bandpass",.35);
      this.nextBreath = now + 1.4 + Math.min(d, 16) * 0.12;
    }
  }
};
