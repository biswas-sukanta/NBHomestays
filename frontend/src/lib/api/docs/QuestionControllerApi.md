# QuestionControllerApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**answerQuestion**](#answerquestion) | **PUT** /api/questions/{id}/answer | |
|[**askQuestion**](#askquestion) | **POST** /api/homestays/{id}/ask | |
|[**getQuestions**](#getquestions) | **GET** /api/homestays/{id}/questions | |

# **answerQuestion**
> Question answerQuestion(questionRequest)


### Example

```typescript
import {
    QuestionControllerApi,
    Configuration,
    QuestionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new QuestionControllerApi(configuration);

let id: string; // (default to undefined)
let questionRequest: QuestionRequest; //

const { status, data } = await apiInstance.answerQuestion(
    id,
    questionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **questionRequest** | **QuestionRequest**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Question**

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

# **askQuestion**
> Question askQuestion(questionRequest)


### Example

```typescript
import {
    QuestionControllerApi,
    Configuration,
    QuestionRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new QuestionControllerApi(configuration);

let id: string; // (default to undefined)
let questionRequest: QuestionRequest; //

const { status, data } = await apiInstance.askQuestion(
    id,
    questionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **questionRequest** | **QuestionRequest**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Question**

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

# **getQuestions**
> Array<Question> getQuestions()


### Example

```typescript
import {
    QuestionControllerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new QuestionControllerApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.getQuestions(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Array<Question>**

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

