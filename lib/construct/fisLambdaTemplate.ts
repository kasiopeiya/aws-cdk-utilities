import { Construct } from 'constructs'
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_iam as iam } from 'aws-cdk-lib'
import { aws_fis as fis } from 'aws-cdk-lib'
import { aws_logs as logs } from 'aws-cdk-lib'
import { aws_lambda as lambda } from 'aws-cdk-lib'
import { aws_lambda_nodejs as nodejsLambda } from 'aws-cdk-lib'

export interface FisLambdaTemplateProps {
  /** 対象となるLambda関数のタグ名 */
  targetTagName?: string
  /** 対象となるLambda関数のタグ値 */
  targetTagValue?: string
  /** 障害を注入する時間 */
  faultInjectionTime?: Duration
  /** 障害を注入する割合(0 ~ 100)% */
  faultInvocationPercentage?: number
  /** Add Latencyでのみ使用、障害注入を遅延させる時間 */
  startupDelayTime?: Duration
  /** 実験準備用Lambda関数の実装パス */
  setupLambdaPath?: string
  /** 実験設定削除用Lambda関数の実装パス */
  cleanupLambdaPath?: string
}

/**
 * FISのLambda Action実験テンプレートと実験に必要なリソースの構築
 */
export class FisLambdaTemplate extends Construct {
  constructor(scope: Construct, id: string, props?: FisLambdaTemplateProps) {
    super(scope, id)

    props ??= {}
    props.targetTagName ??= 'FisLambdaTargetFlg'
    props.targetTagValue ??= 'true'
    props.faultInjectionTime ??= Duration.minutes(5)
    props.faultInvocationPercentage ??= 100
    props.startupDelayTime = Duration.millis(0)

    // Validation
    if (props.faultInvocationPercentage < 0 || props.faultInvocationPercentage > 100) {
      throw new Error('"faultInvocationPercentage" must be between 0 and 100')
    }

    /*
    /* S3
    -------------------------------------------------------------------------- */
    // Lambda - FIS間で実験設定ファイルを中継するためのバケット
    const fisBucket = new s3.Bucket(this, 'Bucket', {
      bucketName: `${Stack.of(this).stackName}-fis-bucket`,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    })

    /*
    /* CloudWatch Logs
    -------------------------------------------------------------------------- */
    // FISログ保管用
    const fisLogGroup = new logs.LogGroup(this, 'LogGroup', {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY
    })

    /*
    /* IAM
    -------------------------------------------------------------------------- */
    const fisCloudWatchStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogDelivery',
        'logs:PutResourcePolicy',
        'logs:DescribeResourcePolicies',
        'logs:DescribeLogGroups'
      ],
      resources: ['*']
    })
    const fisS3Statement = new iam.PolicyStatement({
      sid: 'AllowWritingAndDeletingObjectFromConfigLocation',
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:DeleteObject'],
      resources: [`${fisBucket.bucketArn}`, `${fisBucket.bucketArn}/*`]
    })
    const fisResourceTaggingStatement = new iam.PolicyStatement({
      sid: 'AllowFisToDoTagLookups',
      effect: iam.Effect.ALLOW,
      actions: ['tag:GetResources'],
      resources: ['*']
    })
    const fisLambdaStatement = new iam.PolicyStatement({
      sid: 'AllowFisToInspectLambdaFunctions',
      effect: iam.Effect.ALLOW,
      actions: ['lambda:GetFunction'],
      resources: ['*']
    })

    const fisRole = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('fis.amazonaws.com')
    })
    fisRole.addToPolicy(fisCloudWatchStatement)
    fisRole.addToPolicy(fisS3Statement)
    fisRole.addToPolicy(fisResourceTaggingStatement)
    fisRole.addToPolicy(fisLambdaStatement)

    /*
    /* FIS
    -------------------------------------------------------------------------- */
    // Targets
    const targetProps: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:lambda:function',
      selectionMode: 'ALL',
      resourceTags: { [props.targetTagName]: props.targetTagValue }
    }

    // Action: Latency
    const latencyActionProps: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty = {
      actionId: 'aws:lambda:invocation-add-delay',
      description: 'Add Delay in Lambda Startup',
      parameters: {
        duration: `PT${props.faultInjectionTime.toMinutes()}M`,
        invocationPercentage: `${props.faultInvocationPercentage}`,
        startupDelayMilliseconds: `${props.startupDelayTime.toMilliseconds()}`
      },
      targets: {
        Functions: 'TargetTaggedLambda'
      }
    }

    // Experiment: Latency
    new fis.CfnExperimentTemplate(this, 'AddLatency', {
      description: 'Lambda Latency Injection Fault',
      roleArn: fisRole.roleArn,
      stopConditions: [
        {
          source: 'none'
        }
      ],
      actions: {
        addLatency: latencyActionProps
      },
      targets: {
        TargetTaggedLambda: targetProps
      },
      logConfiguration: {
        cloudWatchLogsConfiguration: {
          LogGroupArn: fisLogGroup.logGroupArn
        },
        logSchemaVersion: 2
      },
      experimentOptions: {
        accountTargeting: 'single-account',
        emptyTargetResolutionMode: 'fail'
      },
      tags: {
        Name: 'Lambda Latency Injection Fault',
        Stackname: Stack.of(this).stackName
      }
    })

    // Action: Invocation
    const invocationActionProps: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty = {
      actionId: 'aws:lambda:invocation-error',
      description: 'Cause invocation errors',
      parameters: {
        duration: `PT${props.faultInjectionTime.toMinutes()}M`,
        invocationPercentage: `${props.faultInvocationPercentage}`,
        preventExecution: 'true'
      },
      targets: {
        Functions: 'TargetTaggedLambda'
      }
    }

    // Experiment: Invocation
    new fis.CfnExperimentTemplate(this, 'InvocationError', {
      description: 'Lambda Latency Injection Fault',
      roleArn: fisRole.roleArn,
      stopConditions: [
        {
          source: 'none'
        }
      ],
      actions: {
        invocationError: invocationActionProps
      },
      targets: {
        TargetTaggedLambda: targetProps
      },
      logConfiguration: {
        cloudWatchLogsConfiguration: {
          LogGroupArn: fisLogGroup.logGroupArn
        },
        logSchemaVersion: 2
      },
      experimentOptions: {
        accountTargeting: 'single-account',
        emptyTargetResolutionMode: 'fail'
      },
      tags: {
        Name: 'Cause invocation errors',
        Stackname: Stack.of(this).stackName
      }
    })

    /*
    /* Lambda
    -------------------------------------------------------------------------- */
    const updateLambdaPolicyStatement = new iam.PolicyStatement({
      actions: [
        'lambda:GetFunction',
        'lambda:UpdateFunctionConfiguration',
        'lambda:GetLayerVersion',
        'lambda:TagResource',
        'lambda:UntagResource'
      ],
      resources: ['*']
    })

    // FIS実験設定追加用Lambda関数
    if (props.setupLambdaPath !== undefined) {
      const setupLambdaFunc = new nodejsLambda.NodejsFunction(this, 'SetupLambda', {
        functionName: `${Stack.of(this).stackName}-fis-lambda-setup`,
        entry: props.setupLambdaPath,
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambda.Architecture.ARM_64,
        timeout: Duration.minutes(3),
        loggingFormat: lambda.LoggingFormat.JSON,
        systemLogLevelV2: lambda.SystemLogLevel.WARN,
        environment: {
          BUCKET_NAME: fisBucket.bucketName
        }
      })
      setupLambdaFunc.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['iam:AttachRolePolicy'],
          resources: ['*']
        })
      )
      setupLambdaFunc.addToRolePolicy(updateLambdaPolicyStatement)

      // LogGroup
      new logs.LogGroup(this, 'SetupLambdaLogGroup', {
        logGroupName: `/aws/lambda/${setupLambdaFunc.functionName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: logs.RetentionDays.ONE_DAY
      })
    }

    // FIS実験設定削除用Lambda関数
    if (props.cleanupLambdaPath !== undefined) {
      const cleanupLambdaFunc = new nodejsLambda.NodejsFunction(this, 'CleanupLambda', {
        functionName: `${Stack.of(this).stackName}-fis-lambda-cleanup`,
        entry: props.cleanupLambdaPath,
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambda.Architecture.ARM_64,
        timeout: Duration.minutes(3),
        loggingFormat: lambda.LoggingFormat.JSON,
        systemLogLevelV2: lambda.SystemLogLevel.WARN
      })
      cleanupLambdaFunc.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['iam:DetachRolePolicy'],
          resources: ['*']
        })
      )
      cleanupLambdaFunc.addToRolePolicy(updateLambdaPolicyStatement)

      // LogGroup
      new logs.LogGroup(this, 'CleanupLambdaLogGroup', {
        logGroupName: `/aws/lambda/${cleanupLambdaFunc.functionName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: logs.RetentionDays.ONE_DAY
      })
    }
  }
}
