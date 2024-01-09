import { SSM } from '@aws-sdk/client-ssm';
import { PossibleAwsError } from './aws-utils';

/**
 * Get a parameter from SSM Parameter Store.
 * If the parameter is not found and a fallbackValue is given, the fallbackValue will be returned.
 * If the parameter is not found and there is no fallbackValue given, `undefined` will be returned.
 * If any other error occurs, the error will be thrown.
 * @param ssm SSM
 * @param parameterName Name/path of the parameter to get from SSM Parameter Store.
 * @param fallbackValue the value to return if the parameter is not found. If not given, `undefined` will be returned when the parameter is not found.
 * @returns Value of the parameter, or the fallbackValue, or undefined
 */
export async function getSsmParameter(ssm: SSM, parameterName: string, fallbackValue?: string): Promise<string|undefined> {
  try {
    const output = await ssm.getParameter({
      Name: parameterName,
      WithDecryption: true,
    });
    return output.Parameter?.Value ?? fallbackValue;
  } catch (error) {
    if ((error as PossibleAwsError).name === 'ParameterNotFound') {
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Get a parameter from SSM Parameter Store and return it parsed as JSON.
 * If the parameter is not found and a fallbackValue is given, the fallbackValue will be returned.
 * If the parameter is not found and there is no fallbackValue given, `undefined` will be returned.
 * If any other error occurs, the error will be thrown.
 * @param ssm SSM
 * @param parameterName Name/path of the parameter to get from SSM Parameter Store.
 * @param fallbackValue the value to return if the parameter is not found. If not given, `undefined` will be returned  when the parameter is not found.
 * @returns Value of the parameter parsed as JSON, or the fallbackValue, or undefined
 */
export async function getSsmParameterParsed<T>(ssm: SSM, parameterName: string, fallbackValue?: T): Promise<T|undefined> {
  const stringValue = await getSsmParameter(ssm, parameterName);
  if (stringValue === undefined) {
    return fallbackValue;
  }
  return JSON.parse(stringValue) as T;
}