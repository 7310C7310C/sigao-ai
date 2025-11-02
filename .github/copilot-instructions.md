# GitHub Copilot 开发指令
（不要动不动就生成.md总结文档，直接在回答中告诉我就行。）
(留意项目用的是 Docker 技术，很多命令需要在 Docker 容器中运行)
本项目是思高圣经读经辅助系统，所有代码必须遵循以下规范：

## 兼容性要求（必须遵守）

- 支持 iOS 10+ Safari、Android 5.0+ Chrome、微信浏览器
- 响应式设计：320px（小屏）、480px（手机）、768px（平板）、1920px（桌面）
- 触摸目标最小 44x44px

## HTML 规范

必须包含以下 meta 标签：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
```

使用 `<!DOCTYPE html>` 和 `<html lang="zh-CN">`

## CSS 规范

- 使用 rem/em/% 相对单位，避免固定 px
- 添加浏览器前缀：-webkit-, -moz-
- 使用 Flexbox 布局（带前缀）
- 必须包含媒体查询：@media (max-width: 480px), (max-width: 768px)
- 引用项目样式：/css/style.css

## JavaScript 规范

- 使用 ES5 语法：function() {} 不用箭头函数
- 使用 var 不用 const/let（兼容旧浏览器）
- 避免 ES6+ 特性（模板字符串、async/await、解构等）
- 添加 try-catch 错误处理
- 使用特性检测：if ('IntersectionObserver' in window)
- 引用项目脚本：/js/main.js

## 项目配色

- 主色: #3498db
- 文字: #333
- 背景: #f5f5f5
- 按钮 hover: #2980b9
- 按钮 active: #21618c
- 圆角: 4px
- 过渡: 0.2s ease

## 禁止使用

- ❌ const/let → 使用 var
- ❌ 箭头函数 () => {} → 使用 function() {}
- ❌ 模板字符串 `${}` → 使用字符串拼接
- ❌ vh/vw 单位 → 使用 % 或 rem
- ❌ async/await → 使用 Promise 或回调
- ❌ CSS Grid → 使用 Flexbox
- ❌ 固定 px 宽度 → 使用相对单位

## 代码检查清单

生成代码后必须确认：
- [ ] viewport meta 标签 ✓
- [ ] X-UA-Compatible meta 标签 ✓
- [ ] 使用相对单位（rem/em/%）✓
- [ ] 触摸目标 ≥ 44px ✓
- [ ] 浏览器前缀（-webkit-, -moz-）✓
- [ ] 响应式媒体查询 ✓
- [ ] ES5 语法（function/var）✓
- [ ] 错误处理（try-catch）✓
- [ ] 引用项目 CSS/JS 文件 ✓

## 参考文档

详细规范见：
- docs/AI_QUICK_REFERENCE.md
- docs/AI_DEVELOPMENT_GUIDE.md
