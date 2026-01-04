# 实时汇率转换器

一个基于 Next.js 构建的实时汇率转换应用，支持人民币、港币和美元之间的实时转换。

## 功能特点

- 🔄 实时汇率数据（使用 Wise API）
- 💱 支持人民币、港币、美元三种货币
- ⚡ 自动每30秒更新汇率
- 📱 响应式设计，支持移动端
- 🎨 现代化 UI 设计

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Wise API

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

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

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
   - Value: ``

6. 点击 "Deploy"

## 使用说明

1. 选择要输入的货币类型（人民币/港币/美元）
2. 输入金额
3. 其他两种货币会自动计算并显示
4. 汇率每30秒自动更新，也可手动点击刷新按钮

## 环境变量

- `WISE_API_KEY`: Wise API 密钥（必需）

## 注意事项

- 确保在生产环境中正确配置 `WISE_API_KEY` 环境变量
- API 调用受 Wise API 限制约束
- 汇率数据仅供参考，实际交易请以官方汇率为准

## License

MIT
