# 小问号科学周刊 — 开发日志

> 记录人：项目实施者  
> 汇报对象：项目负责人  
> 时间跨度：2026年5月20日 — 5月22日

---

## 5月20日 — 第一天

### 上午 · 接到任务

拿到了一份非常详尽的设计方案——"小问号科学周刊"公益网站。目标用户是6-12岁留守儿童，用温暖的科学故事陪伴他们认识世界。方案里从配色、字体、吉祥物到每一篇故事的内容都写好了，我需要做的就是把它变成真正能用的网站。

先做了一件事：把方案里的所有需求拆成具体要实现的东西。

- 4个页面：首页、故事详情、写信、关于我们
- 视觉系统：暖橘+米黄+天空蓝，圆角14-16px，柔和阴影
- 核心交互：听故事（TTS朗读）、问答翻转、留言、写信
- 3篇完整故事，每篇有正文、科学词解释、趣味问答

### 下午 · 纯前端搭建

决定先用纯静态HTML/CSS/JS把所有页面做出来，数据暂时硬编码，留言先用localStorage模拟——这样能最快看到效果。

CSS是整个项目的基石，先花了最多时间在上面。建了完整的变量体系：颜色、圆角、阴影、字体全部抽成CSS变量，后面改起来只改一处。响应式断点设了768px和400px两档，确保爷爷奶奶的千元手机也能正常看。动画——卡片悬浮、留言滑入、toast弹出、录音脉冲——也都在这一轮写完了。

然后是4个HTML页面。首页的故事卡片用CSS Grid做响应式布局，大屏3列手机1列。吉祥物"问问"——一只戴眼镜的橙色小狐狸——直接画成了内嵌SVG，不需要额外图片文件。

故事详情页是最复杂的：正文渲染时要识别科学词并包上虚线框和弹窗解释；TTS朗读要逐句切割、逐句高亮、自动滚动；问答卡片点击翻转。这些交互逻辑全写在story-detail.js里。

最花心思的是3篇故事的内容。每一篇都是一篇完整的小故事，跟着小狐狸问问探索一个科学问题——天空为什么是蓝的、种子怎么去旅行、月亮为什么跟着人走。每个科学词都配了童趣解释，比如"散射"解释成"光线遇到小颗粒像弹弹球一样弹得到处都是"。

### 晚上 · 部署到GitHub Pages

纯前端部分完成后，推到GitHub，打开GitHub Pages。网站可以访问了——留言能发，但刷新就没了；阅读量是写死的。需要后端。

---

## 5月21日 — 第二天

### 上午 · 后端架构决策

需要一个后端来存留言、信件、阅读量。要求：轻量、免费、国内能访问。

之前这个仓库用过Supabase，被墙了。后来换了Cloudflare Workers + D1，国内能用。这次继续用这套方案。Workers当API服务器，D1（基于SQLite）当数据库，都在Cloudflare免费额度内（10万请求/天，5GB存储），对这个项目来说绰绰有余。

### 中午 · 搭建后端

1. 全局安装Wrangler CLI
2. 登录Cloudflare
3. 手动创建Worker项目——package.json、tsconfig.json、wrangler.toml三个文件
4. wrangler d1 create shanhau-db ——创建数据库
5. 编写schema.sql，3张表：story_stats（阅读量）、comments（留言）、letters（信件），播种初始阅读量
6. 远程执行建表SQL

然后写Worker主体代码——这是整个后端唯一一个文件，200行TypeScript，零第三方依赖。实现了8个API端点：

- 阅读量查询和递增（upsert机制，新故事首次被读自动建行）
- 留言列表查询和提交（表情白名单校验、字数限制）
- 信件提交（心情白名单校验）
- 管理后台统计和信件列表（Bearer Token认证）

安全措施都在代码层面处理了：CORS白名单、参数化SQL防注入、输入校验。管理密码存在Cloudflare Secrets里，代码里看不到。

### 下午 · 前后端对接

创建了js/api.js——整个前端的API通信都通过这一个模块。每个方法都做了两层处理：先发请求到Worker，失败了就走localStorage兜底。

然后改三个地方：
- index.html：页面加载后拉取真实阅读量替换默认值
- story-detail.js：留言从API加载、提交走API、localStorage只当缓存
- letter.html：信件提交走API，失败提示"已保存到本地"

最后创建了admin.html管理后台：密码登录→查看所有孩子来信（分页）+数据统计。

### 傍晚 · 部署和遇到的第一个坑

Worker部署到workers.dev成功。前端也推送了。

但测试时发现workers.dev域名从当前网络访问超时——这是国内部分运营商对workers.dev的限制。解决方案：用户买了一个自定义域名dhmsweb.asia，把Worker绑到api.dhmsweb.asia上，国内就畅通了。

### 晚上 · 遇到的第二个坑

绑好域名后测试API——留言和信件都能正常读写，但管理后台登录一直返回"密码不对"。排查过程：

1. 先怀疑是crypto.subtle.timingSafeEqual在Worker环境中行为异常，改成简单字符串比较
2. 重新部署，还是401
3. 最终定位到问题：当初用PowerShell管道设置Cloudflare Secret时，管道在密码末尾多加了一个换行符\n。导致存在Cloudflare里的密码是"xiaowenhao2026\n"，而用户输入的是"xiaowenhao2026"，永远对不上。
4. 换成用二进制文件+cmd管道重设密码，解决了。

教训：往Cloudflare传Secret，不要用PowerShell的Write-Output管道——它会偷偷加换行符。用cmd的type命令或者直接交互式输入更可靠。

---

## 5月22日 — 第三天

### 上午 · 全流程测试和文档

端到端测试了所有场景：
- 用户浏览首页→点击故事→阅读→留言→留言刷新后仍在
- 写信→数据库有记录
- 管理后台→输入密码→查看信件和统计
- 断网测试→页面不崩溃，数据存localStorage，恢复网络后可同步
- 插画展示、TTS朗读、问答翻转全部验证通过

编写了PROJECT-FLOW.md工艺流程图和这份开发日志。

---

## 最终交付清单

```
小问号科学周刊/
├── index.html          — 首页：故事宝箱，看故事/听故事切换
├── story.html          — 故事详情：沉浸式阅读+TTS+问答+留言
├── letter.html         — 写信：心情选择+语音转文字+寄信
├── about.html          — 关于我们：团队介绍+FAQ+支持入口
├── admin.html          — 管理后台：查看信件+数据统计（需密码）
├── css/style.css       — 全局样式系统（21KB，一套CSS变量管全部）
├── js/
│   ├── stories.js      — 3篇故事完整数据
│   ├── main.js         — 公共工具：卡片渲染/SVG插图/toast提示
│   ├── api.js          — API客户端：8个接口统一管理
│   ├── story-detail.js — 详情页逻辑：TTS/留言/问答/上下篇导航
│   └── admin.js        — 后台逻辑：登录/信件分页/统计加载
└── worker/
    ├── wrangler.toml   — Worker部署配置
    ├── src/index.ts    — 全部后端API（200行，8个端点）
    └── src/db/schema.sql — 数据库建表（3张表+种子数据）

线上地址：
  前端: hippo667.github.io/shanhau-growth/
  API:  api.dhmsweb.asia
  后台: hippo667.github.io/shanhau-growth/admin.html
  密码: xiaowenhao2026

数据库: Cloudflare D1 (shanhau-db, WNAM区域, 0.04MB)
  表: story_stats / comments / letters
```

---

## 技术选型回顾

| 问题 | 方案 | 为什么 |
|------|------|--------|
| 前端托管 | GitHub Pages | 免费，push自动部署 |
| 后端API | Cloudflare Workers | 免费10万请求/天，无需管理服务器 |
| 数据库 | Cloudflare D1 (SQLite) | 免费5GB，与Worker深度集成 |
| 域名 | dhmsweb.asia | 解决workers.dev国内不稳定问题 |
| 前端框架 | 零框架，原生JS | 目标用户用低端手机，减小加载体积 |
| 离线保障 | localStorage兜底 | 农村网络不稳时数据不丢 |
| 语音朗读 | Web Speech API | 浏览器内置，不依赖第三方 |
