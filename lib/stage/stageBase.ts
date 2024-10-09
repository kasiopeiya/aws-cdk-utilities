import { type Stack, Stage, type Environment } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { type Config } from '../../config'
import { MainAppStack } from '../stack/mainAppStack'
import { BaseStack } from '../stack/baseStack'

export abstract class StageBase extends Stage {
  createCommonStacks(scope: Construct, config: Config, env: Environment): Record<string, Stack> {
    const prefix: string = config.prefix

    const baseStack = new BaseStack(scope, `${prefix}-base-stack`, { env })

    const mainAppStack = new MainAppStack(scope, `${prefix}-lambda-stack`, {
      env,
      lambdaSrcDirPath: './resources/lambda/base'
    })

    return {
      baseStack,
      mainAppStack
    }
  }
}
