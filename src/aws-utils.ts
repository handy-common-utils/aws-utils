/**
 * ## Re-exports
 *
 * ### Functions
 *
 * - [fetchAllByNextToken = AwsUtils.fetchAllByNextToken](../classes/aws_utils.AwsUtils.md#fetchAllByNextToken)
 * - [fetchAllByNextTokenV3 = AwsUtils.fetchAllByNextTokenV3](../classes/aws_utils.AwsUtils.md#fetchAllByNextTokenV3)
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
import { PromiseUtils } from '@handy-common-utils/promise-utils';
import { parseArn as simpleParseArn } from '@unbounce/parse-aws-arn';

type AWSError = {
  statusCode?: number;  // v2
  retryable?: boolean;  // v2
  retryDelay?: number;  // v2
  $retryable?: {        // v3
    throttling: boolean;
  };
  $metadata?: {         // v3
    httpStatusCode: number;
  }
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

export const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811];
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
   * @returns all items fetched
   */
  static async fetchAllByPosition<T, P = string>(
    fetchItemsByPosition: FetchItemsFunction<{ position?: P }, { position?: P }>,
    itemsFieldName = 'items',
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByPosition),
      response => response.position ? { position: response.position } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
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
   * @returns all items fetched
   */
  static async fetchAllByNextToken<T, K = string>(
    fetchItemsByNextToken: FetchItemsFunction<{ NextToken?: K }, { NextToken?: K }>,
    itemsFieldName: string,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByNextToken),
      response => response.NextToken ? { NextToken: response.NextToken } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
      [] as Array<T>,
    );
  }

  /**
   * Fetch all items through repeatedly calling API with nextToken based pagination which is used in aws-sdk v3.
   * This function is useful for client side pagination when the response from AWS API contains nextToken and items fields.
   *
   * @example
   * const command = new ListExecutionsCommand({
   *   stateMachineArn,
   *   statusFilter: status,
   * });
   * 
   * const executions = AwsUtils.fetchAllByNextToken<ExecutionListItem>(
   *   (pagingParam) => this.client.send({...command, ...pagingParam}),
   *   'executions',
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByNextToken the function for fetching one batch/page of items by nextToken
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @returns all items fetched
   */
  static async fetchAllByNextTokenV3<T, K = string>(
    fetchItemsByNextToken: FetchItemsFunction<{ nextToken?: K }, { nextToken?: K }>,
    itemsFieldName: string,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByNextToken),
      response => response.nextToken ? { nextToken: response.nextToken } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
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
   * @returns all items fetched
   */
  static async fetchAllByMarker<T, M = string>(
    fetchItemsByMarker: FetchItemsFunction<{ Marker?: M }, { NextMarker?: M }>,
    itemsFieldName: string,
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByMarker),
      response => response.NextMarker ? { Marker: response.NextMarker } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
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
   * @returns all items fetched
   */
  static async fetchAllByExclusiveStartKey<T, K = { [key: string]: any }>(
    fetchItemsByExclusiveStartKey: FetchItemsFunction<{ ExclusiveStartKey?: K }, { LastEvaluatedKey?: K }>,
    itemsFieldName = 'Items',
  ): Promise<T[]> {
    return PromiseUtils.repeat(
      awaitItems(fetchItemsByExclusiveStartKey),
      response => response.LastEvaluatedKey ? { ExclusiveStartKey: response.LastEvaluatedKey } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
      [] as Array<T>,
    );
  }

  /**
   * Usually you would find `promiseWithRetry(...)` more convenient.
   *
   * Perform an AWS operation (returning a Promise) with retry.
   * The retry could happen only if the error coming from AWS has property `retryable`/`$retryable` equals to true.
   * If you don't want `retryable`/`$retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.
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
   *                    If omitted or undefined, only 429 status code would result in a retry.
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
      const awsError = previousError as unknown as AWSError;
      const awsRetryDelaySec = awsError?.retryDelay;
      if (backoffMs == null || backoffMs < 0 || awsRetryDelaySec == null) {  // if there should be no retry or if AWS does not tell us the delay
        return backoffMs;
      }
      const awsRetryDelayMs = awsRetryDelaySec * 1000;
      return awsRetryDelayMs > backoffMs ? awsRetryDelayMs : backoffMs;
    }, (previousError: TError | undefined) => {
      const awsError = previousError as unknown as AWSError;
      const isRetryable = awsError?.retryable ?? awsError?.$retryable?.throttling;
      const statusCode = awsError?.statusCode ?? awsError?.$metadata?.httpStatusCode;
      return isRetryable === true && (statusCodes == null || statusCodes.includes(statusCode));
    });
  }

  /**
   * Perform an AWS operation (returning a Request) with retry.
   * The retry could happen only if the error coming from AWS has property `retryable`/`$retryable` equals to true.
   * If you don't want `retryable`/`$retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.
   * @param operation the AWS operation that returns a Request, such like `() => apig.getBasePathMappings({ domainName, limit: 500 })`
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,
   *                so the first retry is the second attempt.
   *                If omitted or undefined, a default backoff array will be used.
   *                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used.
   * @param statusCodes Array of status codes for which retry should be done.
   *                    If omitted or undefined, only 429 status code would result in a retry.
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
export const fetchAllByMarker = AwsUtils.fetchAllByMarker;
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
