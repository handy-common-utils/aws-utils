/**
 * ## Re-exports
 *
 * ### Functions
 *
 * - [fetchAllByNextToken = AwsUtils.fetchAllByNextToken](../classes/aws_utils.AwsUtils.md#fetchAllByNextToken)
 * - [fetchAllByNextTokenV3 = AwsUtils.fetchAllByNextTokenV3](../classes/aws_utils.AwsUtils.md#fetchAllByNextTokenV3)
 * - [fetchAllWithPagination = AwsUtils.fetchAllWithPagination](../classes/aws_utils.AwsUtils.md#fetchAllWithPagination)
 * - [fetchAllByMarker = AwsUtils.fetchAllByMarker](../classes/aws_utils.AwsUtils.md#fetchAllByMarker)
 * - [fetchAllByExclusiveStartKey = AwsUtils.fetchAllByExclusiveStartKey](../classes/aws_utils.AwsUtils.md#fetchAllByExclusiveStartKey)
 * - [withRetry = AwsUtils.withRetry](../classes/aws_utils.AwsUtils.md#withRetry)
 * - [promiseWithRetry = AwsUtils.promiseWithRetry](../classes/aws_utils.AwsUtils.md#promiseWithRetry)
 * - [fibonacciRetryConfigurationOptions = AwsUtils.fibonacciRetryConfigurationOptions](../classes/aws_utils.AwsUtils.md#fibonacciRetryConfigurationOptions)
 * - [parseArn = AwsUtils.parseArn](../classes/aws_utils.AwsUtils.md#parseArn)
 * - [dynamodbLocalClientOptions = AwsUtils.dynamodbLocalClientOptions](../classes/aws_utils.AwsUtils.md#dynamodbLocalClientOptions)
 *
 * ## Exports
 *
 * @module
 */
/* eslint-disable unicorn/prefer-spread */
import { FIBONACCI_SEQUENCE, PromiseUtils } from '@handy-common-utils/promise-utils';
import { parseArn as simpleParseArn } from '@unbounce/parse-aws-arn';

/**
 * Possibly an error thrown from by AWS SDK v2, about a service or networking error.
 */
export type PossibleAwsV2Error = Error & {
  /**
   * A unique short code representing the error that was emitted.
   */
  code: string;
  /**
   * A longer human readable error message.
   */
  message: string;
  /**
   * Whether the error message is retryable.
   */
  retryable?: boolean;
  /**
   * In the case of a request that reached the service, this value contains the response status code.
   */
  statusCode?: number;
  /**
   * The date time object when the error occurred.
   */
  time: Date;
  /**
   * Set when a networking error occurs to easily identify the endpoint of the request.
   */
  hostname?: string;
  /**
   * Set when a networking error occurs to easily identify the region of the request.
   */
  region?: string;
  /**
   * Amount of time (in seconds) that the request waited before being resent.
   */
  retryDelay?: number;
  /**
   * The unique request ID associated with the response.
   */
  requestId?: string;
  /**
   * Second request ID associated with the response from S3.
   */
  extendedRequestId?: string;
  /**
   * CloudFront request ID associated with the response.
   */
  cfId?: string;
  /**
   * The original error which caused this Error
   */
  originalError?: Error
}

/**
 * Possibly an error thrown from by AWS SDK v3
 */
export type PossibleAwsV3Error = Error & {
  $fault: 'client' | 'server';
  /**
   * v3 $retryable
   */
  $retryable?: {
    throttling?: boolean;
  };
  /**
   * v3 $metadata
   */
  $metadata: {
    httpStatusCode: number;
  }
}

export type PossibleAwsError = PossibleAwsV2Error | PossibleAwsV3Error;

/**
 * Check whether it could be an error thrown from AWS SDK v2.
 * Normally you should use `isPossibleAwsError(...)` function instead for best compatibility.
 * @param error to be checked
 * @returns true if it could be an error thrown from AWS SDK v2
 */
export function isPossibleAwsV2Error(error: any): error is PossibleAwsV2Error {
  return typeof error === 'object' && error != null && 'retryable' in error && 'code' in error && 'message' in error;
}

/**
 * Check whether it could be an error thrown from AWS SDK v3.
 * Normally you should use `isPossibleAwsError(...)` function instead for best compatibility.
 * @param error to be checked
 * @returns true if it could be an error thrown from AWS SDK v3
 */
export function isPossibleAwsV3Error(error: any): error is PossibleAwsV3Error {
  return typeof error === 'object' && error != null && '$metadata' in error && 'message' in error;
}

/**
 * Check whether it could be an error thrown from AWS SDK v2 or v3.
 * @param error to be checked
 * @returns true if it could be an error thrown from AWS SDK v2 or v3
 */
export function isPossibleAwsError(error: any): error is PossibleAwsError {
  return isPossibleAwsV3Error(error) || isPossibleAwsV2Error(error);
}

/**
 * Get the status code of the error thrown from AWS SDK v2 or v3.
 * @param error AWS error
 * @returns status code
 */
export function awsErrorStatusCode(error: PossibleAwsError): number | undefined {
  return (error as PossibleAwsV3Error).$metadata.httpStatusCode ?? (error as PossibleAwsV2Error).statusCode;
}

/**
 * Check whether the error thrown from AWS SDK v2 or v3 is retryable.
 * @param error AWS error
 * @returns true of retryable
 */
export function awsErrorRetryable(error: PossibleAwsError): boolean {
  return (error as PossibleAwsV3Error).$retryable?.throttling ?? (error as PossibleAwsV2Error).retryable ?? false;
}

/**
 * Check whether the error thrown from AWS SDK v2 or v3 is a throttling error.
 * @param error AWS error
 * @returns true if it is a throttling error
 */
export function isPossibleAwsThrottlingError(error: any): error is PossibleAwsError {
  return isPossibleAwsV3Error(error) && error.name === 'ThrottlingException' || isPossibleAwsV2Error(error) && error.code === 'ThrottlingException';
}


type PartialConfigurationOptions = {
  /**
   * The maximum amount of retries to perform for a service request.
   */
  maxRetries: number;
  retryDelayOptions: {
    /**
     * A custom function that accepts a retry count and error and returns the amount of time to delay in milliseconds. If the result is a non-zero negative value, no further retry attempts will be made.
     * The base option will be ignored if this option is supplied.
     */
    customBackoff: (retryCount: number, err?: Error) => number;
  }
}

export { FIBONACCI_SEQUENCE } from '@handy-common-utils/promise-utils';
export const FIBONACCI_SEQUENCE_BACKOFFS = [...FIBONACCI_SEQUENCE, -1];

type WithPromiseFunction<O> = { promise: () => Promise<O> };
type FetchItemsFunction<I, O> = ((parameter: I) => Promise<O>) | ((parameter: I) => WithPromiseFunction<O>);

function awaitItems<I, O>(func: FetchItemsFunction<I, O>): ((parameter: I) => Promise<O>) {
  return (parameter: I) => {
    const requestOrPromise = func(parameter);
    const asRequest = requestOrPromise as WithPromiseFunction<O>;
    if (typeof asRequest.promise === 'function') {
      return asRequest.promise();
    }
    return requestOrPromise as Promise<O>;
  };
}

export abstract class AwsUtils {
  /**
   * Build an object that can be passed into `DynamoDB.DocumentClient(...)` for
   * DynamoDB Local (https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
   *
   * @example
   * const ddbClient = new DynamoDB.DocumentClient(process.env.IS_OFFLINE === 'true' ? AwsUtils.dynamodbLocalClientOptions() : undefined);
   *
   * @param endpoint if omitted, the endpoint will be 'http://localhost:8000' which is the default
   * @returns the options object
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static dynamodbLocalClientOptions(endpoint = 'http://localhost:8000') {
    return {
      endpoint,
      region: 'ap-southeast-2',
      accessKeyId: 'FAKE_ACCESS_KEY',
      secretAccessKey: 'FAKE_SECRET',
    };
  }

  /**
   * Fetch all items through repeatedly calling API with position based pagination.
   * This function is useful for client side pagination when the response from AWS API contains position and items fields.
   *
   * @example
   * const domainNameObjects = await AwsUtils.fetchingAllByPosition(
   *   pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByPosition the function for fetching one batch/page of items by position
   * @param itemsFieldName    name of the field containing returned items in AWS API response, default value is 'items'
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByPosition<T, P = string>(
    fetchItemsByPosition: FetchItemsFunction<{ position?: P }, { position?: P }>,
    itemsFieldName = 'items',
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByPosition),
      response => response.position ? { position: response.position } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling API with NextToken based pagination.
   * This function is useful for client side pagination when the response from AWS API contains NextToken and items fields.
   *
   * @example
   * const topics = await AwsUtils.fetchAllByNextToken<SNS.Topic>(
   *   pagingParam => sns.listTopics({...pagingParam}).promise(),
   *   'Topics',
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByNextToken the function for fetching one batch/page of items by NextToken
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByNextToken<T, K = string>(
    fetchItemsByNextToken: FetchItemsFunction<{ NextToken?: K }, { NextToken?: K }>,
    itemsFieldName: string,
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByNextToken),
      response => response.NextToken ? { NextToken: response.NextToken } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling pagination based API.
   * This function is useful for client side pagination when the calling AWS API.
   *
   * @example
   * const executions = await AwsUtils.fetchAllWithPagination(
   *   (pagingParam) => this.client.send(new ListExecutionsCommand({
   *     stateMachineArn,
   *     statusFilter: status,
   *     ...pagingParam,
   *   })),
   *   'executions',
   *   'nextToken',
   *   (resp) => resp.executions != null && resp.executions.some((exe) => exe.startDate!.getTime() <= beginTime),
   * );
   *
   * @template IT type of the items returned by AWS API
   * @template RT type of the response returned by AWS API
   * @template IFN name of the field containing returned items in AWS API response
   * @template PFN name of the field containing the pagination token in AWS API response, such like "ExclusiveStartKey", "Marker", "NextToken", "nextToken"
   * @template PFT type of the pagination token in AWS API response, usually it is string
   *
   * @param fetchOnePageOfItems   the function for fetching one batch/page of items by nextToken
   * @param itemsFieldName        name of the field containing returned items in AWS API response
   * @param paginationFieldName   name of the field containing the pagination token in AWS API response, such like "ExclusiveStartKey", "Marker", "NextToken", "nextToken"
   * @param shouldFetchNextPage   a function to determine if the fetch should continue, the default value is always true
   *                              and will continue fetching items until the response does not contain nextToken field.
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllWithPagination<IT, RT extends Record<IFN, IT[]|undefined> & Partial<Record<PFN, PFT>>, IFN extends string, PFN extends string, PFT = string>(
    fetchOnePageOfItems: FetchItemsFunction<Partial<Record<PFN, PFT>>, RT>,
    itemsFieldName: IFN,
    paginationFieldName: PFN,
    shouldFetchNextPage?: (response: RT) => boolean,
    filterFunc?: (entry: IT) => boolean,
  ): Promise<Exclude<RT[IFN], undefined>> {
    return PromiseUtils.repeat(
      awaitItems(fetchOnePageOfItems),
      response => (!shouldFetchNextPage || shouldFetchNextPage(response)) ? (response[paginationFieldName] ? ({ [paginationFieldName]: response[paginationFieldName] }) as unknown as Record<PFN, PFT> : null) : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<IT>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<IT>,
    ) as Promise<Exclude<RT[IFN], undefined>>;
  }

  /**
   * Fetch all items through repeatedly calling API with nextToken based pagination which is used in aws-sdk v3.
   * This function is useful for client side pagination when the response from AWS API contains nextToken and items fields.
   *
   * @example
   * const executions = await AwsUtils.fetchAllByNextTokenV3<ExecutionListItem>(
   *   (pagingParam) => this.client.send(new ListExecutionsCommand({
   *     stateMachineArn,
   *     statusFilter: status,
   *     ...pagingParam,
   *   })),
   *   'executions',
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByNextToken the function for fetching one batch/page of items by nextToken
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByNextTokenV3<T, K = string>(
    fetchItemsByNextToken: FetchItemsFunction<{ nextToken?: K }, { nextToken?: K }>,
    itemsFieldName: string,
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByNextToken),
      response => response.nextToken ? { nextToken: response.nextToken } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling API with Marker/NextMarker based pagination.
   * This function is useful for client side pagination when the response from AWS API contains NextMarker and items fields.
   *
   * @example
   * const functionConfigurations = await AwsUtils.fetchAllByMarker<Lambda.FunctionConfiguration>(
   *   pagingParam => withRetry(() => lambda.listFunctions({ ...pagingParam }).promise()),
   *   'Functions',
   * );
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByMarker the function for fetching one batch/page of items by Marker
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByMarker<T, M = string>(
    fetchItemsByMarker: FetchItemsFunction<{ Marker?: M }, { NextMarker?: M }>,
    itemsFieldName: string,
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByMarker),
      response => response.NextMarker ? { Marker: response.NextMarker } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling API with ContinuationToken/NextContinuationToken based pagination.
   * This function is useful for client side pagination when the response from AWS API contains NextContinuationToken and items fields.
   *
   * @example
   * const objects = await fetchAllByContinuationToken(() => s3.send(new ListObjectsV2Command({Bucket: bucket})));
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByContinuationToken the function for fetching one batch/page of items by ContinuationToken
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByContinuationToken<T, M = string>(
    fetchItemsByContinuationToken: FetchItemsFunction<{ ContinuationToken?: M }, { NextContinuationToken?: M }>,
    itemsFieldName: string = 'Contents',
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByContinuationToken),
      response => response.NextContinuationToken ? { ContinuationToken: response.NextContinuationToken } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling API with ExclusiveStartKey/LastEvaluatedKey based pagination.
   * This function is useful for client side pagination when the response from AWS API contains LastEvaluatedKey and items fields.
   *
   * @example
   * const allItemsInDynamoDbTable = await AwsUtils.fetchAllByExclusiveStartKey<MyTableItem>(
   *   pagingParam => dynamoDbDocumentClient.scan({...pagingParam, TableName: 'my-table', limit: 20}).promise(),
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByExclusiveStartKey the function for fetching one batch/page of items by ExclusiveStartKey
   * @param itemsFieldName    name of the field containing returned items in AWS API response, the default value is 'Items'
   * @param filterFunc Optional filter function to filter out objects based on certain conditions.
   *        This function is called for each paged output during pagination.
   *        For finding few interested items in a huge number of entries,
   *        utilising this function can avoid keeping too many useless array entries in memory.
   * @returns all items fetched
   */
  static async fetchAllByExclusiveStartKey<T, K = { [key: string]: any }>(
    fetchItemsByExclusiveStartKey: FetchItemsFunction<{ ExclusiveStartKey?: K }, { LastEvaluatedKey?: K }>,
    itemsFieldName = 'Items',
    filterFunc?: (entry: T) => boolean,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByExclusiveStartKey),
      response => response.LastEvaluatedKey ? { ExclusiveStartKey: response.LastEvaluatedKey } : null,
      (collection, response: any) => {
        const entries = response[itemsFieldName] as Array<T>;
        return Array.isArray(entries) ? collection.concat(filterFunc ? entries.filter((entry) => filterFunc(entry)) : entries) : collection;
      },
      [] as Array<T>,
    );
  }

  /**
   * Perform an AWS operation (returning a Promise) with retry.
   * This function is quite handy when you are using AWS SDK v3.
   * If you are using AWS SDK v2, `promiseWithRetry(...)` could be more convenient.
   * 
   * The retry would happen when the error coming from AWS indicates HTTP status code 429, and
   * has property `retryable`/`$retryable.throttling` equals to true
   * or property `name`/`code` equals to "ThrottlingException".
   * If you want to customise the retry logic, use `PromiseUtils.withRetry(...)` directly.
   * @see promiseWithRetry
   * @param operation the AWS operation that returns a Promise, such like `() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()`
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,
   *                there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,
   *                so the first retry is the second attempt.
   *                If omitted or undefined, a default backoff array will be used.
   *                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used.
   * @param statusCodes Array of status codes for which retry should be done.
   *                    If omitted or undefined, only 429 status code could result in a retry.
   *                    If it is null, status code would not be looked into.
   *                    If it is an empty array, retry would never happen.
   * @returns result came out from the last attempt
   */
  static withRetry<Result, TError = any>(
    operation: (attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => Promise<Result>,
    backoff: Array<number> | ((attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => number | undefined) = [500, 1000, 1500, 3000, 5000, 8000],
    statusCodes: Array<number|undefined> | null = [429]): Promise<Result> {
    return PromiseUtils.withRetry<Result, TError>(operation, (attempt: number, previousResult: Result|undefined, previousError: TError|undefined) => {
      const backoffMs = Array.isArray(backoff) ? backoff[attempt - 1] : backoff(attempt, previousResult, previousError);
      const awsRetryDelaySec = isPossibleAwsV2Error(previousError) ? previousError.retryDelay : null;
      if (backoffMs == null || backoffMs < 0 || awsRetryDelaySec == null) {  // if there should be no retry or if AWS does not tell us the delay
        return backoffMs;
      }
      const awsRetryDelayMs = awsRetryDelaySec * 1000;
      return awsRetryDelayMs > backoffMs ? awsRetryDelayMs : backoffMs;
    }, (previousError: TError | undefined) => {
      if (!isPossibleAwsError(previousError)) {
        return false;
      }
      const isRetryable = awsErrorRetryable(previousError) || isPossibleAwsThrottlingError(previousError);
      const statusCode = awsErrorStatusCode(previousError);
      return isRetryable === true && (statusCodes == null || statusCodes.includes(statusCode));
    });
  }

  /**
   * Perform an AWS operation (returning a Request) with retry.
   * This function is quite handy when you are using AWS SDK v2.
   * If you are using AWS SDK v3, use `withRetry(...)` instead.
   *
   * The retry would happen when the error coming from AWS indicates HTTP status code 429, and
   * has property `retryable`/`$retryable.throttling` equals to true
   * or property `name`/`code` equals to "ThrottlingException".
   * If you want to customise the retry logic, use `PromiseUtils.withRetry(...)` directly.
   * @param operation the AWS operation that returns a Request, such like `() => apig.getBasePathMappings({ domainName, limit: 500 })`
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,
   *                so the first retry is the second attempt.
   *                If omitted or undefined, a default backoff array will be used.
   *                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used.
   * @param statusCodes Array of status codes for which retry should be done.
   *                    If omitted or undefined, only 429 status code could result in a retry.
   *                    If it is null, status code would not be looked into.
   *                    If it is an empty array, retry would never happen.
   * @returns result came out from the last attempt
   */
  static promiseWithRetry<Result, TError = any>(
    operation: (attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => WithPromiseFunction<Result>,
    backoff?: Array<number> | ((attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => number | undefined),
    statusCodes?: Array<number|undefined> | null): Promise<Result> {
    return AwsUtils.withRetry((attempt, previousResult, previousError) => operation(attempt, previousResult, previousError).promise(), backoff, statusCodes);
  }

  /**
   * Generate part of a ConfigurationOptions object having maxRetries as specified and a custom RetryDelayOptions for fibonacci sequence based retry delays.
   * @param maxRetries The maximum amount of retries to perform for a service request.
   * @param base  The base number of milliseconds to use in the fibonacci backoff for operation retries. Defaults to 100 ms.
   * @returns part of a ConfigurationOptions object that has maxRetries as specified and a customBackoff utilising fibonacci sequence for calculating delays
   */
  static fibonacciRetryConfigurationOptions(maxRetries: number, base = 100): PartialConfigurationOptions {
    if (maxRetries < 0 || maxRetries > FIBONACCI_SEQUENCE_BACKOFFS.length - 1) {
      throw new Error(`maxRetries must between 0 and ${FIBONACCI_SEQUENCE_BACKOFFS.length - 1}`);
    }
    return {
      maxRetries,
      retryDelayOptions: {
        customBackoff: i => base * FIBONACCI_SEQUENCE_BACKOFFS[i],
      },
    };
  }

  /**
   * Parse ARN
   * @param arn the ARN string that could be null or undefined
   * @returns null or undefined if the input is null or undefined, or parsed ARN including the original ARN string
   */
  static parseArn(arn: string | null | undefined): ReturnType<typeof simpleParseArn> & { arn: string } | null | undefined {
    if (arn === null) {
      return null;
    }
    if (arn === undefined) {
      return undefined;
    }
    return { ...simpleParseArn(arn), arn };
  }
}

/** @ignore */
export const fetchAllByPosition = AwsUtils.fetchAllByPosition;
/** @ignore */
export const fetchAllByNextToken = AwsUtils.fetchAllByNextToken;
/** @ignore */
export const fetchAllByNextTokenV3 = AwsUtils.fetchAllByNextTokenV3;
/** @ignore */
export const fetchAllWithPagination = AwsUtils.fetchAllWithPagination;
/** @ignore */
export const fetchAllByMarker = AwsUtils.fetchAllByMarker;
/** @ignore */
export const fetchAllByContinuationToken = AwsUtils.fetchAllByContinuationToken;
/** @ignore */
export const fetchAllByExclusiveStartKey = AwsUtils.fetchAllByExclusiveStartKey;

/** @ignore */
export const withRetry = AwsUtils.withRetry;
/** @ignore */
export const promiseWithRetry = AwsUtils.promiseWithRetry;
/** @ignore */
export const fibonacciRetryConfigurationOptions = AwsUtils.fibonacciRetryConfigurationOptions;

/** @ignore */
export const parseArn = AwsUtils.parseArn;
/** @ignore */
export const dynamodbLocalClientOptions = AwsUtils.dynamodbLocalClientOptions;
