import { Construct } from 'constructs'
import { type NodejsFunctionProps, NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { type LogGroupProps, LogGroup } from 'aws-cdk-lib/aws-logs'
import * as lambda_ from 'aws-cdk-lib/aws-lambda'
import { RemovalPolicy } from 'aws-cdk-lib'

interface MyNodejsFunctionProps {
  lambda: NodejsFunctionProps
  logs?: LogGroupProps
}

/**
 * 自作Lambda関数Construct
 * 関数削除後にCloudWatch Logsが残らないようにしている
 */
export class MyNodejsFunction extends Construct {
  public readonly func: NodejsFunction
  public readonly logGroup: LogGroup

  constructor(scope: Construct, id: string, props: MyNodejsFunctionProps) {
    super(scope, id)

    // Lambda Layer
    const layer = new lambda_.LayerVersion(this, 'LambdaLayer', {
      removalPolicy: RemovalPolicy.DESTROY,
      code: lambda_.Code.fromAsset('resources/layer/logging'),
      compatibleRuntimes: [lambda_.Runtime.NODEJS_20_X],
      compatibleArchitectures: [lambda_.Architecture.ARM_64]
    })

    // Lambda Function
    this.func = new NodejsFunction(this, 'LambdaFunc', {
      ...props.lambda,
      runtime: props.lambda.runtime ?? lambda_.Runtime.NODEJS_20_X,
      architecture: props.lambda.architecture ?? lambda_.Architecture.ARM_64
    })
    this.func.addLayers(layer)

    // CloudWatch Logs: LogGroup
    this.logGroup = new LogGroup(this, 'LogGroup', {
      ...props.logs,
      logGroupName: `/aws/lambda/${this.func.functionName}`,
      removalPolicy: props.logs?.removalPolicy ?? RemovalPolicy.DESTROY
    })
  }
}
