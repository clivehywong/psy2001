import { C, apVm, gradedVm, sampleVm, traceSvg, ratesSvg, patchSvg, apChannels, apExtras } from "../mrs.js";

const PRESETS = [
  { id:"f1", label:"Hyperpolarize",        vm:-85, ap:false, d:-15,
    note:"The membrane is pushed further from zero — nothing fires." },
  { id:"f2", label:"Small depolarization", vm:-65, ap:false, d:5,
    note:"A small nudge toward threshold… which quickly fades. No spike." },
  { id:"f3", label:"Slightly stronger",    vm:-58, ap:false, d:12,
    note:"Closer — but still below threshold. The response just fades again." },
  { id:"f4", label:"Reach threshold",      vm:30,  ap:true,  d:0,
    note:"Threshold crossed → a full-size action potential. Every time." },
];


// named ions travel through the channels and STAY on the far side

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns" id="p3-btns"></div>
    <label class="speed">playback speed
      <input type="range" id="p3-speed" min="0.25" max="2" step="0.25" value="1">
      <span id="p3-speed-val">1×</span></label>
    <div class="p3-grid">
      <div id="p3-patch"></div>
      <div id="p3-trace"></div>
    </div>
    <p class="p3-caption" id="p3-note"></p>
    <p class="p3-caption">Press each stimulus and watch the recording. The same membrane,
      the same channels — the only difference is how far the stimulus pushes the voltage.
      <b>Below threshold, every response is small, brief, and fades.</b>
      At threshold, the Na⁺ channels' positive feedback takes over.
      The lower panel shows <b>who is moving and when</b>: Na⁺ rushes in first
      (its channels open at threshold, then snap shut at the peak);
      K⁺ leaves later and longer (its channels open late, close last).</p>
  </div>`;

  const patchEl = el.querySelector("#p3-patch");
  const traceEl = el.querySelector("#p3-trace");
  const noteEl  = el.querySelector("#p3-note");
  const btnBox  = el.querySelector("#p3-btns");
  const speedEl = el.querySelector("#p3-speed");
  speedEl.oninput=()=>{ el.querySelector("#p3-speed-val").textContent=speedEl.value+"×"; };

  PRESETS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p.label;
    b.dataset.id=p.id;
    b.onclick=()=>play(p,b);
    btnBox.appendChild(b);
  });

  let raf=null, wallT=0;
  function draw(p,t){
    const fn=p.ap?apVm:gradedVm(p.d);
    const vm=fn(t);
    const [naSt,kSt]=p.ap?apChannels(t):["closed","almost"];
    patchEl.innerHTML=patchSvg(vm,naSt,kSt,p.ap?apExtras(t):"",wallT);
    traceEl.innerHTML=traceSvg(sampleVm(fn),460,150,t)+ratesSvg(p.ap,t);
  }

  function play(p,b){
    if(raf) cancelAnimationFrame(raf);
    btnBox.querySelectorAll("button").forEach(x=>x.classList.remove("playing"));
    b.classList.add("playing");
    noteEl.innerHTML=`<b>${p.label}:</b> ${p.note}`;
    const t0=performance.now();
    const DUR=8000/+speedEl.value;            // 6 ms of record over 8 s at 1×
    const step=now=>{
      wallT=(now-t0)/1000;
      const t=Math.min(6,(now-t0)/DUR*6);
      draw(p,t);
      if(t<6) raf=requestAnimationFrame(step);
      else { raf=null; b.classList.remove("playing"); }
    };
    raf=requestAnimationFrame(step);
  }

  // rest state; ?play=f4&t=1.75 renders a given instant (deep link / fixture testing)
  draw(PRESETS[3],0);
  const q=new URLSearchParams(location.search);
  const auto=PRESETS.find(p=>p.id===q.get("play"));
  if(auto){
    const fx=q.get("t");
    if(fx!==null){ noteEl.innerHTML=`<b>${auto.label}:</b> ${auto.note}`; draw(auto,Math.min(6,+fx)); }
    else play(auto, btnBox.querySelector(`[data-id="${auto.id}"]`));
  }
}
