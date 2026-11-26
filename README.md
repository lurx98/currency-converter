# 实时汇率转换器

一个基于 Next.js 构建的实时汇率转换应用，支持 Wise 提供的多种货币之间的实时换算。

## 功能特点

- 🔄 实时汇率数据（使用 Wise API）
- 💱 支持 Wise 提供的全部货币，最多同时选择 5 种（默认人民币、港币、美元）
- ↕️ 长按拖拽调整货币顺序，列表第一个货币作为汇率基准
- 💾 自动保存所选货币、顺序和输入金额（localStorage）
- ⚡ 每 30 秒自动更新汇率，页面切到后台时暂停
- 📱 响应式设计，支持移动端

## 技术栈

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS
- @dnd-kit（拖拽排序）
- Vitest（单元测试）
- Wise API

## 项目结构

```
app/
├── api/
│   ├── currencies/route.ts   # 代理 Wise 货币列表（服务端缓存 1 天）
│   └── rates/route.ts        # 代理 Wise 汇率（参数校验、并行请求、缓存 30 秒）
├── components/
│   ├── CurrencySelector.tsx      # 选择货币弹窗
│   └── SortableCurrencyCard.tsx  # 可拖拽的货币卡片
├── hooks/
│   ├── useCurrencyList.ts    # 加载货币列表
│   └── useExchangeRates.ts   # 获取并轮询汇率
└── page.tsx                  # 主页面
lib/
├── conversion.ts             # 换算纯函数
├── currencies.ts             # 货币元数据与解析
└── storage.ts                # 本地存储读写与校验
```

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 创建 `.env.local` 文件并添加 Wise API Key：

```
WISE_API_KEY=your_api_key_here
```

3. 运行开发服务器：

```bash
npm run dev
```

如果本机需要通过代理才能访问 Wise（例如在国内网络环境下），改用：

```bash
npm run dev:proxy
```

Node.js 自带的 `fetch` 默认不读取 `http_proxy` / `https_proxy` 环境变量，这个脚本会设置 `NODE_USE_ENV_PROXY=1`（需要 Node.js 24+），让服务端请求走代理。

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

5. 运行单元测试：

```bash
npm test
```

## 部署到 Vercel

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI：

```bash
npm install -g vercel
```

2. 登录 Vercel：

```bash
vercel login
```

3. 部署项目：

```bash
vercel
```

4. 在 Vercel 仪表板中添加环境变量 `WISE_API_KEY`

### 方法二：通过 GitHub

1. 将代码推送到 GitHub 仓库

2. 访问 [vercel.com](https://vercel.com)

3. 点击 "Import Project"

4. 选择你的 GitHub 仓库

5. 在环境变量设置中添加：
   - Name: `WISE_API_KEY`
   - Value: 你的 Wise API 密钥

6. 点击 "Deploy"

## 使用说明

1. 点击「选择货币」添加或移除货币（最多 5 种）
2. 点击某张货币卡片，在该卡片中输入金额
3. 其他货币会自动换算并显示
4. 长按卡片左侧的拖拽图标调整顺序，第一个货币作为汇率基准
5. 汇率每 30 秒自动更新，也可手动点击刷新按钮

## API

### `GET /api/rates?base=CNY&targets=HKD,USD`

- `base`、`targets` 必须是 3 位大写字母的货币代码，最多 4 个目标货币，否则返回 `400`
- 部分货币获取失败时仍返回 `200`，失败的货币列在 `missing` 中；全部失败返回 `502`

```json
{ "base": "CNY", "rates": { "HKD": 1.1 }, "missing": ["USD"], "timestamp": "..." }
```

### `GET /api/currencies`

返回 Wise 支持的货币列表（已附带中文名称、符号和国旗代码）。

## 环境变量

- `WISE_API_KEY`: Wise API 密钥（必需）

## 注意事项

- 确保在生产环境中正确配置 `WISE_API_KEY` 环境变量
- API 调用受 Wise API 限制约束，服务端已对汇率缓存 30 秒、货币列表缓存 1 天
- 汇率数据仅供参考，实际交易请以官方汇率为准

## License

MIT
