-- AI 提示词配置表
-- 设置客户端字符集为 UTF-8
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE sigao_ai;

CREATE TABLE IF NOT EXISTS ai_prompts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prompt_key VARCHAR(64) NOT NULL UNIQUE COMMENT '提示词唯一标识',
  prompt_name VARCHAR(128) NOT NULL COMMENT '显示名称',
  prompt_type ENUM('system','function') NOT NULL DEFAULT 'function' COMMENT '提示词类型',
  prompt_template TEXT NOT NULL COMMENT '提示词模板',
  function_type VARCHAR(64) NULL COMMENT '功能类型（summary/history/saints/prayer等）',
  lang VARCHAR(16) DEFAULT 'zh' COMMENT '语言',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  order_index INT DEFAULT 0 COMMENT '显示顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type_active (prompt_type, is_active),
  INDEX idx_function_lang (function_type, lang, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认数据
INSERT INTO ai_prompts (prompt_key, prompt_name, prompt_type, prompt_template, function_type, lang, order_index) VALUES

-- ========== System Prompt（全局预设） ==========
('system_default_zh', '默认系统提示词', 'system', 
'你是一位精通天主教教理和圣经的灵修导师，熟悉教父著作和圣人教导。

回答时务必遵循以下原则：
1. **严格遵循天主教教理**：参照《天主教教理》、教宗通谕、大公会议文献
2. **引用权威文献**：圣经章节、教父著作、圣师教导
3. **语言风格**：温和、虔诚、易于理解
4. **谨慎态度**：避免臆测，对不确定的内容明确说明
5. **正统信仰**：符合罗马天主教会的正统教导

请用简体中文回答。', 
NULL, 'zh', 0),

-- ========== Function Prompts（具体功能） ==========
('summary_zh', '经文总结', 'function', 
'请用200字以内总结以下经文的核心要义：

{verses}

要求：
- 提炼主要信息和神学主题
- 符合天主教教理
- 简洁清晰', 
'summary', 'zh', 1),

('history_zh', '历史背景', 'function', 
'请介绍以下经文的历史背景：

{verses}

包括：
- 写作年代和作者背景
- 当时的社会、政治、宗教环境
- 事件发生的具体情境（如适用）

保持学术严谨，引用可靠的圣经研究成果。', 
'history', 'zh', 2),

('saints_zh', '圣人诠释', 'function', 
'请引用圣人圣师对以下经文的诠释或相关教导：

{verses}

优先引用：
- 教父（如圣奥斯定、圣金口若望、圣热罗尼莫）
- 圣师（如圣多玛斯·阿奎那、圣女大德兰）
- 近代圣人（如圣十字若望、圣女小德兰）

请注明引用来源。', 
'saints', 'zh', 3),

('prayer_zh', '祈祷指引', 'function', 
'基于以下经文，请提供一段简短的祈祷文或默想指引：

{verses}

风格：
- 虔诚、平和
- 适合个人灵修或晨祷晚课
- 与经文紧密结合

可包含简短的默想反思（3-5句）和祈祷文（50-100字）。', 
'prayer', 'zh', 4);
