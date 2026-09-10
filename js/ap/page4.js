import { C, apVm, gradedVm, sampleVm, traceSvg, ratesSvg, patchSvg, apChannels, apExtras } from "../mrs.js";

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="p4-controls">
      <div class="p4-barbox" id="p4-bar"></div>
      <input type="range" id="p4-str" min="0.5" max="2" step="0.05" value="0.8">
      <div class="p4-btns">
        <button id="p4-go">Stimulate</button>
        <button id="p4-clear" class="ghostbtn">Clear traces</button>
      </div>
    </div>
    <div class="p3-grid">
      <div id="p4-patch"></div>
      <div id="p4-trace"></div>
    </div>
    <p class="p3-caption" id="p4-note"></p>
    <p class="p3-caption">Choose a press strength, then stimulate. <b>Below threshold</b> the response is a small,
      brief bump that fades — and it fades completely. <b>At or above threshold</b> the spike is always the
      same full size — press harder and it does not get bigger. Stimulate twice above threshold and compare the
      ghost traces: identical.</p>
  </div>`;

  const patchEl = el.querySelector("#p4-patch");
  const traceEl = el.querySelector("#p4-trace");
  const noteEl  = el.querySelector("#p4-note");
  const strEl   = el.querySelector("#p4-str");
  const barBox  = el.querySelector("#p4-bar");

  let ghosts=[], raf=null, wallT=0;

  function bar(){
    const s=+strEl.value, f=(s-0.5)/1.5, ft=(1-0.5)/1.5;
    barBox.innerHTML=`<svg width="300" height="52" viewBox="0 0 300 52">
      <rect x="30" y="18" width="240" height="16" rx="8" fill="#eee" stroke="#bbb"/>
      <rect x="30" y="18" width="${240*f}" height="16" rx="8" fill="#8a6d3b"/>
      <line x1="${30+240*ft}" y1="10" x2="${30+240*ft}" y2="42" stroke="#B03A2E" stroke-width="2"/>
      <text x="${30+240*ft}" y="8" text-anchor="middle" font-size="10" fill="#B03A2E">threshold</text>
      <text x="150" y="50" text-anchor="middle" font-size="11" fill="#555">press strength ${s}×</text>
    </svg>`;
  }

  function vmFn(s){ return s<1 ? gradedVm(15*s) : apVm; }

  function draw(fn,ap,t){
    const vm=fn(t);
    const [naSt,kSt]=ap?apChannels(t):["closed","almost"];
    patchEl.innerHTML=patchSvg(vm,naSt,kSt,ap?apExtras(t):"",wallT);
    traceEl.innerHTML=traceSvg(sampleVm(fn),460,150,t,ghosts)+ratesSvg(ap,t);
  }

  function note(s){
    noteEl.innerHTML = s<1
      ? `<b>${s}× — below threshold:</b> a small, brief bump… and it's gone. Nothing fired.`
      : `<b>${s}× — at/above threshold:</b> the full-size action potential. Same size as any supra-threshold press.`;
  }

  function play(s){
    if(raf) cancelAnimationFrame(raf);
    note(s);
    const fn=vmFn(s), ap=s>=1;
    const t0=performance.now(), DUR=8000;
    const step=now=>{
      wallT=(now-t0)/1000;
      const t=Math.min(6,(now-t0)/DUR*6);
      draw(fn,ap,t);
      if(t<6) raf=requestAnimationFrame(step);
      else {
        raf=null;
        ghosts.push(sampleVm(fn));
        if(ghosts.length>4) ghosts.shift();
      }
    };
    raf=requestAnimationFrame(step);
  }

  strEl.oninput=bar;
  el.querySelector("#p4-go").onclick=()=>play(+strEl.value);
  el.querySelector("#p4-clear").onclick=()=>{ ghosts=[]; draw(vmFn(+strEl.value),+strEl.value>=1,0); };

  // fixtures: ?s=1.5&t=1.9 renders an instant; &ghost=ap pre-seeds an AP ghost
  const q=new URLSearchParams(location.search);
  const s=+ (q.get("s") ?? 0.8);
  strEl.value=s; bar();
  if(q.get("ghost")==="ap") ghosts.push(sampleVm(apVm));
  draw(vmFn(s),s>=1,+(q.get("t") ?? 0));
  if(q.get("s")) note(s);
}
