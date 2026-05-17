# RedPen

Pentest AI Agent Platform — 基于 35+ Claude Code 子代理的渗透测试智能体平台，提供 scope-gated 安全执行、SQLite 持久化和 8 模块 GUI。

![Dashboard](screenshots/dashboard.png)

## 项目背景

RedPen 脱胎于 [pentest-ai-agents](https://github.com/0xSteph/pentest-ai-agents) 项目，后者定义了 35 个渗透测试子代理（覆盖侦察、扫描、Web、AD、云安全等领域）并通过 Claude Code CLI 运行。RedPen 在此基础上做了以下改造：

- **GUI 化**：Electron + React + Ant Design 8 模块桌面应用
- **安全增强**：Scope-Gate 插件（硬拦截拒绝清单 + CIDR/域名校验 + 命令审计）
- **数据持久化**：SQLite 10 张表（engagements, hosts, services, vulns, credentials, chains, session_log, approvals, task_state, config_versions）
- **OpenCode 兼容**：Converter CLI 自动将 `.claude/` 格式转为 `.opencode/` 格式
- **国际化**：i18next 中/英双语支持

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  React GUI (Vite)                │
│  Dashboard │ Engagements │ Agents │ Execution    │
│  Findings  │ Reports     │ Config │ Process      │
├─────────────────────────────────────────────────┤
│              Zustand Stores (mock/IPC)           │
├─────────────────────────────────────────────────┤
│              Main Process Services               │
│  AgentService │ ScopeService │ ExecutionService  │
│  FindingsService │ ReportService │ IPC Handlers  │
├─────────────────────────────────────────────────┤
│              Security Plugins                    │
│  scope-gate (before) │ cmd-audit (after)        │
│  session-sync (idle)                            │
├─────────────────────────────────────────────────┤
│           SQLite (better-sqlite3, WAL)           │
└─────────────────────────────────────────────────┘
```

## Agent 体系

### 双层架构

| 层级 | 职责 | 审批要求 | 代表代理 |
|------|------|---------|---------|
| **Tier 1 - Advisory** | 分析、规划、方法论指导 | 无需审批 | osint-collector, threat-modeler, report-generator |
| **Tier 2 - Execution** | 组合并执行命令 | 需 scope 校验 + 人工审批 | recon-advisor, vuln-scanner, web-hunter, ad-attacker |

### 35+ 代理覆盖领域

- **侦察**：recon-advisor, osint-collector, c2-operator
- **扫描**：vuln-scanner, nikto, nmap NSE
- **Web**：web-hunter, api-security, bizlogic-hunter
- **AD/内网**：ad-attacker, exploit-chainer, credential-tester
- **云安全**：cloud-security, container-breakout
- **防御/蓝队**：detection-engineer, malware-analyst, stig-analyst
- **社会工程**：social-engineer, phishing-operator
- **移动/IoT**：mobile-pentester, wireless-pentester
- **报告**：report-generator, engagement-planner

## 安全机制

### Scope Gate

所有 Tier 2 命令执行前必须通过 scope gate 校验：

1. **目标校验**：提取命令中的 IP/CIDR/域名，验证是否在 engagement scope 内
2. **硬拦截清单**：匹配以下模式的命令被直接拒绝：
   - `masscan 0.0.0.0/0` — 全网扫描
   - `| bash` / `| sh` — 管道注入
   - `rm -rf /` — 系统破坏
   - `hping3 --flood` — DoS 工具
   - `--destructive` — 危险标志
   - fork bomb 模式
3. **噪音分级**：QUIET（被动）/ MODERATE（主动扫描）/ LOUD（激进扫描，可能触发 IDS）
4. **人工审批**：Operator 在 GUI 审批队列中 approve/deny

### 命令审计

所有执行的命令自动记录到 `session_log`，包含：
- 执行代理、命令、参数
- 执行状态（executed/blocked/denied）
- 证据文件路径（`data/evidence/{engagement_id}/{tool}_{target}_{timestamp}.log`）

## 安装

### 环境要求

- Node.js >= 18
- npm >= 9

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/wolf0x/redpen.git
cd redpen

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 浏览器访问 http://localhost:5173

# 运行测试
npm test

# 构建生产版本
npm run build
```

### OpenCode 集成

```bash
# 转换 .claude/ → .opencode/ 格式
npm run converter

# 生成的文件位于 .opencode/ 目录
# - .opencode/agents/*.md
# - .opencode/commands/*.md
# - opencode.json
```

## 8 模块功能

### 1. Dashboard（仪表盘）

![Dashboard](screenshots/dashboard.png)

- 统计总览：Hosts / Vulns / Credentials / Attack Chains
- 活跃 Engagement 卡片（含风险分布、确认率、攻击链完成度）
- 最近活动时间线
- Engagement 状态分布

### 2. Engagements（项目管理）

![Engagements](screenshots/engagements.png)

- Engagement CRUD（客户、类型、scope、ROE、日期、状态）
- Scope 编辑器（IP/CIDR/域名实时解析 + 可视化校验标签）
- 一键激活为当前工作 Engagement

### 3. Agents（代理控制台）

![Agents](screenshots/agents.png)

- 35+ Agent 表格（域名/层级筛选）
- Agent 详情抽屉（工具列表、Prompt 预览、模型信息）
- 代理配置与版本管理

### 4. Execution（执行中心）

![Execution](screenshots/execution.png)

- **实时执行 Tab**：Task Orchestrator → 命令排队 → 审批队列（approve/deny）→ 执行流 → Scope Gate 状态
- **审计追踪 Tab**：已审批记录 + Session Log 时间线
- New Task 对话框（选择代理、命令、噪音级别）

### 5. Findings（发现中心）

![Findings](screenshots/findings.png)

- 5 个 Tab：Hosts / Services / Vulns / Credentials / Attack Chains
- Vuln 批量状态更新（选中多个 → 设为 confirmed/fixed/accepted）
- 详情抽屉（CVSS、CVE、MITRE ATT&CK、PoC 输出）
- Attack Chain 步骤可视化

### 6. Reports（报告中心）

![Reports](screenshots/reports.png)

- 3 种报告类型：Technical / Executive / Handoff
- 数据驱动 Markdown 生成
- 实时预览 + 导出 MD/JSON

### 7. Config（配置中心）

![Config](screenshots/config.png)

- **Policy**：审批策略（All/High Risk Only/Auto）、Scope 强制开关、硬拦截规则展示
- **Tool Health**：渗透工具安装状态扫描（nmap, nuclei, sqlmap, ffuf, bloodhound 等 15+ 工具）
- **Model Strategy**：各 Agent 模型与预估成本
- **Environment**：证据路径、数据库路径、本地模型端点

### 8. Process（过程追踪）

![Process](screenshots/process.png)

- 攻击链进度图（6 阶段：侦察 → 枚举 → 漏洞分析 → 利用 → 后渗透 → 报告）
- 基于 Session Log 自动计算各阶段完成度
- 完整事件时间线（含命令详情）
- 证据文件浏览器

## 项目结构

```
redpen/
├── .claude/
│   ├── agents/          # 35+ agent 定义文件 (YAML frontmatter)
│   └── commands/        # recommend, agents-for, memory 命令
├── .opencode/           # converter 生成的 OpenCode 兼容格式
├── db/
│   └── schema.sql       # SQLite 10 表 schema
├── scripts/
│   ├── converter-cli.ts      # .claude/ → .opencode/ 转换器
│   ├── parse-agents-meta.ts  # 解析 agent 元数据
│   ├── opencode-installer.ts # OpenCode 安装脚本
│   └── screenshot.ts         # 自动截图脚本
├── screenshots/         # 各模块截图
├── src/
│   ├── main/
│   │   ├── index.ts           # Electron 主进程入口
│   │   ├── preload.ts         # IPC bridge
│   │   ├── ipc-handlers.ts    # 40+ IPC 通道注册
│   │   └── services/
│   │       ├── AgentService.ts
│   │       ├── DatabaseService.ts
│   │       ├── ExecutionService.ts
│   │       ├── FindingsService.ts
│   │       ├── ReportService.ts
│   │       └── ScopeService.ts
│   ├── plugins/
│   │   ├── scope-gate.ts      # 安全：scope 校验 + 硬拦截
│   │   ├── cmd-audit.ts       # 安全：命令审计日志
│   │   ├── session-sync.ts    # 会话：空闲时生成 handoff
│   │   └── types.ts
│   ├── renderer/
│   │   ├── App.tsx            # 路由 + 布局
│   │   ├── main.tsx           # React 入口
│   │   ├── api/mockData.ts    # 前端 mock 数据
│   │   ├── i18n/              # 中/英翻译
│   │   ├── pages/             # 8 个页面组件
│   │   └── stores/            # Zustand 状态管理
│   └── shared/
│       ├── types.ts           # 共享 TypeScript 接口
│       └── constants.ts       # 常量定义
├── tests/
│   ├── smoke/            # agent 加载、DB 写入
│   ├── security/         # scope 拒绝、危险模式拦截
│   └── regression/       # converter 输出、Tier 流程
├── AGENTS.md             # 顶层代理指令
├── opencode.json         # OpenCode 配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm test` | 运行全部测试 (83 个) |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run converter` | 执行 .claude/ → .opencode/ 转换 |
| `npx tsx scripts/screenshot.ts` | 自动截取各页面截图 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite |
| UI | Ant Design 5 + @ant-design/icons |
| 状态 | Zustand |
| 路由 | react-router-dom 6 |
| 国际化 | i18next + react-i18next |
| 数据库 | better-sqlite3 (WAL 模式) |
| 主进程 | Electron 28（可选，当前纯前端模式） |
| 测试 | Vitest |
| 安全 | Scope-Gate 插件 + 硬拦截清单 |

## 配置

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `data/evidence/` | - | 命令输出证据存储目录 |
| `data/handoffs/` | - | Session handoff 报告目录 |
| `data/redpen.db` | - | SQLite 数据库文件路径 |

### 审批策略

- **All Approval**：所有 Tier 2 命令需人工审批
- **High Risk Only**：仅 LOUD 级别命令需审批，MODERATE/QUIET 自动通过
- **Auto-Approve Safe**：匹配安全模式的命令自动通过

### 噪音级别

| 级别 | 说明 | 颜色标识 |
|------|------|---------|
| QUIET | 被动侦察，不发包 | 绿色 |
| MODERATE | 主动扫描，限速 | 橙色 |
| LOUD | 激进扫描，可能触发 IDS | 红色 |

## License

MIT
