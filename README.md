# B站 VTuber 粉丝数监测系统

一个基于 Cloudflare Workers 的 B站（Bilibili）VTuber 粉丝数实时监测系统，支持多用户监测、粉丝数变化追踪和美观的前端展示。

## ✨ 功能特性

- 📊 **多用户监测**：同时监测多个 B站 VTuber 的粉丝数
- 🎨 **美观界面**：现代化的渐变背景和卡片式布局
- 📸 **头像显示**：自动显示每个用户的头像
- 📈 **变化追踪**：自动追踪粉丝数变化，显示增减差值
- 💾 **智能缓存**：使用 Cloudflare KV 存储，每天自动更新基准值
- ⚡ **高性能**：基于 Cloudflare Workers，全球边缘计算

## 🎯 监测的用户

- 嘉然今天吃什么 (ID: 672328094)
- 贝拉kira (ID: 672353429)
- 乃琳Queen (ID: 672342685)
- 露早GOGO (ID: 1669777785)
- 柚恩不加糖 (ID: 1795147802)

## 🛠️ 技术栈

- **Cloudflare Workers** - 边缘计算平台
- **Cloudflare KV** - 键值存储（用于缓存粉丝数）
- **HTML/CSS/JavaScript** - 前端界面
- **Bilibili API** - 数据来源（通过 workers.vrp.moe 代理）

## 📦 项目结构

```
vtuber/
├── main.js          # Worker 主文件
├── wrangler.toml    # Cloudflare Workers 配置文件
└── README.md        # 项目说明文档
```

## 🚀 部署说明

### 前置要求

1. Cloudflare 账号
2. 已创建 Cloudflare KV Namespace

### 步骤 1: 创建 KV Namespace

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → **KV**
3. 点击 **Create a namespace**
4. 命名空间名称：`FANS_CACHE`
5. 记录返回的 Namespace ID

### 步骤 2: 配置 Worker

1. 在 Cloudflare Dashboard 中创建新的 Worker
2. 进入 Worker 的 **Settings** → **Variables**
3. 在 **KV Namespace Bindings** 中添加绑定：
   - **Variable name**: `FANS_CACHE`
   - **KV namespace**: 选择刚才创建的 `FANS_CACHE`

### 步骤 3: 更新配置文件

编辑 `wrangler.toml`，将 KV namespace ID 更新为你创建的 ID：

```toml
[[kv_namespaces]]
binding = "FANS_CACHE"
id = "你的-namespace-id"
```

### 步骤 4: 部署代码

将 `main.js` 的代码复制到 Cloudflare Dashboard 的 Worker 编辑器中，保存并部署。

## 📖 使用方法

### 访问页面

部署完成后，访问你的 Worker URL，例如：
```
https://vtuber-bilibili.你的用户名.workers.dev
```

### API 端点

#### GET `/api/user-info`

获取所有监测用户的粉丝信息。

**响应格式：**
```json
[
  {
    "userId": "672328094",
    "name": "嘉然今天吃什么",
    "fans": 1719814,
    "face": "https://i2.hdslb.com/bfs/face/...",
    "fansDiff": 186,
    "success": true
  },
  ...
]
```

**字段说明：**
- `userId`: 用户 ID
- `name`: 用户名
- `fans`: 当前粉丝数
- `face`: 头像 URL
- `fansDiff`: 与基准值的差值（正数表示增加，负数表示减少）
- `success`: 是否成功获取数据

## 🔄 缓存机制

### 工作原理

1. **首次访问**：保存当前粉丝数作为基准值，不显示差值
2. **同一天内再次访问**：显示与当天基准值的差值（+数字 或 -数字）
3. **新的一天首次访问**：
   - 先计算与昨天基准值的差值并显示
   - 然后更新为今天的基准值
4. **新的一天再次访问**：显示与今天基准值的差值

### KV 存储结构

每个用户存储两个键值对：
- `fans_{userId}`: 粉丝数（基准值）
- `date_{userId}`: 日期（YYYY-MM-DD 格式）

## 🎨 界面展示

- **渐变背景**：紫色渐变背景
- **卡片布局**：每个用户独立卡片展示
- **头像显示**：圆形头像，带白色边框和阴影
- **变化提示**：
  - 增加：绿色显示 `(+数字)`
  - 减少：红色显示 `(-数字)`
  - 无变化：不显示差值

## 🔧 自定义配置

### 添加新用户

编辑 `main.js`，在 `userIds` 数组中添加新的用户 ID：

```javascript
const userIds = [
  '672328094',  // 嘉然今天吃什么
  '672353429',  // 贝拉kira
  '你的用户ID',  // 新用户
];
```

### 修改样式

在 `main.js` 的 `HTML_CONTENT` 变量中修改 CSS 样式。

## 📝 注意事项

1. **KV Namespace 绑定**：确保在 Cloudflare Dashboard 中正确绑定了 KV namespace
2. **API 限制**：注意 Bilibili API 的调用频率限制
3. **时区**：日期判断基于 UTC 时间，可能与本地时间有差异
4. **首次访问**：第一次访问时不会显示差值，因为还没有基准值

## 📄 许可证

MIT License

## 🙏 致谢

- [Bilibili API](https://www.bilibili.com/)
- [workers.vrp.moe](https://workers.vrp.moe) - Bilibili API 代理服务
- [Cloudflare Workers](https://workers.cloudflare.com/)

