# HomestayControllerApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**approveHomestay**](#approvehomestay) | **PUT** /api/homestays/{id}/approve | |
|[**createHomestay**](#createhomestay) | **POST** /api/homestays | |
|[**deleteHomestay**](#deletehomestay) | **DELETE** /api/homestays/{id} | |
|[**getHomestay**](#gethomestay) | **GET** /api/homestays/{id} | |
|[**getMyListings**](#getmylistings) | **GET** /api/homestays/my-listings | |
|[**getPendingHomestays**](#getpendinghomestays) | **GET** /api/homestays/pending | |
|[**rejectHomestay**](#rejecthomestay) | **PUT** /api/homestays/{id}/reject | |
|[**search**](#search) | **GET** /api/homestays/search | |
|[**updateHomestay**](#updatehomestay) | **PUT** /api/homestays/{id} | |

# **approveHomestay**
> approveHomestay()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.approveHomestay(
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

# **createHomestay**
> Response createHomestay(request)


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let request: Request; //

const { status, data } = await apiInstance.createHomestay(
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

# **deleteHomestay**
> deleteHomestay()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.deleteHomestay(
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

# **getHomestay**
> Response getHomestay()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.getHomestay(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Response**

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

# **getMyListings**
> Array<Response> getMyListings()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

const { status, data } = await apiInstance.getMyListings();
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

# **getPendingHomestays**
> Array<Response> getPendingHomestays()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

const { status, data } = await apiInstance.getPendingHomestays();
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

# **rejectHomestay**
> rejectHomestay()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.rejectHomestay(
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

# **search**
> Array<Response> search()


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let q: string; // (optional) (default to undefined)
let minPrice: number; // (optional) (default to undefined)
let maxPrice: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.search(
    q,
    minPrice,
    maxPrice
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **q** | [**string**] |  | (optional) defaults to undefined|
| **minPrice** | [**number**] |  | (optional) defaults to undefined|
| **maxPrice** | [**number**] |  | (optional) defaults to undefined|


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

# **updateHomestay**
> Response updateHomestay(request)


### Example

```typescript
import {
    HomestayControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new HomestayControllerApi(configuration);

let id: string; // (default to undefined)
let request: Request; //

const { status, data } = await apiInstance.updateHomestay(
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

