import { arrow } from "../mrs.js";

// two models of an axon: a decaying wave on a wire vs. regeneration down a chain of people
function wireSVG(f){   // f = progress 0..1
  const x0=20, x1=340, y=80, w=24;
  const cx=x0+f*(x1-x0);
  const amp=25*(1-0.82*f);
  let d=`M ${x0} ${y}`;
  for(let x=x0;x<=x1;x+=4){
    const dy=amp*Math.exp(-Math.pow((x-cx)/w,2));
    d+=` L ${x} ${(y-dy).toFixed(1)}`;
  }
  return `<text x="8" y="16" font-size="12" fill="#555">if axons were wires…</text>`+
    `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#C9BFA8" stroke-width="2"/>`+
    `<path d="${d}" fill="none" stroke="#E08A63" stroke-width="3.6" stroke-linecap="round"/>`+
    `<text x="8" y="112" font-size="11" fill="#555">nothing re-ignites it — the wave just fades</text>`;
}
function chainSVG(f){
  const n=9, lit=Math.floor(f*(n-1));
  let s=`<text x="8" y="16" font-size="12" fill="#555">how axons actually work</text>`;
  for(let i=0;i<n;i++){
    const x=40+i*38, on=i<=lit&&f>0;
    s+=`<g transform="translate(${x},52)"><circle cy="-8" r="5" fill="${on?"#B8652A":"#5C6B7A"}"/><line x1="0" y1="-3" x2="0" y2="14" stroke="${on?"#B8652A":"#5C6B7A"}" stroke-width="2"/><line x1="-6" y1="4" x2="6" y2="4" stroke="${on?"#B8652A":"#5C6B7A"}" stroke-width="2"/><line x1="0" y1="14" x2="-5" y2="26" stroke="${on?"#B8652A":"#5C6B7A"}" stroke-width="2"/><line x1="0" y1="14" x2="5" y2="26" stroke="${on?"#B8652A":"#5C6B7A"}" stroke-width="2"/></g>`;
  }
  s+=`<text x="8" y="112" font-size="11" fill="#555">each person = one patch of membrane — re-fires it, full size</text>`;
  return s;
}

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns"><button id="p1-go">Send a pulse</button></div>
    <div class="p1-grid">
      <div><svg id="p1-wire" width="360" height="150" viewBox="0 0 360 150"></svg></div>
      <div><svg id="p1-chain" width="360" height="150" viewBox="0 0 360 150"></svg>
        ${""}
      </div>
    </div>
    <p class="p3-caption" id="p1-note"></p>
    <p class="p3-caption">Two guesses about how a signal could travel. On a <b>wire</b>, a wave decays with
      distance — an axon made of wire could never reach a giraffe's foot. But an axon works like a
      <b>chain of people</b>: each person is <b>one patch of membrane</b>, packed with the voltage-gated
      Na⁺ channels you'll meet on Page 2. When the squeeze (a small depolarization) reaches a patch, that patch
      <b>fires its own fresh, full-size action potential</b> — which squeezes the next person's hand.
      Regeneration, not conduction: the signal never weakens. The next pages take that one "squeeze" apart.</p>
  </div>`;

  const w=el.querySelector("#p1-wire"), c=el.querySelector("#p1-chain");
  const draw=f=>{ w.innerHTML=wireSVG(f)+arrow(30,135,330,135,"#8a6d3b"); c.innerHTML=chainSVG(f)+arrow(30,135,330,135,"#8a6d3b"); };
  draw(0);
  let raf=null;
  el.querySelector("#p1-go").onclick=()=>{
    if(raf) cancelAnimationFrame(raf);
    const t0=performance.now();
    const step=now=>{
      const f=Math.min(1,(now-t0)/2600);
      draw(f);
      if(f<1) raf=requestAnimationFrame(step);
      else { raf=null; el.querySelector("#p1-note").innerHTML="Wire: the pulse arrived <b>shrunken</b>. Chain: it arrived <b>full size</b>."; }
    };
    raf=requestAnimationFrame(step);
  };

  const q=new URLSearchParams(location.search).get("f");
  if(q!==null) draw(+q);
}
