#!/bin/bash

# 思高圣经 AI 系统 - 配置验证脚本

set -e

echo "=========================================="
echo "  思高圣经 AI 系统 - 配置验证"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ 错误：未找到 .env 文件"
    echo ""
    echo "请运行以下命令创建配置文件："
    echo "  bash scripts/setup-env.sh"
    echo "或者："
    echo "  cp .env.example .env"
    exit 1
fi

echo "✅ .env 文件存在"

# 检查文件权限
perms=$(stat -c "%a" .env 2>/dev/null || stat -f "%Lp" .env 2>/dev/null)
if [ "$perms" != "600" ]; then
    echo "⚠️  警告：.env 文件权限为 $perms，建议设置为 600"
    echo "   运行：chmod 600 .env"
else
    echo "✅ 文件权限正确 (600)"
fi
echo ""

# 读取并验证配置
echo "=========================================="
echo "配置检查"
echo "=========================================="

source .env

# 应用配置
echo ""
echo "📦 应用配置:"
echo "  NODE_ENV: ${NODE_ENV:-未设置}"
echo "  PORT: ${PORT:-未设置}"

if [ "$NODE_ENV" = "production" ]; then
    echo "  ⚠️  生产环境模式"
fi

# 数据库配置
echo ""
echo "🗄️  数据库配置:"
echo "  DB_HOST: ${DB_HOST:-未设置}"
echo "  DB_PORT: ${DB_PORT:-未设置}"
echo "  DB_USER: ${DB_USER:-未设置}"
echo "  DB_PASS: ${DB_PASS:+********} ${DB_PASS:-(未设置)}"
echo "  DB_NAME: ${DB_NAME:-未设置}"

# 检查必填项
errors=0

if [ -z "$DB_HOST" ]; then
    echo "  ❌ DB_HOST 未设置"
    ((errors++))
fi

if [ -z "$DB_USER" ]; then
    echo "  ❌ DB_USER 未设置"
    ((errors++))
fi

if [ -z "$DB_PASS" ]; then
    echo "  ❌ DB_PASS 未设置"
    ((errors++))
fi

if [ -z "$DB_NAME" ]; then
    echo "  ❌ DB_NAME 未设置"
    ((errors++))
fi

# 管理员配置
echo ""
echo "👤 管理员配置:"
echo "  ADMIN_USERNAME: ${ADMIN_USERNAME:-未设置}"
echo "  ADMIN_PASS: ${ADMIN_PASS:+********} ${ADMIN_PASS:-(未设置)}"

if [ -z "$ADMIN_USERNAME" ]; then
    echo "  ⚠️  ADMIN_USERNAME 未设置，将使用默认值 'admin'"
fi

if [ -z "$ADMIN_PASS" ]; then
    echo "  ❌ ADMIN_PASS 未设置"
    ((errors++))
elif [ "$ADMIN_PASS" = "admin" ] || [ "$ADMIN_PASS" = "change_me_in_production" ]; then
    if [ "$NODE_ENV" = "production" ]; then
        echo "  ❌ 生产环境使用默认密码，不安全！"
        ((errors++))
    else
        echo "  ⚠️  使用默认密码（仅开发环境可接受）"
    fi
else
    pass_len=${#ADMIN_PASS}
    if [ $pass_len -lt 12 ]; then
        echo "  ⚠️  密码长度为 $pass_len，建议至少 12 位"
    else
        echo "  ✅ 密码强度良好"
    fi
fi

# AI 服务配置
echo ""
echo "🤖 AI 服务配置:"
echo "  MAGISTERIUM_API_KEY: ${MAGISTERIUM_API_KEY:+sk_****...} ${MAGISTERIUM_API_KEY:-(未设置)}"
echo "  MAGISTERIUM_API_URL: ${MAGISTERIUM_API_URL:-未设置}"

if [ -z "$MAGISTERIUM_API_KEY" ] || [ "$MAGISTERIUM_API_KEY" = "your_api_key_here" ]; then
    echo "  ⚠️  API 密钥未设置，AI 功能将不可用"
fi

# 日志配置
echo ""
echo "📝 日志配置:"
echo "  LOG_LEVEL: ${LOG_LEVEL:-未设置}"
echo "  LOG_DIR: ${LOG_DIR:-未设置}"

# 总结
echo ""
echo "=========================================="
if [ $errors -eq 0 ]; then
    echo "✅ 配置验证通过！"
    echo "=========================================="
    echo ""
    echo "下一步："
    echo "  1. 启动服务: docker-compose up -d"
    echo "  2. 查看日志: docker-compose logs -f"
    echo "  3. 访问应用: http://localhost:${PORT:-3000}"
    echo ""
else
    echo "❌ 发现 $errors 个配置错误"
    echo "=========================================="
    echo ""
    echo "请修复以上错误后重新运行验证"
    echo ""
    exit 1
fi
