/**
 * FIS障害注入対象のLambda関数に実験で必要な設定を追加する
 * 注意！東京リージョンのみ使用可能
 * */
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  GetFunctionCommandInput,
  GetFunctionCommandOutput,
  TagResourceCommand
} from '@aws-sdk/client-lambda'
import { IAMClient, AttachRolePolicyCommand } from '@aws-sdk/client-iam'

const iamClient = new IAMClient({ region: 'ap-northeast-1' })
const lambdaClient = new LambdaClient({ region: 'ap-northeast-1' })

/** Lambda関数環境変数 */
// 固定値（変更しないこと）
const AWS_LAMBDA_EXEC_WRAPPER = '/opt/aws-fis/bootstrap'
// FISログの出力レベル
const AWS_FIS_LOG_LEVEL: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
// FISのCloudWatch Metrics送信設定
const AWS_FIS_EXTENSION_METRICS: 'none' | 'all' = 'all'

// FISターゲット識別用Tag
const fisTargetTag = { FisLambdaTargetFlg: 'true' }

/** Lambda Layer */
const FIS_EXTENTION_TOKYO_ARM64 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-arm64:9'
const FIS_EXTENTION_TOKYO_X86 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-x86_64:9'

/** Lambda関数にアタッチするIAM PolicyのArn */
const attachPolicyArns = [
  'arn:aws:iam::aws:policy/AmazonS3FullAccess',
  'arn:aws:iam::aws:policy/CloudWatchFullAccessV2'
]

interface Event {
  /** 障害注入対象のLambda関数名 */
  targetLambdaName: string
  /** FIS設定ファイル共有用のS3バケット名 */
  fisBucketName: string
}

export const handler = async (event: Event) => {
  try {
    const functionName = event?.targetLambdaName
    if (!functionName) throw new Error('Function Name is required.')
    const bucketName = event?.fisBucketName ?? process.env.BUCKET_NAME
    if (!bucketName) throw new Error('Bucket Name is required.')

    console.log(`input, functionName: ${functionName}, bucketName: ${bucketName}`)

    await main(functionName, bucketName)

    console.log(`function ${functionName} updated successfully.`)

    return { statusCode: 200, body: 'Function updated successfully.' }
  } catch (error) {
    console.error('Error:', error)
    return { statusCode: 500, body: `Error: ${error}` }
  }
}

async function main(functionName: string, bucketName: string) {
  // Lambda関数のRoleを取得
  const response: GetFunctionCommandOutput = await getLambdaFunction(functionName)

  // IAM RoleをARNから取得し、S3ポリシーを付与
  const roleArn = response.Configuration?.Role
  if (roleArn === undefined) throw new Error('Failed to get lambda role')
  const roleName = roleArn.split('/')[1]
  await addToPolicy(roleName, attachPolicyArns)

  // 既存の環境変数を含む新しい環境変数のリストを作成
  const existingEnvVariables = response.Configuration?.Environment?.Variables
  const envVariables = {
    ...existingEnvVariables,
    AWS_LAMBDA_EXEC_WRAPPER,
    AWS_FIS_LOG_LEVEL,
    AWS_FIS_EXTENSION_METRICS,
    AWS_FIS_CONFIGURATION_LOCATION: `arn:aws:s3:::${bucketName}/FisConfigs/`
  }

  // 既存のLayerを含む新しいLayerのリストを作る
  const lambdaArchitecture = response.Configuration?.Architectures![0]
  const fisExtentionArn =
    lambdaArchitecture === 'arm64' ? FIS_EXTENTION_TOKYO_ARM64 : FIS_EXTENTION_TOKYO_X86
  let existingLambdaLayers = response.Configuration?.Layers?.map((layer) => layer.Arn).filter(
    (layerArn) => layerArn !== undefined
  )
  existingLambdaLayers ??= []
  // すでにFIS用Layerが追加済みの場合を考慮して配列の重複を排除、重複の場合はエラーになる
  const layers = Array.from(new Set([...existingLambdaLayers, fisExtentionArn]))
  await updateLambdaFunction(functionName, envVariables, layers)

  // FIS実験対象識別用tagの追加
  const functionArn = response.Configuration?.FunctionArn
  if (functionArn === undefined) throw new Error('Failed to get lambda function arn')
  await addTagToFunction(functionArn, fisTargetTag)
}

/**
 * 対象のLambda関数の情報を取得する
 * @param functionName
 * @returns response: GetFunctionCommandOutput
 */
async function getLambdaFunction(functionName: string) {
  const input: GetFunctionCommandInput = {
    FunctionName: functionName
  }
  const command = new GetFunctionCommand(input)
  return await lambdaClient.send(command)
}

/**
 * 対象のLambda関数の環境変数とLayer情報を更新
 * @param functionName
 */
async function updateLambdaFunction(
  functionName: string,
  envVariables: Record<string, string> | undefined,
  layers: string[] | undefined
) {
  const updateConfigCommand = new UpdateFunctionConfigurationCommand({
    FunctionName: functionName,
    Environment: {
      Variables: envVariables
    },
    Layers: layers
  })

  await lambdaClient.send(updateConfigCommand)
}

/**
 * LambdaのIAM RoleにIAM Policyを追加
 * @param roleName
 */
async function addToPolicy(roleName: string, policyArns: string[]) {
  for (const policyArn of policyArns) {
    const attachPolicyCommand = new AttachRolePolicyCommand({
      RoleName: roleName,
      PolicyArn: policyArn
    })
    await iamClient.send(attachPolicyCommand)
  }
}

/**
 * Lambda関数にタグを追加する
 * @param functionArn
 * @param tags
 */
async function addTagToFunction(functionArn: string, tags: Record<string, string>) {
  const command = new TagResourceCommand({
    Resource: functionArn,
    Tags: tags
  })

  await lambdaClient.send(command)
}
