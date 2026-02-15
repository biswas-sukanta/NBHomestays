# Homestay


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**owner** | [**User**](User.md) |  | [optional] [default to undefined]
**pricePerNight** | **number** |  | [optional] [default to undefined]
**latitude** | **number** |  | [optional] [default to undefined]
**longitude** | **number** |  | [optional] [default to undefined]
**address** | **string** |  | [optional] [default to undefined]
**amenities** | **{ [key: string]: boolean; }** |  | [optional] [default to undefined]
**photoUrls** | **Array&lt;string&gt;** |  | [optional] [default to undefined]
**vibeScore** | **number** |  | [optional] [default to undefined]
**status** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { Homestay } from './api';

const instance: Homestay = {
    id,
    name,
    description,
    owner,
    pricePerNight,
    latitude,
    longitude,
    address,
    amenities,
    photoUrls,
    vibeScore,
    status,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
