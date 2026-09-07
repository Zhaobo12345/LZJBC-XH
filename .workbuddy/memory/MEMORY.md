# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 协作约定（最高优先级）
- **中断即取消**：用户中途取消某任务后立即给新指令 → 被中断任务视为已取消，仅执行新指令。
- **先确认后改**：提方案（结构化表格：方案/理由/风险）→ 用户确认 → 再实现；禁止自作主张；改完代码再同步 PRD（除非说"仅改代码"）。
- **改动前置约束**：不得影响基础施工/设计服务合同原流程；工人合同逻辑一律经 `isWorkerType` / 独立页面门控；不得破坏既有交互、页面其他模块。
- **无滚动条（全局）**：小程序端滚动容器一律 `::-webkit-scrollbar{display:none}` + `scrollbar-width:none` + `-ms-overflow-style:none`。
- **页面必带微信小程序默认导航栏**（状态栏 + nav + 原生胶囊占位）；mobile-first 全宽堆叠，复合卡片不并排半宽；兼顾中老年可访问性（触控区够大）。
- 校验留痕：`node --check` JS + `.workbuddy/_validate_html.py <file>` 验 HTML 标签平衡 + CSS 大括号平衡 + id 引用自检；验收后截图复核。

## PRD 书写规范
- 「中文（英文标识符）」前置，禁止英文前置或 `<code>` 裸英文；例外：MIME/URL/代码表达式/组件名可留英文。每轮改后 Grep 扫违规。
- 状态机表列序固定 `显示文案 | 状态 key | …`；V1 不写历史对比，不为已砍功能留"已取消"专节。
- **状态基准以原型为权威**：工人合同看 `contract-store.js` + `worker-contract-detail.js` STATUS_CONFIG；基础/设计合同看 `contract-detail.*`（含平台审核）。写前先 Grep 原型，杜绝自造状态名。PC 运营端用自有 key（`pending_review`/`reviewed_*`）属另一层映射，勿改。

## 工人合同（service-miniapp）
- 六类工种合同（拆除/水电/木作/泥瓦/油漆/小零工）走 `worker-contract-detail.html`+`.js`（合并页，暴露 `WCP`）；基础/设计合同走 `contract-detail.html`。数据层 `localStorage`（无后端），`js/contract-store.js` 提供 `window.ContractStore`。
- **甲方=陈庄（工长，非业主）**；意向乙方仅限六工种（`TRADE_ROLE_BY_TYPE` 过滤）；"业主"候选 `m-owner` 不参与意向乙方。
- 右侧原型导航「合同状态切换」以 `state.status`（预览态）为准；四组：发起方视角(5)/受邀方视角(4)/演示数据/变更阶段(4)。**同一组需同步修改 5 个页面**（合并页 + signed/confirming/draft-initial/receive-confirmed 四个 -new 页）。
- 受邀方视角（`state.viewer==='receiver'`）差异化：`renderMeta` 去掉「合同类型」「所属架构层级」、加「项目地址」；正文预览仅关键条款（`receiverKeyClausesHTML()`）。终态（`worker_lost_receiver`/`worker_rejected_receiver`）渲染轻量 `#receiverEndedView`。
- **变更阶段布局（2026-09-07 对齐）**：发起方两态（`change_confirming_sender`/`change_rejected+sender`）走 `#changeReadOnlyWrap`（合同正文/阶段任务/附件 三 Tab，卡片标题「🤝 合同方」，参考「已签约（发起方）-新」）；受邀方两态（`change_confirming`/`change_rejected+receiver`）走 `#receiverChangeWrap`（合作方→工期→违约责任→合同全部正文链接+已阅读徽标→我要干的活(折叠)→附件，卡片标题「🤝 合作方」，参考 `worker-contract-receive-confirmed-new.html`）。标题三分支（变更发起方=合同方／变更受邀方=合作方／其余=原标题），**必须还原**。

## 工人合同变更流程最新规则（2026-09-07）
- 流程：已签约 → 发起变更（`worker-contract-change.html`）→ 对方确认 → 即生成 V2 已签约（**无上传签约文件环节**）；驳回 → 变更已驳回 → 可重发/返回已签约。
- 已删除：`change_signing_wait`、`worker-change-sign-upload.html`、`worker-sign-upload.html`、`upload_change_sign`。勿恢复。
- `applyChangeAction('confirm_change')` 返回 `{next:'worker_signed', applyProposal:true}` → 调 `applyChangeProposal()` 生成 V2；回到 `worker_signed` 时 `clearChangeProposal()`。
- **范围边界**：合规版 `contract-detail.html`/`js/contract-detail.js` 是另一套流程（含平台审核、`change_signing_wait` 仍有效，`todo-list.html:432` 指向它），清理工人合同变更态勿误伤。

## 数据口径 / 页面约定
- 「全部待办」不含「临时任务」「待审核」；任务类待办标签=「任务」；层级不进 todo-list（按人聚合）。
- 消息页 Tab：service 端仅 邀请/合同邀约（无任务通知/系统消息）；owner 端**不显示 Tab 栏**，未读数走底部导航 `#navMsgBadge`。
- 被邀请人体验演示页：`wechat-service-notice.html`（C）、`invite-banner-demo.html`（A）、`worker-contract-receive-inviting.html`（E 入口）。已删 `share-navigation.html`、`worker-contract-receive.html`、`project-detail-worker.html`，勿恢复。
- 业主端项目详情已收敛为 `project-detail-ongoing-v2.html` / `project-detail-completed-v2.html`（旧 `project-detail*.html` 已删）；但 `css/project-detail.css`+`js/project-detail.js` 是两 -v2 页共享资源，**勿按同名误删**。
- 架构层级联动：`selectLevel()` 给两级链接带 `?level=`（service ongoing-v2、service/owner completed-v2；owner ongoing-v2 无 JS 静态展示勿加）；`task-list.html`/`activity-list.html` 各自过滤。
- 「待办事项」卡片在 `project-detail-ongoing-v2.html` 中置于吸顶导航之前。
- 原型城市仅限 北京/南阳/西安；主示例统一 西安。
- 任务模块后置四小节顺序（服务方 §3.16~3.19 / 业主端 §6.9~6.12）：已完成 → 驳回后待开始 → 确认中（被驳回后） → 已完成（含驳回）；增删须同步重映射引用与 TOC。
- 合规版阶段编辑器两套并行：拟定中 `#editStageList`(`.stage-card`) + 变更 `#stageEditContainer`(`.stage-edit-item`)；相关函数须兼容双选择器 `.stage-card, .stage-edit-item`。
