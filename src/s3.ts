import { CommonPrefix, CopyObjectCommand, CopyObjectCommandOutput, DeleteObjectCommand, DeleteObjectCommandOutput, GetObjectCommand, HeadObjectCommand, HeadObjectCommandOutput, ListObjectsV2Command, ListObjectsV2CommandInput, ListObjectsV2CommandOutput, PutObjectCommand, PutObjectCommandInput, PutObjectOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PromiseUtils } from '@handy-common-utils/promise-utils';

import { PossibleAwsError, fetchAllByContinuationToken } from './aws-utils';

/**
 * URL encode the object key, and also replace "%20" with " " and "%2F with "/" which is the convention of AWS
 * @param key The S3 object key before encoding
 * @returns URL encoded object key
 */
export function encodeS3ObjectKey(key: string): string {
  return encodeURIComponent(key).replaceAll('%20', '+').replaceAll('%2F', '/');
}

/**
 * Decode the raw object key which is URL encoded and could contain "+" as replacement of " "
 * @param key The raw S3 object key which is URL encoded
 * @returns Decoded key
 */
export function decodeS3ObjectKey(key: string): string {
  return decodeURIComponent(key.replaceAll('+', '%20'));
}

/**
 * Delete an S3 object. No error would be thrown if the object does not exist.
 * @param s3 S3Client
 * @param bucket bucket name
 * @param key object key (without URL encoding)
 * @returns S3 command output
 */
export async function deleteS3Object(s3: S3Client, bucket: string, key: string): Promise<DeleteObjectCommandOutput> {
  return s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Copy S3 object
 * @param s3 S3Client
 * @param srcBucket bucket of the source object
 * @param srcEncodedKey key (URL encoded) of the source object
 * @param destDecodedKey key (NOT URL encoded) of the destination object
 * @param metadata metadata to be set on the destination object, if it is not specified then the metadata from source object will be copied
 * @param destBucket bucket of the destination object, if it is not specified then the source bucket will be used
 * @returns S3 command output
 */
export async function copyS3Object(s3: S3Client, srcBucket: string, srcEncodedKey: string, destDecodedKey: string, metadata?: Record<string, string>, destBucket?: string): Promise<CopyObjectCommandOutput> {
  return s3.send(
    new CopyObjectCommand({
      CopySource: `${srcBucket}/${srcEncodedKey}`,
      Bucket: destBucket || srcBucket,
      Key: destDecodedKey,
      MetadataDirective: metadata ? 'REPLACE' : 'COPY',
      Metadata: metadata,
    }),
  );
}

/**
 * Get details of the S3 object without downloading its content.
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @param treat403AsNonExisting If this flag is true, then 403 response from AWS is considered as the object does not exist.
 *                              Otherwise, only 404 response from AWS is considered as the object does not exist.
 *                              Background info: If the caller does not have s3:ListBucket permission, AWS responses with 403 when the object does not exists.
 * @returns S3 command output, or `undefined` if the object does not exist.
 */
export async function headS3Object(s3: S3Client, bucket: string, key: string, treat403AsNonExisting = false): Promise<HeadObjectCommandOutput | undefined> {
  try {
    return await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (error) {
    if ((error as PossibleAwsError).$metadata?.httpStatusCode === 404 || treat403AsNonExisting && (error as PossibleAwsError).$metadata?.httpStatusCode === 403) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Get the content of the S3 object as a string.
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @param encoding Text encoding of the content, if not specified then "utf8" will be used
 * @returns Content of the S3 object as a string.
 * If the object does not have content, an empty string will be returned.
 * If the object does not exist, `undefined` will be returned.
 */
export async function getS3ObjectContentString(s3: S3Client, bucket: string, key: string, encoding = 'utf8'): Promise<string | undefined> {
  try {
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return data?.Body ? data.Body.transformToString(encoding) : '';  
  } catch (error) {
    if ((error as PossibleAwsError).$metadata?.httpStatusCode === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * Get the content of the S3 object as a Uint8Array.
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @param range See https://www.rfc-editor.org/rfc/rfc9110.html#name-range
 * @param encoding Text encoding of the content, if not specified then "utf8" will be used
 * @returns Content of the S3 object as a Uint8Array.
 * If the object does not have content, an empty Uint8Array will be returned.
 * If the object does not exist, `undefined` will be returned.
 */
export async function getS3ObjectContentByteArray(s3: S3Client, bucket: string, key: string, range?: string): Promise<Uint8Array | undefined> {
  try {
    const data = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: range,
      }),
    );
    return data?.Body ? data.Body.transformToByteArray(): new Uint8Array();
  } catch (error) {
    if ((error as PossibleAwsError).$metadata?.httpStatusCode === 404) {
      return undefined;
    }
    throw error;
  }
}

export type S3ObjectSummary = Exclude<ListObjectsV2CommandOutput['Contents'], undefined>[0];

/**
 * Scan S3 bucket and return both normal objects and directory objects.
 * Directory objects have keys ending with '/'.
 * This function handles pagination automatically.
 * @param s3 S3Client
 * @param bucket Name of the bucket
 * @param options Optional settings for the scan
 * @returns Array of normal and directory objects found
 */
export async function scanS3Bucket(s3: S3Client, bucket: string, options?: Partial<Exclude<ListObjectsV2CommandInput, 'Bucket'|'ContinuationToken'>>): Promise<Array<S3ObjectSummary>> {
  return await fetchAllByContinuationToken(() => s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    ...options,
  })));
}

/**
 * Scan S3 bucket and return both normal objects and directory objects.
 * Directory objects have keys ending with '/'.
 * This function handles pagination automatically.
 * @param s3 S3Client
 * @param bucket Name of the bucket
 * @param options Optional settings for the scan
 * @param filterFunc Optional filter function to filter out objects based on certain conditions.
 *        This function is called for each paged output during pagination.
 *        For finding few interested objects in a bucket having huge number of object,
 *        utilising this function can avoid keeping too many useless array entries in memory.
 * @returns Array of normal and directory objects found
 */
export async function listS3Objects(
  s3: S3Client,
  bucket: string,
  options?: Partial<Exclude<ListObjectsV2CommandInput, 'Bucket'|'ContinuationToken'>>,
  filterFunc?: (entry: S3ObjectSummary|CommonPrefix) => boolean,
): Promise<{
  contents: S3ObjectSummary[];
  commonPrefixes: CommonPrefix[];
}> {
  const result = {
    contents: new Array<S3ObjectSummary>(),
    commonPrefixes: new Array<CommonPrefix>(),
  };
  await PromiseUtils.repeat(
    () => s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ...options,
    })),
    response => response.NextContinuationToken ? { ContinuationToken: response.NextContinuationToken } : null,
    (collection, response: ListObjectsV2CommandOutput) => {
      if (response.Contents) {
        collection.contents.push(...(filterFunc ? response.Contents.filter((entry) => filterFunc(entry)) : response.Contents));
      }
      if (response.CommonPrefixes) {
        collection.commonPrefixes.push(...(filterFunc ? response.CommonPrefixes.filter((entry) => filterFunc(entry)) : response.CommonPrefixes));
      }
      return collection;
    },
    result,
  );
  return result;
}

/**
 * Store content into S3.
 * @param s3 S3Client
 * @param bucket Name of the bucket
 * @param key Key of the object
 * @param content Content of the object, or undefined if the object is a directory.
 * @param options Additional options
 * @returns PutObjectOutput
 */
export async function putS3Object(s3: S3Client, bucket: string, key: string, content: PutObjectCommandInput['Body'], options?: Partial<Exclude<PutObjectCommandInput, 'Bucket'>>): Promise<PutObjectOutput> {
  return await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ...options,
  }));
}

/**
 * Generate a pre-signed URL for downloading the S3 object
 * @param s3 S3Client
 * @param bucket Name of the bucket
 * @param key Key of the object
 * @param expiresIn The number of seconds before the presigned URL expires
 * @param options Additional options. For example, you can specify content-disposition and content-type in it.
 * @returns An URL that can be used to download the S3 object.
 */
export async function generatePresignedUrlForDownloading(s3: S3Client, bucket: string, key: string, expiresIn?: number, options?: Omit<ConstructorParameters<typeof GetObjectCommand>[0], 'Bucket'|'Key'>): Promise<string> {
  const command = new GetObjectCommand({
    ...options,
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
};

/**
 * Generate a pre-signed URL for uploading content to the S3 object
 * @param s3 S3Client
 * @param bucket Name of the bucket
 * @param key Key of the object
 * @param expiresIn The number of seconds before the presigned URL expires
 * @param options Additional options
 * @returns An URL that can be used to upload content to the S3 object.
 */
export async function generatePresignedUrlForUploading(s3: S3Client, bucket: string, key: string, expiresIn?: number, options?: Omit<ConstructorParameters<typeof PutObjectCommand>[0], 'Bucket'|'Key'>): Promise<string> {
  const command = new PutObjectCommand({
    ...options,
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
};