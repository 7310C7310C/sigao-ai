# Magisterium API 使用文档（已对照官方文档核验）

> 本文档严格依据 Magisterium 官方开发者文档（见文末 5 个链接）整理，覆盖：首个请求、引用来源、相关问题、安全设置与错误处理。

## 目录

- 概述
- 1) 第一个请求（OpenAI 兼容）
- 2) 引用来源 Citations（响应字段与流式行为）
- 3) 相关问题 Related Questions（开启参数与流式行为）
- 4) 安全设置 Safety Settings（输入侧治理与触发行为）
- 5) 错误处理 Error Handling（官方错误码）
- 参考链接
- 集成建议与示例（ES5 / XHR）

---

## 概述

Magisterium 提供 OpenAI Chat Completions 兼容接口，并在响应对象上做了少量扩展（如 citations、related_questions）。

关键信息（来自官方“Making Your First API Request”等）：
- Endpoint（非流式/流式均相同）：POST https://www.magisterium.com/api/v1/chat/completions
- Headers：
    - Authorization: Bearer YOUR_API_KEY
    - Content-Type: application/json
- 请求主体（核心字段）：
    - model: "magisterium-1"（示例值）
    - messages: [{ role: "user", content: "..." }]
    - stream: 可选布尔值（流式时为 true）

---

## 1) 第一个请求（OpenAI 兼容）

使用 ES5 与 XMLHttpRequest（满足本项目旧设备兼容要求）：

```javascript
// 非流式（stream=false）基本示例（ES5 / XHR）
function magisteriumChat(messages, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.magisterium.com/api/v1/chat/completions', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + 'YOUR_API_KEY');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    // OpenAI 兼容：答案位于 choices[0].message.content
                    var text = data && data.choices && data.choices[0] && data.choices[0].message
                        ? data.choices[0].message.content
                        : '';
                    callback(null, { text: text, citations: data.citations, related_questions: data.related_questions, raw: data });
                } catch (e) {
                    callback(new Error('解析响应失败'));
                }
            } else {
                callback(new Error('HTTP ' + xhr.status));
            }
        }
    };

    xhr.onerror = function () { callback(new Error('网络错误')); };
    xhr.timeout = 30000; // 30s
    xhr.ontimeout = function () { callback(new Error('请求超时')); };

    var body = {
        model: 'magisterium-1',
        messages: messages,
        stream: false
    };
    xhr.send(JSON.stringify(body));
}

// 使用
magisteriumChat([{ role: 'user', content: '什么是信德？' }], function (err, res) {
    if (err) { console.error(err); return; }
    console.log('回答:', res.text);
    console.log('引用 citations:', res.citations);
});
```

关于流式（stream: true）：接口为 SSE 风格的分块响应（chat.completion.chunk），推荐在后端代理转发为 EventSource/ReadableStream 到前端。官方说明：citations/related_questions 仅会在“含有 finish_reason 的最后一个分块”一起出现（见后文各节）。

---

## 2) 引用来源 Citations（官方字段与流式行为）

官方说明：Magisterium API 与 OpenAI API 兼容，但在响应对象上新增了 citations 字段。

流式行为：当 stream=true 时，citations 也会返回，但只出现在包含 finish_reason 的最后一个 chunk。

字段 Schema（来自官方“Citations”页）：citations 为对象数组，字段包含（部分可为 null）：
- cited_text: string（被引用的原文片段）
- cited_text_heading: string|null（该引用附近的标题）
- document_title: string|null（文献标题）
- document_index: integer（文献在响应中出现的索引，0 基）
- document_author: string|null（作者/发布机构）
- document_year: string|null（年份）
- document_reference: string|null（段落/编号等引用标识）
- source_url: string（来源 URL）

示例（非流式响应片段，官方示例值）：

```json
{
    "object": "chat.completion",
    "model": "magisterium-1",
    "choices": [ { "index": 0, "message": { "role": "assistant", "content": "..." }, "finish_reason": "stop" } ],
    "citations": [
        {
            "cited_text": "...",
            "document_title": "Cherishing Life",
            "document_index": 0,
            "document_author": "Catholic Bishops’ Conference of England and Wales",
            "document_reference": "34"
        }
    ]
}
```

---

## 3) 相关问题 Related Questions（开启参数与流式行为）

官方说明：可选的相关问题数组通过响应字段 related_questions 返回。

开启方式：在请求体中设置 return_related_questions: true。

响应：related_questions 为字符串数组（string[]）。

流式行为：与 citations 相同，仅在含有 finish_reason 的最后一个分块返回。

---

## 4) 安全设置 Safety Settings（输入侧治理）

官方说明摘要：
- 安全设置仅用于“输入侧”审核，不直接治理输出。
- 通过请求体 safety_settings 字段按类别配置阈值与是否返回替代响应。
- 若触发：
    - 当某类别的配置中 response=true（默认 true）时，会返回“替代响应/安全响应”。
    - 当 response=false 时，本次生成会以 finish_reason = "content_filter" 结束，输出文本为空（流式的最后分块如此指示）。

示例（来自官方“Safety Settings”页）：

```json
{
    "model": "magisterium-1",
    "messages": [{ "role": "user", "content": "..." }],
    "safety_settings": {
        "CATEGORY_NON_CATHOLIC": { "threshold": "BLOCK_ALL", "response": true }
    }
}
```

注记：官方示例类别包含 CATEGORY_NON_CATHOLIC；示例阈值含 BLOCK_ALL 与 OFF；默认阈值通常更严格（如 BLOCK_ALL）。

---

## 5) 错误处理 Error Handling（官方错误码）

来自官方“Error Handling”页的错误码概览（示例表）：

- 400 Token limit exceeded（令牌上限超出）
- 401 Incorrect API key provided（API Key 无效）
- 401 Invalid billing（计费未正确设置）
- 401 Tier not found（服务等级无效）
- 429 Too many requests（超出速率限制）
- 500 Internal server error（服务器内部错误）

处理建议：
- 400：减少消息长度/历史/生成长度（max_tokens），确保参数有效。
- 401：检查 Authorization 头与 Key 是否正确、是否有权限与有效计费；必要时联系支持。
- 429：加入速率限制与指数退避重试。
- 500：短暂等待并重试；可观察状态页。
- content_filter：当安全设置 response=false 被触发时，finish_reason 会为 content_filter（无文本），前端需给出友好提示。

---

## 参考链接（官方）

1) Making Your First API Request  
     https://www.magisterium.com/zh/developers/docs/chat/making-first-request

2) Citations  
     https://www.magisterium.com/zh/developers/docs/chat/citations

3) Related Questions  
     https://www.magisterium.com/zh/developers/docs/chat/related-questions

4) Safety Settings  
     https://www.magisterium.com/zh/developers/docs/chat/safety-settings

5) Error Handling  
     https://www.magisterium.com/zh/developers/docs/chat/error-handling

---

## 集成建议与示例（ES5 / 兼容旧端）

项目兼容性（iOS 10+ / Android 5.0+ / 微信浏览器）：
- 使用 var 与 function，避免箭头函数与 ES6+ 特性
- 使用 XMLHttpRequest 而非 fetch
- 避免模板字符串，使用字符串拼接

最小可用封装（含错误与重试）：

```javascript
function callMagisterium(messages, options, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.magisterium.com/api/v1/chat/completions', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + 'YOUR_API_KEY');
    xhr.timeout = 30000;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    var text = data && data.choices && data.choices[0] && data.choices[0].message
                        ? data.choices[0].message.content : '';
                    cb(null, { text: text, citations: data.citations, related_questions: data.related_questions, raw: data });
                } catch (e) {
                    cb(new Error('解析响应失败'));
                }
            } else if (xhr.status === 401) {
                cb(new Error('认证失败(401)：请检查 API Key/计费/服务等级'));
            } else if (xhr.status === 429) {
                cb(new Error('请求过多(429)：触发速率限制'));
            } else if (xhr.status === 400) {
                cb(new Error('请求无效(400)：可能超出 token 限制或参数错误'));
            } else if (xhr.status === 500) {
                cb(new Error('服务器内部错误(500)'));
            } else {
                cb(new Error('HTTP ' + xhr.status));
            }
        }
    };

    xhr.onerror = function () { cb(new Error('网络错误')); };
    xhr.ontimeout = function () { cb(new Error('请求超时')); };

    // 允许可选项：return_related_questions、safety_settings 等
    var body = {
        model: 'magisterium-1',
        messages: messages
    };
    if (options && options.return_related_questions === true) {
        body.return_related_questions = true;
    }
    if (options && options.safety_settings) {
        body.safety_settings = options.safety_settings;
    }
    if (options && options.max_tokens) { body.max_tokens = options.max_tokens; }
    if (options && options.temperature != null) { body.temperature = options.temperature; }

    xhr.send(JSON.stringify(body));
}

// 指数退避重试
function callWithRetry(messages, options, maxRetries, cb) {
    var attempt = 0;
    function run() {
        callMagisterium(messages, options, function (err, res) {
            if (err) {
                var retryable = (attempt < maxRetries) && (
                    err.message.indexOf('429') !== -1 ||
                    err.message.indexOf('500') !== -1 ||
                    err.message.indexOf('网络错误') !== -1 ||
                    err.message.indexOf('超时') !== -1
                );
                if (retryable) {
                    attempt++;
                    var delay = Math.pow(2, attempt) * 1000; // 2^n * 1000ms
                    setTimeout(run, delay);
                } else {
                    cb(err);
                }
            } else {
                cb(null, res);
            }
        });
    }
    run();
}
```

UI 友好提示（示例）：

```javascript
function showError(message) {
    var el = document.getElementById('error-message');
    if (!el) return;
    el.textContent = message;
    el.className = 'error-message active';
    setTimeout(function () { el.className = 'error-message'; }, 5000);
}
```

---

## 更新日志

- 2025-11-01：首版。依据官方文档修正了端点、请求/响应结构，完善 citations/related_questions 的开启方式与流式行为，补充安全设置与错误码。
