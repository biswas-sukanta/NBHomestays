# BookingControllerApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createBooking**](#createbooking) | **POST** /api/bookings | |
|[**getMyBookings**](#getmybookings) | **GET** /api/bookings/my-bookings | |

# **createBooking**
> Response createBooking(request)


### Example

```typescript
import {
    BookingControllerApi,
    Configuration,
    Request
} from './api';

const configuration = new Configuration();
const apiInstance = new BookingControllerApi(configuration);

let request: Request; //

const { status, data } = await apiInstance.createBooking(
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

# **getMyBookings**
> Array<Response> getMyBookings()


### Example

```typescript
import {
    BookingControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new BookingControllerApi(configuration);

const { status, data } = await apiInstance.getMyBookings();
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

