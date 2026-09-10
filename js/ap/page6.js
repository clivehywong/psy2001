import { C, G, apVm, apChannels, bilayerBetween, ionField, ionShape, channel, arrow, vmColor, vmInside } from "../mrs.js";

const X0=60, X1=900, V=60;                 // strip extent, wave speed (px per ms)

function stripSvg(tWave){
  const stops=[];
  for(let x=X0;x<=X1;x+=20){
    const tl=tWave-(x-X0)/V;               // local AP time at position x
    stops.push([x,(tl>=0&&tl<=6)?apVm(tl):-70]);
  }
  const gd=(id,fn)=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${X0}" x2="${X1}" y1="0" y2="0">`+
    stops.map(([x,v])=>`<stop offset="${(x-X0)/(X1-X0)}" stop-color="${fn(v)}"/>`).join("")+`</linearGradient>`;
  let inner=`<defs>${gd("p6b",vmColor)}${gd("p6i",vmInside)}</defs>`+
    `<rect x="${X0}" y="100" width="${X1-X0}" height="${G.bandY-32-100}" fill="${C.ecf}"/>`+
    `<rect x="${X0}" y="${G.bandY-32}" width="${X1-X0}" height="${G.bandT}" fill="url(#p6b)"/>`+
    `<rect x="${X0}" y="${G.bandY+32}" width="${X1-X0}" height="100" fill="url(#p6i)"/>`+
    ionField(X0,X1,104,168,250,334,0,26)+
    bilayerBetween(X0,X1,[]);
  for(let x=X0+52;x<X1;x+=52){
    const isNa=Math.round((x-X0-52)/52)%2===0, col=isNa?C.naChan:C.kChan;
    const tl=tWave-(x-X0)/V;
    const [naSt,kSt]=(tl>=0&&tl<=6)?apChannels(tl):["closed","almost"];
    const st=isNa?naSt:kSt, vm=(tl>=0&&tl<=6)?apVm(tl):-70;
    const flow=(isNa&&st==="open")?"na":(!isNa&&st==="open")?"k":null;
    inner+=channel(x,col,st,flow?{ion:flow,ionY:flow==="na"?26:-26,bg:vmColor(vm)}:{bg:vmColor(vm)});
    if(flow==="na") inner+=ionShape(x,G.bandY-52,"na",5.5)+arrow(x-6,G.bandY-72,x-4,G.bandY-40,C.na);
    if(flow==="k")  inner+=ionShape(x,G.bandY+52,"k",5.5)+arrow(x+4,G.bandY+60,x+2,G.bandY+34,C.k);
  }
  inner+=`<circle cx="34" cy="${G.bandY}" r="22" fill="${vmInside(-70)}" stroke="#999" stroke-dasharray="4 3"/>`+
    `<text x="34" y="${G.bandY+40}" text-anchor="middle" font-size="10" fill="#555">soma</text>`+
    arrow(60,130,900,130,"#8a6d3b")+
    `<text x="480" y="120" text-anchor="middle" font-size="11" fill="#8a6d3b">hillock → terminal</text>`;
  return `<svg id="p6-svg" width="100%" viewBox="0 90 960 270" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns"><button id="p6-go">Fire at the hillock</button></div>
    <div id="p6-strip"></div>
    <p class="p3-caption" id="p6-note"></p>
    <p class="p3-caption">The action potential is <b>rebuilt at full size by every patch of membrane</b> —
      that is why it never weakens with distance. While the wave crosses, <b>click anywhere on the axon</b>
      to try stimulating that spot: just behind the wave the Na⁺ channels are padlocked
      (<b>absolute refractory</b> — impossible); further back, in the undershoot, it is merely difficult
      (<b>relative refractory</b> — needs an extra-strong push).</p>
  </div>`;

  const stripEl = el.querySelector("#p6-strip");
  const noteEl  = el.querySelector("#p6-note");
  let tWave=-1, origin=X0, raf=null;

  function draw(){
    stripEl.innerHTML=stripSvg(tWave);
    stripEl.querySelector("#p6-svg").onclick=clickTest;
  }

  function clickTest(ev){
    const r=ev.currentTarget.getBoundingClientRect();
    const x=(ev.clientX-r.left)/r.width*960;
    if(tWave<0){ noteEl.innerHTML="No wave yet — press <b>Fire at the hillock</b> first."; return; }
    const tl=tWave-(x-origin)/V;
    if(tl<1.4)  noteEl.innerHTML="This patch is <b>ahead of the wave</b> — the signal hasn't arrived yet; it fires on schedule, not early.";
    else if(tl<3.3) noteEl.innerHTML="<b>Absolute refractory.</b> The Na⁺ channels here are snapped shut (see the padlock) — no stimulus, however strong, can re-fire this patch right now.";
    else if(tl<5.6) noteEl.innerHTML="<b>Relative refractory.</b> This patch is still below resting (K⁺ channels not yet closed) — it <i>can</i> fire, but only to an extra-strong push.";
    else { noteEl.innerHTML="<b>Recovered — a new wave fires from your click!</b>"; origin=Math.max(X0,Math.min(X1,x)); tWave=0; }
  }

  el.querySelector("#p6-go").onclick=()=>{
    if(raf) cancelAnimationFrame(raf);
    origin=X0; tWave=0;
    const t0=performance.now();
    const step=now=>{
      tWave=(now-t0)/1000*2.2;              // cross in ~7 s
      draw();
      if(tWave<15) raf=requestAnimationFrame(step);
      else { raf=null; tWave=-1; draw(); noteEl.innerHTML="The wave reached the terminal at <b>full strength</b> — same size as when it left the hillock."; }
    };
    raf=requestAnimationFrame(step);
  };

  const q=new URLSearchParams(location.search).get("t");
  if(q!==null){ tWave=+q; }
  draw();
  if(tWave>=0) noteEl.innerHTML=`Wave ${tWave.toFixed(1)} ms into its journey.`;
}
