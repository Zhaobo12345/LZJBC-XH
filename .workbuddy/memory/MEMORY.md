# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 协作约定（重要）
- **中断即取消**：用户中途取消某任务后立即给新指令 → 被中断任务视为已取消，仅执行新指令。
- 单点改动、逐项确认工作流（create-contract / worker-contract 原型迭代）延续：代码定稿后再同步 PRD（除非说"仅改代码"）。
- **改动前置约束**：任何修改不得影响基础施工/设计服务合同原流程；工人合同逻辑一律经 `isWorkerType` / 独立页面门控。

## PRD 书写规范
- **中英文顺序**：以中文为主、英文 key 辅，有中文对照者一律「中文（英文标识符）」前置（如 `初始拟定（worker_draft_initial）`），禁止英文前置；状态机表列序固定 `显示文案 | 状态 key | …`。**例外保持英文在前**：技术标识符/组件名/代码表达式/URL 片段（如 `localStorage（无后端）`、`POST /api/v1/...`）。
- **裸英文自查**：字段名/状态名/枚举值/子字段有中文对照者一律「中文（英文标识符）」前置（`媒体文件（files）`），禁止 `<code>files</code>` 类裸英文；仅 MIME/URL/代码表达式可保留英文置 `<code>`。每轮改动后 Grep 扫 `<code>` 与裸露英文字母串确认无违规。
- **第一版不写历史对比**：当前 PRD 为 V1，不写"本版已取消 X / 已移除 X"，不为砍掉功能留"已取消"专节；功能取舍仅存代码层记忆。
- **合同状态机以原型为权威基准**：PRD 内所有合同状态的中文名与状态 key 必须与 `service-miniapp/contract-detail.html` 步骤条（拟定中/平台审核/确认中/已确认/已签约）及 `contract-detail.js` STATUS_MAP（`draft`/`platform_reviewing`/`confirming_sender`/`confirming_receiver`/`confirmed`/`signed`/`platform_rejected`/`changing` + 变更态 `change_platform_reviewing`/`change_platform_rejected`/`change_confirming*`/`change_signing_wait`）严格对齐；工人合同状态以 `contract-store.js` 为准（全程无平台审核）。写状态机前先 Grep 原型确认，杜绝自造「待审核/待确认/待签约」「drafting/pending_review/pending_confirm/pending_sign」等偏离名。**注意 PC 运营端模块使用自有状态 key（`pending_review`/`changing`/`reviewed_*` 等），与小程序 `platform_reviewing` 为不同层映射，属正常，勿改。**

## 关键架构约定
- 六类工人合同（拆除/水电/木作/泥瓦/油漆/小零工）走独立页 `worker-contract-detail.html`+`.js`；基础/设计合同走 `contract-detail.html`。
- 工人合同数据层前端 `localStorage`（无后端），`contract-store.js` 提供 `window.ContractStore`；并发首胜防重用 `confirmInvitation` 首胜校验。
- 右侧原型导航「合同状态切换（工人合同）」以 `state.status`（预览态）为准，非真实 `c.status`。
- 工人合同两种草案态 `worker_draft_initial`/`worker_draft` 共用内联编辑面板 `draftContentWrap`（替代只读 `readOnlySections`），由底部"提交邀请"统一提交；状态步骤条 拟定中→确认中→已确认→已签约。
- 工人合同 **甲方=陈庄（工长，非业主）**；阶段确认人 `conf`=陈庄；"业主"候选 `m-owner` 仅系统角色、不参与意向乙方；意向乙方仅限六工种。
- 意向乙方按合同类型过滤工种：`TRADE_ROLE_BY_TYPE` 映射类型→工种角色，草稿面板仅展示匹配工种。
- 受邀方终态（`worker_lost_receiver`/`worker_rejected_receiver`）渲染轻量「邀约已结束」视图 `#receiverEndedView`，仅作用于受邀方终态，发起方视角保持完整。
- 受邀方视角（`state.viewer==='receiver'`）差异化：`renderMeta` 去掉「合同类型」「所属架构层级」、新增「项目地址」（`projectAddress`）；正文预览仅展示关键条款（`receiverKeyClausesHTML()`），「查看全文」→「查看全部正文」（`buildReceiverContractHTML()`）；发起方/草稿态保持原样。

## 数据口径约定（全部待办页）
- service/owner 端「全部待办」不含「临时任务」示例项、不含「待审核」待办（仅 PC 运营端有）；所有任务类待办标签=「任务」（2026-08-04 统一更正，原误标「合约」），真实 合同/变更/架构/对账单 类标签保持原样。
- 「邀请加入强电施工组」（架构标签）点击跳 `invite-join.html?group=强电施工组`，接受/拒绝写 `localStorage['lzj_group_invite_强电施工组']`，返回待办页移除并角标重算。
- service 端角标硬编码（全部13/待处理10/已处理3）；owner 端角标由 `updateTodoBadges()` 动态算（含 localStorage 注入「对账单」待办）。
- 消息页 Tab 结构：service-miniapp 含 邀请/合同邀约 两 Tab（2026-08-19 已移除「任务通知」「系统消息」Tab）；owner-miniapp 仅"邀请"一类、**不展示分类 Tab 栏**（2026-08-19 移除「任务通知」「系统消息」，本日取消单 Tab 栏），消息直接列表渲染，未处理数量以底部导航"消息"项右上角红色角标（#navMsgBadge，由 updateBadge 维护）呈现。「合同邀约」Tab 仅 service-miniapp 有，勿误加至 owner；owner 端亦勿恢复「系统消息」Tab 或加回分类 Tab 栏。

## 合同邀约体验方案页面位置约定（被邀请人视角）
- C方案（微信服务通知）独立页 `service-miniapp/wechat-service-notice.html`（绿色微信外壳，点开直达 `worker-contract-detail.html?viewer=receiver`），不可放小程序内消息页。
- A方案（顶部邀约通知条）独立页 `service-miniapp/invite-banner-demo.html`。
- A/C 二级入口挂 `worker-contract-detail.html` 右侧原型导航「演示数据」分组底部（`<a>` 链接 + `status-switch-divider`，分组计数 7→9）。
- 方案 E（整页接单卡片流）独立页 `service-miniapp/worker-contract-receive.html`（2026-08-05 新增，零耦合）；勿再在 message.html 内置 C 演示。
- 原 `service-miniapp/share-navigation.html` 已于 2026-08-04 删除，勿恢复。

## 页面布局约定（项目详情进行中-新版）
- `project-detail-ongoing-v2.html`（service/owner 两份）「待办事项」卡片不与架构切换联动，置于吸顶导航（快捷入口+架构切换）之前；改按 HTML 注释锚点整体移动，不改 CSS/JS，两份同步。
- 现状顺序：项目基本信息 → 待办事项 → [快捷入口+架构切换 吸顶] → 合同/任务概览 → 今日动态（owner 版今日动态在吸顶后、合同概览前）。

## 架构层级联动约定（2026-08-19 方案A）
- 详情页 `selectLevel()` 末尾统一把「任务概览/今日动态」`.more` 链接改带 `?level=架构层级名`（encodeURIComponent；项目部=不带参）。已改 3 页：service ongoing-v2、service/owner completed-v2；**owner ongoing-v2 无层级切换 JS（静态展示），不携带、勿加交互**。
- `task-list.html`：`.contract-section` 挂 `data-level`（合同↔工作组一一对应：水电/泥瓦/木工/油漆工作组）；`currentFilters.level`；`filterTasks()` 分组层早退；标签复用 `updateFilterTags`/`removeFilter`（文案「架构层级：XX」）。
- `activity-list.html`：activities 加 `level` 字段（设计服务/基础施工→项目部）；`currentLevelFilter` 置 renderActivities 过滤链头部；`#levelFilterRow/#levelFilterTag` 可移除标签；`initLevelFilter()`/`clearLevelFilter()`。
- 口径：层级与既有筛选 AND 叠加、计数联动；**全部待办 todo-list 不携带层级**（按人聚合，无对应关系）。

## 产品决策与功能取消记录
- 已取消「引导到电脑端编辑合同内容」：基础施工合同 `contract-detail.*` 不再提供 PC 端编辑引导；已删 `editGuideBox`/`pcEditGuide` 及 `copyEditLink`/`fallbackCopy`/`showPCEditGuide`。勿恢复。
- 工人合同「已确认（受邀方）」不支持上传签约文件（2026-08-14）：纸质合同扫描件仅发起方（工长·甲方，`worker_confirmed_sender` 内联 `pickSignFile` + 整页 `worker-sign-upload.html`）上传；受邀方（`worker_confirmed_receiver`）与方案 E 仅只读等待。代码已改 `worker-contract-detail.js`/`worker-contract-receive.html`；PRD §7.5.1/§8.2/§8.4 已去"受邀方上传签约文件"。
- 基础合同阶段编辑器两套并行体系（易踩坑）：拟定中表单 `#editStageList`（`.stage-card`，`renderStagesFromSnapshot` 等）+ 变更流程 `#stageEditContainer`（`.stage-edit-item`，`addNewStage` 仅服务变更）。阶段处理函数（`deleteStage`/`addTaskToStage`/`toggleStageSequential`/`editStageSettings`/`checkChangeContent`）已兼容双选择器（`.stage-card, .stage-edit-item`）。改这些函数须保双体系兼容；`addNewStage` 勿改 `.stage-card`/`#editStageList`。

## 任务模块后置状态小节顺序（2026-08-17）
- 服务方与业主端任务详情页四个后置状态小节顺序一致：**已完成 → 驳回后待开始 → 确认中（被驳回后） → 已完成（含驳回）**（服务方 §3.16~§3.19 / 业主端 §6.9~§6.12；映射：3.16=6.9=已完成、3.17=6.10=驳回后待开始、3.18=6.11=确认中被驳回后、3.19=6.12=已完成含驳回）。增删/引用须同步重映射 `§3.1[6789]`/`§6.[9,10,11,12]` 引用与 TOC。

## 原型城市范围（2026-08-10）
- 仅支持 北京、南阳、西安（`create-project.html` 注释"仅支持北京、河南、陕西"→北京市/南阳市/西安市）。
- 所有页面与文档示例城市必须落此范围，不得出现 杭州/上海/深圳/广州/成都/宁波/温州/浙江/江苏 等越界城市；合同/项目主示例统一用 西安（陕西省/西安市），消息页地址可在三城轮替。
