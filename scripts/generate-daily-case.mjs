import fs from "node:fs/promises";
import path from "node:path";

const casesPath = path.join(process.cwd(), "data", "cases.json");
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("缺少 OPENAI_API_KEY：请在仓库 Settings → Secrets and variables → Actions 中配置。");
}

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const database = JSON.parse(await fs.readFile(casesPath, "utf8"));
const maxNumber = Math.max(...database.cases.map(({ id }) => Number(id.slice(1))));
const nextId = `P${String(maxNumber + 1).padStart(3, "0")}`;
const publicIndex = database.cases.map(({ name, slug }) => ({ name, slug }));

const prompt = `你是全球 AI 成功应用案例库的研究编辑。今天是北京时间 ${today}。
使用 web_search 研究一个真实、持续运营、有公开用户或商业验证的全球 AI 应用，并只输出可直接加入 cases[] 的合法 JSON 对象。

安全与质量要求：
- id=${nextId}，publishedAt=${today}，status="published"；slug 为唯一的英文小写短横线格式。
- 不得与公开索引中的名称、曾用名、域名、slug 或相同核心项目重复：${JSON.stringify(publicIndex)}
- 优先方向：宠物、母婴、孕产妇、0—12 岁儿童教育、中小企业 AI 服务、知识服务、订阅、低成本软件、一人公司和低边际成本业务。
- 至少 9 个 sections；创始人故事至少 3 个完整段落；至少 5 个关键决策或产品阶段。
- 至少 3 个 sources，其中至少 1 个官网、官方文档或创始人一手来源；不得编造数字，数字要标明时间和口径。
- 内容必须包括：项目信息、创始人创业故事、第一版、产品演进、关键决策、增长与商业模式、竞争、风险、中国复制分析、九维评分、低成本 MVP、三个月验证 100 名付费用户的路线与停止条件、可复用方法论。
- 面向普通中文读者，先给结论，短句清楚。不得输出任何用户个人身份或履历。
- 顶层至少包含：id, slug, publishedAt, status, name, tagline, hook, summary, category, businessModel, customer, pricing, launchCost, chinaOpportunity, keywords, metrics, sections, sources。
- sections 中根据内容使用 paragraphs、facts、timeline、cards、subsections、table、scorecard、checklist、methods、quote、note 等结构。
- 只能输出 JSON，不要 Markdown 代码围栏或解释。`;

const response = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || "gpt-5",
    store: false,
    tools: [{ type: "web_search", search_context_size: "high" }],
    input: prompt,
  }),
});

if (!response.ok) {
  throw new Error(`OpenAI API 请求失败 (${response.status}): ${await response.text()}`);
}

const result = await response.json();
const outputText = result.output_text || result.output
  ?.flatMap((item) => item.content || [])
  .filter((item) => item.type === "output_text")
  .map((item) => item.text)
  .join("");
if (!outputText) throw new Error("模型没有返回案例 JSON。");

let newCase;
try {
  newCase = JSON.parse(outputText);
} catch (error) {
  throw new Error(`模型返回的不是合法 JSON：${error.message}`);
}

if (newCase.id !== nextId) throw new Error(`编号错误：预期 ${nextId}，实际 ${newCase.id}`);
if (newCase.publishedAt !== today) throw new Error(`发布日期错误：预期 ${today}，实际 ${newCase.publishedAt}`);
if (newCase.status !== "published") throw new Error("status 必须为 published");

const normalized = (value) => String(value || "").trim().toLowerCase();
if (database.cases.some((item) => normalized(item.name) === normalized(newCase.name))) {
  throw new Error(`项目名称重复：${newCase.name}`);
}
if (database.cases.some((item) => normalized(item.slug) === normalized(newCase.slug))) {
  throw new Error(`slug 重复：${newCase.slug}`);
}

database.updatedAt = today;
database.cases.unshift(newCase);
await fs.writeFile(casesPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`已生成 ${newCase.id} ${newCase.name}`);
