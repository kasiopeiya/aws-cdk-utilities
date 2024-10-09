import { Stack, type StackProps } from 'aws-cdk-lib'
import { type Construct } from 'constructs'

import { MyNodejsFunction } from '../construct/mylambda'

interface MainAppStackProps extends StackProps {
  lambdaSrcDirPath: string
}

/**
 * メインアプリのスタック
 * ステートレスなものを中心に構築する
 */
export class MainAppStack extends Stack {
  constructor(scope: Construct, id: string, props: MainAppStackProps) {
    super(scope, id, props)

    /*
    * Lambda
    -------------------------------------------------------------------------- */
    const func = new MyNodejsFunction(this, 'LambdaFunc', {
      lambda: {
        entry: `${props.lambdaSrcDirPath}/index.ts`,
        handler: 'handler',
        bundling: {
          externalModules: ['winston']
        },
        depsLockFilePath: `${props.lambdaSrcDirPath}/package-lock.json`,
        environment: {
          TABLE_NAME: 'hogehoge'
        }
      }
    })

    this.exportValue(func.func.functionName, { name: 'FunctionName' })
  }
}
