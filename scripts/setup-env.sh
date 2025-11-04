#!/bin/bash

# 思高圣经 AI 系统 - 环境配置脚本
# 用于快速设置环境变量

set -e

echo "=========================================="
echo "  思高圣经 AI 系统 - 环境配置向导"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在
if [ -f .env ]; then
    echo "⚠️  检测到 .env 文件已存在"
    read -p "是否要覆盖现有配置？(y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "❌ 取消配置"
        exit 0
    fi
    echo ""
fi

# 复制模板
echo "📝 复制配置模板..."
cp .env.example .env
echo "✅ 配置文件已创建"
echo ""

# 询问运行环境
echo "=========================================="
echo "1. 应用配置"
echo "=========================================="
read -p "运行环境 (development/production) [development]: " node_env
node_env=${node_env:-development}
sed -i "s/NODE_ENV=.*/NODE_ENV=$node_env/" .env

read -p "服务端口 [3000]: " port
port=${port:-3000}
sed -i "s/PORT=.*/PORT=$port/" .env
echo ""

# 数据库配置
echo "=========================================="
echo "2. 数据库配置"
echo "=========================================="
read -p "使用 Docker 环境？(y/N): " use_docker
if [[ $use_docker =~ ^[Yy]$ ]]; then
    db_host="mysql"
else
    db_host="127.0.0.1"
fi
sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" .env

read -p "数据库端口 [3306]: " db_port
db_port=${db_port:-3306}
sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" .env

read -p "数据库用户名 [sigao]: " db_user
db_user=${db_user:-sigao}
sed -i "s/DB_USER=.*/DB_USER=$db_user/" .env

read -p "数据库密码 [sigao]: " db_pass
db_pass=${db_pass:-sigao}
sed -i "s/DB_PASS=.*/DB_PASS=$db_pass/" .env

read -p "数据库名称 [sigao_ai]: " db_name
db_name=${db_name:-sigao_ai}
sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" .env
echo ""

# 管理员配置
echo "=========================================="
echo "3. 管理员配置"
echo "=========================================="
read -p "管理员用户名 [admin]: " admin_user
admin_user=${admin_user:-admin}
sed -i "s/ADMIN_USERNAME=.*/ADMIN_USERNAME=$admin_user/" .env

echo "⚠️  请设置强密码（至少12位，包含大小写字母、数字和特殊字符）"
read -sp "管理员密码: " admin_pass
echo ""
if [ -z "$admin_pass" ]; then
    echo "❌ 密码不能为空"
    exit 1
fi
sed -i "s/ADMIN_PASS=.*/ADMIN_PASS=$admin_pass/" .env
echo ""

# AI 服务配置
echo "=========================================="
echo "4. AI 服务配置"
echo "=========================================="
read -p "Magisterium API 密钥: " api_key
if [ -z "$api_key" ]; then
    echo "⚠️  警告：未设置 API 密钥，AI 功能将不可用"
else
    sed -i "s/MAGISTERIUM_API_KEY=.*/MAGISTERIUM_API_KEY=$api_key/" .env
fi

read -p "API 端点 URL [https://www.magisterium.com/api/v1/chat/completions]: " api_url
api_url=${api_url:-https://www.magisterium.com/api/v1/chat/completions}
sed -i "s|MAGISTERIUM_API_URL=.*|MAGISTERIUM_API_URL=$api_url|" .env
echo ""

# 日志配置
echo "=========================================="
echo "5. 日志配置"
echo "=========================================="
read -p "日志级别 (debug/info/warn/error) [info]: " log_level
log_level=${log_level:-info}
sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=$log_level/" .env

read -p "日志目录 [./logs]: " log_dir
log_dir=${log_dir:-./logs}
sed -i "s|LOG_DIR=.*|LOG_DIR=$log_dir|" .env
echo ""

# 设置文件权限
echo "🔒 设置文件权限..."
chmod 600 .env
echo "✅ 权限已设置为 600 (仅所有者可读写)"
echo ""

# 完成
echo "=========================================="
echo "✅ 配置完成！"
echo "=========================================="
echo ""
echo "配置摘要："
echo "  - 运行环境: $node_env"
echo "  - 服务端口: $port"
echo "  - 数据库主机: $db_host:$db_port"
echo "  - 数据库名称: $db_name"
echo "  - 管理员用户: $admin_user"
echo "  - 日志级别: $log_level"
echo ""
echo "下一步："
echo "  1. 检查 .env 文件确认配置正确"
echo "  2. 启动应用: npm start"
echo "  3. 访问: http://localhost:$port"
echo ""
echo "安全提示："
echo "  - 永远不要提交 .env 文件到版本控制"
echo "  - 生产环境定期更换密码和密钥"
echo "  - 保持 .env 文件权限为 600"
echo ""
