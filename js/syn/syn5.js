import { C, vmInside, ionShape, ntShape, arrow, tag, channel, along } from "../mrs.js";
import { CS, bilayerPath, transporter, vesicle } from "../syn.js";

// S5 · Blocking reuptake (Kalat Fig 2.16, Table 2.3).
// Normally the transporter pulls transmitter back into the terminal (reuptake):
// the cleft clears and the signal ends. Cocaine / methylphenidate (Ritalin) block
// the transporter, so transmitter lingers and the postsynaptic effect is prolonged.
const TMAX=7, N_FULL=12, N_LOW=4;

const SCEN=[
  { id:"normal",     label:"Normal reuptake",        note:"The transporter ferries transmitter back into the terminal — the cleft clears, the signal switches off, and the transmitter is recycled." },
  { id:"blocked",    label:"Cocaine / Ritalin",      note:"The drug docks on the transporter and blocks it. Transmitter lingers in the cleft, so the postsynaptic receptors keep firing — a <b>prolonged</b> effect." },
  { id:"withdrawal", label:"Hours later: withdrawal",note:"With reuptake blocked, enzymes broke down the surplus and the terminal couldn't replenish. Stores are low, so a smaller release gives a <b>weaker</b> signal — the withdrawal dip." },
];

const SLOTS=(()=>{
  let seed=3; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const out=[];
  for(let i=0;i<N_FULL;i++) out.push([412+rnd()*196, 158+rnd()*26]);
  return out;
})();

function profile(t,id){
  const N=id==="withdrawal"?N_LOW:N_FULL;
  if(t<=0) return 0;
  if(t<0.5) return N*t/0.5;
  const tau=id==="blocked"?6:0.75;
  return N*Math.exp(-(t-0.5)/tau);
}

const SLOTS_SORTED=[...SLOTS].sort((a,b)=>Math.abs(a[0]-480)-Math.abs(b[0]-480));
function captureTimes(N,tau){
  const out=[];
  for(let j=0;j<N;j++){ const level=Math.max(0.5,N-(j+1)); out.push(0.5+tau*Math.log(N/level)); }
  return out;
}
const CAPTURE={ normal:captureTimes(N_FULL,0.75), withdrawal:captureTimes(N_LOW,0.75) };
const TRAVEL=0.5;

// Draw the transmitter in the cleft; reuptake animates each molecule slot -> transporter -> terminal.
function ntParticles(t,id){
  const N=id==="withdrawal"?N_LOW:N_FULL, times=id==="blocked"?null:CAPTURE[id];
  const released=t<0.5?Math.max(0,Math.round(N*t/0.5)):N;
  let out="";
  for(let i=0;i<N;i++){
    if(i>=released) break;
    const [sx,sy]=SLOTS_SORTED[i];
    if(!times){ out+=ntShape(sx,sy,"glu",5); continue; }
    const c=times[i];
    if(t>c+TRAVEL) continue;
    if(t<c){ out+=ntShape(sx,sy,"glu",5); continue; }
    const u=(t-c)/TRAVEL;
    if(u<0.5){ out+=ntShape(...along([[sx,sy],[480,174]],u/0.5),"glu",5); }
    else{
      const op=1-(u-0.5)/0.5;
      const pos=along([[480,174],[480,150],[480,122]],(u-0.5)/0.5);
      out+=`<g opacity="${op.toFixed(2)}">${ntShape(pos[0],pos[1],"glu",5)}</g>`;
    }
  }
  return out;
}

function sceneSVG(t,id){
  const prof=profile(t,id);
  const blocked=id==="blocked";
  const collecting=!blocked && prof>0.6 && t>0.4;
  const open=prof>1.5;
  let inner=`<rect x="380" y="30" width="240" height="120" fill="${vmInside(-70)}"/>`+
    `<rect x="380" y="150" width="240" height="40" fill="${C.ecf}"/>`+
    `<rect x="380" y="190" width="240" height="60" fill="${vmInside(-70)}"/>`+
    bilayerPath([[378,150],[622,150]],0.2)+
    bilayerPath([[378,190],[622,190]],0.2);

  const empty=id==="withdrawal";
  inner+=vesicle(415,86,"glu",15,0.2,false,false)+vesicle(480,80,"glu",15,0.2,false,false)+
    vesicle(545,86,"glu",15,0.2,false,empty);
  if(empty) inner+=tag(480,52,"recycled stores low","#B03A2E");

  inner+=`<g transform="translate(480,150) scale(0.4) translate(-480,-150)">${transporter(480,150,blocked?"blocked":(collecting?"collecting":"closed"))}</g>`;
  if(collecting) inner+=arrow(480,184,480,168,CS.transporter);
  if(blocked) inner+=tag(556,132,"cocaine / Ritalin",CS.drug);

  [440,520].forEach(rx=>{
    inner+=`<g transform="translate(${rx},190) scale(0.24) translate(${-rx},-210)">${channel(rx,CS.gluR,open?"open":"closed",{badge:"R"})}</g>`;
    if(open) for(let j=0;j<2;j++) inner+=ionShape(rx-4+j*8,198+j*10,"na",3);
  });

  inner+=ntParticles(t,id);

  const chip=`<g transform="translate(392,214)"><rect width="150" height="26" rx="7" fill="#fff" stroke="#999"/>`+
    `<text x="75" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="#222">${id==="blocked"?"reuptake blocked":id==="withdrawal"?"after the drug":"normal reuptake"}</text></g>`;

  return `<svg width="100%" style="aspect-ratio:240/220" viewBox="380 30 240 220" xmlns="http://www.w3.org/2000/svg">${inner}${chip}</svg>`;
}

function traceSVG(t,id){
  const W=520,H=170,X0=46,X1=506,Y0=18,Y1=142;
  const X=tt=>X0+(X1-X0)*tt/TMAX, Y=v=>Y1-(Y1-Y0)*v;
  let d=""; const N=260;
  for(let i=0;i<=N;i++){ const tt=TMAX*i/N; d+=(i?" L":"M")+X(tt).toFixed(1)+","+Y(Math.min(1,profile(tt,id)/N_FULL)).toFixed(1); }
  const cx=X(t);
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`+
    `<rect width="${W}" height="${H}" rx="8" fill="#141A22"/>`+
    `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#7A8794" stroke-dasharray="4 3"/>`+
    `<text x="${X0}" y="${Y0-4}" font-size="9" fill="#7A8794">full postsynaptic response</text>`+
    `<line x1="${X0}" y1="${Y1}" x2="${X1}" y2="${Y1}" stroke="#3A4650"/>`+
    `<path d="${d}" fill="none" stroke="#3EDAD8" stroke-width="2.4"/>`+
    `<line x1="${cx.toFixed(1)}" y1="8" x2="${cx.toFixed(1)}" y2="${Y1}" stroke="#E0A458" stroke-width="1.3"/>`+
    `<text x="${X0}" y="${H-8}" font-size="9" fill="#8A98A8">postsynaptic response over time →</text>`+
    `</svg>`;
}

function statusHTML(t,id){
  if(t<=0) return "At rest. Press <b>Release transmitter</b> to run the scenario.";
  if(id==="blocked"){
    if(t<0.6) return `<b>${t.toFixed(1)} s:</b> transmitter is released into the cleft — and the drug is already sitting on the transporter.`;
    return `<b>${t.toFixed(1)} s:</b> the transporter is blocked, so transmitter <b>lingers</b> in the cleft. The receptors keep firing (Na⁺ still entering) — the signal is <b>prolonged</b>.`;
  }
  if(id==="withdrawal"){
    if(t<0.6) return `<b>${t.toFixed(1)} s:</b> stores are depleted, so only a <b>small</b> release arrives in the cleft.`;
    return `<b>${t.toFixed(1)} s:</b> the small release is cleared quickly — a <b>weak, brief</b> response. With less dopamine than usual, the user is in withdrawal.`;
  }
  if(t<0.6) return `<b>${t.toFixed(1)} s:</b> transmitter is released into the cleft and the receptors begin to respond.`;
  return `<b>${t.toFixed(1)} s:</b> the transporter pulls transmitter back into the terminal — the cleft clears, the receptors stop, and the response ends.`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns" id="s5-scen"></div>
    <label class="speed">time
      <input type="range" id="s5-time" min="0" max="${TMAX}" step="0.05" value="0">
      <span id="s5-tval">0.0 s</span>
      <button id="s5-play">▶ Release transmitter</button>
    </label>
    <div class="s5-grid">
      <div id="s5-scene"></div>
      <div>
        <div id="s5-trace"></div>
        <p class="p3-caption" id="s5-status"></p>
        <p class="p3-caption" id="s5-note"></p>
      </div>
    </div>
    <p class="p3-caption">After a transmitter activates its receptor, a <b>transporter</b> protein pulls it
      back into the presynaptic cell — <b>reuptake</b>. That clears the cleft, switches the signal off, and
      recycles the molecule. <b>Stimulant drugs</b> — amphetamine and cocaine, and methylphenidate (Ritalin),
      which acts the same way — <b>block the transporter</b>, so transmitter lingers and the effect lasts far
      longer. Later, when the surplus has been broken down and stores run low, the user dips below normal —
      withdrawal.</p>
  </div>`;

  const sceneEl=el.querySelector("#s5-scene"), traceEl=el.querySelector("#s5-trace");
  const statusEl=el.querySelector("#s5-status"), noteEl=el.querySelector("#s5-note");
  const slider=el.querySelector("#s5-time"), tvalEl=el.querySelector("#s5-tval"), scenBox=el.querySelector("#s5-scen");
  let id="normal", raf=null;
  function draw(t){ sceneEl.innerHTML=sceneSVG(t,id); traceEl.innerHTML=traceSVG(t,id); statusEl.innerHTML=statusHTML(t,id);
    tvalEl.textContent=t.toFixed(1)+" s"; }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function play(){
    stop();
    const t0=performance.now(), DUR=6500;
    const step=now=>{ const t=Math.min(TMAX,(now-t0)/DUR*TMAX); slider.value=t; draw(t);
      if(t<TMAX) raf=requestAnimationFrame(step); else raf=null; };
    raf=requestAnimationFrame(step);
  }
  SCEN.forEach(s=>{
    const b=document.createElement("button");
    b.textContent=s.label; b.dataset.id=s.id;
    b.onclick=()=>{ id=s.id; slider.value=0; noteEl.innerHTML=s.note; play(); };
    scenBox.appendChild(b);
  });
  slider.oninput=()=>{ stop(); draw(+slider.value); };
  el.querySelector("#s5-play").onclick=play;

  const q=new URLSearchParams(location.search);
  const sc=q.get("scenario"); if(SCEN.some(s=>s.id===sc)) id=sc;
  noteEl.innerHTML=(SCEN.find(s=>s.id===id)||SCEN[0]).note;
  const ft=q.get("t");
  if(ft!==null){ stop(); slider.value=Math.min(TMAX,+ft); draw(Math.min(TMAX,+ft)); }
  else if(q.get("play")){ play(); }
  else draw(0);
}
