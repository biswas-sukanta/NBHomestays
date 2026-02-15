# ReviewControllerApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addReview**](#addreview) | **POST** /api/reviews | |
|[**getReviews**](#getreviews) | **GET** /api/reviews/homestay/{homestayId} | |

# **addReview**
> Response addReview(request)


### Example

```typescript
import {
    ReviewControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new ReviewControllerApi(configuration);

let request: Request; //

const { status, data } = await apiInstance.addReview(
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

# **getReviews**
> Array<Response> getReviews()


### Example

```typescript
import {
    ReviewControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReviewControllerApi(configuration);

let homestayId: string; // (default to undefined)

const { status, data } = await apiInstance.getReviews(
    homestayId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **homestayId** | [**string**] |  | defaults to undefined|


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

