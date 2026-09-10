import { C, apVm, sampleVm, traceSvg, ratesSvg, patchSvg, apChannels, apExtras } from "../mrs.js";

const STOPS=[
  ["Rest",       0,    "Na⁺ and K⁺ channels closed — no flow, inside −70 mV."],
  ["Threshold",  1.58, "−55 mV — Na⁺ channels start to open; the positive feedback begins."],
  ["Rising",     1.69, "Na⁺ streaming in — the inside rushes toward positive."],
  ["Peak",       1.9,  "+30 mV — Na⁺ channels snapped shut (refractory); K⁺ open."],
  ["Falling",    2.2,  "K⁺ streaming out — the inside falls back down."],
  ["Undershoot", 4.4,  "K⁺ still leaving — dips below resting (−85 mV)."],
  ["Recovered",  5.9,  "Back to −70 mV — a few Na⁺ in, a few K⁺ out; the pump will swap them."],
];

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="p3-grid">
      <div id="p5-patch"></div>
      <div id="p5-trace"></div>
    </div>
    <div class="p5-scrub">
      <input type="range" id="p5-slider" min="0" max="6" step="0.01" value="0">
      <div class="p5-stops" id="p5-stops"></div>
    </div>
    <p class="p3-caption" id="p5-note"></p>
    <p class="p3-caption">Drag the slider (or tap a stop) to scrub through one action potential.
      Watch the channels, the traveling ions, the +/− lining, and the Na⁺/K⁺ rate curves —
      they always agree with the cursor.</p>
  </div>`;

  const patchEl = el.querySelector("#p5-patch");
  const traceEl = el.querySelector("#p5-trace");
  const noteEl  = el.querySelector("#p5-note");
  const slider  = el.querySelector("#p5-slider");
  const stopBox = el.querySelector("#p5-stops");

  STOPS.forEach(([nm,t])=>{
    const b=document.createElement("button");
    b.textContent=nm;
    b.onclick=()=>{ slider.value=t; draw(+slider.value); };
    stopBox.appendChild(b);
  });

  function draw(t){
    const [naSt,kSt]=apChannels(t);
    patchEl.innerHTML=patchSvg(apVm(t),naSt,kSt,apExtras(t),0);
    traceEl.innerHTML=traceSvg(sampleVm(apVm),460,150,t)+ratesSvg(true,t);
    let best=0, bd=1e9;
    STOPS.forEach(([nm,st],i)=>{
      const d=Math.abs(st-t);
      if(d<bd){ bd=d; best=i; }
    });
    stopBox.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("active", i===best&&bd<0.25));
    if(bd<0.25) noteEl.innerHTML=`<b>${STOPS[best][0]}:</b> ${STOPS[best][2]}`;
    else noteEl.innerHTML=`<b>t = ${t.toFixed(2)} ms</b> — between stops; drag slowly and watch the transitions.`;
  }

  slider.oninput=()=>draw(+slider.value);
  const q=new URLSearchParams(location.search).get("t");
  slider.value=q!==null?Math.min(6,Math.max(0,+q)):0;
  draw(+slider.value);
}
