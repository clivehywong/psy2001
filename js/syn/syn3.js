import { C, vmInside, ionShape, ntShape, along, channel } from "../mrs.js";
import { CS, POST, POST_S, bilayerPath, pathFill, proteinOnPath, metabo, miniBouton } from "../syn.js";

// S3 · Ionotropic vs. metabotropic timing (Kalat Table 2.2, Fig 2.15).
// Same transmitter, two receptor types on one postsynaptic membrane:
// ionotropic = ligand-gated pore, fast/local/brief (ms); metabotropic = GPCR →
// G protein → second messenger (cAMP), slow/widespread/lasting (seconds).
const TMIN=0.0003, TMAX=60, L0=Math.log10(TMIN), L1=Math.log10(TMAX);
const X_IONO=430, X_META=530;
const A_IONO=proteinOnPath(POST_S,X_IONO,346,"",0.19,false).skip;
const A_META=proteinOnPath(POST_S,X_META,346,"",0.19,false).skip;

const PRESETS=[
  { id:"fast", label:"≈1 ms",  t:0.001 },
  { id:"mid",  label:"≈10 ms", t:0.010 },
  { id:"slow", label:"≈1 s",   t:1.0 },
];

const CAMP_DOTS=(()=>{
  let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const out=[];
  for(let i=0;i<36;i++){ const a=rnd()*Math.PI*2, r=Math.sqrt(rnd()); out.push([Math.cos(a)*r,Math.sin(a)*r]); }
  return out;
})();

function fracToT(f){ return Math.pow(10,L0+(L1-L0)*Math.max(0,Math.min(1,f))); }
function tToFrac(t){ return (Math.log10(t)-L0)/(L1-L0); }
function iono(t){
  if(t<=0) return 0;
  const d=Math.log10(t)-Math.log10(0.0015);
  return Math.exp(-(d*d)/(2*0.45*0.45));
}
function meta(t){ return t<=0?0:(t/(t+0.05))*Math.exp(-t/40); }
function tLabel(t){
  const ms=t*1000;
  if(ms<1) return (t*1e6).toFixed(0)+" µs";
  if(ms<10) return (+ms.toFixed(2))+" ms";
  if(ms<1000) return ms.toFixed(0)+" ms";
  return (t<10?t.toFixed(1):t.toFixed(0))+" s";
}

function sceneSVG(t){
  const I=iono(t), M=meta(t);
  const ionoOpen=I>0.15;
  const metaState=M>0.5?"signaling":M>0.05?"bound":"rest";
  let body="";
  const prI=proteinOnPath(POST_S,X_IONO,346,
    `<g transform="translate(-${X_IONO},-210)">${channel(X_IONO,CS.gluR,ionoOpen?"open":"closed",{badge:"R"})}</g>`,0.19,false);
  body+=prI.svg;
  const prM=proteinOnPath(POST_S,X_META,346,
    `<g transform="translate(-${X_META},-210)">${metabo(X_META,210,metaState)}</g>`,0.19,false);
  body+=prM.svg;
  [[X_IONO,A_IONO],[X_META,A_META]].forEach(([x,a])=>{
    const by=a.y-58;
    body+=miniBouton(x,by);
    body+=`<line x1="${x}" y1="${by-33}" x2="${x}" y2="${by-50}" stroke="#9a9a9a" stroke-width="3"/>`;
    body+=ntShape(x,a.y-12,"glu",5);
  });
  let cyto="";
  if(I>0.05){
    cyto+=`<circle cx="${A_IONO.x}" cy="${A_IONO.y+2}" r="22" fill="#EE9258" opacity="${(0.34*I).toFixed(2)}"/>`;
  }
  if(M>0.02){
    const R=24+74*(1-Math.exp(-t/2));
    cyto+=`<ellipse cx="${A_META.x}" cy="${A_META.y+40}" rx="${R.toFixed(1)}" ry="${(R*0.55).toFixed(1)}" fill="${CS.camp}" opacity="${(0.13*M).toFixed(3)}"/>`;
    CAMP_DOTS.forEach((d,i)=>{
      const op=M*(0.65+0.35*(((i*29)%11)/10));
      if(op<=0.02) return;
      cyto+=`<circle cx="${(A_META.x+d[0]*R).toFixed(1)}" cy="${(A_META.y+40+d[1]*R*0.55).toFixed(1)}" r="4" fill="${CS.camp}" opacity="${Math.min(1,op).toFixed(2)}"/>`;
    });
  }
  if(I>0.05){
    for(let k=0;k<2;k++){
      const f=Math.max(0,Math.min(1,0.25+0.55*I-k*0.16));
      const pos=along([[A_IONO.x-3,A_IONO.y+2],[A_IONO.x+3,A_IONO.y+18],[A_IONO.x+5,A_IONO.y+34]],f);
      body+=ionShape(pos[0],pos[1],"na",3.2);
    }
  }
  body+=`<g transform="translate(348,206)"><rect width="118" height="36" rx="9" fill="#fff" stroke="#999"/>`+
    `<text x="59" y="24" text-anchor="middle" font-size="16" font-weight="700" fill="#222">${tLabel(t)}</text></g>`;
  const cellPath=pathFill(POST," L 900 600 L 60 600 Z");
  const inner=`<defs><clipPath id="s3cell"><path d="${cellPath}"/></clipPath></defs>`+
    `<rect x="340" y="200" width="300" height="300" fill="${C.ecf}"/>`+
    `<path d="${cellPath}" fill="${vmInside(-70)}"/>`+
    `<g clip-path="url(#s3cell)">${cyto}</g>`+
    bilayerPath(POST,0.2,[])+body;
  return `<svg width="100%" style="aspect-ratio:1/1" viewBox="340 200 300 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function chartSVG(t){
  const W=540,H=180,X0=46,X1=528,Y0=18,Y1=150;
  const X=lo=>X0+(X1-X0)*(Math.log10(lo)-L0)/(L1-L0);
  const Y=v=>Y1-(Y1-Y0)*v;
  const curve=fn=>{ let d=""; const N=280;
    for(let i=0;i<=N;i++){ const lo=Math.pow(10,L0+(L1-L0)*i/N); d+=(i?" L":"M")+X(lo).toFixed(1)+","+Y(fn(lo)).toFixed(1); }
    return d; };
  const dI=curve(iono), dM=curve(meta);
  const areaI=dI+` L ${X(TMAX).toFixed(1)},${Y(0).toFixed(1)} L ${X(TMIN).toFixed(1)},${Y(0).toFixed(1)} Z`;
  const areaM=dM+` L ${X(TMAX).toFixed(1)},${Y(0).toFixed(1)} L ${X(TMIN).toFixed(1)},${Y(0).toFixed(1)} Z`;
  const ticks=[[0.001,"1 ms"],[0.01,"10 ms"],[0.1,"100 ms"],[1,"1 s"],[10,"10 s"]];
  let grid="";
  ticks.forEach(([lo,l])=>{
    grid+=`<line x1="${X(lo).toFixed(1)}" y1="${Y0}" x2="${X(lo).toFixed(1)}" y2="${Y1}" stroke="#2A3541"/>`+
      `<text x="${X(lo).toFixed(1)}" y="${Y1+12}" text-anchor="middle" font-size="9" fill="#7A8794">${l}</text>`;
  });
  const cx=X(t), cyI=Y(iono(t)), cyM=Y(meta(t));
  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`+
    `<rect width="${W}" height="${H}" rx="8" fill="#141A22"/>`+ grid+
    `<text x="${X0}" y="${Y0+10}" font-size="9.5" fill="#6FBF7A">ionotropic — fast, local, brief (ms)</text>`+
    `<text x="${X1}" y="${Y0+10}" text-anchor="end" font-size="9.5" fill="#9B86D6">metabotropic — slow, widespread, lasting (s)</text>`+
    `<path d="${areaI}" fill="#2E7D32" opacity="0.28"/>`+
    `<path d="${areaM}" fill="${CS.gprotein}" opacity="0.28"/>`+
    `<path d="${dI}" fill="none" stroke="#6FBF7A" stroke-width="2.2"/>`+
    `<path d="${dM}" fill="none" stroke="${CS.gprotein}" stroke-width="2.2"/>`+
    `<line x1="${cx.toFixed(1)}" y1="${Y0}" x2="${cx.toFixed(1)}" y2="${Y1}" stroke="#E0A458" stroke-width="1.4"/>`+
    `<circle cx="${cx.toFixed(1)}" cy="${cyI.toFixed(1)}" r="4" fill="#6FBF7A" stroke="#fff" stroke-width="1"/>`+
    `<circle cx="${cx.toFixed(1)}" cy="${cyM.toFixed(1)}" r="4" fill="${CS.gprotein}" stroke="#fff" stroke-width="1"/>`+
    `<text x="${X0}" y="${Y1+26}" font-size="9" fill="#8A98A8">time since release → (log scale)</text>`+
    `</svg>`;
}

function statusHTML(t){
  const I=iono(t), M=meta(t);
  const iMsg = I>0.5?"open — fast, <b>local</b> depolarization at full effect (lasts only milliseconds)."
    : I>0.1?"effect already fading — the pore has begun to close."
    : "silent — its brief effect is long over.";
  const mMsg = M<0.05?"not started yet — the second messenger is still building."
    : M<0.5?"ramping up — G protein and second messenger accumulating."
    : "fully active — <b>widespread</b> through the cell and <b>long-lasting</b>.";
  return `<div><b>Ionotropic receptor (fast):</b> ${iMsg}</div>`+
    `<div><b>Metabotropic receptor (slow):</b> ${mMsg}</div>`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns" id="s3-presets"></div>
    <label class="speed">time since transmitter release
      <input type="range" id="s3-time" min="0" max="1" step="0.002" value="0">
      <span id="s3-tval">1 ms</span>
      <button id="s3-play" class="ghostbtn">▶ Sweep time</button>
    </label>
    <div class="s3-grid">
      <div id="s3-scene"></div>
      <div>
        <div id="s3-chart"></div>
        <p class="p3-caption" id="s3-status"></p>
      </div>
    </div>
    <p class="p3-caption">The same glutamate molecule can act in two ways. A
      <b>ionotropic</b> receptor is itself a pore: it opens within a millisecond, lets Na⁺ in
      <b>locally</b>, and shuts again almost immediately. A <b>metabotropic</b> receptor has no pore —
      it releases a G protein that makes a <b>second messenger</b>, which spreads through much of the
      cell: slower to start (~100 ms+), but <b>wider</b> and <b>longer</b>. Two speeds, one transmitter.</p>
  </div>`;

  const sceneEl=el.querySelector("#s3-scene"), chartEl=el.querySelector("#s3-chart");
  const statusEl=el.querySelector("#s3-status"), tvalEl=el.querySelector("#s3-tval");
  const slider=el.querySelector("#s3-time"), presetBox=el.querySelector("#s3-presets");

  let raf=null;
  function draw(t){
    sceneEl.innerHTML=sceneSVG(t);
    chartEl.innerHTML=chartSVG(t);
    statusEl.innerHTML=statusHTML(t);
    tvalEl.textContent=tLabel(t);
  }
  function stopSweep(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }

  PRESETS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p.label; b.dataset.id=p.id;
    b.onclick=()=>{ stopSweep(); slider.value=tToFrac(p.t); draw(p.t); };
    presetBox.appendChild(b);
  });
  slider.oninput=()=>{ stopSweep(); draw(fracToT(+slider.value)); };
  el.querySelector("#s3-play").onclick=()=>{
    stopSweep();
    const t0=performance.now(), DUR=9000;
    const step=now=>{
      const f=Math.min(1,(now-t0)/DUR);
      slider.value=f; draw(fracToT(f));
      if(f<1) raf=requestAnimationFrame(step); else raf=null;
    };
    raf=requestAnimationFrame(step);
  };

  const q=new URLSearchParams(location.search);
  const preset=PRESETS.find(p=>p.id===q.get("preset"));
  const ft=q.get("t");
  if(ft!==null){ stopSweep(); slider.value=tToFrac(Math.max(TMIN,Math.min(TMAX,+ft/1000))); draw(Math.max(TMIN,Math.min(TMAX,+ft/1000))); }
  else if(preset){ stopSweep(); slider.value=tToFrac(preset.t); draw(preset.t); }
  else if(q.get("play")==="1"){
    const t0=performance.now(), DUR=9000;
    const step=now=>{ const f=Math.min(1,(now-t0)/DUR); slider.value=f; draw(fracToT(f)); if(f<1) raf=requestAnimationFrame(step); else raf=null; };
    raf=requestAnimationFrame(step);
  }
  else { slider.value=tToFrac(0.001); draw(0.001); }
}
