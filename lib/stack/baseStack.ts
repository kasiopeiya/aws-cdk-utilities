import { Stack, type StackProps } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { MyS3Bucket } from '../construct/myS3'

/**
 * ステートフルなリソースを構築する
 */
export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /*
    * S3
    -------------------------------------------------------------------------- */
    new MyS3Bucket(this, 'Bucket1', {})
    new MyS3Bucket(this, 'Bucket2', {})
  }
}
