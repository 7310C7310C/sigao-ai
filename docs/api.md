# Sigao AI API 文档

## 概述
思高圣经读经辅助系统 API 文档

## 公开接口

### 1. 首页 - 经卷列表
- **路径**: `GET /`
- **描述**: 显示所有圣经经卷
- **返回**: HTML 页面，包含经卷列表

### 2. 查看经卷章节
- **路径**: `GET /book/:bookId`
- **参数**:
  - `bookId` (number): 经卷 ID
- **描述**: 显示指定经卷的所有章节
- **返回**: HTML 页面，包含章节列表

### 3. 查看章节经文
- **路径**: `GET /book/:bookId/chapter/:chapter`
- **参数**:
  - `bookId` (number): 经卷 ID
  - `chapter` (number): 章节号
- **描述**: 显示指定章节的所有经文
- **返回**: HTML 页面，包含经文内容

## 管理接口（需认证）

### 4. 管理后台
- **路径**: `GET /admin`
- **认证**: Basic Auth (用户名: admin, 密码: 见环境变量 ADMIN_PASS)
- **描述**: 显示管理后台页面
- **返回**: HTML 页面，包含上传表单

### 5. 上传 Excel 文件
- **路径**: `POST /admin/upload`
- **认证**: Basic Auth
- **参数**:
  - `file` (multipart/form-data): Excel 文件
- **描述**: 上传并导入圣经数据
- **预期 Excel 格式**:
  - 列: 约别, 经卷类别, 卷名, 章, 节, 经文内容
- **返回**: HTML 页面，显示导入结果

## 数据模型

### Book（经卷）
```javascript
{
  id: number,
  code: string,
  name_cn: string,
  book_type: string,
  testament: string,
  order_index: number
}
```

### Verse（经文）
```javascript
{
  id: number,
  translation_id: number,
  book_id: number,
  chapter: number,
  verse_ref: string,
  line_index: number,
  type: 'verse' | 'note',
  text: string,
  content_hash: string,
  original_row: number
}
```

### Translation（译本）
```javascript
{
  id: number,
  code: string,
  name: string,
  lang: string
}
```

## 错误处理
- **404**: 页面未找到
- **400**: 请求错误（如未上传文件）
- **401**: 认证失败
- **500**: 服务器内部错误
