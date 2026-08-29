import fs from "node:fs";
const data=JSON.parse(fs.readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
const required=["id","slug","publishedAt","status","name","tagline","hook","summary","category","businessModel","customer","pricing","chinaOpportunity","sections","sources"];
const errors=[];const ids=new Set(),slugs=new Set(),names=new Set();
for(const item of data.cases){
  for(const key of required)if(item[key]===undefined||item[key]===null||item[key]==="")errors.push(`${item.id||"未知案例"} 缺少 ${key}`);
  if(ids.has(item.id))errors.push(`重复 id: ${item.id}`);ids.add(item.id);if(slugs.has(item.slug))errors.push(`重复 slug: ${item.slug}`);slugs.add(item.slug);if(names.has(item.name.toLowerCase()))errors.push(`重复项目名: ${item.name}`);names.add(item.name.toLowerCase());
  if(!/^P\d{3}$/.test(item.id))errors.push(`编号格式错误: ${item.id}`);if(!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt))errors.push(`日期格式错误: ${item.id}`);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug))errors.push(`slug 格式错误: ${item.slug}`);
  const modernStandard=Number(item.id.slice(1))>=23;
  if(!Array.isArray(item.sections)||item.sections.length<(modernStandard?7:4))errors.push(`${item.id} 章节不足 ${modernStandard?7:4} 个`);
  if(modernStandard&&!item.sections.some(section=>/创始|创业起源/.test(section.title)))errors.push(`${item.id} 缺少创始人创业故事`);
  if(!Array.isArray(item.sources)||item.sources.length<(modernStandard?2:1))errors.push(`${item.id} 来源不足 ${modernStandard?2:1} 个`);
  for(const source of item.sources||[])if(!/^https:\/\//.test(source.url||""))errors.push(`${item.id} 来源 URL 无效: ${source.url||"空"}`);
}
const newest=data.cases.reduce((latest,item)=>item.publishedAt>latest?item.publishedAt:latest,"");
if(!/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt||""))errors.push("根级 updatedAt 格式错误");
if(data.updatedAt<newest)errors.push(`updatedAt ${data.updatedAt} 早于最新发布日期 ${newest}`);
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
const maxId=Math.max(...data.cases.map(item=>Number(item.id.slice(1))));
console.log(`验证通过：${data.cases.length} 个案例，${ids.size} 个唯一编号，${slugs.size} 个唯一 slug；当前最大编号 P${String(maxId).padStart(3,"0")}。`);
