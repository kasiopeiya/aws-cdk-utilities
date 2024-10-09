import { type Stack, type StageProps, type Environment } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { devConfig, type Config } from '../../config'
import { StageBase } from './stageBase'

export class DevStage extends StageBase {
  public readonly stacks: Record<string, Stack>
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)
    const config: Config = devConfig
    const env: Environment = props.env ?? devConfig.env
    this.stacks = this.createStacks(config, env)
  }

  createStacks(config: Config, env: Environment): Record<string, Stack> {
    // 各環境にのみデプロイするスタックを生成
    // const hogeStack = new HogeStack(this, 'HogeStack')
    return {
      ...super.createCommonStacks(this, config, env)
      // hogeStack
    }
  }
}
