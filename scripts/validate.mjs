import fs from "node:fs";
const data=JSON.parse(fs.readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
const required=["id","slug","publishedAt","status","name","tagline","hook","summary","category","businessModel","customer","pricing","chinaOpportunity","sections","sources"];
const errors=[];const ids=new Set(),slugs=new Set();
for(const item of data.cases){
  for(const key of required)if(item[key]===undefined||item[key]===null||item[key]==="")errors.push(`${item.id||"未知案例"} 缺少 ${key}`);
  if(ids.has(item.id))errors.push(`重复 id: ${item.id}`);ids.add(item.id);if(slugs.has(item.slug))errors.push(`重复 slug: ${item.slug}`);slugs.add(item.slug);
  if(!/^P\d{3}$/.test(item.id))errors.push(`编号格式错误: ${item.id}`);if(!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt))errors.push(`日期格式错误: ${item.id}`);
  if(!Array.isArray(item.sections)||item.sections.length<4)errors.push(`${item.id} 章节不足`);if(!Array.isArray(item.sources)||item.sources.length<1)errors.push(`${item.id} 缺少来源`);
}
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log(`验证通过：${data.cases.length} 个案例，${ids.size} 个唯一编号，${slugs.size} 个唯一 slug。`);
