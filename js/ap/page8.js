import { C, vmInside, vmColor, mvChip, ntShape, tag } from "../mrs.js";
import { NEURON } from "../neuron.js";

const EXC=["#F5EDDA","#F3D9AE","#F0BE85","#EE9C5C"], INH=["#F5EDDA","#AFC8EC","#97BCE6","#8AB6E8"];
const S=0.62, TY=70;
const P=(x,y)=>[S*x, S*y+TY];

const PRESETS=[
  { id:"balanced", label:"Balanced",   E:2, I:2, M:1 },
  { id:"quiet",    label:"Too quiet",  E:1, I:0, M:0 },
  { id:"twitchy",  label:"Too twitchy",E:3, I:0, M:1 },
];

// animated hump gradient along an axis (offset o from axis start), warm core traveling/dimming
function humpGrad(id,g,hump){
  const stops=[];
  for(let o=0;o<=1.001;o+=0.05){
    const v=hump?-70+hump.amp*Math.exp(-Math.pow((o-(1-hump.f))/0.16,2)):-70;
    const a=hump?Math.min(1,Math.max(0,(v+70)/45)):0;
    stops.push(`<stop offset="${o}" stop-color="${vmColor(v)}" stop-opacity="${a}"/>`);
  }
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}">${stops.join("")}</linearGradient>`;
}
function axonGrad(id,hump){
  const stops=[];
  for(let o=0;o<=1.001;o+=0.04){
    const v=hump?-70+hump.amp*Math.exp(-Math.pow((o-hump.f)/0.1,2)):-70;
    const a=hump?Math.min(1,Math.max(0,(v+70)/45)):0;
    stops.push(`<stop offset="${o}" stop-color="${vmColor(v)}" stop-opacity="${a}"/>`);
  }
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="308.85" y1="249.15" x2="890" y2="300">${stops.join("")}</linearGradient>`;
}

function neuronSVG(uid,st){
  const lg=(id,g,c)=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${g[0]}" y1="${g[1]}" x2="${g[2]}" y2="${g[3]}">`+
    `<stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="0.5" stop-color="${c}" stop-opacity="0.35"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const band=st.rate>0&&!st.anim?(st.rate>25?EXC[3]:EXC[2]):null;
  const axGstatic=`<linearGradient id="axGs${uid}" gradientUnits="userSpaceOnUse" x1="308.85" y1="249.15" x2="890" y2="300">`+
    `<stop offset="0" stop-color="${band}" stop-opacity="0"/><stop offset="0.32" stop-color="${band}" stop-opacity="0"/>`+
    `<stop offset="0.5" stop-color="${band}"/><stop offset="0.68" stop-color="${band}" stop-opacity="0"/>`+
    `<stop offset="1" stop-color="${band}" stop-opacity="0"/></linearGradient>`;
  const [hx,hy]=P(308.85,249.15);
  let inner=`<rect x="0" y="0" width="600" height="420" fill="${C.ecf}"/>`+
    `<defs>${lg("lgUL"+uid,NEURON.gUL,EXC[Math.min(3,st.gluC[0])])}${lg("lgUR"+uid,NEURON.gUR,INH[Math.min(3,st.gabaC)])}${lg("lgL"+uid,NEURON.gL,EXC[Math.min(3,st.gluC[1])])}`+
    `${band&&!st.ax?axGstatic:""}${humpGrad("hgUL"+uid,NEURON.gUL,st.ul)}${humpGrad("hgL"+uid,NEURON.gL,st.lo)}${axonGrad("hgA"+uid,st.ax)}</defs>`+
    `<g transform="translate(0,${TY}) scale(${S})">`+
    `<path d="${NEURON.dL}" fill="url(#lgL${uid})"/>`+
    `<path d="${NEURON.dUL}" fill="url(#lgUL${uid})"/>`+
    `<path d="${NEURON.dUR}" fill="url(#lgUR${uid})"/>`+
    `<path d="${NEURON.axon}" fill="${band&&!st.ax?`url(#axGs${uid})`:"#EFE8D2"}"/>`+
    `<path d="${NEURON.soma}" fill="${vmInside(st.vm)}"/>`+
    `<path d="${NEURON.dL}" fill="url(#hgL${uid})"/>`+
    `<path d="${NEURON.dUL}" fill="url(#hgUL${uid})"/>`+
    (st.ax?`<path d="${NEURON.axon}" fill="url(#hgA${uid})"/>`:"")+
    `<path d="${NEURON.nucleus}" fill="#4A463E"/>`+
    `<path d="${NEURON.outline}" fill="none" stroke="#4A463E" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`+
    `</g>`+
    (st.hill?`<circle cx="${hx}" cy="${hy}" r="16" fill="#EE9258" opacity="0.55"/><circle cx="${hx}" cy="${hy}" r="10" fill="none" stroke="#DD6C42" stroke-width="2"/>`
            :`<circle cx="${hx}" cy="${hy}" r="10" fill="none" stroke="#888" stroke-dasharray="3 3"/>`)+
    tag(hx+8,hy+28,"hillock","#888");
  const boutons=[
    {x:94,y:68,mx:97,my:92,nt:"glu",n:st.gluC[0],rot:0},
    {x:256,y:88,mx:250,my:106,nt:"gaba",n:st.gabaC,rot:0},
    {x:120,y:386,mx:120,my:366,nt:"glu",n:st.gluC[1],rot:1},
  ];
  boutons.forEach(b=>{
    inner+=`<g transform="translate(${b.x},${b.y})${b.rot?" rotate(180)":""} scale(0.8)"><path d="M -8 -18 L 8 -18 L 14 4 L -14 4 Z" fill="#F2ECDC" stroke="#999"/></g>`;
    for(let j=0;j<b.n;j++) inner+=ntShape(b.mx-8+j*13,b.my+(j%2)*9,b.nt,6);
  });
  inner+=mvChip(470,16,Math.round(st.vm))+
    `<g transform="translate(470,62)"><rect width="110" height="26" rx="8" fill="#fff" stroke="#999"/><text x="55" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#222">${st.rate.toFixed(0)} Hz</text></g>`;
  return `<svg width="600" height="420" viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function spikeTraceSVG(rate){
  let s=`<rect width="440" height="70" rx="6" fill="#141A22"/>`;
  if(rate>0){
    const isi=1000/rate;
    for(let t=0.3;t<3;t+=isi/1000){
      const x=14+t/3*412;
      s+=`<path d="M ${x} 58 L ${x+3} 22 L ${x+7} 58" fill="none" stroke="#3EDAD8" stroke-width="2"/>`;
    }
  }else{
    s+=`<line x1="14" y1="58" x2="426" y2="58" stroke="#3EDAD8" stroke-width="2"/>`;
  }
  s+=`<text x="8" y="14" font-size="9" fill="#9FB3C8">axon output · 3 s</text>`;
  return `<svg width="440" height="70" viewBox="0 0 440 70" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

const s01=x=>Math.max(0,Math.min(1,x))**2*(3-2*Math.max(0,Math.min(1,x)));

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns" id="p8-presets"></div>
    <div class="p8-sliders">
      <label>excitatory input <input type="range" id="p8-e" min="0" max="3" step="1" value="2"></label>
      <label>inhibitory input <input type="range" id="p8-i" min="0" max="3" step="1" value="2"></label>
      <label>modulator <input type="range" id="p8-m" min="0" max="2" step="1" value="1"></label>
      <button id="p8-epsp">Deliver an EPSP</button>
    </div>
    <div class="p8-grid">
      <div id="p8-neuron"></div>
      <div>
        <div id="p8-spikes"></div>
        <p class="p3-caption" id="p8-note"></p>
      </div>
    </div>
    <p class="p3-caption">Graded inputs land on the dendrites (▲ excitatory, ▼ inhibitory) and
      <b>travel down the dendrites, dimming as they go</b> — graded potentials decay with distance.
      They sum at the soma; if the sum crosses threshold, the <b>hillock fires</b> and a full-size
      action potential races down the axon <b>without dimming</b> — graded fade on the input side,
      regeneration on the output side.</p>
  </div>`;

  const E=el.querySelector("#p8-e"), I=el.querySelector("#p8-i"), M=el.querySelector("#p8-m");
  const nEl=el.querySelector("#p8-neuron"), sEl=el.querySelector("#p8-spikes"), noteEl=el.querySelector("#p8-note");
  const pBox=el.querySelector("#p8-presets");
  PRESETS.forEach(p=>{
    const b=document.createElement("button");
    b.textContent=p.label; b.dataset.id=p.id;
    b.onclick=()=>{ E.value=p.E; I.value=p.I; M.value=p.M; update(p.label); };
    pBox.appendChild(b);
  });

  function params(){
    const e=+E.value, i=+I.value, m=+M.value;
    const mScale=[0.4,1,1.6][m];
    const vm=Math.max(-85,Math.min(-45, -70+9*e*mScale-6*i));
    const rate=Math.min(40,Math.max(0,(vm+66)*3));
    return {e,i,m,vm,rate,mScale};
  }
  function drawStatic(name){
    const {e,i,vm,rate}=params();
    nEl.innerHTML=neuronSVG(1,{vm,gluC:[e,e],gabaC:i,rate,ul:null,lo:null,ax:null,hill:false});
    sEl.innerHTML=spikeTraceSVG(rate);
    if(name) noteEl.innerHTML=`<b>${name}:</b> soma ${vm.toFixed(0)} mV → <b>${rate.toFixed(0)} Hz</b>.`;
  }
  function update(name){ if(!anim) drawStatic(name); }

  let anim=null;
  function drawFrame(T){
    const {e,i,vm:target,rate}=params();
    const ul = T<0.95?{f:Math.min(1.15,T/0.8),amp:60*Math.exp(-Math.min(1.15,T/0.8)*1.2)}:null;
    const lo = T>0.2&&T<1.15?{f:Math.min(1.15,(T-0.2)/0.8),amp:60*Math.exp(-Math.min(1.15,(T-0.2)/0.8)*1.2)}:null;
    let vmS=-70+(target+70)*0.5*s01((T-0.68)/0.35)+(target+70)*0.5*s01((T-0.9)/0.35);
    const firing=rate>0&&T>1.3;
    if(firing){ const bump=Math.exp(-Math.pow((T-1.45)/0.25,2)); vmS=vmS+(30-vmS)*bump; }  // the soma spikes too
    if(rate===0) vmS=-70+(vmS+70)*(1-s01((T-2.0)/1.0));
    const ax = firing&&T<2.95?{f:(T-1.3)/1.5,amp:100}:null;
    const hill = firing&&T<1.6;
    nEl.innerHTML=neuronSVG(1,{vm:vmS,gluC:[e,e],gabaC:i,rate,ul,lo,ax,hill,anim:true});
    if(T<0.8) noteEl.innerHTML="<b>EPSPs incoming</b> — watch the excitatory dendrites: the warmth travels toward the soma and dims (graded decay)…";
    else if(!firing&&T<2.0) noteEl.innerHTML=rate===0?"The soma warms — but the sum stays <b>below threshold</b>. It will fade back.":"Sum reached…";
    else if(firing&&T<1.6) noteEl.innerHTML="<b>Threshold crossed — the hillock FIRES!</b>";
    else if(firing&&T<2.95) noteEl.innerHTML="Full-size action potential racing down the axon — <b>no dimming</b>: regenerated all the way.";
    else if(T>=2.95&&rate>0) noteEl.innerHTML="Arrived at the terminal, full strength.";
    else if(T>=3.0) noteEl.innerHTML="Subthreshold sum faded back to rest. Nothing fired.";
  }

  function runEPSP(){
    if(anim) cancelAnimationFrame(anim);
    const t0=performance.now();
    const step=now=>{
      const T=(now-t0)/1000;
      drawFrame(T);
      if(T<4.4) anim=requestAnimationFrame(step);
      else { anim=null; update(); }
    };
    anim=requestAnimationFrame(step);
  }
  el.querySelector("#p8-epsp").onclick=runEPSP;
  [E,I,M].forEach(x=>x.oninput=()=>update(null));

  // fixtures: ?e=3&i=0&m=2, ?p=twitchy, ?anim=1&T=1.2
  const q=new URLSearchParams(location.search);
  if(q.get("e")!==null){ E.value=q.get("e"); I.value=q.get("i")??2; M.value=q.get("m")??1; }
  const pr=PRESETS.find(p=>p.id===q.get("p"));
  if(pr){ E.value=pr.E; I.value=pr.I; M.value=pr.M; }
  if(q.get("T")!==null){ drawFrame(+q.get("T")); noteEl.textContent="(fixture)"; }
  else drawStatic(pr?pr.label:null);
}
