# 项目长期记忆（LZJBC-XH 家装平台小程序原型）

## 协作约定（最高优先级）
- 中断即取消；先确认后改（结构化表格：方案/理由/风险→确认→实现；改完代码再同步 PRD，除非说"仅改代码"）。
- 改动前置约束：不影响基础施工/设计合同原流程；工人合同逻辑经 `isWorkerType`/独立页面门控；不破坏既有交互与其他模块。
- 无滚动条全局（`::-webkit-scrollbar{display:none}`+`scrollbar-width:none`+`-ms-overflow-style:none`）；页面必带微信小程序默认导航栏（状态栏+nav+原生胶囊占位）；mobile-first 全宽堆叠、复合卡片不并排半宽；兼顾中老年可访问性（触控区够大）。
- 校验留痕：`node --check` 验 JS + `.workbuddy/_validate_html.py` 验 HTML 标签平衡 + **CSS 大括号按 `<style>` 块逐个统计** + id 引用自检；验收后截图复核。
- 演示开关/说明放手机框右侧框外（`.arch-demo-stage`+`.arch-demo-note` 左侧 2px 虚线蓝条），只改状态变量、不调语义不符的既有函数。
- 弹窗层级：`.app-modal` 同 `z-index:1000`，同层时 DOM 靠后者盖前者；弹窗内触发提示须 `#appModal{z-index:1010}`/`.app-toast{z-index:1020}`。
- 演示页回迁正式页：先 Python 正则剔除 `data-page-node-id` 并 rstrip 归一再 diff；批量替换脚本每处 `count==1` 断言防静默；回迁后清洗版 diff 剩余差异=演示专有项；改前 `cp` 备份 `.workbuddy/_tmp/*.bak`；演示专有说明卡/标题后缀/装饰注释不回迁。

## 项目架构页·复制发起
- `architecture.html` 已接管演示页复制发起能力（等价 `architecture-multi-contract-demo.html`）。数据模型 `groupContracts`=组名→合同数组；`contractsOf`/`hasSignedContract`。
- 常规入口唯一：有合同节点「查看合同」→弹窗内每份「📋 复制发起」；无合同节点「📝 创建合同」空白新建。`copyContract()`→`contract-copy-initiate.html?group=&source=&from=architecture`。「已有合同→弹创建方式」是不可达防御分支，PRD 仅写"如因数据同步触发不阻断"。
- PRD 落位：§6.12（项目模块）+ §7.12（合同模块，字段差异 §7.12.2 对比 §7.5.3.1 拟定中页 + §7.12.3 隶属架构层级）；权限=创建合同权限；禁历史对比。

## PRD 书写规范
- 「中文（英文标识符）」前置；状态机表列序 `显示文案|状态 key|…`；V1 不写历史对比、不为已砍功能留专节。
- 禁「对原有交互的影响」总结小节（影响已写入对应小节则不单列）。状态基准以原型为权威：工人合同看 `contract-store.js`+`worker-contract-detail.js` STATUS_CONFIG；基础/设计看 `contract-detail.*`；PC 用自有 key（`pending_review`/`reviewed_*`）属另一层映射，勿改。

## 工人合同（service-miniapp）
- 六工种走 `worker-contract-detail.html`+`.js`（合并页暴露 `WCP`）；基础/设计走 `contract-detail.html`。数据层 localStorage，`contract-store.js` 提供 `window.ContractStore`。
- 甲方=陈庄（工长，非业主）；意向乙方仅限六工种（`TRADE_ROLE_BY_TYPE` 过滤），业主不参与。
- **乙方必选/可选口径（2026-09-11）**：`create-contract.html` 选工人类型时，意向乙方（仅工种、最多3人）为非必选（0-3 人可选）；`worker-contract-draft-initial-new.html` 拟定中页与 `contract-copy-initiate.html` 复制发起页的意向乙方维持各自既有口径（未改）。三页「乙方=当前意向乙方」，0 人时下游按空处理。
- 受邀方视角 `viewer==='receiver'` 差异化（renderMeta/正文预览/终态 `#receiverEndedView`）；阶段任务卡标题：发起方=「阶段任务」、受邀方=「🔧 承接任务」。
- 变更流程：已签约→发起变更→对方确认→生成 V2（**无上传签约文件环节**）。`change_signing_wait`/`worker-change-sign-upload.html`/`worker-sign-upload.html` 已删，勿恢复。合规版 `contract-detail.*` 含平台审核属另一流程，勿混。
- 「新建任务」=弹窗 `#addTaskModal`（必填=名称+执行·确认·担责三标准）；执行人默认：乙方仅1人→默认填、多人→空；无签约文件区（已下线）。

## 数据口径/页面约定
- PC 合同文本模板：六类工人合同双字段（违约责任可编辑绿标 / 固定条款不可编辑红标）；基础/设计单一「合同正文」。口径与小程序 `buildTemplatePreviewSections()` 同步。
- 待办：不含临时任务/待审核；任务类标签「任务」；层级不进 todo-list（按人聚合）。「合同任务执行」待办类型已取消→走微信服务号通知提醒。
- 服务通知 SSOT=《PRD-完整文档》§7.10（5 项微信订阅消息）；站内不占消息页 Tab、任务提醒不生成应用内待办。消息页 service 仅邀请/合同邀约；owner 不显 Tab，未读走 `#navMsgBadge`。
- 业主端项目详情收敛为 `project-detail-ongoing-v2.html`/`project-detail-completed-v2.html`（共享 css/js 勿误删）。原型城市限 北京/南阳/西安，主示例 西安。
- 阶段编辑器双套并行：拟定中 `#editStageList`(`.stage-card`) + 变更 `#stageEditContainer`(`.stage-edit-item`)，相关函数须兼容双选择器 `.stage-card, .stage-edit-item`。
