# @handy-common-utils/aws-utils

AWS related utilities that are compatible with both AWS Javascript SDK v3 and v2.

[![Version](https://img.shields.io/npm/v/@handy-common-utils/aws-utils.svg)](https://npmjs.org/package/@handy-common-utils/aws-utils)
[![Downloads/week](https://img.shields.io/npm/dw/@handy-common-utils/aws-utils.svg)](https://npmjs.org/package/@handy-common-utils/aws-utils)
[![CI](https://github.com/handy-common-utils/aws-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/handy-common-utils/aws-utils/actions/workflows/ci.yml)


## How to use

First add it as a dependency:

```sh
npm install @handy-common-utils/aws-utils
```

Then you can use it in the code:

```javascript
import { AwsUtils } from '@handy-common-utils/aws-utils';

const domainNameObjects = await AwsUtils.repeatFetchingItemsByPosition(
  pagingParam => apig.getDomainNames({ limit: 100, ...pagingParam }).promise(),
);
```

You can either import and use the [class](#classes) as shown above,
or you can import individual [functions](#variables) directly like below:

```javascript
import { repeatFetchingItemsByNextToken, repeatFetchingItemsByMarker, parseArn } from '@handy-common-utils/aws-utils';
```

# API

<!-- API start -->
<a name="readmemd"></a>

## @handy-common-utils/aws-utils

### Re-exports

#### Functions

- [fetchAllByNextToken = AwsUtils.fetchAllByNextToken](#fetchAllByNextToken)
- [fetchAllByMarker = AwsUtils.fetchAllByMarker](#fetchAllByMarker)
- [fetchAllByExclusiveStartKey = AwsUtils.fetchAllByExclusiveStartKey](#fetchAllByExclusiveStartKey)
- [withRetry = AwsUtils.withRetry](#withRetry)
- [promiseWithRetry = AwsUtils.promiseWithRetry](#promiseWithRetry)
- [fibonacciRetryConfigurationOptions = AwsUtils.fibonacciRetryConfigurationOptions](#fibonacciRetryConfigurationOptions)
- [parseArn = AwsUtils.parseArn](#parseArn)
- [dynamodbLocalClientOptions = AwsUtils.dynamodbLocalClientOptions](#dynamodbLocalClientOptions)

### Exports

### Classes

- [AwsUtils](#classesawsutilsmd)

### Variables

#### FIBONACCI\_SEQUENCE

• `Const` **FIBONACCI\_SEQUENCE**: `number`[]

___

#### FIBONACCI\_SEQUENCE\_BACKOFFS

• `Const` **FIBONACCI\_SEQUENCE\_BACKOFFS**: `number`[]

## Classes


<a name="classesawsutilsmd"></a>

### Class: AwsUtils

#### Constructors

##### constructor

• **new AwsUtils**()

#### Methods

##### dynamodbLocalClientOptions

▸ `Static` **dynamodbLocalClientOptions**(`endpoint?`): `Object`

Build an object that can be passed into `DynamoDB.DocumentClient(...)` for
DynamoDB Local (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `endpoint` | `string` | `'http://localhost:8000'` | if omitted, the endpoint will be 'http://localhost:8000' which is the default |

###### Returns

`Object`

the options object

| Name | Type |
| :------ | :------ |
| `accessKeyId` | `string` |
| `endpoint` | `string` |
| `region` | `string` |
| `secretAccessKey` | `string` |

**`Example`**

```ts
const ddbClient = new DynamoDB.DocumentClient(process.env.IS_OFFLINE === 'true' ? AwsUtils.dynamodbLocalClientOptions() : undefined);
```

___

##### fetchAllByExclusiveStartKey

▸ `Static` **fetchAllByExclusiveStartKey**<`T`, `K`\>(`fetchItemsByExclusiveStartKey`, `itemsFieldName?`): `Promise`<`T`[]\>

Fetch all items through repeatedly calling API with ExclusiveStartKey/LastEvaluatedKey based pagination.
This function is useful for client side pagination when the response from AWS API contains LastEvaluatedKey and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `K` | { `[key: string]`: `any`;  } | - |

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `fetchItemsByExclusiveStartKey` | `FetchItemsFunction`<{ `ExclusiveStartKey?`: `K`  }, { `LastEvaluatedKey?`: `K`  }\> | `undefined` | the function for fetching one batch/page of items by ExclusiveStartKey |
| `itemsFieldName` | `string` | `'Items'` | name of the field containing returned items in AWS API response, the default value is 'Items' |

###### Returns

`Promise`<`T`[]\>

all items fetched

**`Example`**

```ts
const allItemsInDynamoDbTable = await AwsUtils.fetchAllByExclusiveStartKey<MyTableItem>(
  pagingParam => dynamoDbDocumentClient.scan({...pagingParam, TableName: 'my-table', limit: 20}).promise(),
);
```

___

##### fetchAllByMarker

▸ `Static` **fetchAllByMarker**<`T`, `M`\>(`fetchItemsByMarker`, `itemsFieldName`): `Promise`<`T`[]\>

Fetch all items through repeatedly calling API with Marker/NextMarker based pagination.
This function is useful for client side pagination when the response from AWS API contains NextMarker and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `M` | `string` | - |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fetchItemsByMarker` | `FetchItemsFunction`<{ `Marker?`: `M`  }, { `NextMarker?`: `M`  }\> | the function for fetching one batch/page of items by Marker |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |

###### Returns

`Promise`<`T`[]\>

all items fetched

**`Example`**

```ts
const functionConfigurations = await AwsUtils.fetchAllByMarker<Lambda.FunctionConfiguration>(
  pagingParam => withRetry(() => lambda.listFunctions({ ...pagingParam }).promise()),
  'Functions',
);
```

___

##### fetchAllByNextToken

▸ `Static` **fetchAllByNextToken**<`T`, `K`\>(`fetchItemsByNextToken`, `itemsFieldName`): `Promise`<`T`[]\>

Fetch all items through repeatedly calling API with NextToken based pagination.
This function is useful for client side pagination when the response from AWS API contains NextToken and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `K` | `string` | - |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fetchItemsByNextToken` | `FetchItemsFunction`<{ `NextToken?`: `K`  }, { `NextToken?`: `K`  }\> | the function for fetching one batch/page of items by NextToken |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |

###### Returns

`Promise`<`T`[]\>

all items fetched

**`Example`**

```ts
const topics = await AwsUtils.fetchAllByNextToken<SNS.Topic>(
  pagingParam => sns.listTopics({...pagingParam}).promise(),
  'Topics',
);
```

___

##### fetchAllByPosition

▸ `Static` **fetchAllByPosition**<`T`, `P`\>(`fetchItemsByPosition`, `itemsFieldName?`): `Promise`<`T`[]\>

Fetch all items through repeatedly calling API with position based pagination.
This function is useful for client side pagination when the response from AWS API contains position and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `P` | `string` | - |

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `fetchItemsByPosition` | `FetchItemsFunction`<{ `position?`: `P`  }, { `position?`: `P`  }\> | `undefined` | the function for fetching one batch/page of items by position |
| `itemsFieldName` | `string` | `'items'` | name of the field containing returned items in AWS API response, default value is 'items' |

###### Returns

`Promise`<`T`[]\>

all items fetched

**`Example`**

```ts
const domainNameObjects = await AwsUtils.fetchingAllByPosition(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
);
```

___

##### fibonacciRetryConfigurationOptions

▸ `Static` **fibonacciRetryConfigurationOptions**(`maxRetries`, `base?`): `PartialConfigurationOptions`

Generate part of a ConfigurationOptions object having maxRetries as specified and a custom RetryDelayOptions for fibonacci sequence based retry delays.

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `maxRetries` | `number` | `undefined` | The maximum amount of retries to perform for a service request. |
| `base` | `number` | `100` | The base number of milliseconds to use in the fibonacci backoff for operation retries. Defaults to 100 ms. |

###### Returns

`PartialConfigurationOptions`

part of a ConfigurationOptions object that has maxRetries as specified and a customBackoff utilising fibonacci sequence for calculating delays

___

##### parseArn

▸ `Static` **parseArn**(`arn`): `undefined` \| ``null`` \| `Arn` & { `arn`: `string`  }

Parse ARN

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `arn` | `undefined` \| ``null`` \| `string` | the ARN string that could be null or undefined |

###### Returns

`undefined` \| ``null`` \| `Arn` & { `arn`: `string`  }

null or undeinfed if the input is null or undefined, or parsed ARN including the original ARN string

___

##### promiseWithRetry

▸ `Static` **promiseWithRetry**<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`<`Result`\>

Perform an AWS operation (returning a Request) with retry.
The retry could happen only if the error coming from AWS has property `retryable`/`$retryable` equals to true.
If you don't want `retryable`/`$retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | `Result` |
| `TError` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `WithPromiseFunction`<`Result`\> | the AWS operation that returns a Request, such like `() => apig.getBasePathMappings({ domainName, limit: 500 })` |
| `backoff?` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them. If retry is desired, before making next call to the operation the desired backoff period would be waited. If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation. The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff, so the first retry is the second attempt. If ommitted or undefined, a default backoff array will be used. In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes?` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If ommitted or undefined, only 429 status code would result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

###### Returns

`Promise`<`Result`\>

result came out from the last attempt

___

##### withRetry

▸ `Static` **withRetry**<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`<`Result`\>

Usually you would find `promiseWithRetry(...)` more convenient.

Perform an AWS operation (returning a Promise) with retry.
The retry could happen only if the error coming from AWS has property `retryable`/`$retryable` equals to true.
If you don't want `retryable`/`$retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | `Result` |
| `TError` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`<`Result`\> | the AWS operation that returns a Promise, such like `() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()` |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them. If retry is desired, before making next call to the operation the desired backoff period would be waited. If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number, there would be no further call to the operation. The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff, so the first retry is the second attempt. If ommitted or undefined, a default backoff array will be used. In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If ommitted or undefined, only 429 status code would result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

###### Returns

`Promise`<`Result`\>

result came out from the last attempt

**`See`**

promiseWithRetry
<!-- API end -->
