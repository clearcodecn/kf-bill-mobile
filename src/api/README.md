# API 模块使用说明

## 概述

本项目使用axios作为HTTP客户端，提供了统一的API接口管理方案，包含以下特性：

- 自动token认证
- 统一错误处理
- 请求/响应拦截
- 模块化API管理

## 目录结构

```
src/api/
├── index.js              # axios配置和拦截器
├── api.js               # 统一导出文件
├── auth.js              # 用户认证API
├── cards.js             # 卡密管理API
├── domains.js           # 域名管理API
├── antiBlockDomains.js  # 防封域名管理API
├── system.js            # 系统管理API
└── README.md            # 使用说明
```

## 使用方法

### 1. 在组件中导入API

```javascript
import { cardsApi, domainsApi, authApi } from '@/api/api'
```

### 2. 使用API接口

```javascript
// 获取卡密列表
const getCardsList = async () => {
  try {
    const response = await cardsApi.getCardsList({
      page: 1,
      pageSize: 10,
      status: 'active'
    })
    console.log(response.data)
  } catch (error) {
    console.error('获取卡密列表失败:', error)
  }
}

// 创建卡密
const createCard = async (cardData) => {
  try {
    const response = await cardsApi.createCard(cardData)
    showToast('创建成功')
    return response.data
  } catch (error) {
    console.error('创建卡密失败:', error)
  }
}
```

### 3. 环境配置

在项目根目录创建环境变量文件：

**.env.development**
```
VITE_API_BASE_URL=http://localhost:8080/api
```

**.env.production**
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## API特性

### 自动Token认证
- 所有请求会自动从localStorage获取token
- Token过期会自动跳转到登录页
- 支持Bearer Token认证方式

### 统一错误处理
按照以下优先级处理错误：

1. **服务器返回具体错误信息** (`data.message`): 优先显示服务器返回的具体错误信息
2. **401/403错误**: 显示"登录过期或权限不足, 请重新登陆!"并自动跳转登录页
3. **500错误**: 显示"请求数据失败, 请重试!"
4. **406错误**: 显示"登陆超时请重新登录!"并自动跳转登录页
5. **其他错误**: 显示默认错误信息或状态码

**特点**:
- 所有错误都会通过 `showToast` 自动显示给用户
- 认证相关错误会自动清除本地token并跳转到登录页
- 在业务代码中无需手动处理错误提示，拦截器会自动处理

### 请求配置
- 默认超时时间：10秒
- 自动添加Content-Type: application/json
- 支持自定义请求配置

## 扩展API模块

要添加新的API模块，请按以下步骤：

1. 在`src/api/`目录下创建新的模块文件
2. 按照现有模块的格式编写API接口
3. 在`src/api/api.js`中导出新模块
4. 在组件中导入并使用

## 注意事项

- 所有API接口都返回Promise
- 成功响应会返回`{ code: 200, data: ..., message: ... }`格式
- 错误会自动显示Toast提示，无需手动处理
- 401错误会自动清除本地token并跳转登录页
