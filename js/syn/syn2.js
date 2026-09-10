import { C, ionShape, ntShape, along, channel, mvChip, tag, vmInside } from "../mrs.js";
import { CS, POST, POST_S, bilayerPath, pathFill, proteinOnPath, miniBouton } from "../syn.js";

// S2 · Summation playground (Kalat Fig 2.3/2.4). Three terminals onto one postsynaptic cup:
// two excitatory (glu → Na⁺ in) and one inhibitory (GABA → Cl⁻ in). Graded potentials sum.
const THRESH=-55, REST=-70;

const CONTACTS=[
  { id:"e1", x:400, kind:"E", label:"▲ axon 1" },
  { id:"e2", x:480, kind:"E", label:"▲ axon 2" },
  { id:"i1", x:560, kind:"I", label:"▼ inhibitory" },
];
const ANCH=CONTACTS.map(c=>proteinOnPath(POST_S,c.x,346,"",0.19,false).skip);

const PRESETS=[
  { id:"single", label:"One EPSP", start:()=>[mkEvent(0,1.0)],
    blurb:"One EPSP is small (~+8 mV): the membrane warms, then fades long before threshold. No spike." },
  { id:"temporal", label:"Temporal train", start:()=>[mkEvent(0,1.0),mkEvent(0,1.35),mkEvent(0,1.7),mkEvent(0,2.05)],
    blurb:"Temporal summation: the <b>same</b> synapse fires again before the first EPSP has decayed — the bumps stack until they cross threshold." },
  { id:"spatial", label:"Two axons at once", start:()=>[mkEvent(0,1.0),mkEvent(1,1.0)],
    blurb:"Spatial summation: <b>two different</b> axons fire at once — their EPSPs add at the same place and time, so the sum crosses threshold." },
  { id:"cancel", label:"EPSP + IPSP", start:()=>[mkEvent(0,1.0),mkEvent(2,1.0)],
    blurb:"An EPSP and an IPSP arrive together: the depolarization and hyperpolarization cancel — the membrane holds at rest." },
];

function mkEvent(ci,t){
  const k=CONTACTS[ci].kind;
  return { ci, t, kind:k, amp:k==="E"?8:-8, rw:0.12, dw:1.2 };
}

function s01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
function bump(t,t0,a,rw,dw){
  const d=t-t0; if(d<=-rw||d>=dw) return 0;
  const w=d<0?rw:dw; return a*Math.cos(Math.PI*d/(2*w))**2;
}
function baseVm(ev,t){ let v=REST; ev.forEach(e=>{ v+=bump(t,e.t,e.amp,e.rw,e.dw); }); return v; }
function apWave(u,v0){
  if(u<0) return REST;
  const peak=0.25, under=0.9, dur=2.0;
  if(u<peak) return v0+(30-v0)*s01(u/peak);
  if(u<under) return 30-115*Math.pow((u-peak)/(under-peak),0.7);
  if(u<dur){ return -85+15*s01((u-under)/(dur-under)); }
  return REST;
}
function simulate(ev,tEnd,dt=0.02){
  if(!ev.length) return [];
  const tFirst=Math.min(...ev.map(e=>e.t));
  const tStop=Math.min(tEnd, Math.max(...ev.map(e=>e.t))+3);
  const sp=[]; let refr=-1;
  for(let t=Math.max(0,tFirst-0.05);t<=tStop+1e-9;t+=dt){
    const v=baseVm(ev,t);
    if(v>=THRESH && t>=refr){ sp.push({t:+t.toFixed(3),v0:v}); refr=t+2.0; }
  }
  return sp;
}
function vmAt(ev,sp,t){
  for(const s of sp){ if(t>=s.t&&t<=s.t+2.0) return apWave(t-s.t,s.v0); }
  return baseVm(ev,t);
}
function activePulse(ev,ci,T){
  let best=null;
  ev.forEach(e=>{ if(e.ci!==ci) return; const p=T-e.t; if(p>=0&&p<=1.2&&(!best||p<best.p)) best={p,e}; });
  return best;
}

function sceneSVG(vm,ev,sp,T){
  let body="";
  CONTACTS.forEach((c,i)=>{
    const ap=activePulse(ev,i,T);
    const docked=ap&&ap.p>=0.12&&ap.p<=1.0;
    const nt=c.kind==="E"?"glu":"gaba", col=c.kind==="E"?CS.gluR:CS.gabaR;
    const pr=proteinOnPath(POST_S,c.x,346,
      `<g transform="translate(-${c.x},-210)">${channel(c.x,col,docked?"open":"closed",{cup:nt,docked:docked?nt:undefined})}</g>`,0.19,false);
    body+=pr.svg;
  });
  CONTACTS.forEach((c,i)=>{
    const a=ANCH[i], by=a.y-58, col=c.kind==="E"?C.glu:C.gaba;
    body+=miniBouton(c.x,by);
    body+=`<line x1="${c.x}" y1="${by-33}" x2="${c.x}" y2="${by-50}" stroke="#9a9a9a" stroke-width="3"/>`;
    body+=`<text x="${c.x}" y="${by-53}" text-anchor="middle" font-size="15" fill="${col}">${c.kind==="E"?"▲":"▼"}</text>`;
  });
  ev.forEach(e=>{
    const p=T-e.t; if(p<0||p>0.45) return;
    const c=CONTACTS[e.ci], a=ANCH[e.ci], bx=c.x, by=a.y-58;
    for(let k=0;k<3;k++){
      const f=Math.max(0,Math.min(1,(p-k*0.05)/0.36));
      const pos=along([[bx+k*5-5,by+16],[a.x,a.y-10]],f);
      body+=ntShape(pos[0],pos[1],c.kind==="E"?"glu":"gaba",4.5);
    }
  });
  ev.forEach(e=>{
    const p=T-e.t; if(p<0.22||p>1.15) return;
    const c=CONTACTS[e.ci], a=ANCH[e.ci], type=c.kind==="E"?"na":"cl";
    for(let k=0;k<2;k++){
      const f=Math.max(0,Math.min(1,(p-0.22-k*0.15)/0.8));
      const pos=along([[a.x-4,a.y+2],[a.x+4,a.y+22],[a.x+6,a.y+40]],f);
      body+=ionShape(pos[0],pos[1],type,3.2);
    }
  });
  let flash=0;
  sp.forEach(s=>{ const u=T-s.t; if(u>=0&&u<=2) flash=Math.max(flash,Math.exp(-Math.pow((u-0.15)/0.22,2))); });
  const cellPath=pathFill(POST," L 900 600 L 60 600 Z");
  if(flash>0.02) body+=`<path d="${cellPath}" fill="#EE9258" opacity="${(0.24*flash).toFixed(3)}"/>`;
  body+=mvChip(348,206,Math.round(vm));
  if(sp.some(s=>T>=s.t&&T<=s.t+2.0)) body+=tag(480,440,"threshold crossed — FIRED","#B03A2E");
  const inner=`<rect x="340" y="200" width="300" height="300" fill="${C.ecf}"/>`+
    `<path d="${cellPath}" fill="${vmInside(vm)}"/>`+
    bilayerPath(POST,0.2,[])+body;
  return `<svg width="100%" style="aspect-ratio:1/1" viewBox="340 200 300 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function traceSVG(ev,sp,tNow,live){
  const W=540,H=180,X0=48,X1=528,Y0=20,Y1=152,WIN=4.5;
  const tB=live?tNow:Math.max(0.5,tNow), tA=live?tNow-WIN:0;
  const span=Math.max(0.001,tB-tA);
  const X=t=>X0+(X1-X0)*(t-tA)/span;
  const Y=v=>Y0+(Y1-Y0)*(45-v)/135;
  let d="";
  const N=300;
  for(let i=0;i<=N;i++){ const t=tA+span*i/N; if(t<0) continue;
    d+=(d?" L":"M")+X(t).toFixed(1)+","+Y(vmAt(ev,sp,t)).toFixed(1); }
  let ticks="";
  sp.forEach(s=>{ if(s.t>=Math.max(0,tA)&&s.t<=tB) ticks+=`<line x1="${X(s.t).toFixed(1)}" y1="${Y(30)}" x2="${X(s.t).toFixed(1)}" y2="${Y(-55)}" stroke="#F0C36B" stroke-width="1" opacity="0.85"/>`; });
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`+
    `<rect width="${W}" height="${H}" rx="8" fill="#141A22"/>`+
    `<line x1="${X0}" y1="${Y(30)}" x2="${X1}" y2="${Y(30)}" stroke="#7A8794" stroke-dasharray="4 3"/>`+
    `<text x="${X0+4}" y="${Y(30)-3}" font-size="9" fill="#7A8794">peak +30</text>`+
    `<line x1="${X0}" y1="${Y(-55)}" x2="${X1}" y2="${Y(-55)}" stroke="#E0A458" stroke-dasharray="4 3"/>`+
    `<text x="${X1-4}" y="${Y(-55)-4}" text-anchor="end" font-size="9" fill="#E0A458">threshold −55</text>`+
    `<line x1="${X0}" y1="${Y(-70)}" x2="${X1}" y2="${Y(-70)}" stroke="#5A6B7E" stroke-dasharray="2 3"/>`+
    `<text x="${X1-4}" y="${Y(-70)+11}" text-anchor="end" font-size="9" fill="#8A98A8">resting −70</text>`+
    `<line x1="${X0}" y1="${Y(-90)}" x2="${X1}" y2="${Y(-90)}" stroke="#3A4650"/>`+
    `<text x="${X0}" y="${Y(-90)-3}" font-size="9" fill="#8A98A8">mV · graded potential over time →</text>`+
    `<path d="${d}" fill="none" stroke="#3EDAD8" stroke-width="2.4"/>`+
    ticks+
    (live?`<line x1="${X(tNow).toFixed(1)}" y1="8" x2="${X(tNow).toFixed(1)}" y2="${Y(-90)}" stroke="#E0A458" stroke-width="1.2" opacity="0.6"/>`:"")+
    `</svg>`;
}

function fmt(v){ return (v<0?"−"+Math.abs(v).toFixed(0):"+"+v.toFixed(0)); }
function statusLine(vm,sp,T){
  const inAp=sp.some(s=>T>=s.t&&T<=s.t+2.0);
  if(inAp) return `<b>Vm ≈ ${fmt(vm)} mV</b> · the summed depolarization crossed threshold — <b>the cell fired an action potential.</b>`;
  if(sp.length&&vm<REST+1) return `<b>Vm ≈ ${fmt(vm)} mV</b> · the cell fired and has settled back to rest.`;
  if(vm>=THRESH) return `<b>Vm ≈ ${fmt(vm)} mV</b> · at threshold — a spike is about to start.`;
  if(vm<-70.5) return `<b>Vm ≈ ${fmt(vm)} mV</b> · hyperpolarized by the IPSP — pushed <b>further</b> from threshold.`;
  return `<b>Vm ≈ ${fmt(vm)} mV</b> · below threshold (−55 mV) — no spike.`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns" id="s2-presets"></div>
    <div class="stim-btns">
      <span class="s2-lab">deliver one pulse →</span>
      <span id="s2-manual"></span>
      <button id="s2-clear" class="ghostbtn">Clear</button>
    </div>
    <div class="s2-grid">
      <div id="s2-scene"></div>
      <div>
        <div id="s2-trace"></div>
        <p class="p3-caption" id="s2-status"></p>
        <p class="p3-caption" id="s2-note"></p>
      </div>
    </div>
    <p class="p3-caption">Graded potentials don't travel — they <b>sum</b> on the postsynaptic membrane.
      Two excitatory axons (▲, glutamate → Na⁺ in) each add a small EPSP; the inhibitory axon (▼, GABA → Cl⁻ in)
      subtracts. Add enough excitation fast enough (temporal) or at once (spatial) and the sum reaches
      threshold (−55 mV) — then the hillock fires a full action potential.</p>
  </div>`;

  const sceneEl=el.querySelector("#s2-scene"), traceEl=el.querySelector("#s2-trace");
  const statusEl=el.querySelector("#s2-status"), noteEl=el.querySelector("#s2-note");
  const presetBox=el.querySelector("#s2-presets"), manualBox=el.querySelector("#s2-manual");

  let events=[], startWall=performance.now(), raf=null;

  PRESETS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p.label; b.dataset.id=p.id;
    b.onclick=()=>{
      events=p.start();
      startWall=performance.now();
      noteEl.innerHTML=p.blurb;
      if(raf===null) raf=requestAnimationFrame(frame);
    };
    presetBox.appendChild(b);
  });
  CONTACTS.forEach((c,i)=>{
    const b=document.createElement("button");
    b.textContent=c.label;
    b.onclick=()=>{
      events=events.concat(mkEvent(i,(performance.now()-startWall)/1000));
      noteEl.innerHTML="You delivered a pulse — watch it add to whatever is still decaying.";
      if(raf===null) raf=requestAnimationFrame(frame);
    };
    manualBox.appendChild(b);
  });
  el.querySelector("#s2-clear").onclick=()=>{
    events=[]; startWall=performance.now();
    noteEl.innerHTML="Cleared. Fire pulses to build a graded potential from rest.";
  };

  function frame(){
    const T=(performance.now()-startWall)/1000;
    const sp=simulate(events,T);
    const vm=vmAt(events,sp,T);
    sceneEl.innerHTML=sceneSVG(vm,events,sp,T);
    traceEl.innerHTML=traceSVG(events,sp,T,true);
    statusEl.innerHTML=statusLine(vm,sp,T);
    if(T>60){ events=[]; startWall=performance.now(); }
    raf=requestAnimationFrame(frame);
  }

  const q=new URLSearchParams(location.search);
  const preset=PRESETS.find(p=>p.id===q.get("play"));
  const fx=q.get("t");
  if(fx!==null){
    const ev=preset?preset.start():[];
    const T=+fx, sp=simulate(ev,T), vm=vmAt(ev,sp,T);
    sceneEl.innerHTML=sceneSVG(vm,ev,sp,T);
    traceEl.innerHTML=traceSVG(ev,sp,T,q.get("win")==="live");
    statusEl.innerHTML=statusLine(vm,sp,T);
    noteEl.innerHTML=preset?preset.blurb:"rest state (fixture).";
    raf=null;
  }else{
    if(preset){ events=preset.start(); noteEl.innerHTML=preset.blurb; }
    else noteEl.innerHTML="Press a preset, or fire single pulses yourself, and watch them sum.";
    raf=requestAnimationFrame(frame);
  }
}
