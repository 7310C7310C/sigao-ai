# Magisterium PoC (Node + HTML + Docker)

这是一个最小 PoC：Node.js 代理服务器 + 前端 HTML，可打开 stream 并将 Magisterium API 的流式输出增量显示在浏览器。

重要：不要把 API key 写入代码或提交到仓库。请用环境变量传入：MAGISTERIUM_API_KEY

快速开始（本地运行）：

1. 在终端设置 API key：

```bash
export MAGISTERIUM_API_KEY="<your-key-here>"
node server.js
```

打开 http://localhost:3000 查看前端页面，输入提示并点击 Send 查看流式输出。

使用 Docker：

```bash
# 构建镜像
docker build -t magisterium-poc .

# 运行容器（将 API key 注入环境变量）
docker run -p 3000:3000 -e MAGISTERIUM_API_KEY="$MAGISTERIUM_API_KEY" magisterium-poc
```

命令行测试（curl 流式示例）：

```bash
curl -N -H "Content-Type: application/json" \
  -d '{"model":"magisterium-1","messages":[{"role":"user","content":"What is the Magisterium?"}],"stream":true}' \
  http://localhost:3000/api/stream
```

安全和注意事项：
- 切勿将 API key 写入仓库文件。生产环境请使用 Secret 管理器。
- 本 PoC 没有做请求验证或速率限制，请在实际部署时做好防护。
