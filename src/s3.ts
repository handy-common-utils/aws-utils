import { CopyObjectCommand, CopyObjectCommandOutput, DeleteObjectCommand, DeleteObjectCommandOutput, GetObjectCommand, HeadObjectCommand, HeadObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';

import { PossibleAwsError } from './aws-utils';

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
 * Get details of the S3 object without downloading its content
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @returns S3 command output
 */
export async function headS3Object(s3: S3Client, bucket: string, key: string): Promise<HeadObjectCommandOutput> {
  return s3.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Get the content of the S3 object as a string.
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @param encoding Text encoding of the content, if not specified then "utf8" will be used
 * @returns Content of the S3 object as a string. If the object does not have content, an empty string will be returned.
 */
export async function getS3ObjectContentString(s3: S3Client, bucket: string, key: string, encoding = 'utf8'): Promise<string> {
  const data = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  return data?.Body ? data.Body.transformToString(encoding) : '';
}

/**
 * Get the content of the S3 object as a string.
 * @param s3 S3Client
 * @param bucket bucket of the source object
 * @param key object key (without URL encoding)
 * @param range See https://www.rfc-editor.org/rfc/rfc9110.html#name-range
 * @param encoding Text encoding of the content, if not specified then "utf8" will be used
 * @returns Content of the S3 object as a string. If the object does not have content, an empty string will be returned.
 */
export async function getS3ObjectContentByteArray(s3: S3Client, bucket: string, key: string, range?: string): Promise<Uint8Array> {
  const data = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    }),
  );
  return data?.Body ? data.Body.transformToByteArray(): new Uint8Array();
}