# @handy-common-utils/aws-utils

AWS related utilities that are compatible with both AWS Javascript SDK v3 and v2, and also some utilities that require v3.

[![Version](https://img.shields.io/npm/v/@handy-common-utils/aws-utils.svg)](https://npmjs.org/package/@handy-common-utils/aws-utils)
[![Downloads/week](https://img.shields.io/npm/dw/@handy-common-utils/aws-utils.svg)](https://npmjs.org/package/@handy-common-utils/aws-utils)
[![CI](https://github.com/handy-common-utils/aws-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/handy-common-utils/aws-utils/actions/workflows/ci.yml)


## How to use

### Core

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

### S3

S3 related utility functions can be imported and used in this way:

```javascript
import { S3Client } from '@aws-sdk/client-s3';
import { decodeS3ObjectKey, deleteS3Object } from '@handy-common-utils/aws-utils/s3';

const srcEncodedKey = record.s3.object.key;
const srcKey = decodeS3ObjectKey(srcEncodedKey);
const destKey = srcKey.replace('/src-dir/', '/dest-dir/')

const s3 = new S3Client();
await copyS3Object(s3, bucket, srcEncodedKey, destKey);
await deleteS3Object(s3, bucket, srcKey);
```

To use S3 related utilities, you need to add `@aws-sdk/client-s3` as a dependency of your project
because it is not included as a dependency of this package.

For uploading content to S3, there are two functions available.
`putS3Object(...)` is simpler but can't handle stream content with unknown length.
`uploadS3Object(...)` can handle stream content and supports concurrent uploading.

If you need `uploadS3Object(...)`, remember to also add `@aws-sdk/lib-storage` as a dependency of your project.

### SSM

SSM related utility functions can be imported and used in this way:

```javascript
import { SSM } from '@aws-sdk/client-ssm';
import { getSsmParameter, getSsmParameterParsed } from '@handy-common-utils/aws-utils/ssm';

const ssm = new SSM();
const workDir = await getSsmParameter(ssm, '/my-config/work-dir', '/tmp');
const config = await getSsmParameterParsed<Config>(ssm, '/my-config/config');
```

To use SSM related utilities, you need to add `@aws-sdk/client-ssm` as a dependency of your project
because it is not included as a dependency of this package.

# API

<!-- API start -->
<a name="readmemd"></a>

## @handy-common-utils/aws-utils

### Modules

- [aws-utils](#modulesaws_utilsmd)
- [s3](#moduless3md)
- [ssm](#modulesssmmd)

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

##### fetchAllByContinuationToken

▸ `Static` **fetchAllByContinuationToken**\<`T`, `M`\>(`fetchItemsByContinuationToken`, `itemsFieldName?`, `filterFunc?`): `Promise`\<`T`[]\>

Fetch all items through repeatedly calling API with ContinuationToken/NextContinuationToken based pagination.
This function is useful for client side pagination when the response from AWS API contains NextContinuationToken and items fields.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `T` | `T` | type of the items returned by AWS API |
| `M` | `string` | - |

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `fetchItemsByContinuationToken` | `FetchItemsFunction`\<\{ `ContinuationToken?`: `M`  }, \{ `NextContinuationToken?`: `M`  }\> | `undefined` | the function for fetching one batch/page of items by ContinuationToken |
| `itemsFieldName` | `string` | `'Contents'` | name of the field containing returned items in AWS API response |
| `filterFunc?` | (`entry`: `T`) => `boolean` | `undefined` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

###### Returns

`Promise`\<`T`[]\>

all items fetched

**`Example`**

```ts
const objects = await fetchAllByContinuationToken(() => s3.send(new ListObjectsV2Command({Bucket: bucket})));
```

___

##### fetchAllByExclusiveStartKey

▸ `Static` **fetchAllByExclusiveStartKey**\<`T`, `K`\>(`fetchItemsByExclusiveStartKey`, `itemsFieldName?`, `filterFunc?`): `Promise`\<`T`[]\>

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
| `filterFunc?` | (`entry`: `T`) => `boolean` | `undefined` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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

▸ `Static` **fetchAllByMarker**\<`T`, `M`\>(`fetchItemsByMarker`, `itemsFieldName`, `filterFunc?`): `Promise`\<`T`[]\>

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
| `filterFunc?` | (`entry`: `T`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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

▸ `Static` **fetchAllByNextToken**\<`T`, `K`\>(`fetchItemsByNextToken`, `itemsFieldName`, `filterFunc?`): `Promise`\<`T`[]\>

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
| `filterFunc?` | (`entry`: `T`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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

▸ `Static` **fetchAllByNextTokenV3**\<`T`, `K`\>(`fetchItemsByNextToken`, `itemsFieldName`, `filterFunc?`): `Promise`\<`T`[]\>

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
| `filterFunc?` | (`entry`: `T`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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

▸ `Static` **fetchAllByPosition**\<`T`, `P`\>(`fetchItemsByPosition`, `itemsFieldName?`, `filterFunc?`): `Promise`\<`T`[]\>

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
| `filterFunc?` | (`entry`: `T`) => `boolean` | `undefined` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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

▸ `Static` **fetchAllWithPagination**\<`IT`, `RT`, `IFN`, `PFN`, `PFT`\>(`fetchOnePageOfItems`, `itemsFieldName`, `paginationFieldName`, `shouldFetchNextPage?`, `filterFunc?`): `Promise`\<`Exclude`\<`RT`[`IFN`], `undefined`\>\>

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
| `filterFunc?` | (`entry`: `IT`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested items in a huge number of entries, utilising this function can avoid keeping too many useless array entries in memory. |

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
This function is quite handy when you are using AWS SDK v2.
If you are using AWS SDK v3, use `withRetry(...)` instead.

The retry would happen when the error coming from AWS indicates HTTP status code 429, and
has property `retryable`/`$retryable.throttling` equals to true
or property `name`/`code` equals to "ThrottlingException".
If you want to customise the retry logic, use `PromiseUtils.withRetry(...)` directly.

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
| `statusCodes?` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If omitted or undefined, only 429 status code could result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

###### Returns

`Promise`\<`Result`\>

result came out from the last attempt

___

##### withRetry

▸ `Static` **withRetry**\<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`\<`Result`\>

Perform an AWS operation (returning a Promise) with retry.
This function is quite handy when you are using AWS SDK v3.
If you are using AWS SDK v2, `promiseWithRetry(...)` could be more convenient.

The retry would happen when the error coming from AWS indicates HTTP status code 429, and
has property `retryable`/`$retryable.throttling` equals to true
or property `name`/`code` equals to "ThrottlingException".
If you want to customise the retry logic, use `PromiseUtils.withRetry(...)` directly.

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
| `statusCodes` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done. If omitted or undefined, only 429 status code could result in a retry. If it is null, status code would not be looked into. If it is an empty array, retry would never happen. |

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

Ƭ **PossibleAwsError**: [`PossibleAwsV2Error`](#possibleawsv2error) \| [`PossibleAwsV3Error`](#possibleawsv3error)

___

##### PossibleAwsV2Error

Ƭ **PossibleAwsV2Error**: `Error` & \{ `cfId?`: `string` ; `code`: `string` ; `extendedRequestId?`: `string` ; `hostname?`: `string` ; `message`: `string` ; `originalError?`: `Error` ; `region?`: `string` ; `requestId?`: `string` ; `retryDelay?`: `number` ; `retryable?`: `boolean` ; `statusCode?`: `number` ; `time`: `Date`  }

Possibly an error thrown from by AWS SDK v2, about a service or networking error.

___

##### PossibleAwsV3Error

Ƭ **PossibleAwsV3Error**: `Error` & \{ `$fault`: ``"client"`` \| ``"server"`` ; `$metadata`: \{ `httpStatusCode`: `number`  } ; `$retryable?`: \{ `throttling?`: `boolean`  }  }

Possibly an error thrown from by AWS SDK v3

#### Variables

##### FIBONACCI\_SEQUENCE\_BACKOFFS

• `Const` **FIBONACCI\_SEQUENCE\_BACKOFFS**: `number`[]

#### Functions

##### awsErrorRetryable

▸ **awsErrorRetryable**(`error`): `boolean`

Check whether the error thrown from AWS SDK v2 or v3 is retryable.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | [`PossibleAwsError`](#possibleawserror) | AWS error |

###### Returns

`boolean`

true of retryable

___

##### awsErrorStatusCode

▸ **awsErrorStatusCode**(`error`): `number` \| `undefined`

Get the status code of the error thrown from AWS SDK v2 or v3.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | [`PossibleAwsError`](#possibleawserror) | AWS error |

###### Returns

`number` \| `undefined`

status code

___

##### isPossibleAwsError

▸ **isPossibleAwsError**(`error`): error is PossibleAwsError

Check whether it could be an error thrown from AWS SDK v2 or v3.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | to be checked |

###### Returns

error is PossibleAwsError

true if it could be an error thrown from AWS SDK v2 or v3

___

##### isPossibleAwsThrottlingError

▸ **isPossibleAwsThrottlingError**(`error`): error is PossibleAwsError

Check whether the error thrown from AWS SDK v2 or v3 is a throttling error.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | AWS error |

###### Returns

error is PossibleAwsError

true if it is a throttling error

___

##### isPossibleAwsV2Error

▸ **isPossibleAwsV2Error**(`error`): error is PossibleAwsV2Error

Check whether it could be an error thrown from AWS SDK v2.
Normally you should use `isPossibleAwsError(...)` function instead for best compatibility.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | to be checked |

###### Returns

error is PossibleAwsV2Error

true if it could be an error thrown from AWS SDK v2

___

##### isPossibleAwsV3Error

▸ **isPossibleAwsV3Error**(`error`): error is PossibleAwsV3Error

Check whether it could be an error thrown from AWS SDK v3.
Normally you should use `isPossibleAwsError(...)` function instead for best compatibility.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `any` | to be checked |

###### Returns

error is PossibleAwsV3Error

true if it could be an error thrown from AWS SDK v3


<a name="moduless3md"></a>

### Module: s3

#### Type Aliases

##### S3ObjectSummary

Ƭ **S3ObjectSummary**: `Exclude`\<`ListObjectsV2CommandOutput`[``"Contents"``], `undefined`\>[``0``]

#### Functions

##### copyS3Object

▸ **copyS3Object**(`s3`, `srcBucket`, `srcEncodedKey`, `destDecodedKey`, `metadata?`, `destBucket?`, `options?`): `Promise`\<`CopyObjectCommandOutput`\>

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
| `options?` | `Partial`\<`CopyObjectCommandInput`\> | Additional options for the CopyObjectCommand |

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

▸ **deleteS3Object**(`s3`, `bucket`, `key`, `options?`): `Promise`\<`DeleteObjectCommandOutput`\>

Delete an S3 object. No error would be thrown if the object does not exist.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket name |
| `key` | `string` | object key (without URL encoding) |
| `options?` | `Partial`\<`DeleteObjectCommandInput`\> | Additional options for the DeleteObjectCommand |

###### Returns

`Promise`\<`DeleteObjectCommandOutput`\>

S3 command output

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

##### generatePresignedUrlForDownloading

▸ **generatePresignedUrlForDownloading**(`s3`, `bucket`, `key`, `expiresIn?`, `options?`): `Promise`\<`string`\>

Generate a pre-signed URL for downloading the S3 object

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | Name of the bucket |
| `key` | `string` | Key of the object |
| `expiresIn?` | `number` | The number of seconds before the presigned URL expires |
| `options?` | `Omit`\<`GetObjectCommandInput`, ``"Bucket"`` \| ``"Key"``\> | Additional options. For example, you can specify content-disposition and content-type in it. |

###### Returns

`Promise`\<`string`\>

An URL that can be used to download the S3 object.

___

##### generatePresignedUrlForUploading

▸ **generatePresignedUrlForUploading**(`s3`, `bucket`, `key`, `expiresIn?`, `options?`): `Promise`\<`string`\>

Generate a pre-signed URL for uploading content to the S3 object

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | Name of the bucket |
| `key` | `string` | Key of the object |
| `expiresIn?` | `number` | The number of seconds before the presigned URL expires |
| `options?` | `Omit`\<`PutObjectCommandInput`, ``"Bucket"`` \| ``"Key"``\> | Additional options |

###### Returns

`Promise`\<`string`\>

An URL that can be used to upload content to the S3 object.

___

##### getS3Object

▸ **getS3Object**(`s3`, `bucket`, `key`, `options?`): `Promise`\<`GetObjectCommandOutput` \| `undefined`\>

Get the details (including the content) of the S3 object.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket of the source object |
| `key` | `string` | object key (without URL encoding) |
| `options?` | `Partial`\<`GetObjectCommandInput`\> | Additional options for the GetObjectCommand |

###### Returns

`Promise`\<`GetObjectCommandOutput` \| `undefined`\>

details (including the content) of the S3 object.
If the object does not exist, `undefined` will be returned.

___

##### getS3ObjectContentByteArray

▸ **getS3ObjectContentByteArray**(`s3`, `bucket`, `key`, `range?`, `options?`): `Promise`\<`Uint8Array` \| `undefined`\>

Get the content of the S3 object as a Uint8Array.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | bucket of the source object |
| `key` | `string` | object key (without URL encoding) |
| `range?` | `string` | See https://www.rfc-editor.org/rfc/rfc9110.html#name-range |
| `options?` | `Partial`\<`GetObjectCommandInput`\> | Additional options for the GetObjectCommand |

###### Returns

`Promise`\<`Uint8Array` \| `undefined`\>

Content of the S3 object as a Uint8Array.
If the object does not have content, an empty Uint8Array will be returned.
If the object does not exist, `undefined` will be returned.

___

##### getS3ObjectContentString

▸ **getS3ObjectContentString**(`s3`, `bucket`, `key`, `encoding?`, `options?`): `Promise`\<`string` \| `undefined`\>

Get the content of the S3 object as a string.

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `s3` | `S3Client` | `undefined` | S3Client |
| `bucket` | `string` | `undefined` | bucket of the source object |
| `key` | `string` | `undefined` | object key (without URL encoding) |
| `encoding` | `string` | `'utf8'` | Text encoding of the content, if not specified then "utf8" will be used |
| `options?` | `Partial`\<`GetObjectCommandInput`\> | `undefined` | Additional options for the GetObjectCommand |

###### Returns

`Promise`\<`string` \| `undefined`\>

Content of the S3 object as a string.
If the object does not have content, an empty string will be returned.
If the object does not exist, `undefined` will be returned.

___

##### headS3Object

▸ **headS3Object**(`s3`, `bucket`, `key`, `treat403AsNonExisting?`, `options?`): `Promise`\<`HeadObjectCommandOutput` \| `undefined`\>

Get details of the S3 object without downloading its content.

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `s3` | `S3Client` | `undefined` | S3Client |
| `bucket` | `string` | `undefined` | bucket of the source object |
| `key` | `string` | `undefined` | object key (without URL encoding) |
| `treat403AsNonExisting` | `boolean` | `false` | If this flag is true, then 403 response from AWS is considered as the object does not exist. Otherwise, only 404 response from AWS is considered as the object does not exist. Background info: If the caller does not have s3:ListBucket permission, AWS responses with 403 when the object does not exists. |
| `options?` | `Partial`\<`HeadObjectCommandInput`\> | `undefined` | Additional options for the HeadObjectCommand |

###### Returns

`Promise`\<`HeadObjectCommandOutput` \| `undefined`\>

S3 command output, or `undefined` if the object does not exist.

___

##### listS3Objects

▸ **listS3Objects**(`s3`, `bucket`, `options?`, `filterFunc?`): `Promise`\<\{ `commonPrefixes`: `CommonPrefix`[] ; `contents`: [`S3ObjectSummary`](#s3objectsummary)[]  }\>

Scan S3 bucket and return both normal objects and directory objects.
Directory objects have keys ending with '/'.
This function handles pagination automatically.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | Name of the bucket |
| `options?` | `Partial`\<`ListObjectsV2CommandInput`\> | Optional settings for the scan |
| `filterFunc?` | (`entry`: `_Object` \| `CommonPrefix`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested objects in a bucket having huge number of object, utilising this function can avoid keeping too many useless array entries in memory. |

###### Returns

`Promise`\<\{ `commonPrefixes`: `CommonPrefix`[] ; `contents`: [`S3ObjectSummary`](#s3objectsummary)[]  }\>

Array of normal and directory objects found

___

##### putS3Object

▸ **putS3Object**(`s3`, `bucket`, `key`, `content`, `options?`): `Promise`\<`PutObjectOutput`\>

Store content into S3.
Please note that the type of the content parameter can't be a Readable (stream) with unknown length.
For uploading stream with unknown length, use `uploadS3Object(...)` instead.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | Name of the bucket |
| `key` | `string` | Key of the object |
| `content` | `undefined` \| `StreamingBlobPayloadInputTypes` | Content of the object, or undefined if the object is a directory. |
| `options?` | `Partial`\<`PutObjectCommandInput`\> | Additional options |

###### Returns

`Promise`\<`PutObjectOutput`\>

PutObjectOutput

___

##### scanS3Bucket

▸ **scanS3Bucket**(`s3`, `bucket`, `options?`, `filterFunc?`): `Promise`\<[`S3ObjectSummary`](#s3objectsummary)[]\>

Scan S3 bucket and return both normal objects and directory objects.
Directory objects have keys ending with '/'.
This function handles pagination automatically.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `s3` | `S3Client` | S3Client |
| `bucket` | `string` | Name of the bucket |
| `options?` | `Partial`\<`ListObjectsV2CommandInput`\> | Optional settings for the scan |
| `filterFunc?` | (`entry`: `_Object`) => `boolean` | Optional filter function to filter out objects based on certain conditions. This function is called for each paged output during pagination. For finding few interested objects in a bucket having huge number of object, utilising this function can avoid keeping too many useless array entries in memory. |

###### Returns

`Promise`\<[`S3ObjectSummary`](#s3objectsummary)[]\>

Array of normal and directory objects found

___

##### uploadS3Object

▸ **uploadS3Object**(`s3`, `bucket`, `key`, `content`, `options?`, `uploadOptions?`, `setupCallback?`): `Promise`\<`void`\>

###### Parameters

| Name | Type |
| :------ | :------ |
| `s3` | `S3Client` |
| `bucket` | `string` |
| `key` | `string` |
| `content` | `undefined` \| `StreamingBlobPayloadInputTypes` |
| `options?` | `Partial`\<`PutObjectCommandInput`\> |
| `uploadOptions?` | `Partial`\<`Options`\> |
| `setupCallback?` | (`upload`: `Upload`) => `void` |

###### Returns

`Promise`\<`void`\>


<a name="modulesssmmd"></a>

### Module: ssm

#### Functions

##### getSsmParameter

▸ **getSsmParameter**(`ssm`, `parameterName`, `fallbackValue?`): `Promise`\<`string` \| `undefined`\>

Get a parameter from SSM Parameter Store.
If the parameter is not found and a fallbackValue is given, the fallbackValue will be returned.
If the parameter is not found and there is no fallbackValue given, `undefined` will be returned.
If any other error occurs, the error will be thrown.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ssm` | `SSM` | SSM |
| `parameterName` | `string` | Name/path of the parameter to get from SSM Parameter Store. |
| `fallbackValue?` | `string` | the value to return if the parameter is not found. If not given, `undefined` will be returned when the parameter is not found. |

###### Returns

`Promise`\<`string` \| `undefined`\>

Value of the parameter, or the fallbackValue, or undefined

___

##### getSsmParameterParsed

▸ **getSsmParameterParsed**\<`T`\>(`ssm`, `parameterName`, `fallbackValue?`): `Promise`\<`T` \| `undefined`\>

Get a parameter from SSM Parameter Store and return it parsed as JSON.
If the parameter is not found and a fallbackValue is given, the fallbackValue will be returned.
If the parameter is not found and there is no fallbackValue given, `undefined` will be returned.
If any other error occurs, the error will be thrown.

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ssm` | `SSM` | SSM |
| `parameterName` | `string` | Name/path of the parameter to get from SSM Parameter Store. |
| `fallbackValue?` | `T` | the value to return if the parameter is not found. If not given, `undefined` will be returned when the parameter is not found. |

###### Returns

`Promise`\<`T` \| `undefined`\>

Value of the parameter parsed as JSON, or the fallbackValue, or undefined
<!-- API end -->
