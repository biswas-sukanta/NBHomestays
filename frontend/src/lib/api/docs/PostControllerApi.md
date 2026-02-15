# PostControllerApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createPost**](#createpost) | **POST** /api/posts | |
|[**deletePost**](#deletepost) | **DELETE** /api/posts/{id} | |
|[**getAllPosts**](#getallposts) | **GET** /api/posts | |
|[**getMyPosts**](#getmyposts) | **GET** /api/posts/my-posts | |
|[**searchPosts**](#searchposts) | **GET** /api/posts/search | |
|[**updatePost**](#updatepost) | **PUT** /api/posts/{id} | |

# **createPost**
> Response createPost(request)


### Example

```typescript
import {
    PostControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

let request: Request; //

const { status, data } = await apiInstance.createPost(
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **Request**|  | |


### Return type

**Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePost**
> deletePost()


### Example

```typescript
import {
    PostControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.deletePost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllPosts**
> Array<Response> getAllPosts()


### Example

```typescript
import {
    PostControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

const { status, data } = await apiInstance.getAllPosts();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Response>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMyPosts**
> Array<Response> getMyPosts()


### Example

```typescript
import {
    PostControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

const { status, data } = await apiInstance.getMyPosts();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Response>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPosts**
> Array<Response> searchPosts()


### Example

```typescript
import {
    PostControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

let q: string; // (optional) (default to '')

const { status, data } = await apiInstance.searchPosts(
    q
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **q** | [**string**] |  | (optional) defaults to ''|


### Return type

**Array<Response>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePost**
> Response updatePost(request)


### Example

```typescript
import {
    PostControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new PostControllerApi(configuration);

let id: string; // (default to undefined)
let request: Request; //

const { status, data } = await apiInstance.updatePost(
    id,
    request
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **request** | **Request**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

