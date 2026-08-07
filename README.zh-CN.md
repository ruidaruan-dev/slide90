# Slide90

**几分钟得到一套80分可用初稿，不让整体生成去冒充100分精修。**

Slide90 是一个面向企业管理汇报的开源 Agent Skill。它优先保留用户已有汇报结构，把业务材料快速、稳定地转化为可编辑PPT初稿，让用户不再为排版发愁；100分精修留给后续单页调整，而不是反复重做整套。

**P1 已经可执行：**当前支持11类确定性可编辑页面，包含5类项目汇报专用页；同时支持轻量输入契约、整套生成、单页生成和指定页面替换。

核心不是“再做一套模板”，而是改变生成循环：**一次规划整套PPT、生成前校验结构、整套批量渲染、锁定通过页面、只返修失败元素**。

在当前提交的5页受控测试中，Fast Loop 将渲染耗时降低 **58%**。Slide90 是项目目标，公开测试结果是当前证据。

[English](README.md) · [测试说明](BENCHMARK.md) · [路线图](ROADMAP.md) · [参与贡献](CONTRIBUTING.md)

![Slide90 Fast Loop 演示](assets/slide90-demo.gif)

## P1：保留汇报结构，消除排版工作

```mermaid
flowchart LR
    A[原始业务材料] --> B[通过校验的 deck spec]
    B --> C[整套批量渲染]
    C --> D[可编辑 PPTX]
    D --> E[渲染与溢出检查]
```

![P0 可编辑 PowerPoint 预览](examples/end-to-end/output/preview.png)

直接运行六页中文虚构验收样例：

```bash
npm ci
node bin/slide90.mjs validate examples/p1/deck-spec.zh-CN.json
node bin/slide90.mjs render examples/p1/deck-spec.zh-CN.json --output deck.pptx
node bin/slide90.mjs render-slide examples/p1/deck-spec.zh-CN.json --slide 3 --output slide-3.pptx
node bin/slide90.mjs replace-slide examples/p1/deck-spec.zh-CN.json --slide 5 \
  --with examples/p1/replacement-slide-5.zh-CN.json --output updated.pptx
```

交付前执行 P1 验收门：

```bash
npm run verify:p1
```

当前P1验收约用时 **1.3秒**：连续生成三次六页PPT并验证一致性，检查可编辑形状、中文字体和必须保留事实，单独生成第3页，替换第5页，并证明其他5页的页面XML完全未变化。完整检查超过600秒会直接失败；精确结果见 [`benchmarks/results/p1-verification-latest.json`](benchmarks/results/p1-verification-latest.json)。该时间仅代表本地渲染与校验，不包含模型推理、排队、网络传输和人工确认。

现在已经证明“生产链路稳定”，但尚未声称所有真实汇报都达到80分。下一项核心证据是10套中文虚构业务材料的人工可用性评分。

核心测试集位于 [`evals/cases.json`](evals/cases.json)：八类管理页面各3题，每题包含预期版式、标题结论、必须保留的事实和禁止臆造项。它当前验证“考题和答案标准是否完整”；后续规划器提交候选 deck spec 后，再按同一答案标准评分。

运行 `npm run eval:baseline` 可以用不读取答案字段的规则基线完成24题，并输出结构正确率、事实保留率、禁止项命中数、结论式标题通过率、内容结构率和整段照抄数量。外部Agent必须只读取 `evals/blind-prompts.json`；其中使用不可推断页面类型的匿名ID，并要求保持英文及原始数字、日期和专有名词。该基线只验证评测闭环，不代表最终AI设计质量。

正式数据契约位于 [`schema/deck-spec.schema.json`](schema/deck-spec.schema.json)。公开样例完整保留了[虚构原始材料](examples/end-to-end/source.md) → [deck spec](examples/end-to-end/deck-spec.json) → [可编辑 PPTX](examples/end-to-end/output/slide90-p0-demo.pptx) → PNG 预览的链路。

## 为什么值得用

- **先回答领导问题**：标题直接给结论，不再使用“工作介绍”“未来规划”等空标题。
- **用证据代替形容词**：指标、项目交付、机制和责任比“持续赋能”更有说服力。
- **整套一次规划**：先形成完整故事线和页面规范，避免逐页重复理解材料。
- **尊重已有结构**：用户已经有汇报顺序时直接保留，只有结构缺失时才轻量建议。
- **整套与单页并存**：既能一次生成完整初稿，也能只生成或替换某一页。
- **只返修失败页面**：通过的页面立即锁定，不因一处问题重做整套PPT。
- **13类管理视图、11类确定性渲染**：除通用管理汇报外，补齐项目一页纸、项目健康度、里程碑甘特图、RAID管理表和业务流程—技术方案页。
- **拒绝AI感**：白底、严格网格、克制配色、可读字号，不堆卡片和装饰图标。
- **跨Agent平台**：适配 ChatGPT/Codex、Claude Code、Cursor、Gemini CLI、WorkBuddy 等兼容 Agent Skills 的环境。

## Fast Loop

```mermaid
flowchart LR
    A[整套规划] --> B[结构校验]
    B --> C[批量生成]
    C --> D[锁定通过页]
    D --> E[只返修失败项]
```

## 安装

```bash
git clone https://github.com/ruidaruan-dev/slide90.git
cd slide90

python scripts/install.py --target workbuddy
# 也支持：codex、claude、cursor、gemini
```

只预览安装位置：

```bash
python scripts/install.py --target workbuddy --dry-run
```

## 使用示例

```text
使用 $build-executive-report-slides 的 Fast Loop 模式，把下面的季度工作总结
设计成5页领导汇报。保留全部事实和数字，先生成整套页面规范，使用结论式标题，
整套只渲染一次，只返修失败页面。
```

```text
使用 $build-executive-report-slides，把这页岗位匹配度重构为证据矩阵。
不得虚构项目和指标，输出可编辑的16:9页面。
```

## 管理汇报与项目汇报覆盖

| 领导要回答的问题 | 页面类型 |
|---|---|
| 做出了什么成果？ | 业绩总览 |
| 为什么相信这个判断？ | 证据矩阵 |
| 问题在哪里、原因是什么？ | 问题诊断 |
| 下一步做什么、什么时候完成？ | 路线图 |
| 组织如何协同运作？ | 能力闭环 |
| 哪些项目优先投入？ | 项目组合表 |
| 应该选择哪个方案？ | 方案对比 |
| 需要领导决定什么？ | 决策页 |
| 这个项目究竟要做什么？ | 项目一页纸 |
| 项目是否受控、哪里需要关注？ | 项目健康度 |
| 关键工作何时完成、依赖是什么？ | 里程碑甘特图 |
| 哪些风险、问题、决策和行动需要闭环？ | RAID管理表 |
| 业务需求如何落到流程、数据和技术方案？ | 业务流程与技术方案页 |

确定性渲染器目前支持表中的11类页面；问题诊断与方案对比暂由 Agent Skill 路由，后续纳入渲染器。

运行5页完全虚构的项目汇报验收样例：

```bash
node bin/slide90.mjs render examples/project-report/deck-spec.zh-CN.json --output project-report.pptx
npm run verify:project
```

该门禁连续生成整套3次，检查结构一致、中文字体、可编辑形状、方框约束与单页生成，并在超过600秒时失败。

## 验证与性能测试

```bash
npm test
npm run eval:validate
npm run eval:baseline
npm run verify:p0
npm run verify:p1
npm run verify:project
npm run benchmark
python scripts/validate_repo.py
python -m unittest discover -s tests
python scripts/package_skill.py
```

## 隐私与脱敏

严禁提交真实内部PPT、水印截图、客户名称、保密指标和未经授权的企业模板。所有公开示例必须使用虚构数据或经过明确授权。

## 开源协议

Apache License 2.0，详见 [LICENSE](LICENSE)。
