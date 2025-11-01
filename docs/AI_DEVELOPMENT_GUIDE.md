# 前端开发规范与 AI 提示词指南

## 📋 给 AI 的标准提示词模板

### 基础提示词（每次开发都要包含）

```
请按照以下规范开发前端页面：

1. **移动端优先设计**
   - 支持 iOS 10+ 和 Android 5.0+
   - 使用响应式布局（断点：360px, 480px, 768px）
   - 所有触摸目标最小 44x44px

2. **HTML 标准**
   - 使用 <!DOCTYPE html>
   - 添加完整的 meta 标签（viewport, X-UA-Compatible, format-detection）
   - 语言声明 lang="zh-CN"
   - 语义化 HTML5 标签

3. **CSS 规范**
   - 使用相对单位（rem, em, %）
   - 添加浏览器前缀（-webkit-, -moz-）
   - 移动优先的媒体查询
   - 触摸友好的交互效果

4. **JavaScript 规范**
   - 兼容 ES5（或使用 Babel）
   - 避免使用箭头函数、async/await（如需兼容旧浏览器）
   - 添加 polyfill 或降级方案
   - 使用 try-catch 包裹可能出错的代码

5. **性能优化**
   - 图片懒加载
   - 最小化请求
   - 合理使用缓存
```

---

## 🎯 具体场景的提示词

### 1. 创建新页面时

```
请创建一个 [页面名称] 页面，要求：

【功能需求】
- [具体功能描述]

【兼容性要求】
- 支持 iOS 10+ Safari、Android 5.0+ Chrome
- 支持微信内置浏览器
- 响应式布局，适配 320px 到 1920px 屏幕

【HTML 要求】
- 包含完整的 meta 标签：
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
- 使用语义化标签

【CSS 要求】
- 使用项目的 /css/style.css
- 触摸目标最小 44x44px
- 使用 rem 单位
- 添加必要的浏览器前缀
- 包含媒体查询：@media (max-width: 480px), (max-width: 768px)

【JavaScript 要求】
- 引入 /js/main.js
- 使用传统函数语法（function）
- 避免 ES6+ 特性（除非有 polyfill）
- 添加错误处理

【样式要求】
- 使用项目配色：主色 #3498db，文字 #333
- 按钮圆角 4px
- 过渡动画 0.2s ease
```

### 2. 修改现有页面时

```
请修改 [页面路径] 页面，要求：

【修改内容】
- [具体修改描述]

【保持兼容性】
- 不要破坏现有的响应式布局
- 保持所有 meta 标签
- 新增的交互元素也要符合 44x44px 触摸标准
- 使用与现有代码一致的 JavaScript 风格
- 测试在移动端的显示效果

【注意事项】
- 使用已有的 CSS 类名
- 保持代码风格一致
- 不要移除浏览器前缀
```

### 3. 添加新功能时

```
请在 [页面名称] 添加 [功能名称] 功能，要求：

【功能描述】
- [详细功能描述]

【兼容性要求】
- 确保在旧浏览器中功能降级而不是崩溃
- 使用 try-catch 包裹新代码
- 如使用新 API，添加特性检测：
  if ('IntersectionObserver' in window) { ... }

【移动端适配】
- 触摸操作流畅
- 表单输入键盘友好
- 加载状态反馈
- 错误提示清晰

【性能考虑】
- 避免阻塞主线程
- 使用防抖/节流
- 合理使用缓存
```

### 4. 创建表单页面时

```
请创建一个 [表单名称] 表单，要求：

【基础要求】
- 所有标准兼容性要求（meta 标签、响应式等）

【表单特定要求】
- 输入框 min-height: 44px
- 标签使用 <label> 标签并关联 input
- 必填字段标注 required 和视觉提示
- 提交按钮全宽（移动端）
- 表单验证使用 HTML5 + JavaScript 双重验证
- 提交时显示加载状态
- 错误提示清晰明显

【移动端优化】
- input type 正确（tel, email, number 等）
- 禁用自动缩放：user-scalable=yes 但 maximum-scale=5.0
- 键盘弹出时页面不错位
```

### 5. 创建列表页面时

```
请创建一个 [列表名称] 列表页面，要求：

【基础要求】
- 所有标准兼容性要求

【列表特定要求】
- 列表项有足够的触摸区域（padding: 0.75rem）
- 点击效果明显（hover/active 状态）
- 长列表考虑性能（虚拟滚动或分页）
- 空状态提示友好
- 加载状态显示骨架屏或加载动画

【响应式处理】
- 移动端：垂直列表，全宽
- 平板：可选网格布局
- 桌面：多列布局
```

---

## 📝 代码审查检查清单

### 提交代码前，让 AI 检查：

```
请审查以下代码的移动端兼容性，检查：

【HTML 检查】
- [ ] 是否有 viewport meta 标签？
- [ ] 是否有 X-UA-Compatible meta 标签？
- [ ] 是否使用了语义化标签？
- [ ] 表单是否有正确的 label？
- [ ] 图片是否有 alt 属性？

【CSS 检查】
- [ ] 是否使用了相对单位？
- [ ] 触摸目标是否 ≥ 44px？
- [ ] 是否有移动端媒体查询？
- [ ] 是否添加了浏览器前缀？
- [ ] 是否有适当的过渡动画？

【JavaScript 检查】
- [ ] 是否避免了 ES6+ 特性（或有 polyfill）？
- [ ] 是否有错误处理？
- [ ] 是否有特性检测？
- [ ] 是否避免了阻塞操作？
- [ ] 是否有适当的事件监听器？

【兼容性检查】
- [ ] 在 iOS 10 Safari 中能否正常工作？
- [ ] 在 Android 5.0 Chrome 中能否正常工作？
- [ ] 在微信浏览器中能否正常工作？
- [ ] 小屏设备（320px）显示是否正常？

【性能检查】
- [ ] 首屏加载时间 < 3s？
- [ ] 是否有不必要的重绘/重排？
- [ ] 图片是否优化？
- [ ] 是否有懒加载？
```

---

## 🔧 常用代码片段（告诉 AI 使用这些）

### HTML 页面模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>[页面标题]</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="container">
        <!-- 页面内容 -->
    </div>
    <script src="/js/main.js"></script>
</body>
</html>
```

### CSS 响应式模板

```css
/* 基础样式 */
.element {
    /* 使用 rem 单位 */
    padding: 1rem;
    
    /* 触摸友好 */
    min-height: 44px;
    min-width: 44px;
    
    /* 浏览器前缀 */
    -webkit-transition: all 0.2s ease;
    -moz-transition: all 0.2s ease;
    transition: all 0.2s ease;
    
    /* Flexbox 布局 */
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
}

/* 平板 */
@media screen and (max-width: 768px) {
    .element {
        padding: 0.75rem;
    }
}

/* 手机 */
@media screen and (max-width: 480px) {
    .element {
        padding: 0.5rem;
        width: 100%;
    }
}
```

### JavaScript 兼容模板

```javascript
// 使用传统函数语法
(function() {
    'use strict';
    
    // 特性检测
    if (!window.Promise) {
        console.log('旧浏览器，启用降级方案');
        // 降级逻辑
        return;
    }
    
    // 错误处理
    try {
        // 主要逻辑
    } catch (e) {
        console.error('发生错误:', e);
    }
    
    // 事件监听（兼容旧浏览器）
    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', init);
    } else if (document.attachEvent) {
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState === 'complete') init();
        });
    }
    
    function init() {
        // 初始化代码
    }
})();
```

---

## 🚨 常见错误与解决方案

### 告诉 AI 避免这些错误：

| 错误 | 正确做法 |
|------|---------|
| ❌ 使用 `vh` 单位 | ✅ 使用 `%` 或 `rem`（移动端 vh 有 bug） |
| ❌ 使用箭头函数 `() => {}` | ✅ 使用 `function() {}` |
| ❌ 使用 `const`/`let` | ✅ 使用 `var`（如需兼容 IE11） |
| ❌ 使用 `template literals` | ✅ 使用字符串拼接 `'text' + var` |
| ❌ 直接使用 `fetch` | ✅ 检查支持或使用 XMLHttpRequest |
| ❌ 按钮太小（< 44px） | ✅ 最小 44x44px |
| ❌ 忘记浏览器前缀 | ✅ 添加 -webkit-, -moz- 前缀 |
| ❌ 固定宽度（px） | ✅ 使用相对单位（%, rem） |
| ❌ 没有 meta viewport | ✅ 必须添加 viewport meta 标签 |
| ❌ 复杂的 CSS Grid | ✅ 使用 Flexbox 或传统布局 |

---

## 📱 测试提示词

```
请提供在以下设备/浏览器中的测试建议：

1. iOS 10-12 Safari
2. Android 5-7 Chrome
3. 微信浏览器（iOS/Android）
4. 小屏设备（iPhone SE, 320px）
5. 平板设备（iPad, 768px）

并说明：
- 预期的显示效果
- 可能的兼容性问题
- 降级方案（如有）
```

---

## 🎨 UI/UX 提示词

```
请设计/实现 [组件名称]，要求：

【视觉设计】
- 遵循项目配色方案（主色 #3498db）
- 圆角 4px
- 阴影 box-shadow: 0 2px 4px rgba(0,0,0,0.1)
- 过渡动画 0.2s ease

【交互设计】
- 触摸反馈明显（:active 状态）
- 加载状态清晰
- 错误提示友好
- 空状态有提示

【移动端优化】
- 拇指友好的操作位置
- 足够的触摸区域
- 避免误触
- 横竖屏都正常
```

---

## 📦 项目特定规范

### 当前项目使用的标准

```
【项目配置】
- 主色调: #3498db
- 文字颜色: #333
- 背景色: #f5f5f5
- 圆角: 4px
- 过渡: 0.2s ease
- 字体: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif

【断点】
- 小屏手机: < 360px
- 手机: < 480px
- 平板: < 768px
- 桌面: > 768px

【文件结构】
- HTML: views/[module]/[page].ejs
- CSS: public/css/style.css
- JS: public/js/main.js
- 图片: public/images/

【命名规范】
- CSS 类名: kebab-case (.book-list, .nav-links)
- JavaScript 变量: camelCase (bookId, chapterList)
- 文件名: kebab-case (bible-service.js, admin.controller.js)
```

---

## 💡 快速提示词生成器

### 模板填空式

```
请创建/修改 [页面/组件名称]，要求：

功能: [简述功能]
兼容: iOS 10+, Android 5.0+, 微信浏览器
响应: 320px - 1920px
样式: 遵循项目 /css/style.css 规范
脚本: 兼容旧浏览器，使用 ES5 语法
测试: 在移动端设备模拟器中验证

特别注意:
- [ ] viewport meta 标签
- [ ] 触摸目标 ≥ 44px
- [ ] 浏览器前缀
- [ ] 错误处理
- [ ] 加载状态
```

---

## 🎯 总结

### 每次让 AI 开发前端时，记住：

1. **明确兼容性要求**
   - iOS 10+, Android 5.0+
   - 微信浏览器
   - 320px - 1920px

2. **提供具体规范**
   - meta 标签清单
   - CSS 单位要求
   - JavaScript 语法限制

3. **给出代码模板**
   - 使用项目已有的模板
   - 参考现有页面的写法

4. **要求代码审查**
   - 检查清单
   - 兼容性测试
   - 性能检查

5. **提供测试指导**
   - 测试场景
   - 预期结果
   - 降级方案

---

**保存这个文档，每次开发前给 AI 相关的提示词，就能确保开发出兼容性良好的网页！** 🎉
