import { G, C, restSvg, pump, ionShape, vmColor, patchSvg, arrow } from "../mrs.js";

// pump cycle frames (board card 5): approach → bind → flip out → bind K⁺ → flip in
const CYCLE=[
  ["openDown","none",x=>[-6,2,8].map((dx,i)=>ionShape(x+dx,G.bandY+58+i*8,"na",6.5)).join(""),"1 · 3 Na⁺ inside approach the inside-facing mouth"],
  ["openDown","na",()=>"","2 · 3 Na⁺ bind the sites facing inside"],
  ["openUp","none",x=>[[-10,-58],[0,-74],[10,-56]].map(([dx,dy])=>ionShape(x+dx,G.bandY+dy,"na",6.5)).join(""),"3 · flip (uses energy) → mouth now faces outside, 3 Na⁺ released"],
  ["openUp","k",()=>"","4 · 2 K⁺ from outside bind the sites facing outside"],
  ["openDown","none",x=>[[6,60],[16,74]].map(([dx,dy])=>ionShape(x+dx,G.bandY+dy,"k",6.5)).join(""),"5 · flip → 2 K⁺ released inside — cycle repeats"],
];

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns"><button id="p2-toggle">Turn off the pump</button></div>
    <div class="p3-grid">
      <div id="p2-patch"></div>
      <div>
        <div id="p2-cycle" class="p2-cycle"></div>
        <p class="p3-caption">The Na⁺/K⁺ pump is one protein complex whose binding sites
          <b>alternate access</b>: facing in → load 3 Na⁺ → flip (costs energy) → facing out → release them,
          load 2 K⁺ → flip back → release them. It flips constantly, but each flip moves only
          <b>3 Na⁺ out, 2 K⁺ in</b> — one net positive charge out per flip, keeping the inside slightly
          negative. Its job is <b>maintenance, not speed</b>: the millisecond spikes are the channels' doing;
          the pump slowly re-stocks the gradients afterwards (Kalat: it "takes time").</p>
      </div>
    </div>
    <p class="p3-caption" id="p2-note"></p>
    <hr style="border:none;border-top:1px solid #E2DAC6;margin:18px 0">
    <h3 style="margin:2px 0 10px">"Voltage-gated" means voltage-gated — try it</h3>
    <label class="speed">membrane voltage
      <input type="range" id="p2-vg" min="-80" max="-30" step="1" value="-70">
      <span id="p2-vg-val">−70 mV</span></label>
    <div id="p2-vgbox"></div>
    <p class="p3-caption" id="p2-vgnote">There is no button on the channel — <b>voltage itself is the signal</b>.
      Drag the voltage: past threshold (≈ −55 mV) the Na⁺ channel's protein changes shape and the pore opens,
      and Na⁺ pours in. This is the channel that drives the action potentials on Pages 3–7.</p>
  </div>`;

  const patchEl = el.querySelector("#p2-patch");
  const noteEl  = el.querySelector("#p2-note");
  const togEl   = el.querySelector("#p2-toggle");

  // static cycle legend
  el.querySelector("#p2-cycle").innerHTML = CYCLE.map(([st,seat,ex,cap])=>
    `<div class="p2-frame"><svg width="100" height="150" viewBox="-52 122 100 175">${
      pump(0,st,seat,vmColor(-70))+ex(0)}</svg><div class="p2-cap">${cap}</div></div>`).join("");

  let on=true, vm=-70, simT=0, phase=0, last=performance.now(), raf=null;
  function step(now){
    if(!el.isConnected){ raf=null; return; }
    const dt=(now-last)/1000; last=now;
    if(on){
      vm+= ( -70-vm )*Math.min(1,dt*0.8);        // pump restores
      phase=(phase+dt/0.55)%5;
    }else{
      vm=Math.min(-32, vm+1.9*dt);               // Na⁺ leaks in (real rundown takes minutes)
    }
    simT+=dt;
    const states=["openDown","openDown","openUp","openUp","openDown"];
    const seats =["none","na","none","k","none"];
    const ps=on?states[Math.floor(phase)]:"closed";
    const seat=on?seats[Math.floor(phase)]:"none";
    const extraNa=Math.max(0,Math.round((vm+70)/38*6));
    patchEl.innerHTML=restSvg(vm,ps,extraNa,!on,seat,phase);
    noteEl.innerHTML = on
      ? `<b>Pump cycling</b> — resting potential holds at ${vm.toFixed(0)} mV.`
      : `<b>Pump off — t ≈ ${simT.toFixed(0)} min</b> (greatly sped up here): Na⁺ leaking in, the inside drifts toward zero… this is why the pump matters.`;
    raf=requestAnimationFrame(step);
  }

  togEl.onclick=()=>{
    on=!on;
    togEl.textContent=on?"Turn off the pump":"Turn the pump back on";
    if(!on) simT=0;
  };

  // voltage-gated demo card
  const vgEl=el.querySelector("#p2-vg"), vgBox=el.querySelector("#p2-vgbox"), vgVal=el.querySelector("#p2-vg-val");
  const vgNote=el.querySelector("#p2-vgnote");
  let vgT=0;
  function vgAlong(f){  // one ion's loop: outside → pore → inside
    const path=[[355,132],[398,162],[408,205],[412,250],[398,300]];
    f=((f%1)+1)%1; const e=f;  // linear loop
    const seg=(path.length-1)*e, i=Math.min(path.length-2,Math.floor(e*(path.length-1))), u=seg-i;
    const a=path[i], b=path[i+1];
    return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u];
  }
  function vgDraw(){
    const vm=+vgEl.value, open=vm>=-55;
    vgVal.textContent=(vm<0?"−"+(-vm):"+"+vm)+" mV";
    let extras="";
    if(open){
      vgT+=0.03;
      [0,0.5].forEach(off=>{
        const [x,y]=vgAlong(vgT+off);
        extras+=ionShape(x,y,"na",6.5);
      });
      extras+=arrow(388,148,392,196,C.na);
    }
    vgBox.innerHTML=patchSvg(vm,open?"open":"closed","almost",extras,0);
    vgNote.innerHTML=open
      ? "<b>−55 mV or above: the pore is open.</b> The protein flipped shape on voltage alone — Na⁺ pours in (watch the stream). This is the channel that drives Pages 3–7."
      : "Below −55 mV the pore is shut. There is no button on the channel — <b>voltage itself is the signal</b>. Drag up…";
  }
  vgEl.oninput=vgDraw;
  if(new URLSearchParams(location.search).get('vg')!==null) vgEl.value=new URLSearchParams(location.search).get('vg');
  vgDraw();
  (function vgLoop(){
    if(!el.isConnected) return;
    if(+vgEl.value>=-55) vgDraw();
    requestAnimationFrame(vgLoop);
  })();

  // fixtures: ?ph=2.5 renders one cycle instant and freezes; ?off=1&t=12 for pump-off
  const q=new URLSearchParams(location.search);
  if(q.get("ph")!==null){
    const ph=+q.get("ph");
    patchEl.innerHTML=restSvg(-70,["openDown","openDown","openUp","openUp","openDown"][Math.floor(Math.min(4.999,ph))],0,false,["none","na","none","k","none"][Math.floor(Math.min(4.999,ph))],ph);
  }
  if(q.get("off")==="1"){
    on=false; togEl.textContent="Turn the pump back on";
    simT=+(q.get("t")??0);
    vm=Math.min(-32,-70+1.9*simT);
    const extraNa=Math.max(0,Math.round((vm+70)/38*6));
    patchEl.innerHTML=restSvg(vm,"closed",extraNa,true,"none");
    noteEl.innerHTML=`<b>Pump off — t ≈ ${simT.toFixed(0)} min</b> (greatly sped up here): Na⁺ leaking in, inside drifting toward zero.`;
  }
  if(q.get("ph")===null&&q.get("off")===null) raf=requestAnimationFrame(step);
}
