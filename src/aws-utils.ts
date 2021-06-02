/* eslint-disable unicorn/prefer-spread */
/* eslint-disable unicorn/no-null */
import { PromiseUtils } from '@handy-common-utils/promise-utils';
import { AWSError } from 'aws-sdk';
import { parseArn as simpleParseArn } from '@unbounce/parse-aws-arn';

// eslint-disable-next-line unicorn/no-static-only-class
export abstract class AwsUtils {
  /**
   * Fetch items by position repeatedly.
   * This function is useful for client side pagination when the response from AWS API contains position and items fields.
   *
   * @example
   * const domainNameObjects = await AwsUtils.repeatFetchingItemsByPosition(
   *   pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param fetchItemsByPosition the function for fetching items by position
   * @returns all items fetched
   */
  static async repeatFetchingItemsByPosition<T>(
    fetchItemsByPosition: (parameter: { position?: string }) => Promise<{ position?: string; items?: Array<T> }>,
  ) {
    return PromiseUtils.repeat(
      fetchItemsByPosition,
      response => response.position ? { position: response.position } : null,
      (collection, response) => response.items ? collection.concat(response.items) : collection,
      [] as Array<T>,
    );
  }

  /**
   * Fetch items by NextToken repeatedly.
   * This function is useful for client side pagination when the response from AWS API contains NextToken fields.
   *
   * @example
   * const topics = await AwsUtils.repeatFetchingItemsByNextToken<SNS.Topic>('Topics',
   *   pagingParam => sns.listTopics({...pagingParam}).promise(),
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param fetchItemsByNextToken the function for fetching items by NextToken
   * @returns all items fetched
   */
  static async repeatFetchingItemsByNextToken<T>(
    itemsFieldName: string,
    fetchItemsByNextToken: (parameter: { NextToken?: string }) => Promise<{ NextToken?: string }>,
  ) {
    return PromiseUtils.repeat(
      fetchItemsByNextToken,
      response => response.NextToken ? { NextToken: response.NextToken } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
      [] as Array<T>,
    );
  }

  /**
   * Fetch items by Marker repeatedly.
   * This function is useful for client side pagination when the response from AWS API contains NextMarker fields.
   *
   * @example
   * const topics = await AwsUtils.repeatFetchingItemsByNextToken<SNS.Topic>('Topics',
   *   pagingParam => sns.listTopics({...pagingParam}).promise(),
   * );
   *
   * @template T type of the items returned by AWS API
   *
   * @param itemsFieldName    name of the field containing returned items in AWS API response
   * @param fetchItemsByMarker the function for fetching items by Marker
   * @returns all items fetched
   */
  static async repeatFetchingItemsByMarker<T>(
    itemsFieldName: string,
    fetchItemsByMarker: (parameter: { Marker?: string }) => Promise<{ NextMarker?: string }>,
  ) {
    return PromiseUtils.repeat(
      fetchItemsByMarker,
      response => response.NextMarker ? { Marker: response.NextMarker } : null,
      (collection, response: any) => response[itemsFieldName] ? collection.concat(response[itemsFieldName] as Array<T>) : collection,
      [] as Array<T>,
    );
  }

  /**
   * Perform an AWS operation with retry.
   * The retry could happen only if the error coming from AWS has property `retryable` equals to true.
   * If you don't want `retryable` property to be checked, use `PromiseUtils.withRetry(...)` directly.
   * @param operation the AWS operation that returns a Promise, such like `() => apig.getBasePathMappings({ domainName, limit: 500 }).promise()`
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined`, there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,
   *                so the first retry is the second attempt.
   *                If ommitted or undefined, a default backoff array will be used.
   *                In case AWS has `retryDelay` property in the returned error, the larger one between `retryDelay` and the backoff will be used.
   * @param statusCodes Array of status codes for which retry should be done.
   *                    If ommitted or undefined, only 429 status code would result in a retry.
   *                    If it is null, status code would not be looked into.
   *                    If it is an empty array, retry would never happen.
   * @returns result coming out from the last attempt
   */
  static withRetry<Result, TError = any>(
    operation: (attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => Promise<Result>,
    backoff: Array<number> | ((attempt: number, previousResult: Result | undefined, previousError: TError | undefined) => number | undefined) = [500, 1000, 1500, 3000, 5000, 8000],
    statusCodes: Array<number|undefined> | null = [429]): Promise<Result> {
    return PromiseUtils.withRetry<Result, TError>(operation, (attempt: number, previousResult: Result|undefined, previousError: TError|undefined) => {
      const backoffMs = Array.isArray(backoff) ? backoff[attempt - 1] : backoff(attempt, previousResult, previousError);
      const awsError = previousError as unknown as AWSError;
      const awsRetryDelaySec = awsError?.retryDelay;
      if (backoffMs == null || awsRetryDelaySec == null) {  // if there should be no retry or if AWS does not tell us the delay
        return backoffMs;
      }
      const awsRetryDelayMs = awsRetryDelaySec * 1000;
      return awsRetryDelayMs > backoffMs ? awsRetryDelayMs : backoffMs;
    }, (previousError: TError | undefined) => {
      const awsError = previousError as unknown as AWSError;
      return awsError?.retryable === true && (statusCodes == null || statusCodes.includes(awsError?.statusCode));
    });
  }

  /**
   * Parse ARN
   * @param arn the ARN string that could be null or undefined
   * @returns null or undeinfed if the input is null or undefined, or parsed ARN including the original ARN string
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

export const repeatFetchingItemsByPosition = AwsUtils.repeatFetchingItemsByPosition;
export const repeatFetchingItemsByNextToken = AwsUtils.repeatFetchingItemsByNextToken;
export const repeatFetchingItemsByMarker = AwsUtils.repeatFetchingItemsByMarker;
export const parseArn = AwsUtils.parseArn;
