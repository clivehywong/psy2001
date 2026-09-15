// Neurotransmitter types & synthesis (Kalat Fig 2.12) + the two ways the signal is ended.
const TR=[
  { id:"ach", name:"Acetylcholine", col:"#9B59B6",
    chain:[["Choline","diet / metabolism"],["Acetyl-CoA","metabolism"],["Acetylcholine",""]],
    note:"Acetylcholine (ACh) is assembled from <b>choline</b> (milk, eggs, peanuts). It is the one transmitter that is <b>not</b> recycled by a transporter directly — first the enzyme <b>acetylcholinesterase</b> splits it into acetate + choline, and only the choline is taken back up.",
    pills:[] },
  { id:"da", name:"Dopamine", col:"#C9A227",
    chain:[["Tyrosine","diet (protein)"],["DOPA",""],["Dopamine",""]],
    note:"Dopamine is a <b>catecholamine</b>. Its supply can be turned up or down at the synthesis step.",
    pills:["L-dopa ↑ supply — used in Parkinson's disease","AMPT ⊣ production — research only"] },
  { id:"ne", name:"Norepinephrine", col:"#2F80ED",
    chain:[["Tyrosine","diet (protein)"],["DOPA",""],["Dopamine",""],["Norepinephrine",""]],
    note:"Norepinephrine (noradrenaline) is made by adding one more step to dopamine — a catecholamine.",
    pills:[] },
  { id:"epi", name:"Epinephrine", col:"#E67A22",
    chain:[["Tyrosine","diet (protein)"],["DOPA",""],["Dopamine",""],["Norepinephrine",""],["Epinephrine",""]],
    note:"Epinephrine (adrenaline) is the last step of the catecholamine chain.",
    pills:[] },
  { id:"ser", name:"Serotonin", col:"#E0A100",
    chain:[["Tryptophan","diet (soy…)"],["5-HTP",""],["Serotonin",""]],
    note:"Serotonin is built from <b>tryptophan</b>. Fewer than 1 in 1000 neurons release it, but their axons branch widely through the brain.",
    pills:[] },
];

const BAND="0 0 660 210";

function chainSVG(tr){
  const n=tr.chain.length, x0=36, x1=624, gap=26;
  const w=(x1-x0-(n-1)*gap)/n, y=78, h=54;
  let s=`<text x="${x0}" y="34" font-size="12" fill="#555">Built from dietary precursors — one chemical reaction per arrow</text>`+
    `<text x="${x0}" y="52" font-size="11" fill="#8A8272">${tr.name}</text>`+
    `<rect x="${x0-10}" y="60" width="${x1-x0+20}" height="${h+16}" rx="12" fill="#FBF8F0" stroke="#EDE6D4"/>`;
  tr.chain.forEach((c,i)=>{
    const bx=x0+i*(w+gap);
    const last=i===n-1;
    s+=`<rect x="${bx.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="10" fill="${last?tr.col:"#fff"}" stroke="${last?"rgba(0,0,0,.15)":"#D8CFB8"}" stroke-width="1.3"/>`+
      `<text x="${(bx+w/2).toFixed(1)}" y="${y+ (c[1]?24:31)}" text-anchor="middle" font-size="13" font-weight="${last?700:500}" fill="${last?"#fff":"#333"}">${c[0]}</text>`+
      (c[1]?`<text x="${(bx+w/2).toFixed(1)}" y="${y+41}" text-anchor="middle" font-size="9.5" fill="${last?"rgba(255,255,255,.85)":"#8A8272"}">${c[1]}</text>`:"");
    if(i<n-1){
      const ax=bx+w+3, ay=y+h/2, ax2=bx+w+gap-3;
      s+=`<line x1="${ax.toFixed(1)}" y1="${ay}" x2="${ax2.toFixed(1)}" y2="${ay}" stroke="#B9AE93" stroke-width="2"/>`+
        `<polygon points="${ax2.toFixed(1)},${ay} ${(ax2-7).toFixed(1)},${ay-4} ${(ax2-7).toFixed(1)},${ay+4}" fill="#B9AE93"/>`;
    }
  });
  let yN=176;
  if(tr.pills.length){
    s+=`<text x="${x0}" y="${yN}" font-size="10.5" fill="#8A8272">Drugs that act on this pathway:</text>`;
    tr.pills.forEach((p,i)=>s+=pillsv(x0+i*320, yN+10, p, tr.col));
  }
  return `<svg width="100%" viewBox="${BAND}" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}
function pillsv(x,y,text,col){ const w=text.replace(/<[^>]+>/g,"").length*5.4+20;
  return `<g transform="translate(${x},${y})"><rect width="${w}" height="24" rx="12" fill="${col}22" stroke="${col}"/><text x="${w/2}" y="16" text-anchor="middle" font-size="11" fill="#333">${text}</text></g>`; }

export function render(el){
  el.innerHTML=`<div class="card">
    <div class="stim-btns" id="st-tabs"></div>
    <div id="st-scene"></div>
    <p class="p3-caption" id="st-note"></p>
    <p class="p3-caption">All the transmitters you meet are built by neurons from <b>amino acids and other
      dietary chemicals</b>, in a short chain of reactions (Kalat Fig 2.12). Once released, the signal must also be
      <b>switched off</b>: mostly by <b>reuptake</b> (a transporter pulls the transmitter back in — see Blocking
      reuptake), or by <b>enzymatic breakdown</b> (acetylcholinesterase splits acetylcholine; MAO and COMT break
      down the monoamines).</p>
  </div>`;
  const sceneEl=el.querySelector("#st-scene"), noteEl=el.querySelector("#st-note"), tabs=el.querySelector("#st-tabs");
  let cur=TR[0].id;
  function draw(){ const tr=TR.find(t=>t.id===cur);
    sceneEl.innerHTML=chainSVG(tr);
    noteEl.innerHTML=`<b>${tr.name}:</b> ${tr.note}`;
    tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.id===cur));
  }
  TR.forEach(t=>{ const b=document.createElement("button"); b.textContent=t.name; b.dataset.id=t.id;
    b.onclick=()=>{ cur=t.id; draw(); }; tabs.appendChild(b); });
  const q=new URLSearchParams(location.search).get("nt");
  if(TR.some(t=>t.id===q)) cur=q;
  draw();
}
