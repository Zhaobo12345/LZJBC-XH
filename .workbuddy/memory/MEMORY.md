# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 协作约定（重要）
- **中断即取消**：当用户在消息中途发出 "Interrupted by user" 或明确表示"取消/不需要"某任务后，紧接着给出新的指令，则被中断的任务视为**已被取消**，不得继续执行或顺带落地。只执行用户新给出的指令。
- 单点改动、逐项确认的工作流（create-contract / worker-contract 等原型迭代）延续：代码定稿后再同步 PRD/文档（除非用户说"仅改代码"）。
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

## 数据口径约定（全部待办页）
- `service-miniapp/todo-list.html` 与 `owner-miniapp/todo-list.html` 的「全部待办」列表**不含**「临时任务」示例项、**不含**「待审核」待办（待审核仅 PC 运营人员端存在，服务方/业主端无）。
- 列表**所有**任务类待办（开槽布线/墙面贴砖/瓷砖铺贴确认、吊顶安装、材料采购、防水施工、墙面基层处理、水管打压测试确认、木门安装验收）标签均为「任务」（原误标「合约」，已于 2026-08-04 按"全部改为任务"指令统一更正）。**真实合同/变更/架构/对账单类**标签保持原样（合同/变更/架构/对账单），不得误改为「任务」。
- 列表「邀请加入强电施工组」（架构标签）待办项点击跳转 `invite-join.html?group=强电施工组` 进入"加入施工组"接收流程；`invite-join.html` 以 `?group=` 参数做**附加式上下文切换**（无参数时保持原"加入项目"流程不变），接受/拒绝写入 `localStorage['lzj_group_invite_强电施工组']`，返回待办页时该项被移除并角标重算，形成完整闭环。
- service 端角标为硬编码（删除两项后：全部 13 / 待处理 10 / 已处理 3）；owner 端角标由 `updateTodoBadges()` 按 DOM 动态计算（含 localStorage 注入的「对账单」待办），无需手改。
- 消息页「合同邀约」Tab **仅 service-miniapp 存在**（工人=被邀请人场景）；owner-miniapp/message.html 只有 邀请/任务通知/系统消息 三 Tab，无合同邀约功能，**勿在 owner 端误加合同邀约相关改动**。

## 合同邀约体验方案（被邀请人视角）页面位置约定
- 「微信服务通知（订阅消息）」演示（C方案）= **微信客户端层**，必须是**独立页面** `service-miniapp/wechat-service-notice.html`（绿色微信外壳模拟「服务通知」会话，点开直达 `worker-contract-detail.html?viewer=receiver`），**不可放在小程序内消息页**（违反层级逻辑）。该详情页无 id 时会 `ensureDemoSeed` 播种水电示例并以 receiver 视角渲染，跳转用 `?viewer=receiver` 即安全。
- 「应用内顶部邀约通知条」（A方案）= 独立页面 `service-miniapp/invite-banner-demo.html`（phone-frame 小程序外壳，进入时顶部滑出通知条，参考滴滴抢单实时提醒、不阻断操作）。
- 两页面入口挂在 **原型导航 `service-miniapp/share-navigation.html`**：A 与 C 同归入新增的「消息通知」section，该 section 位于「工人合同详情（新流程）」（含其下「合同状态切换（工人合同）」）section 之后。因项目已取消分享（改原生胶囊内分享），该导航页内的「分享接收页面」section 已于 2026-08-04 移除，现仅含「工人合同详情（新流程）」与「消息通知」两个 section，页面标题/页头/页脚也不再含「分享」字样。
- 2026-08-04 曾误将 C 方案演示卡放进 message.html「合同邀约」Tab，按用户指令已撤销并改为独立页面；后续**勿再在 message.html 内置该演示**。
