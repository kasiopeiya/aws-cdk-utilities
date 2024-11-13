import { Construct } from 'constructs'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import { aws_events as events } from 'aws-cdk-lib'
import { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib'
import { aws_logs as logs } from 'aws-cdk-lib'
import { aws_lambda as lambda } from 'aws-cdk-lib'
import { aws_lambda_nodejs as nodejsLambda } from 'aws-cdk-lib'
import { aws_events_targets as targets } from 'aws-cdk-lib'

export interface CfnEventLoggerProps {
  /** Lambda関数実装のパス */
  lambdaEntry: string
}

/**
 * CloudFormationのデプロイエラー時にスタックイベントをS3に保存する仕組みを構築
 */
export class CfnEventLogger extends Construct {
  constructor(scope: Construct, id: string, props: CfnEventLoggerProps) {
    super(scope, id)

    /*
    /* Lambda
    -------------------------------------------------------------------------- */
    const bucket = new s3.Bucket(this, 'EventLogBucket', {
      removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    })

    /*
    /* Lambda
    -------------------------------------------------------------------------- */
    const lambdaFunc = new nodejsLambda.NodejsFunction(this, 'LambdaFunc', {
      entry: props.lambdaEntry,
      handler: 'lambdaHandler',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.minutes(3),
      loggingFormat: lambda.LoggingFormat.JSON,
      systemLogLevelV2: lambda.SystemLogLevel.WARN,
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    })
    bucket.grantWrite(lambdaFunc)
    lambdaFunc.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudformation:DescribeStackEvents'],
        resources: ['*']
      })
    )

    // LogGroup
    new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${lambdaFunc.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY
    })

    /*
    /* Event Bridge
    -------------------------------------------------------------------------- */
    const rule = new events.Rule(this, 'Rule', {
      eventPattern: {
        source: ['aws.cloudformation'],
        detailType: ['CloudFormation Stack Status Change'],
        detail: {
          'status-details': {
            status: [
              'CREATE_FAILED',
              'UPDATE_ROLLBACK_COMPLETE',
              'UPDATE_ROLLBACK_FAILED',
              'DELETE_FAILED'
            ]
          }
        }
      }
    })
    rule.addTarget(new targets.LambdaFunction(lambdaFunc))
  }
}
