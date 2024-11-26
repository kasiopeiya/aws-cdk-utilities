import { Stack, type StackProps } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { Ec2AutoStartStop } from '../construct/ec2AutoStartStop'
import { CfnEventLogger } from '../construct/cfnEventLogger'
import { FisLambdaTemplate } from '../construct/fisLambdaTemplate'

/**
 * ステートフルなリソースを構築する
 */
export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    /*
    * EC2インスタンス自動起動停止
    -------------------------------------------------------------------------- */
    new Ec2AutoStartStop(this, 'Ec2AutoStartStop')

    /*
    * CloudFormationスタックイベント自動保存
    -------------------------------------------------------------------------- */
    new CfnEventLogger(this, 'CfnEventLogger', {
      lambdaEntry: './resources/lambda/cfnEventLogger/index.ts'
    })

    /*
    * FIS Lambda実験テンプレート
    -------------------------------------------------------------------------- */
    new FisLambdaTemplate(this, 'FisLambdaTemplate', {
      setupLambdaPath: './resources/lambda/fisLambdaActionSetup/index.ts',
      cleanupLambdaPath: './resources/lambda/fisLambdaActionCleanUp/index.ts'
    })
  }
}
