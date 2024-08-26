import { expect } from 'chai';

import { isPossibleAwsThrottlingError, withRetry } from '../src/aws-utils';

const v3ThrottlingErrorWith400 = {
  __type: 'com.amazon.coral.availability#ThrottlingException',
  $fault: 'client',
  $metadata: {
    attempts: 3,
    httpStatusCode: 400,
    requestId: 'bcd054d2-56c3-4237-9c28-89deabfe8c0b',
    totalRetryDelay: 421,
  },
  message: 'Rate exceeded',
  name: 'ThrottlingException',
};

describe('isPossibleAwsThrottlingError(...)', () => {
  it('works for AWS SDK v3 error with 400', () => {
    expect(isPossibleAwsThrottlingError(v3ThrottlingErrorWith400)).to.equal(true);
  });
});

describe('withRetry(...)', () => {
  it('does not retry for AWS SDK v3 error with 400 when the statusCodes parameter is not specified', async () => {
    let count = 0;
    try {
      await withRetry(async () => {
        count ++;
        throw v3ThrottlingErrorWith400;
      });
    } catch (error) {
      expect(error).to.deep.equal(v3ThrottlingErrorWith400);
    }
    expect(count).to.equal(1);
  });
  it('retries for AWS SDK v3 error with 400 when the statusCodes parameter is specified', async function() {
    let count = 0;
    try {
      await withRetry(async () => {
        count ++;
        throw v3ThrottlingErrorWith400;
      }, [100, 100, 100, 100, 100], [400, 429]);
    } catch (error) {
      expect(error).to.deep.equal(v3ThrottlingErrorWith400);
    }
    expect(count).to.equal(6);
  });
});
