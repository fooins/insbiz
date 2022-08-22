# 保险业务系统 REST API 参考文档 v1.0 <!-- omit in toc -->

## 变更说明 <!-- omit in toc -->

本文档及对应的 API 是最初始版本。

## 目录 <!-- omit in toc -->

- [1. 接口规范](#1-接口规范)
  - [1.1. 接口地址](#11-接口地址)
  - [1.2. 数据格式](#12-数据格式)
  - [1.3. 错误响应](#13-错误响应)
    - [1.3.1. HTTP 状态代码](#131-http-状态代码)
    - [1.3.2. 错误对象](#132-错误对象)
    - [1.3.3. 错误对象示例](#133-错误对象示例)
    - [1.3.4. 错误代码](#134-错误代码)
  - [1.4. 身份验证](#14-身份验证)
  - [1.5. 其他细节](#15-其他细节)

# 1. 接口规范

## 1.1. 接口地址

所有 API 都通过 HTTPS 来访问，并以下方地址作为接口的基础地址：

| 环境 | 地址                                       |
| ---- | ------------------------------------------ |
| 生产 | https://insbiz.fooins.itabbot.com/v1.0     |
| 开发 | https://dev.insbiz.fooins.itabbot.com/v1.0 |

## 1.2. 数据格式

对于 POST、PUT、PATH 和 DELETE 请求，所有数据均以 JSON 格式发送和接收。客户端需使用 `Content-type` 为 `application/json` 的 HTTP 请求标头。

## 1.3. 错误响应

对于请求不成功的情况，服务端会返回标准的 HTTP 状态代码和一个错误对象，以供客户端识别并与成功响应的情况分开处理。

对于允许重试的情况，服务端还会响应一个 `Retry-After` 的 HTTP 标头，指示客户端再次尝试之前应该等待的最小秒数。

### 1.3.1. HTTP 状态代码

| 状态代码 | 状态消息 | 说明 |
| :------: | -------- | ---- |
| 400 | 错误的请求 (Bad Request) | 无法处理请求，因为格式有误或者不正确。 |
| 401 | 未经授权 (Unauthorized) | 资源所需的身份验证信息缺少或无效。 |
| 403 | 禁止访问 (Forbidden) | 对于请求的资源，访问被拒绝。用户可能没有足够的权限。 |
| 404 | 未找到 (Not Found) | 所请求的资源不存在。 |
| 405 | 方法不允许 (Method Not Allowed) | 请求中的 HTTP 方法在资源上不允许。 |
| 406 | 不接受 (Not Acceptable) | 该服务不支持 “Accept” 标头中请求的格式。 |
| 415 | 媒体类型不受支持 (Unsupported Media Type) | 请求的内容类型的格式不受服务支持。 |
| 422 | 实体无法处理 (Unprocessable Entity) | 无法处理请求，因为语义上不正确。 |
| 429 | 请求过多 (Too Many Requests) | 客户端应用程序已被限制，经过一段时间之后再尝试重复的请求。 |
| 500 | 内部服务器错误 (Internal Server Error) | 处理请求时出现内部服务器错误。 |
| 503 | 服务不可用 (Service Unavailable) | 该服务暂时不可用。可以过段时间之后再重复该请求。 |

### 1.3.2. 错误对象

响应的错误对象 ErrorResponse 格式如下：

**ErrorResponse : 对象**

| 属性名  | 类型  | 必需 | 描述       |
| ------- | :---: | :--: | ---------- |
| `error` | Error |  是  | 错误对象。 |

**Error : 对象**

| 属性名 | 类型 | 必需 | 描述 |
| ------ | :--: | :--: | ---- |
| `code` | 字符串 | 是 | 服务端定义的错误代码。通常是人类可读的，指示出比 HTTP 状态码更加具体的错误。 |
| `message` | 字符串 | 是 | 人类可读的错误消息。主要是为开发人员提供帮助，而不作为暴露给最终用户的提示语。 |
| `target` | 字符串 | 否 | 错误的目标。通常是某个属性名。 |
| `details` | Error 数组 | 否 | 错误详细信息。通常表示某次错误请求发生的多个不同的错误。 |
| `innerError` | InnerError | 否 | 包含更具体信息的系统内部错误对象。是一个嵌套的 InnerError 对象，反映出不同层级的错误细节。每个级别都可能包含服务端定义的一些特殊属性。 |

**InnerError : 对象**

| 属性名       |    类型    | 必需 | 描述                   |
| ------------ | :--------: | :--: | ---------------------- |
| `code`       |   字符串   |  是  | 更具体的错误代码。     |
| `innerError` | InnerError |  否  | 嵌套的 InnerError 对象 |

### 1.3.3. 错误对象示例

包含 innerError 的示例：

```json
{
  "error": {
    "code": "BadArgument",
    "message": "Previous passwords may not be reused",
    "target": "password",
    "innerError": {
      "code": "PasswordError",
      "innerError": {
        "code": "PasswordDoesNotMeetPolicy",
        "minLength": "6",
        "maxLength": "64",
        "characterTypes": ["lowerCase", "upperCase", "number", "symbol"],
        "minDistinctCharacterTypes": "2",
        "innerError": {
          "code": "PasswordReuseNotAllowed"
        }
      }
    }
  }
}
```

包含 details 的示例：

```json
{
  "error": {
    "code": "BadArgument",
    "message": "Multiple errors in ContactInfo data",
    "target": "ContactInfo",
    "details": [
      {
        "code": "NullValue",
        "target": "PhoneNumber",
        "message": "Phone number must not be null"
      },
      {
        "code": "NullValue",
        "target": "LastName",
        "message": "Last name must not be null"
      },
      {
        "code": "MalformedValue",
        "target": "Address",
        "message": "Address is not valid"
      }
    ]
  }
}
```

### 1.3.4. 错误代码

以下列出基本的错误代码，客户端应做好处理其中任意一项的准备。

| 错误代码            | 说明                                             |
| ------------------- | ------------------------------------------------ |
| Unauthorized        | 客户端未经授权。                                 |
| AccessDenied        | 客户端没有执行该操作的权限。                     |
| InvalidRequest      | 请求格式有误或不正确。                           |
| NotFound            | 所请求的资源不存在。                             |
| InternalServerError | 处理请求时出现服务端内部错误。                   |
| ServiceUnavailable  | 该服务暂时不可用。可以过段时间之后再重复该请求。 |
| GeneralException    | 发生未指定错误。                                 |

## 1.4. 身份验证

所有的 API 会对每个请求进行身份验证，客户端需要在 HTTP 请求标头中携带凭证以表明身份。格式如下：

```
Authorization: SecretId={密钥标识}, Timestamp={签名时间}, Signature={签名串}
```

请向管理员索要您的 SecretId 和 SecretKey，用于生成签名串（Signature）。生成方式为：

```
Signature = Base64( HMAC_SHA1( SecretKey, SecretId + Timestamp + Path + Query + Body ) )
```

其中：

- Base64：一种二进制数据编码方式，参阅 [RFC 4648](https://www.rfc-editor.org/rfc/rfc4648) 标准文件。
- HMAC_SHA1：一种加密算法，参阅 [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104) 标准文件。
- SecretKey：由管理员分配的密钥，请妥善保管避免泄漏。
- SecretId：由管理员分配的密钥标识。
- Timestamp：发起请求之时的秒级时间戳。
- Path：请求路径。
- Query：对所有 HTTP Query 参数按参数名的字典序（ASCII 码）升序排序，然后使用 “=” 连接参数名和参数值，再使用 “&” 连接每个键值对得到 Query 串。若没有 HTTP Query 参数则使用空字符串。
- Body：最终用于发送到服务端的数据体，JSON 字符串格式。若没有则使用空字符串。

以下是示例：

```
// 假设：
SecretId = "a867f464-55ea-4004-af53-0c8b025e7dc2"
SecretKey = "uKB^9C$@o6rbEDQKHHk01388lG@odVxJ"
Timestamp = "1659917288"
Path = "/v1.0/entities"
Query = "?size=10&offset=0"
Body = ""

// 计算出的签名串为：
Signature = ""
```

## 1.5. 其他细节

空值的字段会使用 `null` 值，而不是被省略。

所有时间值都以 UTC 时间（ISO 8601）格式返回：`YYYY-MM-DDTHH:MM:SSZ`。
