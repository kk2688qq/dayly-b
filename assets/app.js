const $=id=>document.getElementById(id);
const state={cases:[],query:"",category:"",model:""};
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const deepText=value=>Array.isArray(value)?value.map(deepText).join(" "):value&&typeof value==="object"?Object.values(value).map(deepText).join(" "):typeof value==="string"?value:"";
const href=item=>`case.html?slug=${encodeURIComponent(item.slug)}`;
const score=n=>Array.from({length:5},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("");

function feature(item){
  const firstStory=item.sections.find(s=>/创始|起源/.test(s.title));
  const story=firstStory?.paragraphs?.[0]||item.summary;
  return `<div class="feature-index"><span>${esc(item.id)}</span><b>${esc(item.name.slice(0,1))}</b><small>${esc(item.category)}</small></div><div class="feature-copy"><div class="meta"><span>${esc(item.publishedAt)}</span><span>${esc(item.businessModel)}</span></div><h3>${esc(item.name)}</h3><p class="tagline">${esc(item.tagline)}</p><p>${esc(story)}</p><div class="feature-bottom"><div><small>中国机会</small><span class="score">${score(item.chinaOpportunity)}</span></div><a class="button primary" href="${href(item)}">进入完整故事</a></div></div>`;
}
function card(item){return `<article class="case-card"><div class="case-card-top"><span>${esc(item.id)}</span><span>${esc(item.publishedAt)}</span></div><p class="card-category">${esc(item.category)}</p><h3>${esc(item.name)}</h3><p>${esc(item.tagline)}</p><div class="card-footer"><span>${esc(item.businessModel)}</span><a href="${href(item)}" aria-label="阅读 ${esc(item.name)}">阅读案例 →</a></div></article>`}
function render(){
  const q=state.query.toLocaleLowerCase("zh-CN");
  const list=state.cases.filter(item=>(!q||deepText(item).toLocaleLowerCase("zh-CN").includes(q))&&(!state.category||item.category===state.category)&&(!state.model||item.businessModel===state.model));
  $("case-grid").innerHTML=list.map(card).join("");$("result-count").textContent=`${list.length} / ${state.cases.length} 个案例`;$("empty").hidden=Boolean(list.length);
}
function options(id,values){$(id).insertAdjacentHTML("beforeend",[...new Set(values)].sort((a,b)=>a.localeCompare(b,"zh-CN")).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(""))}
async function init(){
  try{
    const response=await fetch(`data/cases.json?v=${Date.now()}`,{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();state.cases=data.cases.filter(x=>x.status==="published").sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||b.id.localeCompare(a.id));
    const latest=state.cases[0];$("featured").innerHTML=feature(latest);$("latest-link").href=href(latest);$("update-date").textContent=data.updatedAt;$("case-count").textContent=state.cases.length;$("source-count").textContent=state.cases.reduce((n,x)=>n+x.sources.length,0);
    options("category",state.cases.map(x=>x.category));options("model",state.cases.map(x=>x.businessModel));render();
  }catch(error){$("featured").innerHTML=`<div class="empty"><strong>案例数据读取失败</strong><p>${esc(error.message)}</p></div>`;$("update-date").textContent="读取失败"}
}
$("search").addEventListener("input",e=>{state.query=e.target.value.trim();render()});
$("category").addEventListener("change",e=>{state.category=e.target.value;render()});
$("model").addEventListener("change",e=>{state.model=e.target.value;render()});
$("clear").addEventListener("click",()=>{state.query=state.category=state.model="";$("search").value=$("category").value=$("model").value="";render()});
init();
