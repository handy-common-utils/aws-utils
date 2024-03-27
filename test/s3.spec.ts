import { S3Client } from '@aws-sdk/client-s3';
import { expect } from 'chai';

import { decodeS3ObjectKey, encodeS3ObjectKey, getS3ObjectContentByteArray, headS3Object, scanS3Bucket } from '../src/s3';

const testBucketName = process.env.TEST_BUCKET_NAME;
const testExistingObjectKey = process.env.TEST_EXISTING_OBJECT_KEY;
const testNonExistingObjectKey = process.env.TEST_NON_EXISTING_OBJECT_KEY;

describe('s3', () => {
  it('should decodeS3ObjectKey work', () => {
    expect(decodeS3ObjectKey('path/to+a+name.jpg')).to.equal('path/to a name.jpg');
  });
  it('should encodeS3ObjectKey work', () => {
    expect(encodeS3ObjectKey('path/to a name.jpg')).to.equal('path/to+a+name.jpg');
  });
  it('should encodeS3ObjectKey and decodeS3ObjectKey round trip work', () => {
    let key = 'xyz/abc/123/my-name.jpg';
    expect(decodeS3ObjectKey(encodeS3ObjectKey(key))).to.equal(key);
    key = 'xyz/abc/with space in path/with space in name.jpg';
    expect(decodeS3ObjectKey(encodeS3ObjectKey(key))).to.equal(key);
    key = 'xyz/abc/with space in path/with_plus+sign.jpg';
    expect(decodeS3ObjectKey(encodeS3ObjectKey(key))).to.equal(key);
    key = 'xyz/abc/with space in path/with中文.jpg';
    expect(decodeS3ObjectKey(encodeS3ObjectKey(key))).to.equal(key);
  });

  if (testBucketName && testExistingObjectKey && testNonExistingObjectKey) {
    it('should scanS3Bucket work', async () => {
      const s3 = new S3Client();
      const objs = await scanS3Bucket(s3, testBucketName);
      // console.log(objs);
      expect(objs.length).to.be.greaterThan(0);
    });
    it('should headS3Object work with existing object', async () => {
      const s3 = new S3Client();
      const result = await headS3Object(s3, testBucketName, testExistingObjectKey);
      expect(result!.$metadata?.httpStatusCode).to.equal(200);
    });
    it('should getS3ObjectContentByteArray work with existing object', async () => {
      const s3 = new S3Client();
      const result = await getS3ObjectContentByteArray(s3, testBucketName, testExistingObjectKey);
      expect(result!.length).to.be.greaterThan(0);
    });
    it('should headS3Object work with non-existing object', async () => {
      const s3 = new S3Client();
      const result = await getS3ObjectContentByteArray(s3, testBucketName, testNonExistingObjectKey);
      expect(result).to.be.undefined;
    });
    it('should getS3ObjectContentByteArray work with non-existing object', async () => {
      const s3 = new S3Client();
      const result = await getS3ObjectContentByteArray(s3, testBucketName, testNonExistingObjectKey);
      expect(result).to.be.undefined;
    });
  } else {
    console.log('Skipping s3 tests because TEST_BUCKET_NAME, TEST_EXISTING_OBJECT_KEY, and TEST_NON_EXISTING_OBJECT_KEY are not set');
  }

});
