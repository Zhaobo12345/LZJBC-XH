# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 协作约定（重要）
- **中断即取消**：当用户在消息中途发出 "Interrupted by user" 或明确表示"取消/不需要"某任务后，紧接着给出新的指令，则被中断的任务视为**已被取消**，不得继续执行或顺带落地。只执行用户新给出的指令。
- 单点改动、逐项确认的工作流（create-contract / worker-contract 等原型迭代）延续：代码定稿后再同步 PRD/文档（除非用户说"仅改代码"）。
- **PRD 中英文书写顺序约定（2026-08-10 确认）**：文档**以中文说明为主、代码/数据库标识为辅**。凡「状态码 / 枚举值 / 标签类型」等有中文对照者，一律 **中文在前、英文 key 置于括号内**（`初始拟定（worker_draft_initial）`），**禁止** `worker_draft_initial（初始拟定）` 这类英文前置；状态机表格列序固定为 `显示文案 | 状态 key | …`（中文列在首）。**例外（保持英文在前）**：技术标识符 / 组件名 / 代码表达式 / URL 片段，即括号内是规格说明而非中文译名者——如 `localStorage（无后端）`、`Header（56px）`、`SectionTab（内容/阶段/附件切换Tab）`、`textarea（可编辑）`、`hasChangeContent === true（阶段或任务有变更）`、`POST /api/v1/contracts/:id/reject（需填写驳回原因）`。
- **PRD 英文规范强约束（2026-08-14 重申）**：向 PRD 新增/修改段落时，**交付前必须先自查正文裸英文**——凡字段名、状态名、枚举值、子字段（如媒体文件的 name/type/size）等有中文对照者，一律「中文（英文标识符）」前置（`媒体文件（files）`、`name（文件名）`），**禁止** `<code>files</code>` / `<code>name</code>` 这类裸英文标识符；仅 MIME 类型（`<code>image/*</code>`）、URL 片段、代码表达式等纯技术字面量可保留英文并置于 `<code>`。每轮改动后用 Grep 扫 `<code>` 与裸露英文字母串确认无违规再交付。
- **PRD 文档撰写约定（2026-08-10 确认）**：当前产品需求文档为**第一版**，撰写时**不要**写入"本版已取消 X / 已移除 X / 已取消（历史留存参考）"等**历史对比 / 前后差异**表述，也不要为已砍掉的功能保留"已取消"专节；直接按当前最终方案描述，章节编号保持连续无空缺。功能取舍仅在代码层记忆（见下方「产品决策与功能取消记录」）留存，不在 PRD 营造前后对比效果。
- 改动前置约束：任何修改都不得影响基础施工服务合同 / 设计服务合同 的原流程（工人合同逻辑一律经 `isWorkerType` / 独立页面门控）。

## 关键架构约定
- 六类工人合同（拆除/水电/木作/泥瓦/油漆/小零工）走**独立页面** `worker-contract-detail.html` + `worker-contract-detail.js`，基础/设计合同走原 `contract-detail.html`。
- 工人合同数据层为前端 `localStorage`（无后端），由 `contract-store.js` 提供 `window.ContractStore`；并发首胜防重用 `confirmInvitation` 首胜校验 + 注释说明后端唯一约束/分布式锁。
- 右侧原型导航「合同状态切换（工人合同）」按状态预览页面效果，判定以 `state.status`（预览态）为准，而非真实 `c.status`。
- 工人合同**两种草案态**共用内联编辑面板（可改合同名称/金额 + 选意向乙方）：`worker_draft_initial`（拟定中·初始）与 `worker_draft`（拟定中·撤回后）；二者均由底部"提交邀请"按钮统一提交（无内联按钮）。状态步骤条为 拟定中→确认中→已确认→已签约。
- 工人合同 **甲方 = 陈庄**（工长，非业主）；阶段确认人 `conf` 同为陈庄；"业主"候选人 `m-owner` 仍保留原名，仅作系统角色，不参与意向乙方。意向乙方仅限六工种（拆除/水电/木作/泥瓦/油漆/小零工）。
- **意向乙方按合同类型过滤工种**：`TRADE_ROLE_BY_TYPE` 映射 类型→工种角色，草稿态编辑面板仅展示匹配工种（如 水电班组服务合同 → 仅水电工可选）。`DEMO_TYPES.invited` 已改为单一匹配工种，与之一致。
- **拟定中页面 = 可编辑合同内容**（参考「合同详情（合规版）」`contract-detail.html`，复用其 `css/contract-detail.css` 同名类，降低开发成本）：草稿态用 `draftContentWrap` 替换只读区 `readOnlySections`，提供「更换模板（按当前内容Tab分支提供类型匹配模板）/ 合同正文查看全文 / 补充条款输入 / 阶段任务内联增删改与按序并行切换 / 附件上传删除 / 预览合同」；编辑结果经 `patchContract` 随"提交邀请"一并落库。
- **受邀方终态（抢单失败 `worker_lost_receiver` / 已拒绝 `worker_rejected_receiver`）渲染轻量「邀约已结束」视图**：`updateStatus()` 内侦测此二态即隐藏 banner / `#invitationCard` / `#readOnlySections` / `#draftContentWrap` / `#bottomActions`，改显 `#receiverEndedView`（合同名称 + 状态徽标 + 说明），由 `renderReceiverEndedView()` 渲染；**仅作用于受邀方终态，发起方视角（含名单中他人 lost/rejected）保持完整详情不变**。
- **受邀方视角（`state.viewer==='receiver'`）元信息与合同正文差异化**（2026-08-05 确定）：`renderMeta` 对受邀方**去掉「合同类型」「所属架构层级」两行、新增「项目地址」行**（项目地址来自合同数据 `projectAddress` 字段，演示默认 `DEMO_PROJECT_ADDRESS`）；`renderContentSection` 对受邀方合同正文预览**仅展示关键条款**（甲方责权3条 + 乙方责权4条，由 `receiverKeyClausesHTML()` 生成），且「查看全文」链接**改为「查看全部正文」**，点开后由 `buildReceiverContractHTML()` 展示含关键条款 + 标准条款的完整正文（发起方仍用 `buildContractBodyHTML()`）。发起方/草稿态的 `renderMeta` 与正文预览**保持原样**。合同数据层 `createContract` 含 `projectAddress` 字段（默认 `data.projectAddress||''`）。

## 数据口径约定（全部待办页）
- `service-miniapp/todo-list.html` 与 `owner-miniapp/todo-list.html` 的「全部待办」列表**不含**「临时任务」示例项、**不含**「待审核」待办（待审核仅 PC 运营人员端存在，服务方/业主端无）。
- 列表**所有**任务类待办（开槽布线/墙面贴砖/瓷砖铺贴确认、吊顶安装、材料采购、防水施工、墙面基层处理、水管打压测试确认、木门安装验收）标签均为「任务」（原误标「合约」，已于 2026-08-04 按"全部改为任务"指令统一更正）。**真实合同/变更/架构/对账单类**标签保持原样（合同/变更/架构/对账单），不得误改为「任务」。
- 列表「邀请加入强电施工组」（架构标签）待办项点击跳转 `invite-join.html?group=强电施工组` 进入"加入施工组"接收流程；`invite-join.html` 以 `?group=` 参数做**附加式上下文切换**（无参数时保持原"加入项目"流程不变），接受/拒绝写入 `localStorage['lzj_group_invite_强电施工组']`，返回待办页时该项被移除并角标重算，形成完整闭环。
- service 端角标为硬编码（删除两项后：全部 13 / 待处理 10 / 已处理 3）；owner 端角标由 `updateTodoBadges()` 按 DOM 动态计算（含 localStorage 注入的「对账单」待办），无需手改。
- 消息页「合同邀约」Tab **仅 service-miniapp 存在**（工人=被邀请人场景）；owner-miniapp/message.html 只有 邀请/任务通知/系统消息 三 Tab，无合同邀约功能，**勿在 owner 端误加合同邀约相关改动**。

## 合同邀约体验方案（被邀请人视角）页面位置约定
- 「微信服务通知（订阅消息）」演示（C方案）= **微信客户端层**，必须是**独立页面** `service-miniapp/wechat-service-notice.html`（绿色微信外壳模拟「服务通知」会话，点开直达 `worker-contract-detail.html?viewer=receiver`），**不可放在小程序内消息页**（违反层级逻辑）。该详情页无 id 时会 `ensureDemoSeed` 播种水电示例并以 receiver 视角渲染，跳转用 `?viewer=receiver` 即安全。
- 「应用内顶部邀约通知条」（A方案）= 独立页面 `service-miniapp/invite-banner-demo.html`（phone-frame 小程序外壳，进入时顶部滑出通知条，参考滴滴抢单实时提醒、不阻断操作）。
- ~~原型导航 `service-miniapp/share-navigation.html`~~ **已于 2026-08-04 删除**（`git rm`，用户确认：工人合同详情页 `worker-contract-detail.html` 右侧原型导航已包含其全部内容）。删除前该页仅含「工人合同详情（新流程）」与「消息通知」两个 section；A/C 两页面入口现仅挂在 `worker-contract-detail.html` 右侧原型导航「演示数据」分组底部（见下条）。项目内代码/HTML 已无任何对该页的引用（仅 `产品需求说明书-历史版本.md` 存档仍提及，属历史记录不改）。
- A/C 两页面的**二级入口**同时挂在 `worker-contract-detail.html` 右侧原型导航「演示数据」分组底部（以 `<a>` 链接形式，配 `status-switch-divider` 分隔线，与合同类型/重置项区分；该分组计数已由 7 改为 9）。
- 2026-08-04 曾误将 C 方案演示卡放进 message.html「合同邀约」Tab，按用户指令已撤销并改为独立页面；后续**勿再在 message.html 内置该演示**。
- 受邀方体验改造 **方案 E（整页接单卡片流）验证页** = 独立页面 `service-miniapp/worker-contract-receive.html`（2026-08-05 新增）：模拟真实工人接单视角（顶部小程序导航 + 主接单卡 hero + 纵向卡片流 + 吸底 CTA），自带水电演示数据，**完整保留阶段任务（4 阶段）与附件（4 项）**；顶部「确认中 / 已确认」演示态切换条供快速预览两态。入口挂在 `worker-contract-detail.html` 右侧原型导航（page-nav）「工人合同详情（新流程）」之后。此页为独立新增、零耦合，不影响任何其他功能页面；原 `worker-contract-detail.html` 受邀方改动保持不动。

## 页面布局约定（项目详情进行中-新版）
- `project-detail-ongoing-v2.html`（service-miniapp 与 owner-miniapp 两份）的「待办事项」卡片：**不与架构切换联动**，故置于「吸顶导航」（快捷入口 + 架构切换 同处 `.sticky-header`）**之前**（即快捷入口上方），作为普通滚动卡片；吸顶区仅保留快捷入口 + 架构切换。
- 改动方式：按 HTML 注释锚点整体移动，不改任何 CSS/JS（`.card:has(#todoContent)` 入场动效、`data-href` 文档级跳转均与位置无关）；两份文件结构一致、同步改动。
- 现状顺序：项目基本信息 → 待办事项 → [快捷入口 + 架构切换 吸顶] → 合同/任务概览 → 今日动态（owner 版今日动态在吸顶块之后、合同概览之前）。

## 产品决策与功能取消记录
- **本版合同已取消「引导到电脑端编辑合同内容」功能**（2026-08-10 确认）：基础施工服务合同（service-miniapp/contract-detail.*）不再提供任何"复制电脑端编辑链接 / 推荐使用电脑端编辑"等引导。已从 `contract-detail.html` 删除 `editGuideBox`（含"复制电脑端编辑链接"）与 `pcEditGuide`（含"复制链接到电脑端编辑"）两段；从 `contract-detail.js` 删除 `copyEditLink`/`fallbackCopy`/`showPCEditGuide` 函数及其公共 API 与 `window.*` 别名（均无外部调用，为死代码）。后续**勿再恢复** PC 端编辑引导相关 UI/逻辑。
- **工人合同「已确认（受邀方）」不支持上传签约文件（2026-08-14 确认）**：V1 签约的纸质合同扫描件**仅由发起方（工长·甲方）上传**（对应 `worker_confirmed_sender` 的内联 `pickSignFile` 与整页 `worker-sign-upload.html`）；受邀方（`worker_confirmed_receiver`）与接单体验 E（`worker-contract-receive.html` 已确认态）**不得提供任何上传签约文件入口/按钮**，改为只读"等待发起方上传签约文件"提示。代码改动：`worker-contract-detail.js`（STATUS_CONFIG 去 `upload` 动作 + `renderSignArea` 改等待态 + 删除 `handleAction('upload')` 死分支）；`worker-contract-receive.html`（下一步流程第 1 步与吸底 CTA 改为等待提示，删除 `doUpload()`）。PRD 同步：§7.5.1 状态机表、§8.2 页面结构图、§8.4 受邀方状态表 三处去除"受邀方上传签约文件"表述。
- **基础合同阶段编辑器存在两套并行体系（重要，易踩坑）**：
  - 拟定中编辑表单（`#editStageList`，阶段卡片 class = `.stage-card`）：由 `renderStagesFromSnapshot`/`loadDraftSnapshot`/`collectDraftSnapshot` 维护，用户在拟定中实际操作的就是它。
  - 变更流程阶段编辑器（`#stageEditContainer`，阶段卡片 class = `.stage-edit-item`）：位于变更 Tab（`change-tab-content#stage-task`），仅变更申请流程使用，`addNewStage` 仍向它追加 `.stage-edit-item`。
  - 阶段级处理函数（`deleteStage`/`addTaskToStage`/`toggleStageSequential`/`editStageSettings`/`checkChangeContent`）已统一为**同时兼容两套选择器**（`.stage-card, .stage-edit-item`，容器取 `stageItem.parentElement` 或 `getElementById('editStageList') || getElementById('stageEditContainer')`）。**改动这些函数时务必保持双体系兼容**，否则会再次导致某一流程阶段按钮失效。`addNewStage` 仅服务变更流程，不要改成 `.stage-card`/`#editStageList` 以免破坏变更流程。

## 原型城市范围约定（2026-08-10 确认）
- 原型城市**仅支持 北京、南阳、西安**（service-miniapp/create-project.html 注释"仅支持北京、河南、陕西"：北京市→北京市、河南→南阳市、陕西→西安市）。
- 所有页面与文档（PRD、演示数据、地址示例、下拉选项）的示例城市**必须落在上述范围内**，不得出现 杭州/上海/深圳/广州/成都/宁波/温州/浙江/江苏 等越界城市。
- 合同/项目主示例统一用 **西安（陕西省/西安市）**；消息页地址示例可在 北京/南阳/西安 内轮替。
