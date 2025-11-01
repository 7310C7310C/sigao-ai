# 🚀 AI 开发快速参考卡片

> 复制下面的提示词模板，填入具体需求，让 AI 开发兼容的前端页面

---

## 📋 通用提示词模板（直接复制使用）

```
请按照思高圣经项目的规范开发 [具体页面/功能]：

【兼容性要求】
✅ 支持 iOS 10+ Safari、Android 5.0+ Chrome、微信浏览器
✅ 响应式设计：320px（小屏）、480px（手机）、768px（平板）、1920px（桌面）
✅ 触摸目标最小 44x44px

【HTML 必须包含】
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no">
<!DOCTYPE html> 和 <html lang="zh-CN">

【CSS 规范】
✅ 使用 rem/em/% 相对单位，不用固定 px
✅ 添加浏览器前缀：-webkit-, -moz-
✅ 使用 Flexbox 布局（带前缀）
✅ 媒体查询：@media (max-width: 480px), (max-width: 768px)
✅ 引用项目样式：<link rel="stylesheet" href="/css/style.css">

【JavaScript 规范】
✅ 使用 ES5 语法：function() {} 不用箭头函数
✅ 使用 var 不用 const/let（兼容旧浏览器）
✅ 避免 ES6+ 特性（或提供 polyfill）
✅ 添加 try-catch 错误处理
✅ 使用特性检测：if ('IntersectionObserver' in window)
✅ 引用项目脚本：<script src="/js/main.js"></script>

【项目配色】
主色: #3498db | 文字: #333 | 背景: #f5f5f5
按钮: #3498db → #2980b9 (hover) → #21618c (active)
圆角: 4px | 过渡: 0.2s ease

【具体需求】
[在这里填写你的具体需求]
```

---

## 🎯 场景专用模板

### 场景 1: 创建新页面

```
请创建 [页面名称] 页面：
- 位置：views/[模块]/[页面名].ejs
- 功能：[描述功能]
- 参照现有页面风格（如 views/bible/index.ejs）
- 必须包含所有兼容性标签和响应式设计
- 测试断点：320px, 480px, 768px, 1200px
```

### 场景 2: 添加表单

```
请创建 [表单名称] 表单：
- 所有输入框 min-height: 44px
- 使用正确的 input type（tel/email/number）
- 移动端按钮全宽
- 提交时显示"处理中..."状态
- 添加 HTML5 验证 + JavaScript 验证
- 错误提示清晰明显
```

### 场景 3: 创建列表

```
请创建 [列表名称] 列表：
- 列表项触摸区域 ≥ 44px（padding: 0.75rem）
- 点击效果：hover 和 active 状态
- 移动端垂直布局，桌面端可选多列
- 空状态提示友好
- 长列表考虑性能（分页或懒加载）
```

### 场景 4: 添加按钮/链接

```
请添加 [按钮/链接描述]：
- 最小尺寸：44x44px
- 圆角：4px
- 颜色：#3498db (normal) → #2980b9 (hover) → #21618c (active)
- 过渡：transition: all 0.2s ease
- 移动端可能需要全宽
```

### 场景 5: 修改样式

```
请修改 [元素] 的样式：
- 保持响应式布局不被破坏
- 使用相对单位（rem/em/%）
- 添加浏览器前缀
- 在所有断点下测试（320px, 480px, 768px）
- 不要破坏触摸友好性
```

---

## ✅ 代码检查清单（让 AI 自检）

```
请审查代码并确认：

[ ] viewport meta 标签 ✓
[ ] X-UA-Compatible meta 标签 ✓
[ ] 使用相对单位（rem/em/%）✓
[ ] 触摸目标 ≥ 44px ✓
[ ] 浏览器前缀（-webkit-, -moz-）✓
[ ] 响应式媒体查询 ✓
[ ] ES5 语法（function/var）✓
[ ] 错误处理（try-catch）✓
[ ] 引用项目 CSS/JS 文件 ✓
[ ] 在 320px 设备上显示正常 ✓

如有问题请指出并修复。
```

---

## 🔧 常用代码片段

### HTML 页面头部（标准模板）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <title>[标题]</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
```

### CSS 响应式按钮

```css
.button {
    min-height: 44px;
    min-width: 44px;
    padding: 0.75rem 1.5rem;
    background-color: #3498db;
    color: #fff;
    border-radius: 4px;
    -webkit-transition: all 0.2s ease;
    transition: all 0.2s ease;
}

@media (max-width: 480px) {
    .button {
        width: 100%;
    }
}
```

### JavaScript 兼容初始化

```javascript
(function() {
    'use strict';
    
    function init() {
        // 你的代码
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

---

## 🚨 禁止使用（告诉 AI 避免）

| ❌ 不要用 | ✅ 要用 |
|----------|--------|
| `const`/`let` | `var` |
| `() => {}` | `function() {}` |
| `` `模板字符串` `` | `'字符串' + 拼接` |
| `vh/vw` 单位 | `%` 或 `rem` |
| `async/await` | `Promise` 或回调 |
| 固定宽度 px | 相对单位 rem/em/% |
| CSS Grid | Flexbox |

---

## 📱 测试提示

```
请说明如何在以下设备测试：
1. iPhone SE (320px)
2. iPhone 12 (390px)
3. iPad (768px)
4. 桌面 (1200px+)

并预测可能的兼容性问题。
```

---

## 💡 实际使用示例

### 示例 1: 创建登录页面

```
请按照思高圣经项目的规范开发登录页面：

【兼容性要求】
✅ iOS 10+, Android 5.0+, 微信浏览器
✅ 响应式：320px - 1920px
✅ 触摸目标 ≥ 44px

【HTML 必须包含】
完整的 meta 标签（viewport, X-UA-Compatible, format-detection）

【CSS 规范】
✅ 使用 rem 单位
✅ 浏览器前缀
✅ 媒体查询
✅ 引用 /css/style.css

【JavaScript 规范】
✅ ES5 语法（function/var）
✅ 错误处理
✅ 引用 /js/main.js

【项目配色】
#3498db / #333 / #f5f5f5

【具体需求】
1. 用户名和密码输入框
2. 记住密码复选框
3. 登录按钮（移动端全宽）
4. 表单验证
5. 登录中状态提示
```

### 示例 2: 修改按钮样式

```
请修改 views/bible/index.ejs 中的返回按钮：

【保持兼容性】
- 响应式布局
- 触摸友好（≥ 44px）
- 浏览器前缀

【修改要求】
1. 改为圆角矩形（border-radius: 4px）
2. 添加图标 🏠
3. 颜色改为 #3498db
4. hover 效果：#2980b9
5. 移动端全宽
```

---

## 📚 相关文档

- **详细指南**: `/docs/AI_DEVELOPMENT_GUIDE.md`
- **兼容性测试**: `/docs/mobile-compatibility.md`
- **项目总结**: `/docs/REFACTORING_SUMMARY.md`

---

## 🎯 记住这 5 点

1. **每次都要求兼容性** - iOS 10+, Android 5.0+
2. **强调响应式** - 320px - 1920px
3. **指定技术栈** - ES5, rem, Flexbox
4. **提供代码模板** - 直接给 AI 标准模板
5. **要求自检** - 让 AI 检查兼容性清单

---

**💡 使用技巧**: 把这个文件加入你的浏览器书签或 AI 工具的自定义指令，每次开发前一键调用！
