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
- 受邀方视角分组（2026-09-08）：5 项=确认中（受邀方）/ **已签约（受邀方）**（原「已确认（受邀方）-新」更名，页 `worker-contract-receive-confirmed-new.html`，hero 右上「🔨 履约中」徽标）/ **已签约（已履约）**（页 `worker-contract-fulfilled-receiver.html`，全部任务「✓ 已完成」+「🏆 已履约完成」徽标）/ 已拒绝 / 抢单失败；6 个工人合同原型页导航同步；PRD-合同模块 §8.4.6/§8.4.7 为权威描述。
- **受邀方阶段任务卡片标题=「🔧 承接任务」（2026-09-08 定名）**：原口语「我要干的活」已全局替换，勿恢复；涉及 receive-inviting / receive-confirmed-new / fulfilled-receiver 三页 + `worker-contract-detail.js` 受邀方变更态卡片流 + PRD-合同模块各节；发起方仍叫「阶段任务」。
- **工人合同模板预览弹窗基准=「拟定中（发起方）-新」的 wcd-sheet 底部抽屉（2026-09-08）**：合并页 `worker-contract-detail.html` 的 `#wcTemplatePreview` 已重构为 `.wc-wcd-*` 同款（元信息 span 条 + 纵向「取消」「使用此模板」药丸按钮 + 阶段蓝圈序号/#fa8c16 顺序标签）；选择弹窗 `wcTemplatePicker` 仍为合规版 `.wc-template-modal` 风格，勿混改。
- **变更阶段布局（2026-09-07 对齐）**：发起方两态（`change_confirming_sender`/`change_rejected+sender`）走 `#changeReadOnlyWrap`（合同正文/阶段任务/附件 三 Tab，卡片标题「🤝 合同方」，参考「已签约（发起方）-新」）；受邀方两态（`change_confirming`/`change_rejected+receiver`）走 `#receiverChangeWrap`（合作方→工期→违约责任→合同全部正文链接+已阅读徽标→承接任务(折叠)→附件，卡片标题「🤝 合作方」，参考 `worker-contract-receive-confirmed-new.html`）。标题三分支（变更发起方=合同方／变更受邀方=合作方／其余=原标题），**必须还原**。

## 工人合同变更流程最新规则（2026-09-07）
- 流程：已签约 → 发起变更（`worker-contract-change.html`）→ 对方确认 → 即生成 V2 已签约（**无上传签约文件环节**）；驳回 → 变更已驳回 → 可重发/返回已签约。
- 已删除：`change_signing_wait`、`worker-change-sign-upload.html`、`worker-sign-upload.html`、`upload_change_sign`。勿恢复。
- `applyChangeAction('confirm_change')` 返回 `{next:'worker_signed', applyProposal:true}` → 调 `applyChangeProposal()` 生成 V2；回到 `worker_signed` 时 `clearChangeProposal()`。
- **范围边界**：合规版 `contract-detail.html`/`js/contract-detail.js` 是另一套流程（含平台审核、`change_signing_wait` 仍有效，`todo-list.html:432` 指向它），清理工人合同变更态勿误伤。

## 数据口径 / 页面约定
- **PC 端合同文本模板工人合同双字段（2026-09-07）**：`pc/pc-contract-template.html` 新建/编辑/预览按模板类型二选一——六类班组服务合同（工人合同）走「合同文本（工人合同）」双字段（违约责任=引用后可编辑绿色徽标 / 固定详细条款=引用后不可编辑红色徽标，templateData 存 `breach`/`fixed`，`syncTextFieldsByCategory()` 切换）；基础/设计合同保留单一「合同正文」富文本。口径与小程序 `buildTemplatePreviewSections()` 同步；PRD-PC端其他模块详细规格 §1.4/§1.5 已同步。
- 「全部待办」不含「临时任务」「待审核」；任务类待办标签=「任务」；层级不进 todo-list（按人聚合）。
- **「合同任务执行」待办类型已取消（2026-09-07）**：任务进入待开始/驳回后待开始**不生成应用内待办**；执行人提醒走**微信服务号通知**（原型 `service-miniapp/wechat-service-notice.html`，驳回通知点击 → `task-detail.html?status=rejected_pending&role=executor`）。勿恢复该类型或「任务执行待办」表述；PRD §4.8 小节已重编号（原 4.8.3~4.8.11 → 4.8.2~4.8.10）。**PRD-合同模块 §3.10.14 / §9.5.5 / §5.15 中「执行人待办生成/失效」表述已于 2026-09-08 全面改写为「微信服务号通知提醒」（§6.3.3「变更」标签待办与 §4997 工人合同说明属其它有效类型，不改）。** 全部待办筛选 = 待处理(pending+confirming)/已处理(completed)/已失效(invalidated)，无「全部」并集视图。
- 消息页 Tab：service 端仅 邀请/合同邀约（无任务通知/系统消息）；owner 端**不显示 Tab 栏**，未读数走底部导航 `#navMsgBadge`。
- **服务通知 SSOT 归口《PRD-完整文档》§7.10**（2026-09-07）：微信订阅消息推送总览表 5 项（合同邀约/任务驳回/合同被拒绝/变更待确认/变更已确认V2）；站内不占消息页 Tab、任务提醒站内不生成待办；新增通知项先登记 7.10 表再补模块规则。原型 `service-miniapp/wechat-service-notice.html` 演示五条，跳转经 `worker-contract-detail.html?status=&viewer=` 直达状态视角。
- 被邀请人体验演示页：`wechat-service-notice.html`（C）、`invite-banner-demo.html`（A）、`worker-contract-receive-inviting.html`（E 入口）。已删 `share-navigation.html`、`worker-contract-receive.html`、`project-detail-worker.html`，勿恢复。
- 业主端项目详情已收敛为 `project-detail-ongoing-v2.html` / `project-detail-completed-v2.html`（旧 `project-detail*.html` 已删）；但 `css/project-detail.css`+`js/project-detail.js` 是两 -v2 页共享资源，**勿按同名误删**。
- 架构层级联动：`selectLevel()` 给两级链接带 `?level=`（service ongoing-v2、service/owner completed-v2；owner ongoing-v2 无 JS 静态展示勿加）；`task-list.html`/`activity-list.html` 各自过滤。
- 「待办事项」卡片在 `project-detail-ongoing-v2.html` 中置于吸顶导航之前。
- 原型城市仅限 北京/南阳/西安；主示例统一 西安。
- 任务模块后置四小节顺序（服务方 §3.16~3.19 / 业主端 §6.9~6.12）：已完成 → 驳回后待开始 → 确认中（被驳回后） → 已完成（含驳回）；增删须同步重映射引用与 TOC。
- 合规版阶段编辑器两套并行：拟定中 `#editStageList`(`.stage-card`) + 变更 `#stageEditContainer`(`.stage-edit-item`)；相关函数须兼容双选择器 `.stage-card, .stage-edit-item`。
- **工人合同「新建任务」= 弹窗交互（2026-09-08 统一）**：`worker-contract-detail`（经 `WCP.openAddTaskModal`）与 `worker-contract-draft-initial-new`（全局函数）的「+ 添加任务」均打开 `#addTaskModal`（名称/执行人选填/确认人≤5/执行·确认·担责三标准，必填=名称+三标准），对齐非工人 `addTaskModal`；勿恢复旧内联 `addDraftTask` 追加按钮。工人页执行人/确认人函数均已 prefix 化（'edit'/'new'），`-new` 页下拉由 `fillPersonDropdown(prefix)` 动态填充、detail 页为静态选项。
- **添加任务「执行人默认值」（2026-09-08）**：非工人=默认填当前乙方（可修改/可清空，非必填），可选范围=项目内全部人员（下拉 7 人：张三/李四/王五/赵六/钱七/孙八/业主）；工人=与编辑任务同规则（乙方名单仅 1 人→默认填，多人→默认空）。PRD §3.5.2.1 与 §7.6 note 标题均为「编辑 / 添加任务 · 执行人默认值规则」。
- **工人合同执行人下拉可选范围=项目内全部人员（2026-09-08）**：编辑+添加任务弹窗执行人下拉均为项目全员 23 人（`WORKER_CANDIDATES`：陈庄/陈业主/王设计/刘项目总/孙工长+六工种各3人）。`-new` 页下拉一律由 `fillPersonDropdown(prefix)` 动态填充（editTaskDetail 必须调用 fillPersonDropdown('edit')，否则下拉为空——曾因此报缺陷）；detail 页为静态选项。detail 页确认人下拉仍为 7 人静态，未扩。
