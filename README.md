# @handy-common-utils/aws-utils

AWS related utilities

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

@handy-common-utils/aws-utils

## @handy-common-utils/aws-utils

### Table of contents

#### Classes

- [AwsUtils](#classesawsutilsmd)

#### Variables

- [FIBONACCI\_SEQUENCE](#fibonacci_sequence)
- [FIBONACCI\_SEQUENCE\_BACKOFFS](#fibonacci_sequence_backoffs)

#### Functions

- [dynamodbLocalClientOptions](#dynamodblocalclientoptions)
- [fibonacciRetryConfigurationOptions](#fibonacciretryconfigurationoptions)
- [parseArn](#parsearn)
- [promiseWithRetry](#promisewithretry)
- [repeatFetchingItemsByMarker](#repeatfetchingitemsbymarker)
- [repeatFetchingItemsByNextToken](#repeatfetchingitemsbynexttoken)
- [repeatFetchingItemsByPosition](#repeatfetchingitemsbyposition)
- [withRetry](#withretry)

### Variables

#### FIBONACCI\_SEQUENCE

• `Const` **FIBONACCI\_SEQUENCE**: `number`[]

___

#### FIBONACCI\_SEQUENCE\_BACKOFFS

• `Const` **FIBONACCI\_SEQUENCE\_BACKOFFS**: `number`[]
## Classes


<a name="classesawsutilsmd"></a>

[@handy-common-utils/aws-utils](#readmemd) / AwsUtils

### Class: AwsUtils

#### Table of contents

##### Constructors

- [constructor](#constructor)

##### Methods

- [dynamodbLocalClientOptions](#dynamodblocalclientoptions)
- [fibonacciRetryConfigurationOptions](#fibonacciretryconfigurationoptions)
- [parseArn](#parsearn)
- [promiseWithRetry](#promisewithretry)
- [repeatFetchingItemsByMarker](#repeatfetchingitemsbymarker)
- [repeatFetchingItemsByNextToken](#repeatfetchingitemsbynexttoken)
- [repeatFetchingItemsByPosition](#repeatfetchingitemsbyposition)
- [withRetry](#withretry)

#### Constructors

##### constructor

• **new AwsUtils**()

#### Methods

##### dynamodbLocalClientOptions

▸ `Static` **dynamodbLocalClientOptions**(`endpoint?`): `Object`

Build an object that can be passed into `DynamoDB.DocumentClient(...)` for
DynamoDB Local (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)

**`example`**
```javascript

const ddbClient = new DynamoDB.DocumentClient(process.env.IS_OFFLINE === 'true' ? AwsUtils.dynamodbLocalClientOptions() : undefined);

```
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

___

##### fibonacciRetryConfigurationOptions

▸ `Static` **fibonacciRetryConfigurationOptions**(`maxRetries`, `base?`): `Pick`<`ConfigurationOptions`, ``"maxRetries"`` \| ``"retryDelayOptions"``\>

Generate part of a ConfigurationOptions object having maxRetries as specified and a custom RetryDelayOptions for fibonacci sequence based retry delays.

###### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `maxRetries` | `number` | `undefined` | The maximum amount of retries to perform for a service request. |
| `base` | `number` | `100` | The base number of milliseconds to use in the fibonacci backoff for operation retries. Defaults to 100 ms. |

###### Returns

`Pick`<`ConfigurationOptions`, ``"maxRetries"`` \| ``"retryDelayOptions"``\>

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
The retry could happen only if the error coming from AWS has property `retryable` equals to true.
If you don't want `retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | `Result` |
| `TError` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => { `promise`: () => `Promise`<`Result`\>  } | the AWS operation that returns a Request, such like `() => apig.getBasePathMappings({ domainName, limit: 500 })` |
| `backoff?` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them.                If retry is desired, before making next call to the operation the desired backoff period would be waited.                If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation.                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,                so the first retry is the second attempt.                If ommitted or undefined, a default backoff array will be used.                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes?` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done.                    If ommitted or undefined, only 429 status code would result in a retry.                    If it is null, status code would not be looked into.                    If it is an empty array, retry would never happen. |

###### Returns

`Promise`<`Result`\>

result coming out from the last attempt

___

##### repeatFetchingItemsByMarker

▸ `Static` **repeatFetchingItemsByMarker**<`T`\>(`itemsFieldName`, `fetchItemsByMarker`): `Promise`<`T`[]\>

Fetch items by Marker repeatedly.
This function is useful for client side pagination when the response from AWS API contains NextMarker fields.

**`example`**
```javascript

const topics = await AwsUtils.repeatFetchingItemsByNextToken<SNS.Topic>('Topics',
  pagingParam => sns.listTopics({...pagingParam}).promise(),
);

```
###### Type parameters

| Name | Description |
| :------ | :------ |
| `T` | type of the items returned by AWS API |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |
| `fetchItemsByMarker` | (`parameter`: { `Marker?`: `string`  }) => `Promise`<`Object`\> | the function for fetching items by Marker |

###### Returns

`Promise`<`T`[]\>

all items fetched

___

##### repeatFetchingItemsByNextToken

▸ `Static` **repeatFetchingItemsByNextToken**<`T`\>(`itemsFieldName`, `fetchItemsByNextToken`): `Promise`<`T`[]\>

Fetch items by NextToken repeatedly.
This function is useful for client side pagination when the response from AWS API contains NextToken fields.

**`example`**
```javascript

const topics = await AwsUtils.repeatFetchingItemsByNextToken<SNS.Topic>('Topics',
  pagingParam => sns.listTopics({...pagingParam}).promise(),
);

```
###### Type parameters

| Name | Description |
| :------ | :------ |
| `T` | type of the items returned by AWS API |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `itemsFieldName` | `string` | name of the field containing returned items in AWS API response |
| `fetchItemsByNextToken` | (`parameter`: { `NextToken?`: `string`  }) => `Promise`<`Object`\> | the function for fetching items by NextToken |

###### Returns

`Promise`<`T`[]\>

all items fetched

___

##### repeatFetchingItemsByPosition

▸ `Static` **repeatFetchingItemsByPosition**<`T`\>(`fetchItemsByPosition`): `Promise`<`T`[]\>

Fetch items by position repeatedly.
This function is useful for client side pagination when the response from AWS API contains position and items fields.

**`example`**
```javascript

const domainNameObjects = await AwsUtils.repeatFetchingItemsByPosition(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
);

```
###### Type parameters

| Name | Description |
| :------ | :------ |
| `T` | type of the items returned by AWS API |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fetchItemsByPosition` | (`parameter`: { `position?`: `string`  }) => `Promise`<`Object`\> | the function for fetching items by position |

###### Returns

`Promise`<`T`[]\>

all items fetched

___

##### withRetry

▸ `Static` **withRetry**<`Result`, `TError`\>(`operation`, `backoff?`, `statusCodes?`): `Promise`<`Result`\>

Perform an AWS operation (returning a Promise) with retry.
The retry could happen only if the error coming from AWS has property `retryable` equals to true.
If you don't want `retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | `Result` |
| `TError` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`<`Result`\> | the AWS operation that returns a Promise, such like `() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()` |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them.                If retry is desired, before making next call to the operation the desired backoff period would be waited.                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,                there would be no further call to the operation.                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,                so the first retry is the second attempt.                If ommitted or undefined, a default backoff array will be used.                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used. |
| `statusCodes` | ``null`` \| (`undefined` \| `number`)[] | Array of status codes for which retry should be done.                    If ommitted or undefined, only 429 status code would result in a retry.                    If it is null, status code would not be looked into.                    If it is an empty array, retry would never happen. |

###### Returns

`Promise`<`Result`\>

result coming out from the last attempt
<!-- API end -->
