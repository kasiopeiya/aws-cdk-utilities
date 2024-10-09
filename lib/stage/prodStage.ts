import { Stack, type StageProps, type IAspect, Aspects, type Environment } from 'aws-cdk-lib'
import { type IConstruct, type Construct } from 'constructs'

import { prodConfig, type Config } from '../../config'
import { StageBase } from './stageBase'

export class ProdStage extends StageBase {
  public readonly stacks: Record<string, Stack>
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)
    const config: Config = prodConfig
    const env: Environment = props.env ?? prodConfig.env
    this.stacks = this.createStacks(config, env)

    // スタックの削除保護
    for (const stack of Object.values(this.stacks)) {
      Aspects.of(stack).add(new AddTerminationProtection(false))
    }
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

/**
 * スタックの削除保護を設定するアスペクト
 */
class AddTerminationProtection implements IAspect {
  private readonly terminationProtection: boolean
  constructor(terminationProtection: boolean) {
    this.terminationProtection = terminationProtection
  }

  public visit(node: IConstruct): void {
    // スタックの場合のみ termination protection を設定
    if (Stack.isStack(node)) {
      node.terminationProtection = this.terminationProtection
    }
  }
}
