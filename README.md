# @handy-common-utils/aws-utils

AWS related utilities that are compatible with both AWS Javascript SDK v3 and v2, and also some utilities that require v3.

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

S3 related utility functions can be imported and used in this way:

```javascript
import { decodeS3ObjectKey, deleteS3ObjectSilently } from '@handy-common-utils/aws-utils/s3';

const srcEncodedKey = record.s3.object.key;
const srcKey = decodeS3ObjectKey(srcEncodedKey);
const destKey = srcKey.replace('/src-dir/', '/dest-dir/')

const s3 = new S3Client();
await copyS3Object(s3, bucket, srcEncodedKey, destKey);
await deleteS3ObjectSilently(s3, bucket, srcKey);
```

To use S3 related utilities, you need to add `@aws-sdk/client-s3` as a dependency of your project
because it is not included as a dependency of this package.

# API

<!-- API start -->
<a name="readmemd"></a>

## @handy-common-utils/aws-utils

### Modules

- [aws-utils](#modulesaws_utilsmd)
- [s3](#moduless3md)

## Classes


<a name="classesaws_utilsawsutilsmd"></a>

### Class: AwsUtils

[aws-utils](#modulesaws_utilsmd).AwsUtils

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

▸ `Static` **fetchAllByExclusiveStartKey**\<`T`, `K`\>(`fetchItemsByExclusiveStartKey`, `itemsFieldName?`): `Promise`\<`T`[]\>

Fetch all items through repeatedly calling API with ExclusiveStartKey/LastEvaluatedKey based pagination.
This function is useful for client side pagination when the response from AWS API contains LastEvaluatedKey and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `K` | \{ `[key: string]`: `any`;  } | - |

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `fetchItemsByExclusiveStartKey` | `FetchItemsFunction`\<\{ `ExclusiveStartKey?`: `K`  }, \{ `LastEvaluatedKey?`: `K`  }\> | `undefined` | the function for fetching one batch/page of items by ExclusiveStartKey |
| `itemsFieldName` | `string` | `'Items'` | name of the field containing returned items in AWS API response, the default value is 'Items' |

###### Returns

`Promise`\<`T`[]\>

all items fetched

**`Example`**

```ts
const allItemsInDynamoDbTable = await AwsUtils.fetchAllByExclusiveStartKey<MyTableItem>(
  pagingParam => dynamoDbDocumentClient.scan({...pagingParam, TableName: 'my-table', limit: 20}).promise(),
);
```

___

##### fetchAllByMarker

▸ `Static` **fetchAllByMarker**\<`T`, `M`\>(`fetchItemsByMarker`, `itemsFieldName`): `Promise`\<`T`[]\>

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
| `fetchItemsByMarker` | `FetchItemsFunction`\<\{ `Marker?`: `M`  }, \{ `NextMarker?`: `M`  }\> | the function for fetching one batch/page of items by Marker |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |

###### Returns

`Promise`\<`T`[]\>

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

▸ `Static` **fetchAllByNextToken**\<`T`, `K`\>(`fetchItemsByNextToken`, `itemsFieldName`): `Promise`\<`T`[]\>

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
| `fetchItemsByNextToken` | `FetchItemsFunction`\<\{ `NextToken?`: `K`  }, \{ `NextToken?`: `K`  }\> | the function for fetching one batch/page of items by NextToken |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |

###### Returns

`Promise`\<`T`[]\>

all items fetched

**`Example`**

```ts
const topics = await AwsUtils.fetchAllByNextToken<SNS.Topic>(
  pagingParam => sns.listTopics({...pagingParam}).promise(),
  'Topics',
);
```

___

##### fetchAllByNextTokenV3

▸ `Static` **fetchAllByNextTokenV3**\<`T`, `K`\>(`fetchItemsByNextToken`, `itemsFieldName`): `Promise`\<`T`[]\>

Fetch all items through repeatedly calling API with nextToken based pagination which is used in aws-sdk v3.
This function is useful for client side pagination when the response from AWS API contains nextToken and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `K` | `string` | - |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fetchItemsByNextToken` | `FetchItemsFunction`\<\{ `nextToken?`: `K`  }, \{ `nextToken?`: `K`  }\> | the function for fetching one batch/page of items by nextToken |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |

###### Returns

`Promise`\<`T`[]\>

all items fetched

**`Example`**

```ts
const executions = await AwsUtils.fetchAllByNextTokenV3<ExecutionListItem>(
  (pagingParam) => this.client.send(new ListExecutionsCommand({
    stateMachineArn,
    statusFilter: status,
    ...pagingParam,
  })),
  'executions',
);
```

___

##### fetchAllByPosition

▸ `Static` **fetchAllByPosition**\<`T`, `P`\>(`fetchItemsByPosition`, `itemsFieldName?`): `Promise`\<`T`[]\>

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
| `fetchItemsByPosition` | `FetchItemsFunction`\<\{ `position?`: `P`  }, \{ `position?`: `P`  }\> | `undefined` | the function for fetching one batch/page of items by position |
| `itemsFieldName` | `string` | `'items'` | name of the field containing returned items in AWS API response, default value is 'items' |

###### Returns

`Promise`\<`T`[]\>

all items fetched

**`Example`**

```ts
const domainNameObjects = await AwsUtils.fetchingAllByPosition(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
);
```

___

##### fetchAllWithPagination

▸ `Static` **fetchAllWithPagination**\<`IT`, `RT`, `IFN`, `PFN`, `PFT`\>(`fetchOnePageOfItems`, `itemsFieldName`, `paginationFieldName`, `shouldFetchNextPage?`): `Promise`\<`Exclude`\<`RT`[`IFN`], `undefined`\>\>

Fetch all items through repeatedly calling pagination based API.
This function is useful for client side pagination when the calling AWS API.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `IT` | `IT` | type of the items returned by AWS API |
| `RT` | extends `Record`\<`IFN`, `undefined` \| `IT`[]\> & `Partial`\<`Record`\<`PFN`, `PFT`\>\> | type of the response returned by AWS API |
| `IFN` | extends `string` | name of the field containing returned items in AWS API response |
| `PFN` | extends `string` | name of the field containing the pagination token in AWS API response, such like "ExclusiveStartKey", "Marker", "NextToken", "nextToken" |
| `PFT` | `string` | type of the pagination token in AWS API response, usually it is string |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fetchOnePageOfItems` | `FetchItemsFunction`\<`Partial`\<`Record`\<`PFN`, `PFT`\>\>, `RT`\> | the function for fetching one batch/page of items by nextToken |
| `itemsFieldName` | `IFN` | name of the field containing returned items in AWS API response |
| `paginationFieldName` | `PFN` | name of the field containing the pagination token in AWS API response, such like "ExclusiveStartKey", "Marker", "NextToken", "nextToken" |
| `shouldFetchNextPage?` | (`response`: `RT`) => `boolean` | a function to determine if the fetch should continue, the default value is always true and will continue fetching items until the response does not contain nextToken field. |

###### Returns

`Promise`\<`Exclude`\<`RT`[`IFN`], `undefined`\>\>

all items fetched

**`Example`**

```ts
const executions = await AwsUtils.fetchAllWithPagination(
  (pagingParam) => this.client.send(new ListExecutionsCommand({
    stateMachineArn,
    statusFilter: status,
    ...pagingParam,
  })),
  'executions',
  'nextToken',
  (resp) => resp.executions != null && resp.executions.some((exe) => exe.startDate!.getTime() <= beginTime),
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

▸ `Static` **parseArn**(`arn`): `undefined` \| ``null`` \| `Arn` & \{ `arn`: `string`  }

Parse ARN

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `arn` | `undefined` \| ``null`` \| `string` | the ARN string that could be null or undefined |

###### Returns

`undefined` \| ``null`` \| `Arn` & \{ `arn`: `string`  }

null or undefined if the input is null or undefined, or parsed ARN including the original ARN string

___

##### promiseWithRetry

▸ `Static` **promiseWithRetry**\<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`\<`Result`\>

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
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `WithPromiseFunction`\<`Result`\> | the AWS operation that returns a Request, such like `() => apig.getBasePathMappings({ domainName, limit: 500 })` |
| `backoff?` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them. If retry is desired, before making next call to the operation the desired backoff period would be waited. If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation. The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff, so the first retry is the second attempt. If omitted or undefined, a default backoff array will be used. In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes?` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If omitted or undefined, only 429 status code would result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

###### Returns

`Promise`\<`Result`\>

result came out from the last attempt

___

##### withRetry

▸ `Static` **withRetry**\<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`\<`Result`\>

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
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`\<`Result`\> | the AWS operation that returns a Promise, such like `() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()` |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them. If retry is desired, before making next call to the operation the desired backoff period would be waited. If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number, there would be no further call to the operation. The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff, so the first retry is the second attempt. If omitted or undefined, a default backoff array will be used. In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If omitted or undefined, only 429 status code would result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

###### Returns

`Promise`\<`Result`\>

result came out from the last attempt

**`See`**

promiseWithRetry

## Modules


<a name="modulesaws_utilsmd"></a>

### Module: aws-utils

#### Re-exports

##### Functions

- [fetchAllByNextToken = AwsUtils.fetchAllByNextToken](#fetchAllByNextToken)
- [fetchAllByNextTokenV3 = AwsUtils.fetchAllByNextTokenV3](#fetchAllByNextTokenV3)
- [fetchAllWithPagination = AwsUtils.fetchAllWithPagination](#fetchAllWithPagination)
- [fetchAllByMarker = AwsUtils.fetchAllByMarker](#fetchAllByMarker)
- [fetchAllByExclusiveStartKey = AwsUtils.fetchAllByExclusiveStartKey](#fetchAllByExclusiveStartKey)
- [withRetry = AwsUtils.withRetry](#withRetry)
- [promiseWithRetry = AwsUtils.promiseWithRetry](#promiseWithRetry)
- [fibonacciRetryConfigurationOptions = AwsUtils.fibonacciRetryConfigurationOptions](#fibonacciRetryConfigurationOptions)
- [parseArn = AwsUtils.parseArn](#parseArn)
- [dynamodbLocalClientOptions = AwsUtils.dynamodbLocalClientOptions](#dynamodbLocalClientOptions)

#### Exports

#### Classes

- [AwsUtils](#classesaws_utilsawsutilsmd)

#### Type Aliases

##### PossibleAwsError

Ƭ **PossibleAwsError**: `Object`

An error that is possibly generated by AWS SDK v2 or v3

###### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `$metadata?` | \{ `httpStatusCode`: `number`  } | v3 $metadata |
| `$metadata.httpStatusCode` | `number` | - |
| `$retryable?` | \{ `throttling`: `boolean`  } | v3 $retryable |
| `$retryable.throttling` | `boolean` | - |
| `code?` | `string` | v2 code |
| `message` | `string` | - |
| `name?` | `string` | v3 name |
| `retryDelay?` | `number` | v2 retryDelay |
| `retryable?` | `boolean` | v2 retryable |
| `statusCode?` | `number` | v2 statusCode |

#### Variables

##### FIBONACCI\_SEQUENCE\_BACKOFFS

• `Const` **FIBONACCI\_SEQUENCE\_BACKOFFS**: `number`[]


<a name="moduless3md"></a>

### Module: s3

#### Functions

##### copyS3Object

▸ **copyS3Object**(`s3`, `srcBucket`, `srcEncodedKey`, `destDecodedKey`, `metadata?`, `destBucket?`): `Promise`\<`CopyObjectCommandOutput`\>

Copy S3 object

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `srcBucket` | `string` | bucket of the source object |
| `srcEncodedKey` | `string` | key (URL encoded) of the source object |
| `destDecodedKey` | `string` | key (NOT URL encoded) of the destination object |
| `metadata?` | `Record`\<`string`, `string`\> | metadata to be set on the destination object, if it is not specified then the metadata from source object will be copied |
| `destBucket?` | `string` | bucket of the destination object, if it is not specified then the source bucket will be used |

###### Returns

`Promise`\<`CopyObjectCommandOutput`\>

S3 command output

___

##### decodeS3ObjectKey

▸ **decodeS3ObjectKey**(`key`): `string`

Decode the raw object key which is URL encoded and could contain "+" as replacement of " "

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The raw S3 object key which is URL encoded |

###### Returns

`string`

Decoded key

___

##### deleteS3Object

▸ **deleteS3Object**(`s3`, `bucket`, `key`): `Promise`\<`DeleteObjectCommandOutput`\>

Delete an existing S3 object

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket name |
| `key` | `string` | object key (without URL encoding) |

###### Returns

`Promise`\<`DeleteObjectCommandOutput`\>

S3 command output

___

##### deleteS3ObjectSilently

▸ **deleteS3ObjectSilently**(`s3`, `bucket`, `key`): `Promise`\<`void`\>

Delete an S3 object, and does not throw an error if the object does not already exist.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket name |
| `key` | `string` | object key (without URL encoding) |

###### Returns

`Promise`\<`void`\>

void

___

##### encodeS3ObjectKey

▸ **encodeS3ObjectKey**(`key`): `string`

URL encode the object key, and also replace "%20" with " " and "%2F with "/" which is the convention of AWS

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | The S3 object key before encoding |

###### Returns

`string`

URL encoded object key

___

##### getS3ObjectContentByteArray

▸ **getS3ObjectContentByteArray**(`s3`, `bucket`, `key`, `range?`): `Promise`\<`Uint8Array`\>

Get the content of the S3 object as a string.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket of the source object |
| `key` | `string` | object key (without URL encoding) |
| `range?` | `string` | See https://www.rfc-editor.org/rfc/rfc9110.html#name-range |

###### Returns

`Promise`\<`Uint8Array`\>

Content of the S3 object as a string. If the object does not have content, an empty string will be returned.

___

##### getS3ObjectContentString

▸ **getS3ObjectContentString**(`s3`, `bucket`, `key`, `encoding?`): `Promise`\<`string`\>

Get the content of the S3 object as a string.

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `s3` | `S3Client` | `undefined` | S3Client |
| `bucket` | `string` | `undefined` | bucket of the source object |
| `key` | `string` | `undefined` | object key (without URL encoding) |
| `encoding` | `string` | `'utf8'` | Text encoding of the content, if not specified then "utf8" will be used |

###### Returns

`Promise`\<`string`\>

Content of the S3 object as a string. If the object does not have content, an empty string will be returned.

___

##### headS3Object

▸ **headS3Object**(`s3`, `bucket`, `key`): `Promise`\<`HeadObjectCommandOutput`\>

Get details of the S3 object without downloading its content

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket of the source object |
| `key` | `string` | object key (without URL encoding) |

###### Returns

`Promise`\<`HeadObjectCommandOutput`\>

S3 command output
<!-- API end -->
