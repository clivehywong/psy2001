import { C, G, apVm, apChannels, bilayerBetween, ionField, ionShape, channel, arrow, myelinSeg, vmColor, vmInside, tag } from "../mrs.js";

const X0=60, X1=900, WV=60;                 // unmyelinated wave speed (px per ms)
const NODES=[150, 480, 810];

function gradDefs(idp,stops){
  const gd=(id,fn)=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${X0}" x2="${X1}" y1="0" y2="0">`+
    stops.map(([x,v])=>`<stop offset="${(x-X0)/(X1-X0)}" stop-color="${fn(v)}"/>`).join("")+`</linearGradient>`;
  return `<defs>${gd(idp+"b",vmColor)}${gd(idp+"i",vmInside)}</defs>`;
}
function bandFills(idp){
  return `<rect x="${X0}" y="100" width="${X1-X0}" height="${G.bandY-32-100}" fill="${C.ecf}"/>`+
    `<rect x="${X0}" y="${G.bandY-32}" width="${X1-X0}" height="${G.bandT}" fill="url(#${idp}b)"/>`+
    `<rect x="${X0}" y="${G.bandY+32}" width="${X1-X0}" height="100" fill="url(#${idp}i)"/>`;
}

// unmyelinated: continuous regeneration — the P6 wave, slimmed down
function unmyelStrip(tWave,idp){
  const stops=[];
  for(let x=X0;x<=X1;x+=16){
    const tl=tWave-(x-X0)/WV;
    stops.push([x,(tl>=0&&tl<=6)?apVm(tl):-70]);
  }
  let inner=gradDefs(idp,stops)+bandFills(idp)+ionField(X0,X1,104,168,250,334,0,40)+bilayerBetween(X0,X1,[]);
  for(let x=X0+52;x<X1;x+=104){
    const isNa=Math.round((x-X0-52)/104)%2===0, col=isNa?C.naChan:C.kChan;
    const tl=tWave-(x-X0)/WV;
    const [naSt,kSt]=(tl>=0&&tl<=6)?apChannels(tl):["closed","almost"];
    const st=isNa?naSt:kSt, vm=(tl>=0&&tl<=6)?apVm(tl):-70;
    const flow=(isNa&&st==="open")?"na":(!isNa&&st==="open")?"k":null;
    inner+=channel(x,col,st,flow?{ion:flow,ionY:flow==="na"?26:-26,bg:vmColor(vm)}:{bg:vmColor(vm)});
    if(flow==="na") inner+=ionShape(x,G.bandY-52,"na",5.5)+arrow(x-6,G.bandY-72,x-4,G.bandY-40,C.na);
    if(flow==="k")  inner+=ionShape(x,G.bandY+52,"k",5.5)+arrow(x+4,G.bandY+60,x+2,G.bandY+34,C.k);
  }
  return inner;
}

// myelinated / MS: each fired node runs the same apVm pulse as the unmyelinated lane;
// between nodes the charge only spreads passively (anchored, decaying)
function salStrip(T,ms,idp){
  const HOP=1.6;
  const src=Math.min(1,Math.floor(T/HOP));
  const p=Math.max(0,Math.min(1.3,(T-src*HOP)/HOP));
  const lamM = ms&&src===1 ? 45 : 174;               // stripped stretch: the front dies fast
  const spreadOn = T<2.3*HOP && src<NODES.length-1;
  const front = NODES[src]+Math.min(1.25,p)*(NODES[src+1]-NODES[src]); // hump travels src→dst and drifts past (no reset blink)
  const amp = 100*Math.exp(-(front-NODES[src])/lamM)*Math.exp(-Math.max(0,p-1)*5);
  const vAt=x=>{
    let v=-70;
    for(let i=0;i<NODES.length;i++)                  // each fired node runs the true AP pulse
      if(Math.abs(x-NODES[i])<62 && i*HOP<=T && !(ms&&i===2))
        v=Math.max(v,apVm(Math.min(6,(T-i*HOP)/HOP*6+1.58)));
    if(spreadOn) v=Math.max(v,-70+amp*Math.exp(-Math.pow((x-front)/45,2)));
    return v;
  };
  const stops=[];
  for(let x=X0;x<=X1;x+=16) stops.push([x,vAt(x)]);
  let inner=gradDefs(idp,stops)+bandFills(idp);
  for(let i=0;i<NODES.length;i++){
    const a=i===0?X0:NODES[i-1]+55, b=NODES[i]-55;
    if(!(ms&&i===2)) inner+=myelinSeg(a,b);
  }
  inner+=myelinSeg(NODES[2]+55,X1)+bilayerBetween(X0,X1,[]);
  NODES.forEach((n,i)=>{
    const fired=i*HOP<=T&&!(ms&&i===2), tl=fired?(T-i*HOP)/HOP*6+1.58:-1;  // channel opens as the front arrives
    const [naSt,kSt]=fired?apChannels(Math.min(6,tl)):["closed","almost"];
    const vm=fired?apVm(Math.min(6,tl)):-70;
    inner+=channel(n-22,C.naChan,naSt,{badge:"V",bg:vmColor(vm)})+
           channel(n+22,C.kChan,kSt,{badge:"V",bg:vmColor(vm)});
    if(fired&&naSt==="open") inner+=arrow(n-28,G.bandY-72,n-26,G.bandY-40,C.na);
    if(fired&&kSt==="open"&&naSt!=="open") inner+=arrow(n+26,G.bandY+60,n+24,G.bandY+34,C.k);
  });
  if(ms) inner+=tag((NODES[1]+NODES[2])/2,G.bandY-96,"myelin stripped here","#B03A2E");
  return inner;
}

export function render(el){
  el.innerHTML = `<div class="card">
    <h3 style="margin:2px 0 10px">The giraffe race — one message, three axons</h3>
    <div class="stim-btns"><button id="p7-go">Fire all three</button></div>
    <div class="p7-lane"><div class="p7-label">Unmyelinated — every patch regenerates (slow crawl, ~1–10 m/s)</div><div id="p7-u"></div></div>
    <div class="p7-lane"><div class="p7-label">Myelinated — full-size spike re-made at each node (~100 m/s)</div><div id="p7-m"></div></div>
    <div class="p7-lane"><div class="p7-label" style="color:#B03A2E">Myelin stripped (multiple sclerosis) — the spread dies mid-axon</div><div id="p7-s"></div></div>
    <p class="p3-caption" id="p7-note"></p>
    <p class="p3-caption">Same membrane, same channels, one starting push. Bare axon: every patch must do the full
      work — steady but slow. Myelinated: under the sheath there are <b>no channels</b>, the charge only
      <b>spreads passively and fades</b> — but each node of Ranvier <b>regenerates a full-size spike</b>, so the
      impulse jumps node to node and arrives fast, undiminished. Strip the sheath and the fading spread
      never reaches threshold at the next node: <b>the impulse dies</b> — the failure behind MS.</p>
  </div>`;

  const U=el.querySelector("#p7-u"), M=el.querySelector("#p7-m"), Sx=el.querySelector("#p7-s");
  const noteEl=el.querySelector("#p7-note");
  const draw=(T)=>{
    U.innerHTML=`<svg width="100%" viewBox="20 90 920 280" xmlns="http://www.w3.org/2000/svg">${unmyelStrip(Math.min(18,T)*1.15,"u7")}</svg>`;
    M.innerHTML=`<svg width="100%" viewBox="20 90 920 280" xmlns="http://www.w3.org/2000/svg">${salStrip(Math.min(T,3*1.6),false,"m7")}</svg>`;
    Sx.innerHTML=`<svg width="100%" viewBox="20 90 920 280" xmlns="http://www.w3.org/2000/svg">${salStrip(Math.min(T,1.9*1.6),true,"s7")}</svg>`;
  };
  draw(0);

  let raf=null;
  el.querySelector("#p7-go").onclick=()=>{
    if(raf) cancelAnimationFrame(raf);
    const t0=performance.now();
    const step=now=>{
      const T=(now-t0)/1000;
      draw(T);
      if(T<18) raf=requestAnimationFrame(step);
      else{
        raf=null;
        noteEl.innerHTML="Myelinated arrived <b>full size, long ago</b> — and the stripped axon's impulse never arrived at all. The bare axon is still crawling. In a giraffe's ~1 m spinal axon: ~10 ms myelinated vs ~1 s thin-and-bare.";
      }
    };
    raf=requestAnimationFrame(step);
  };

  const q=new URLSearchParams(location.search);
  if(q.get("T")!==null) draw(+q.get("T"));
}
