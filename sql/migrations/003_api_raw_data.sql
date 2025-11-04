-- 添加 API 原始数据字段
-- 用于存储 AI API 的原始请求和响应数据，便于调试和审计
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE sigao_ai;

-- 为 ai_responses_cache 表添加原始 API 数据字段
ALTER TABLE ai_responses_cache
ADD COLUMN api_request_json LONGTEXT NULL COMMENT 'API 原始请求 JSON' AFTER response_json,
ADD COLUMN api_response_json LONGTEXT NULL COMMENT 'API 原始响应 JSON' AFTER api_request_json;

-- 注释：
-- api_request_json: 存储发送给 AI API 的完整请求数据（包括 messages, model, temperature 等参数）
-- api_response_json: 存储 AI API 返回的完整响应数据（包括 choices, usage, finish_reason 等）
-- 这些字段对现有数据为 NULL，不影响旧记录的使用
-- 新的 AI 请求将自动保存这些原始数据，便于调试和问题追踪
