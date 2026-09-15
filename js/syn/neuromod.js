import { C } from "../mrs.js";

// Neuromodulators & volume transmission (Kalat Table 2.2).
// Neurotransmitter: released at the axon terminal, receptors adjacent, sudden onset, milliseconds.
// Neuromodulator: released from cell body / dendrites / axon sides, receptors spread out,
// gradual onset, seconds to minutes — a diffusing "cloud" reaching many cells.
const DUR=2600;

function ntReceptor(x,y,on){
  return `<g transform="translate(${x},${y})"><rect x="-7" y="-14" width="14" height="22" rx="6" fill="#F0EAD6" stroke="#C9B466"/>`+
    `<circle cy="-17" r="4" fill="${on?C.glu:"#DAD2BC"}"/></g>`;
}
function modReceptor(x,y,str){
  return `<g transform="translate(${x},${y})" opacity="${(0.5+0.5*str).toFixed(2)}"><rect x="-6" y="-12" width="12" height="19" rx="5" fill="#EFE7F6" stroke="${C.mod===undefined?"#7E57C2":"#7E57C2"}"/>`+
    `<circle cy="-14" r="3.5" fill="${str>0.4?"#7E57C2":"#DAD2BC"}"/></g>`;
}

function sceneSVG(p){
  let s=`<rect x="10" y="10" width="360" height="300" rx="12" fill="#FBF8F0" stroke="#EDE6D4"/>`+
    `<rect x="390" y="10" width="360" height="300" rx="12" fill="#FBF8F0" stroke="#EDE6D4"/>`+
    `<text x="30" y="38" font-size="13" font-weight="700" fill="#333">Neurotransmitter</text>`+
    `<text x="30" y="55" font-size="10.5" fill="#8A8272">fast · local · brief</text>`+
    `<text x="410" y="38" font-size="13" font-weight="700" fill="#333">Neuromodulator</text>`+
    `<text x="410" y="55" font-size="10.5" fill="#8A8272">slow · widespread · lasting</text>`;

  // ---- left: point-to-point ----
  const ntOut=p>0.05 ? (p<0.42?1:Math.max(0,1-(p-0.42)/0.35)) : 0;
  s+=`<path d="M150 66 q-26 0 -26 30 q0 30 26 34 q26 -4 26 -34 q0 -30 -26 -30 Z" fill="${C.icf}" stroke="#C9B466"/>`+
    `<text x="150" y="108" text-anchor="middle" font-size="9" fill="#8a7a4a">terminal</text>`;
  [[128,150],[150,168],[172,150]].forEach(([x,y])=>s+=`<polygon points="0,-6 5,4 -5,4" transform="translate(${x},${y})" fill="${C.glu}" opacity="${(0.15+0.85*ntOut).toFixed(2)}"/>`);
  s+=`<line x1="30" y1="210" x2="350" y2="210" stroke="#E7DFC8" stroke-width="2"/>`;
  [150,170,190].forEach(x=>s+=ntReceptor(x,210,ntOut>0.5));
  s+=`<text x="30" y="250" font-size="10.5" fill="#555">released at the axon terminal</text>`+
     `<text x="30" y="266" font-size="10.5" fill="#555">receptors immediately adjacent</text>`+
     `<text x="30" y="282" font-size="10.5" fill="#555">sudden onset · lasts a few milliseconds</text>`;

  // ---- right: volume transmission ----
  const modOut=Math.max(0,Math.min(1,p*1.4));
  const R=26+92*Math.min(1,p*1.15);
  s+=`<circle cx="560" cy="96" r="18" fill="${C.icf}" stroke="#8A8272"/>`+
     `<line x1="560" y1="78" x2="560" y2="60" stroke="#8A8272" stroke-width="2"/>`+
     `<line x1="548" y1="88" x2="520" y2="74" stroke="#8A8272" stroke-width="2"/>`+
     `<line x1="572" y1="88" x2="600" y2="74" stroke="#8A8272" stroke-width="2"/>`+
     `<line x1="560" y1="114" x2="560" y2="140" stroke="#8A8272" stroke-width="2"/>`+
     `<text x="560" y="100" text-anchor="middle" font-size="8.5" fill="#666">cell body</text>`;
  [[520,74],[600,74],[560,62],[560,140]].forEach(([x,y],i)=>{
    const k=Math.max(0,Math.min(1,(p-i*0.05)*1.6));
    s+=`<circle cx="${x}" cy="${y}" r="${(3+5*k).toFixed(1)}" fill="#7E57C2" opacity="${(0.85*k).toFixed(2)}"/>`;
  });
  s+=`<circle cx="560" cy="170" r="${R.toFixed(0)}" fill="#7E57C2" opacity="${(0.16*modOut).toFixed(2)}"/>`+
     `<circle cx="560" cy="170" r="${(R*0.6).toFixed(0)}" fill="#7E57C2" opacity="${(0.14*modOut).toFixed(2)}"/>`;
  [[452,206],[500,224],[560,236],[620,224],[668,206]].forEach(([x,y],i)=>{
    const str=Math.max(0,Math.min(1,(modOut-0.15*i)*1.6));
    s+=modReceptor(x,y,str);
  });
  s+=`<text x="410" y="266" font-size="10.5" fill="#555">released from cell body, dendrites, axon sides</text>`+
     `<text x="410" y="282" font-size="10.5" fill="#555">receptors spread out · gradual onset · lasts seconds–minutes</text>`;

  return `<svg width="100%" viewBox="0 0 770 320" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

function statusHTML(p){
  if(p<=0.02) return "At rest. Press <b>Release</b> and compare the two.";
  if(p<0.45) return `<b>Neurotransmitter (left):</b> transmitter crosses the narrow cleft and hits receptors right beneath the terminal — the effect is <b>sudden, local and brief</b>.`;
  if(p<0.8) return `<b>Neuromodulator (right):</b> released in a diffuse cloud from the cell body, dendrites and axon sides, it spreads to <b>scattered</b> receptors — a <b>gradual</b> effect over many cells.`;
  return `Now compare: the transmitter's effect is already <b>over</b>, while the neuromodulator is still <b>spreading and acting</b> — seconds to minutes. Same molecule family, very different messages.`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns">
      <button id="nm-go">Release</button>
      <button id="nm-reset" class="ghostbtn">Reset</button>
    </div>
    <div id="nm-scene"></div>
    <p class="p3-caption" id="nm-status"></p>
    <p class="p3-caption">The nervous system uses chemicals in two very different ways (Kalat Table 2.2).
      A <b>neurotransmitter</b> is released at the axon terminal onto receptors <b>right beside it</b> — fast, local,
      milliseconds (think of glutamate and GABA in vision and hearing). A <b>neuromodulator</b> is released from the
      <b>cell body, dendrites, or the sides of the axon</b> and diffuses to receptors <b>spread out</b> over a wider
      area — slower to start, but it lasts seconds to minutes and affects many cells. A burst from a cluster of axons
      releases a <b>cloud</b> of modulator that drifts to many targets. These are the messages behind arousal,
      attention, hunger, thirst and emotion.</p>
  </div>`;
  const sceneEl=el.querySelector("#nm-scene"), statusEl=el.querySelector("#nm-status");
  let raf=null;
  function draw(p){ sceneEl.innerHTML=sceneSVG(p); statusEl.innerHTML=statusHTML(p); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function run(){ stop(); const t0=performance.now();
    const step=now=>{ const p=Math.min(1,(now-t0)/DUR); draw(p); if(p<1) raf=requestAnimationFrame(step); else raf=null; };
    raf=requestAnimationFrame(step); }
  el.querySelector("#nm-go").onclick=run;
  el.querySelector("#nm-reset").onclick=()=>{ stop(); draw(0); };
  const q=new URLSearchParams(location.search);
  const fp=q.get("p");
  if(fp!==null){ stop(); draw(Math.max(0,Math.min(1,+fp))); }
  else draw(0);
}
