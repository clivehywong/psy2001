import { C, ntShape, channel, along } from "../mrs.js";
import { CS, bilayerPath } from "../syn.js";

// Drugs that bind to receptors (Kalat "Drugs that Bind to Receptors", Table 2.3).
// A molecule resembling the transmitter can MIMIC it (agonist) or occupy the receptor and
// BLOCK it (antagonist). The drug's effect depends on the receptor it acts on.
const DUR=2800;
const MODES=[
  { id:"tx",       label:"Transmitter",            note:"The transmitter docks and opens the receptor — a <b>normal</b> response." },
  { id:"agonist",  label:"Agonist drug",           note:"A drug that <b>resembles</b> the transmitter docks in the same pocket and <b>mimics</b> it, opening the receptor. <i>e.g. LSD at a serotonin receptor; opiates at endorphin receptors.</i>" },
  { id:"antagonist",label:"Antagonist drug",       note:"A drug <b>occupies</b> the receptor without opening it — it <b>blocks</b> the transmitter's effect. <i>e.g. ondansetron at one serotonin receptor; antipsychotics at dopamine D2.</i>" },
  { id:"both",     label:"Antagonist + transmitter",note:"With the receptor already blocked, the transmitter <b>cannot bind</b> — no message gets through." },
];

function ligand(kind,x,y,s=7){
  if(kind==="tx") return ntShape(x,y,"glu",s);
  if(kind==="agonist") return `<polygon points="0,${-s} ${s},${-s*0.3} ${s*0.6},${s} ${-s*0.6},${s} ${-s},${-s*0.3}" transform="translate(${x},${y})" fill="#2F80ED" stroke="rgba(0,0,0,.3)"/>`;
  return `<polygon points="0,${-s} ${s*0.85},${-s*0.5} ${s*0.85},${s*0.5} 0,${s} ${-s*0.85},${s*0.5} ${-s*0.85},${-s*0.5}" transform="translate(${x},${y})" fill="#4A4A4A" stroke="rgba(0,0,0,.4)"/>`;
}

function response(p,mode){
  if(mode==="antagonist"||mode==="both") return 0;
  if(p<=0.5) return 0;
  const up=Math.min(1,(p-0.5)/(mode==="agonist"?0.3:0.18));
  if(mode==="tx"&&p>0.85) return up*Math.max(0,1-(p-0.85)/0.15);
  return up;
}

function sceneSVG(p,mode){
  const bind=p>=0.5, resp=response(p,mode);
  const blocked=mode==="antagonist"||mode==="both";
  const open=bind&&!blocked;
  let s=`<rect x="0" y="0" width="520" height="300" fill="${C.ecf}"/>`;
  s+=`<path d="M260 34 q-22 0 -22 24 q0 24 22 28 q22 -4 22 -28 q0 -24 -22 -24 Z" fill="${C.icf}" stroke="#C9B466"/>`+
     `<text x="260" y="106" text-anchor="middle" font-size="9" fill="#8a7a4a">presynaptic terminal</text>`;
  s+=bilayerPath([[40,200],[480,200]],0.2);
  s+=`<g transform="translate(260,200) scale(0.55) translate(-260,-210)">${channel(260,CS.gluR,open?"open":"closed",{badge:"R"})}</g>`;
  if(resp>0.02){
    s+=`<circle cx="260" cy="242" r="${(14+18*resp).toFixed(0)}" fill="#EE9258" opacity="${(0.35*resp).toFixed(2)}"/>`;
    for(let k=0;k<2;k++) s+=`<circle cx="${254+k*12}" cy="${228+k*12}" r="3" fill="${C.na}" opacity="${resp.toFixed(2)}"/>`;
  }
  // ligands
  if(mode==="tx"||mode==="agonist"){
    const pos=along([[260,96],[240,150],[260,186]],bind?1:Math.min(1,p/0.5));
    s+=ligand(mode==="agonist"?"agonist":"tx",pos[0],pos[1]);
  } else if(mode==="antagonist"){
    const pos=along([[260,96],[240,150],[260,186]],Math.min(1,p/0.5));
    s+=ligand("antagonist",pos[0],pos[1]);
  } else { // both
    s+=ligand("antagonist",260,186);
    const t=Math.max(0.5,(p-0.3)/0.4);
    s+=`<g opacity="${(1-t).toFixed(2)}">${ligand("tx",along([[260,96],[252,120],[258,150]],Math.min(1,t))[0],along([[260,96],[252,120],[258,150]],Math.min(1,t))[1])}</g>`;
    if(t>=1) s+=`<text x="300" y="150" font-size="10" fill="#B03A2E">can't bind — blocked</text>`;
  }
  // response bar
  s+=`<rect x="452" y="96" width="18" height="104" rx="6" fill="#F3EFE4" stroke="#DAD2BC"/>`+
     `<rect x="452" y="${(200-104*resp).toFixed(1)}" width="18" height="${(104*resp).toFixed(1)}" rx="6" fill="#EE9258"/>`+
     `<text x="461" y="88" text-anchor="middle" font-size="9" fill="#8A8272">response</text>`;
  return `<svg width="100%" viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

function statusHTML(p,mode){
  const m=MODES.find(x=>x.id===mode);
  if(p<=0.02) return `Ready — press <b>Apply</b> to test: <b>${m.label}</b>.`;
  if(p<0.5) return `<b>${m.label}:</b> the molecule is crossing the cleft…`;
  if(mode==="antagonist") return `<b>Antagonist:</b> it sits in the receptor but does <b>not</b> open it — the transmitter's message is <b>blocked</b>.`;
  if(mode==="both") return `<b>Antagonist + transmitter:</b> the receptor is occupied, so the transmitter can't bind — <b>no response</b>.`;
  if(mode==="agonist") return `<b>Agonist:</b> the look-alike drug opened the receptor and produced a response <b>by itself</b> — it mimics the transmitter.`;
  return `<b>Transmitter:</b> docks and opens the receptor — a normal, <b>brief</b> response, then it is cleared.`;
}

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns" id="ag-modes"></div>
    <div class="stim-btns"><button id="ag-go">Apply</button><button id="ag-reset" class="ghostbtn">Reset</button></div>
    <div id="ag-scene"></div>
    <p class="p3-caption" id="ag-status"></p>
    <p class="p3-caption" id="ag-note"></p>
    <p class="p3-caption">Many drugs work by <b>binding to receptors</b> (Kalat, Table 2.3). A drug whose shape
      resembles the transmitter is an <b>agonist</b>: it fits the same pocket and <b>mimics</b> the transmitter —
      LSD mimics serotonin at a serotonin receptor, and opiates mimic the brain's own endorphins. A drug that fits
      but does not open the receptor is an <b>antagonist</b>: it <b>blocks</b> the transmitter — ondansetron blocks
      one serotonin receptor to stop nausea, and antipsychotics block dopamine D2 receptors. Whether a drug excites
      or quiets a neuron therefore depends on which receptor it grabs.</p>
  </div>`;
  const sceneEl=el.querySelector("#ag-scene"), statusEl=el.querySelector("#ag-status"), noteEl=el.querySelector("#ag-note"), modeBox=el.querySelector("#ag-modes");
  let mode="tx", raf=null;
  function draw(p){ sceneEl.innerHTML=sceneSVG(p,mode); statusEl.innerHTML=statusHTML(p,mode); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
  function apply(){ stop(); const t0=performance.now();
    const step=now=>{ const p=Math.min(1,(now-t0)/DUR); draw(p); if(p<1) raf=requestAnimationFrame(step); else raf=null; };
    raf=requestAnimationFrame(step); }
  MODES.forEach(m=>{ const b=document.createElement("button"); b.textContent=m.label; b.dataset.id=m.id;
    b.onclick=()=>{ mode=m.id; noteEl.innerHTML=m.note; stop(); draw(0); }; modeBox.appendChild(b); });
  el.querySelector("#ag-go").onclick=apply;
  el.querySelector("#ag-reset").onclick=()=>{ stop(); draw(0); };
  noteEl.innerHTML=MODES[0].note;
  const q=new URLSearchParams(location.search);
  const md=q.get("mode"); if(MODES.some(m=>m.id===md)){ mode=md; noteEl.innerHTML=MODES.find(m=>m.id===md).note; }
  const fp=q.get("p");
  if(fp!==null){ stop(); draw(Math.max(0,Math.min(1,+fp))); } else draw(0);
}
