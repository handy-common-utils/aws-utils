/* eslint-disable unicorn/prefer-spread */
/* eslint-disable unicorn/no-null */
import { PromiseUtils } from '@handy-common-utils/promise-utils';
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
