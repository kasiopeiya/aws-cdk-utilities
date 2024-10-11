import { Construct } from 'constructs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as rg from 'aws-cdk-lib/aws-resourcegroups'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Stack } from 'aws-cdk-lib'

export class CronSchedule {
  public static readonly WEEKDAY6AM = CronSchedule.of('cron(0, 6 ? * MON-FRI *)')
  public static readonly WEEKDAY7AM = CronSchedule.of('cron(0, 7 ? * MON-FRI *)')
  public static readonly WEEKDAY8AM = CronSchedule.of('cron(0, 8 ? * MON-FRI *)')
  public static readonly WEEKDAY9AM = CronSchedule.of('cron(0, 9 ? * MON-FRI *)')
  public static readonly EVERYDAY6AM = CronSchedule.of('cron(0, 6 ? * * *)')
  public static readonly EVERYDAY7AM = CronSchedule.of('cron(0, 7 ? * * *)')
  public static readonly EVERYDAY8AM = CronSchedule.of('cron(0, 8 ? * * *)')
  public static readonly EVERYDAY9AM = CronSchedule.of('cron(0, 9 ? * * *)')
  public static readonly WEEKDAY9PM = CronSchedule.of('cron(0, 21 ? * MON-FRI *)')
  public static readonly WEEKDAY10PM = CronSchedule.of('cron(0, 22 ? * MON-FRI *)')
  public static readonly WEEKDAY11PM = CronSchedule.of('cron(0, 23 ? * MON-FRI *)')
  public static readonly EVERYDAY9PM = CronSchedule.of('cron(0, 21 ? * * *)')
  public static readonly EVERYDAY10PM = CronSchedule.of('cron(0, 22 ? * * *)')
  public static readonly EVERYDAY11PM = CronSchedule.of('cron(0, 23 ? * * *)')
  public static of(cron: string) {
    return new CronSchedule(cron)
  }
  protected constructor(public readonly cron: string) {}
}

export interface Ec2AutoStartStopProps {
  /** 起動のスケジュール (cron形式) */
  startSchedule?: CronSchedule
  /** 停止のスケジュール (cron形式) */
  stopSchedule?: CronSchedule
}

/**
 * EC2インスタンスを自動起動停止する仕組みを構築する
 * Systems Manager Maintenance WindowとAutomationを使用
 * 起動停止対象はインスタンスのtagをベースに判断
 */
export class Ec2AutoStartStop extends Construct {
  constructor(scope: Construct, id: string, props?: Ec2AutoStartStopProps) {
    super(scope, id)

    props ??= {}
    props.startSchedule ??= CronSchedule.WEEKDAY9AM
    props.stopSchedule ??= CronSchedule.EVERYDAY10PM

    const region = Stack.of(this).region
    const account = Stack.of(this).account
    const stackName = Stack.of(this).stackName

    const startTagName = 'AutoStart'
    const stopTagName = 'AutoStop'

    /*
    /* Resource Group
    -------------------------------------------------------------------------- */
    // tag:AutoStart
    const autoStartResourceGroup = new rg.CfnGroup(this, 'AutoStartRG', {
      name: `${stackName}-AutoStart`,
      resourceQuery: {
        type: 'TAG_FILTERS_1_0',
        query: {
          resourceTypeFilters: ['AWS::EC2::Instance'],
          tagFilters: [
            {
              key: startTagName,
              values: ['true']
            }
          ]
        }
      }
    })

    // tag:AutoStop
    const autoStopResourceGroup = new rg.CfnGroup(this, 'AutoStopRG', {
      name: `${stackName}-AutoStop`,
      resourceQuery: {
        type: 'TAG_FILTERS_1_0',
        query: {
          resourceTypeFilters: ['AWS::EC2::Instance'],
          tagFilters: [
            {
              key: stopTagName,
              values: ['true']
            }
          ]
        }
      }
    })

    /*
    /* IAM
    -------------------------------------------------------------------------- */
    const automationExecutionPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:StartAutomationExecution',
        'ssm:GetAutomationExecution',
        'ssm:DescribeAutomationExecutions'
      ],
      resources: ['*']
    })

    const readRGPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'resource-groups:ListGroups',
        'resource-groups:ListGroupResources',
        'resource-groups:GetGroup',
        'resource-groups:GetGroupQuery',
        'resource-groups:SearchResources',
        'tag:Get*'
      ],
      resources: ['*']
    })

    const describeInstancesPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ec2:DescribeInstanceStatus'],
      resources: ['*']
    })

    const startInstanceRole = new iam.Role(this, 'StartInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      inlinePolicies: {
        policy: new iam.PolicyDocument({
          statements: [
            automationExecutionPolicyStatement,
            readRGPolicyStatement,
            describeInstancesPolicyStatement,
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ec2:StartInstances', 'ec2:DescribeInstances'],
              resources: [`arn:aws:ec2:${region}:${account}:instance/*`],
              conditions: {
                StringEquals: {
                  [`ec2:ResourceTag/${startTagName}`]: 'true'
                }
              }
            })
          ]
        })
      }
    })

    const stopInstanceRole = new iam.Role(this, 'StopInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      inlinePolicies: {
        policy: new iam.PolicyDocument({
          statements: [
            automationExecutionPolicyStatement,
            readRGPolicyStatement,
            describeInstancesPolicyStatement,
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ec2:StopInstances', 'ec2:DescribeInstances'],
              resources: [`arn:aws:ec2:${region}:${account}:instance/*`],
              conditions: {
                StringEquals: {
                  [`ec2:ResourceTag/${stopTagName}`]: 'true'
                }
              }
            })
          ]
        })
      }
    })

    /*
    /* EC2インスタンス自動起動
    -------------------------------------------------------------------------- */
    // Maintenance Window
    const maintenanceWindowStart = new ssm.CfnMaintenanceWindow(this, 'MaintenanceWindowStart', {
      name: `${stackName}-AutoStart`,
      schedule: props.startSchedule.cron,
      scheduleTimezone: 'Japan',
      duration: 1,
      cutoff: 0,
      allowUnassociatedTargets: false
    })

    // Target
    const startTarget = new ssm.CfnMaintenanceWindowTarget(this, 'StartWindowTarget', {
      windowId: maintenanceWindowStart.ref,
      resourceType: 'RESOURCE_GROUP',
      targets: [
        {
          key: 'resource-groups:Name',
          values: [autoStartResourceGroup.ref]
        }
      ]
    })

    // Task
    new ssm.CfnMaintenanceWindowTask(this, 'StartTask', {
      windowId: maintenanceWindowStart.ref,
      serviceRoleArn: startInstanceRole.roleArn,
      taskArn: 'AWS-StartEC2Instance',
      targets: [
        {
          key: 'WindowTargetIds',
          values: [startTarget.ref]
        }
      ],
      taskType: 'AUTOMATION',
      priority: 1,
      maxErrors: '1',
      maxConcurrency: '1',
      taskInvocationParameters: {
        maintenanceWindowAutomationParameters: {
          documentVersion: '1',
          parameters: {
            InstanceId: ['{{RESOURCE_ID}}']
          }
        }
      }
    })

    /*
    /* EC2インスタンス自動停止
    -------------------------------------------------------------------------- */
    // Maintenance Window
    const maintenanceWindowStop = new ssm.CfnMaintenanceWindow(this, 'MaintenanceWindowStop', {
      name: `${stackName}-AutoStop`,
      schedule: props.stopSchedule.cron,
      scheduleTimezone: 'Japan',
      duration: 1,
      cutoff: 0,
      allowUnassociatedTargets: false
    })

    // Target
    const stopTarget = new ssm.CfnMaintenanceWindowTarget(this, 'StopWindowTarget', {
      windowId: maintenanceWindowStop.ref,
      resourceType: 'RESOURCE_GROUP',
      targets: [
        {
          key: 'resource-groups:Name',
          values: [autoStopResourceGroup.ref]
        }
      ]
    })

    // Task
    new ssm.CfnMaintenanceWindowTask(this, 'StopTask', {
      windowId: maintenanceWindowStop.ref,
      serviceRoleArn: stopInstanceRole.roleArn,
      taskArn: 'AWS-StopEC2Instance',
      targets: [
        {
          key: 'WindowTargetIds',
          values: [stopTarget.ref]
        }
      ],
      taskType: 'AUTOMATION',
      priority: 1,
      maxErrors: '1',
      maxConcurrency: '1',
      taskInvocationParameters: {
        maintenanceWindowAutomationParameters: {
          documentVersion: '1',
          parameters: {
            InstanceId: ['{{RESOURCE_ID}}']
          }
        }
      }
    })
  }
}
