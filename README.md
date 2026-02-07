<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 安踏项目扫描系统

这是一个高性能的扫描分拣系统，专为安踏项目设计。

## 功能特性

- 📦 快速扫描识别
- 🎯 智能分区分配
- 📊 实时数据统计
- 💾 离线优先架构
- 🌓 深色/浅色主题
- 📱 响应式设计

## 运行本地环境

**前置要求：** Node.js

1. Install dependencies:
   `npm install`
2. Set the `SUPABASE_URL` and `SUPABASE_ANON_KEY` in [.env.local](.env.local) to your Supabase credentials
3. Run the app:
   `npm run dev`

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- IndexedDB

## 数据库配置

查看 `database/README.md` 了解如何配置 Supabase 数据库。

## 项目结构

```
扫描系统/
├── components/         # React 组件
├── hooks/             # 自定义 Hooks
├── services/          # 服务层（API、数据库）
├── database/          # 数据库结构和配置
└── types.ts           # TypeScript 类型定义
```

## 开发说明

- 使用 `npm run dev` 启动开发服务器
- 使用 `npm run build` 构建生产版本
- 使用 `npm run preview` 预览生产构建

## License

MIT
