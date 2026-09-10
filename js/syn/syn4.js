import { C } from "../mrs.js";

// S4 · Reflex delay (Kalat Fig 2.1/2.2, Sherrington).
// Same journey, two speeds: an axon conducts at ~40 m/s, but a reflex arc only
// reaches ~15 m/s. The difference is time lost at the junctions between neurons —
// Sherrington's evidence for the synapse. Numbers are illustrative (D = 0.30 m).
const D=0.30, V_AXON=40, V_REFLEX=15;
const T_AXON=D/V_AXON*1000, T_REFLEX=D/V_REFLEX*1000, DELAY_TOTAL=T_REFLEX-T_AXON;
const MAXT=T_REFLEX+1, DUR=8000, D3=D.toFixed(2);

const W=[[135,77],[255,77],[325,77],[435,77],[500,77],[614,44],[680,39],[760,39]];
const SYN={1:true,3:true,5:true};
const N_SYN=Object.keys(SYN).length, DELAY=DELAY_TOTAL/N_SYN;
const TOTL=W.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-W[i][0],p[1]-W[i][1]),0);
const SEGL=W.slice(1).map((p,i)=>Math.hypot(p[0]-W[i][0],p[1]-W[i][1])/TOTL*T_AXON);
const INH_SYN=[600,112], EXT_C=[680,119];

function lerp(a,b,u){ return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u]; }
function signalPos(T){
  let t=0;
  for(let i=0;i<W.length;i++){
    if(SYN[i]&&i>0){ if(T<t+DELAY) return {p:W[i],paused:true,pi:i}; t+=DELAY; }
    if(i<W.length-1){
      if(T<t+SEGL[i]) return {p:lerp(W[i],W[i+1],(T-t)/SEGL[i]),paused:false};
      t+=SEGL[i];
    }
  }
  return {p:W[W.length-1],paused:false};
}
function ghostPos(T){
  let t=0;
  for(let i=0;i<SEGL.length;i++){
    if(T<t+SEGL[i]) return lerp(W[i],W[i+1],(T-t)/SEGL[i]);
    t+=SEGL[i];
  }
  return W[W.length-1];
}

function box(x,y,w,h,label,fs=11){
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="#8A8272" stroke-width="1.4"/>`+
    `<text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="${fs}" fill="#333">${label}</text>`;
}
function exSyn(x,y){ return `<polygon points="0,-8 9,0 0,8" transform="translate(${x},${y})" fill="${C.glu}"/>`; }
function inSyn(x,y){ return `<rect x="-9" y="-4.5" width="18" height="9" rx="2" transform="translate(${x},${y})" fill="${C.gaba}"/>`; }
function muscle(x,y,label){
  return `<ellipse cx="${x}" cy="${y}" rx="34" ry="15" fill="#E9B7A4" stroke="#C08C78" stroke-width="1.3"/>`+
    `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="9.5" fill="#7A4033">${label}</text>`;
}
function clock(cx,cy){
  return `<g transform="translate(${cx},${cy})"><circle r="11" fill="#fff" stroke="#B03A2E" stroke-width="2"/>`+
    `<line x1="0" y1="0" x2="0" y2="-6" stroke="#B03A2E" stroke-width="2"/><line x1="0" y1="0" x2="4" y2="0" stroke="#B03A2E" stroke-width="2"/></g>`;
}
function bar(y,ms,color,label,value){
  const x0=128, ppm=560/MAXT;
  return `<text x="${x0}" y="${y-6}" font-size="11.5" fill="#333">${label}</text>`+
    `<rect x="${x0}" y="${y}" width="560" height="16" rx="8" fill="#F3EFE4"/>`+
    `<rect x="${x0}" y="${y}" width="${(ms*ppm).toFixed(1)}" height="16" rx="8" fill="${color}"/>`+
    `<text x="${(x0+ms*ppm+8).toFixed(1)}" y="${y+13}" font-size="11" fill="#333">${value}</text>`;
}

function sceneSVG(T){
  const sig=signalPos(T), ghost=ghostPos(T), ghostDone=T>=T_AXON, sigDone=T>=T_REFLEX;
  let wires="";
  for(let i=0;i<W.length-1;i++)
    wires+=`<line x1="${W[i][0]}" y1="${W[i][1]}" x2="${W[i+1][0]}" y2="${W[i+1][1]}" stroke="#C9BFA8" stroke-width="3"/>`;
  wires+=`<line x1="${W[4][0]}" y1="${W[4][1]}" x2="${INH_SYN[0]}" y2="${INH_SYN[1]}" stroke="#C9BFA8" stroke-width="3"/>`;
  wires+=`<line x1="${INH_SYN[0]}" y1="${INH_SYN[1]}" x2="${EXT_C[0]}" y2="${EXT_C[1]}" stroke="#C9BFA8" stroke-width="3"/>`;

  const boxes=box(80,60,110,34,"skin receptor")+box(265,60,120,34,"sensory neuron")+
    box(445,60,110,34,"interneuron")+box(620,22,120,34,"flexor motor neuron",10)+
    box(620,102,120,34,"extensor motor neuron",10)+
    muscle(788,39,"flexor muscle")+muscle(790,119,"extensor muscle");

  let syns=exSyn(W[1][0],W[1][1])+exSyn(W[3][0],W[3][1])+exSyn(W[5][0],W[5][1])+inSyn(INH_SYN[0],INH_SYN[1]);
  if(sig.paused) syns+=`<circle cx="${W[sig.pi][0]}" cy="${W[sig.pi][1]}" r="16" fill="#B03A2E" opacity="0.18"/>`+clock(W[sig.pi][0]+26,W[sig.pi][1]-18);
  const ghostDot=`<circle cx="${ghost[0]}" cy="${ghost[1]}" r="7" fill="none" stroke="#DD6C42" stroke-width="2.5" opacity="${ghostDone?0.55:0.8}"/>`+
    (ghostDone?`<text x="760" y="16" text-anchor="middle" font-size="9.5" fill="#C0662F">axon-only ✓</text>`:"");
  const sigDot=`<circle cx="${sig.p[0]}" cy="${sig.p[1]}" r="8" fill="#B03A2E" stroke="#fff" stroke-width="1"/>`+
    (sigDone?`<text x="${W[W.length-1][0]}" y="${W[W.length-1][1]+30}" text-anchor="middle" font-size="10" fill="#B03A2E">arrived ${T_REFLEX.toFixed(0)} ms</text>`:"");

  const ppm=560/MAXT;
  const bars=
    bar(168,T_AXON,"#8AB6E8",`axon only — ${D3} m at 40 m/s`,`${T_AXON.toFixed(1)} ms`)+
    bar(200,T_REFLEX,"#EE9258",`reflex arc — ${D3} m, crossing 3 synapses`,`${T_REFLEX.toFixed(0)} ms → 15 m/s`)+
    `<rect x="${128+T_AXON*ppm}" y="200" width="${(DELAY_TOTAL*ppm).toFixed(1)}" height="16" fill="#B03A2E" opacity="0.5"/>`+
    `<text x="${(128+(T_AXON+DELAY_TOTAL/2)*ppm).toFixed(1)}" y="232" text-anchor="middle" font-size="11" fill="#B03A2E">time lost at the synapses: ${DELAY_TOTAL.toFixed(1)} ms</text>`;

  const chip=`<g transform="translate(348,-30)"><rect x="0" y="0" width="96" height="26" rx="7" fill="#fff" stroke="#999"/>`+
    `<text x="48" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#222">${T.toFixed(1)} ms</text></g>`;

  return `<svg width="100%" viewBox="60 -40 780 295" xmlns="http://www.w3.org/2000/svg">`+
    `<text x="78" y="-16" font-size="11" fill="#888">tap the skin →</text>`+
    chip+wires+boxes+syns+ghostDot+sigDot+bars+
    `<text x="128" y="250" font-size="10.5" fill="#888">time →</text>`+
    `</svg>`;
}

function statusHTML(T){
  if(T<=0) return "At rest. Press <b>Pinch the toe</b> and follow the impulse as it crosses the arc.";
  if(T>=T_REFLEX) return `<b>${T_REFLEX.toFixed(0)} ms:</b> the reflex completes. The axon-only ring finished at ${T_AXON.toFixed(1)} ms; crossing the synapses cost an extra ${DELAY_TOTAL.toFixed(1)} ms — which is why the reflex arc conducts at only ≈15 m/s.`;
  if(signalPos(T).paused){
    const lead=T>=T_AXON?" The axon-only ring has <b>already arrived</b>.":"";
    return `<b>${T.toFixed(1)} ms:</b> the impulse is <b>stuck at a synapse</b> — the gap must be crossed by a chemical signal, which takes time.${lead}`;
  }
  if(T>=T_AXON) return `<b>${T.toFixed(1)} ms:</b> the axon-only ring has <b>arrived</b>, but the real impulse is still crossing the arc and will pause again at the next synapse.`;
  return `<b>${T.toFixed(1)} ms:</b> the impulse races along the axons at ~40 m/s. The hollow ring is how far an impulse with <b>no synapse</b> would already have got.`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns">
      <button id="s4-go">Pinch the toe</button>
      <button id="s4-reset" class="ghostbtn">Reset</button>
    </div>
    <div class="s4-legend">
      <span><svg width="22" height="22" viewBox="-11 -11 22 22"><circle r="7" fill="#B03A2E" stroke="#fff" stroke-width="1"/></svg>the real impulse — it pauses at each synapse</span>
      <span><svg width="22" height="22" viewBox="-11 -11 22 22"><circle r="7" fill="none" stroke="#DD6C42" stroke-width="2.5"/></svg>a hypothetical impulse in one <b>uninterrupted axon</b> (no synapses)</span>
      <span><svg width="22" height="22" viewBox="-11 -11 22 22"><polygon points="0,-8 9,0 0,8" fill="${C.glu}"/></svg>excitatory synapse</span>
      <span><svg width="22" height="22" viewBox="-11 -11 22 22"><rect x="-9" y="-4.5" width="18" height="9" rx="2" fill="${C.gaba}"/></svg>inhibitory synapse</span>
    </div>
    <div id="s4-scene"></div>
    <p class="p3-caption" id="s4-status"></p>
    <p class="p3-caption">Sherrington pinched a dog's foot and timed the reflex. An impulse along a nerve
      travels at ~40 m/s, but his <b>reflex arc</b> never exceeded ~15 m/s. <b>Same journey, different speed</b> —
      so time must be lost where one neuron meets the next. He called that junction the <b>synapse</b>.</p>
    <p class="p3-caption"><b>The arithmetic (schematic path, ${D3} m):</b>
      axon only = ${D3} ÷ 40 m/s = <b>${T_AXON.toFixed(1)} ms</b> &nbsp;·&nbsp;
      reflex arc = ${D3} ÷ 15 m/s = <b>${T_REFLEX.toFixed(0)} ms</b> &nbsp;·&nbsp;
      difference = <b>${DELAY_TOTAL.toFixed(1)} ms</b>, the time spent crossing the synapses.
      A single synapse loses well under a millisecond; the reflex route crosses several, and the arc is
      slower than conduction alone can explain — that shortfall is the evidence for synaptic delay.</p>
  </div>`;

  const sceneEl=el.querySelector("#s4-scene"), statusEl=el.querySelector("#s4-status");
  let raf=null;
  function draw(T){ sceneEl.innerHTML=sceneSVG(T); statusEl.innerHTML=statusHTML(T); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function run(){
    stop();
    const t0=performance.now();
    const step=now=>{
      const T=Math.min(T_REFLEX,(now-t0)/DUR*T_REFLEX);
      draw(T);
      if(T<T_REFLEX) raf=requestAnimationFrame(step); else raf=null;
    };
    raf=requestAnimationFrame(step);
  }
  el.querySelector("#s4-go").onclick=run;
  el.querySelector("#s4-reset").onclick=()=>{ stop(); draw(0); };

  const q=new URLSearchParams(location.search);
  const ft=q.get("t");
  if(ft!==null){ stop(); draw(Math.max(0,Math.min(T_REFLEX,+ft))); }
  else if(q.get("play")==="1") run();
  else draw(0);
}
