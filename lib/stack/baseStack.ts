import { Stack, type StackProps } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { Ec2AutoStartStop } from '../construct/ec2AutoStartStop'
import { MyS3Bucket } from '../construct/myS3'

/**
 * ステートフルなリソースを構築する
 */
export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /*
    * EC2インスタンス自動起動停止
    -------------------------------------------------------------------------- */
    new MyS3Bucket(this, 'Bucket', {})

    /*
    * EC2インスタンス自動起動停止
    -------------------------------------------------------------------------- */
    new Ec2AutoStartStop(this, 'Ec2AutoStartStop')
  }
}
