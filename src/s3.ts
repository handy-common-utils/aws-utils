import { CopyObjectCommand, CopyObjectCommandOutput, DeleteObjectCommand, DeleteObjectCommandOutput, GetObjectCommand, HeadObjectCommand, HeadObjectCommandOutput, ListObjectsV2Command, ListObjectsV2CommandInput, PutObjectCommand, PutObjectCommandInput, PutObjectOutput, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { fetchAllByContinuationToken } from './aws-utils';

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

export interface S3ObjectSummary {
  Key: string;
  /**
   * Size of the object, it could be zero for directory objects
   */
  Size: number;
  LastModified: Date;
  ETag: string;
  StorageClass: string;
}

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
export async function generatePresignedUrlForDownloading(s3: S3Client, bucket: string, key: string, expiresIn: number, options?: Omit<ConstructorParameters<typeof GetObjectCommand>[0], 'Bucket'|'Key'>): Promise<string> {
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
 * @returns An URL that can be used to upload content to the S3 object.
 */
export async function generatePresignedUrlForUploading(s3: S3Client, bucket: string, key: string, expiresIn: number): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};