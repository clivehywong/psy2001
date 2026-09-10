import { C, vmInside, mvChip, ionShape, channel, tag, along } from "../mrs.js";
import { bilayerPath } from "../syn.js";

// S6 · Gap junction — an electrical synapse (Kalat Fig 2.17).
// Two membranes touch directly; large pores line up pore-to-pore and are always open.
// Depolarize one cell and Na⁺ flows straight into the other: no cleft, no transmitter,
// no delay — the two neurons act as if they were a single neuron.
const TMAX=3, TSTEP=0.5, TAU=0.35, V_REST=-70, V_DEP=10;

function vmA(t){ return t<TSTEP?V_REST:V_DEP; }
function vmB(t){ return t<TSTEP?V_REST:V_DEP+(V_REST-V_DEP)*Math.exp(-(t-TSTEP)/TAU); }
function flow(t){ return Math.max(0,Math.min(1,(vmA(t)-vmB(t))/(V_DEP-V_REST))); }

const PORES=[430,490,550];
const MEM_T=202, MEM_B=222;

// each neuron has its own membrane; their pores line up pore-to-pore across the junction
function poreAt(x,memY,flip){
  return `<g transform="translate(${x},${memY}) scale(0.19) ${flip?"scale(1 -1)":""} translate(${-x},-210)">${channel(x,C.alwaysOpen,"open")}</g>`;
}

function sceneSVG(t){
  const a=vmA(t), b=vmB(t), fl=flow(t);
  let inner=`<rect x="330" y="110" width="340" height="92" fill="${vmInside(a)}"/>`+
    `<rect x="330" y="222" width="340" height="148" fill="${vmInside(b)}"/>`+
    bilayerPath([[330,MEM_T],[670,MEM_T]],0.2)+
    bilayerPath([[330,MEM_B],[670,MEM_B]],0.2);
  PORES.forEach((x,pi)=>{
    inner+=poreAt(x,MEM_T,false)+poreAt(x,MEM_B,true);
    if(fl>0.02){
      for(let k=0;k<2;k++){
        const ph=(t*1.3+k*0.5+pi*0.2)%1;
        const p=along([[x,176],[x,MEM_T],[x,MEM_B],[x,250]],ph);
        inner+=ionShape(p[0],p[1],"na",3.6);
      }
    }
  });
  inner+=`<text x="342" y="126" font-size="11" fill="#555">presynaptic neuron</text>`+
    `<text x="342" y="252" font-size="11" fill="#555">postsynaptic neuron</text>`+
    mvChip(342,132,a)+mvChip(342,326,b)+
    (fl<0.05&&t>=TSTEP?tag(500,300,"acting as a single neuron","#2F6DB5"):"");
  return `<svg width="100%" style="aspect-ratio:340/260" viewBox="330 110 340 260" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function statusHTML(t){
  if(t<TSTEP) return "Both cells at rest (−70 mV). Press <b>Depolarize cell A</b> and watch cell B.";
  if(flow(t)>0.05) return `<b>${t.toFixed(2)} s:</b> cell A is depolarized, so Na⁺ pours straight through the aligned pores into cell B — no cleft, no transmitter, no delay. Cell B is rising to follow.`;
  return `<b>${t.toFixed(2)} s:</b> the two cells now sit at the <b>same voltage</b> — they charge together and act as a single neuron. (The pores never close.)`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns">
      <button id="s6-go">Depolarize cell A</button>
      <button id="s6-reset" class="ghostbtn">Reset</button>
    </div>
    <div id="s6-scene"></div>
    <p class="p3-caption" id="s6-status"></p>
    <p class="p3-caption">A <b>gap junction</b> is an <b>electrical synapse</b>. The two membranes touch
      directly and their large pores line up <b>pore-to-pore</b>, always open. Depolarize one cell and Na⁺
      passes <b>straight into</b> the other — so the cells share one voltage and behave as if they were a
      <b>single neuron</b>. No cleft, no neurotransmitter, no synaptic delay: faster than even the fastest
      chemical synapse. That speed is why electrical synapses run circuits where <b>exact synchrony</b>
      matters — the cells that pace your breathing, and the escape reflexes of many animals.</p>
  </div>`;

  const sceneEl=el.querySelector("#s6-scene"), statusEl=el.querySelector("#s6-status");
  let raf=null;
  function draw(t){ sceneEl.innerHTML=sceneSVG(t); statusEl.innerHTML=statusHTML(t); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function run(){
    stop();
    const t0=performance.now(), DUR=3000;
    const step=now=>{ const t=Math.min(TMAX,(now-t0)/DUR*TMAX); draw(t);
      if(t<TMAX) raf=requestAnimationFrame(step); else raf=null; };
    raf=requestAnimationFrame(step);
  }
  el.querySelector("#s6-go").onclick=run;
  el.querySelector("#s6-reset").onclick=()=>{ stop(); draw(0); };

  const q=new URLSearchParams(location.search);
  const ft=q.get("t");
  if(ft!==null){ stop(); draw(Math.max(0,Math.min(TMAX,+ft))); }
  else if(q.get("play")==="1") run();
  else draw(0);
}
