/**
 * FIS障害注入対象のLambda関数に実験で必要な設定を追加する
 * 注意！東京リージョンのみ使用可能
 * */
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  GetFunctionCommandInput,
  GetFunctionCommandOutput
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

/** Lambda Layer */
const FIS_EXTENTION_TOKYO_ARM64 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-arm64:9'
const FIS_EXTENTION_TOKYO_X86 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-x86_64:9'

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
    const bucketName = event?.fisBucketName
    if (!bucketName) throw new Error('Bucket Name is required.')

    main(functionName, bucketName)

    return { statusCode: 200, body: 'Function updated successfully.' }
  } catch (error) {
    console.error('Error:', error)
    return { statusCode: 500, body: `Error: ${error}` }
  }
}

handler({
  targetLambdaName: 'dev-kasio-lambda-stack-LambdaFunc4144DB58-zjsfDbtPh7Ps',
  fisBucketName: 'dev-kasio-base-stack-fislambdatemplatebucket8ab4f4-4tls3aebchl5'
})

async function main(functionName: string, bucketName: string) {
  // Lambda関数のRoleを取得
  const response: GetFunctionCommandOutput = await getLambdaFunction(functionName)

  // IAM RoleをARNから取得し、S3ポリシーを付与
  const roleArn = response.Configuration?.Role
  if (roleArn === undefined) throw new Error('Failed to get lambda role')
  const roleName = roleArn.split('/')[1]
  await addS3FullAccessPolicy(roleName)

  // Lambda関数に環境変数を追加
  const existingEnvVariables = response.Configuration?.Environment?.Variables
  const envVariables = {
    ...existingEnvVariables,
    AWS_LAMBDA_EXEC_WRAPPER,
    AWS_FIS_LOG_LEVEL,
    AWS_FIS_EXTENSION_METRICS,
    AWS_FIS_CONFIGURATION_LOCATION: `arn:aws:s3:::${bucketName}/FisConfigs/`
  }
  // Lambda関数にLayerを追加
  const lambdaArchitecture = response.Configuration?.Architectures![0]
  const fisExtentionArn =
    lambdaArchitecture === 'arm64' ? FIS_EXTENTION_TOKYO_ARM64 : FIS_EXTENTION_TOKYO_X86
  let existingLambdaLayers = response.Configuration?.Layers?.map((layer) => layer.Arn).filter(
    (layerArn) => layerArn !== undefined
  )
  existingLambdaLayers ??= []
  // すでにFIS用Layerが追加済みの場合を考慮して配列の重複を排除、重複の場合はエラーになる
  const layers = Array.from(new Set([...existingLambdaLayers, fisExtentionArn]))
  updateLambdaFunction(functionName, envVariables, layers)
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
 * LambdaのIAM PolicyにS3フルアクセスを追加
 * @param roleName
 */
async function addS3FullAccessPolicy(roleName: string) {
  const attachPolicyCommand = new AttachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
  })

  await iamClient.send(attachPolicyCommand)
}
