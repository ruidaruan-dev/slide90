# Slide90

**少花时间调格式，把决策逻辑真正画出来。**

Slide90 是一个面向企业管理汇报的开源 Agent Skill。它把工作总结、经营数据、项目进展、问题诊断和组织规划，转化为紧凑、证据驱动、可直接用于管理决策的演示文稿。

**P0 已经可执行：**正式 deck-spec schema、统一 CLI 和首个自带渲染器已经能够把 `evidence-matrix`（证据矩阵）与 `capability-loop`（能力闭环）生成为可编辑 PowerPoint。

核心不是“再做一套模板”，而是改变生成循环：**一次规划整套PPT、生成前校验结构、整套批量渲染、锁定通过页面、只返修失败元素**。

在5页受控运行时测试中，Fast Loop 将总耗时降低 **79.4%**，且前后输出像素完全一致。Slide90 是项目目标，79.4% 是当前已有证据。

[English](README.md) · [测试说明](BENCHMARK.md) · [路线图](ROADMAP.md) · [参与贡献](CONTRIBUTING.md)

![Slide90 Fast Loop 演示](assets/slide90-demo.gif)

## P0：从结构化规范到可编辑 PowerPoint

```mermaid
flowchart LR
    A[原始业务材料] --> B[通过校验的 deck spec]
    B --> C[整套批量渲染]
    C --> D[可编辑 PPTX]
    D --> E[渲染与溢出检查]
```

![P0 可编辑 PowerPoint 预览](examples/end-to-end/output/preview.png)

直接运行公开样例：

```bash
npm ci
node bin/slide90.mjs validate examples/end-to-end/deck-spec.json
node bin/slide90.mjs render examples/end-to-end/deck-spec.json \
  --output examples/end-to-end/output/slide90-p0-demo.pptx
```

交付前执行 P0 验收门：

```bash
npm run verify:p0
```

它会自动运行测试、检查24题核心管理汇报测试集、校验 deck spec、连续生成三次可编辑 PPTX、比较页面语义指纹、检查原生形状/文本与来源备注、运行五页基准，并在完整检查超过 600 秒时直接失败。最新验收结果保存在 [`benchmarks/results/p0-verification-latest.json`](benchmarks/results/p0-verification-latest.json)。

核心测试集位于 [`evals/cases.json`](evals/cases.json)：八类管理页面各3题，每题包含预期版式、标题结论、必须保留的事实和禁止臆造项。它当前验证“考题和答案标准是否完整”；后续规划器提交候选 deck spec 后，再按同一答案标准评分。

运行 `npm run eval:baseline` 可以用不读取答案字段的规则基线完成24题，并输出结构正确率、事实保留率和禁止项命中数。外部Agent必须只读取 `evals/blind-prompts.json`；其中使用不可推断页面类型的匿名ID，并要求保持英文及原始数字、日期和专有名词。该基线只验证评测闭环，不代表最终AI设计质量。

正式数据契约位于 [`schema/deck-spec.schema.json`](schema/deck-spec.schema.json)。公开样例完整保留了[虚构原始材料](examples/end-to-end/source.md) → [deck spec](examples/end-to-end/deck-spec.json) → [可编辑 PPTX](examples/end-to-end/output/slide90-p0-demo.pptx) → PNG 预览的链路。

## 为什么值得用

- **先回答领导问题**：标题直接给结论，不再使用“工作介绍”“未来规划”等空标题。
- **用证据代替形容词**：指标、项目交付、机制和责任比“持续赋能”更有说服力。
- **整套一次规划**：先形成完整故事线和页面规范，避免逐页重复理解材料。
- **只返修失败页面**：通过的页面立即锁定，不因一处问题重做整套PPT。
- **八类稳定版式**：业绩总览、证据矩阵、问题诊断、路线图、组织闭环、项目组合、方案对比和决策页。
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

## 八类管理页面

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

P0 自带渲染器先支持证据矩阵和能力闭环，其余六种版式继续由 Agent Skill 的结构规范与平台适配器支持，后续逐步纳入确定性渲染器。

## 验证与性能测试

```bash
npm test
npm run eval:validate
npm run eval:baseline
npm run verify:p0
npm run benchmark
python scripts/validate_repo.py
python -m unittest discover -s tests
python scripts/package_skill.py
```

## 隐私与脱敏

严禁提交真实内部PPT、水印截图、客户名称、保密指标和未经授权的企业模板。所有公开示例必须使用虚构数据或经过明确授权。

## 开源协议

Apache License 2.0，详见 [LICENSE](LICENSE)。
