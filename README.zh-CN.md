# Slide90

**少花时间调格式，把决策逻辑真正画出来。**

Slide90 是一个面向企业管理汇报的开源 Agent Skill。它把工作总结、经营数据、项目进展、问题诊断和组织规划，转化为紧凑、证据驱动、可直接用于管理决策的演示文稿。

核心不是“再做一套模板”，而是改变生成循环：**一次规划整套PPT、生成前校验结构、整套批量渲染、锁定通过页面、只返修失败元素**。

在5页受控运行时测试中，Fast Loop 将总耗时降低 **79.4%**，且前后输出像素完全一致。Slide90 是项目目标，79.4% 是当前已有证据。

[English](README.md) · [测试说明](BENCHMARK.md) · [路线图](ROADMAP.md) · [参与贡献](CONTRIBUTING.md)

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

## 隐私与脱敏

严禁提交真实内部PPT、水印截图、客户名称、保密指标和未经授权的企业模板。所有公开示例必须使用虚构数据或经过明确授权。

## 开源协议

Apache License 2.0，详见 [LICENSE](LICENSE)。
