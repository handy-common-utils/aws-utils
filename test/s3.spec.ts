import { expect } from 'chai';

import { decodeS3ObjectKey, encodeS3ObjectKey } from '../src/s3';

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
  // it('should scanS3Bucket', async () => {
  //   const s3 = new S3Client();
  //   const objs = await scanS3Bucket(s3, '');
  //   console.log(objs);
  //   console.log(objs.length);
  // });
});
