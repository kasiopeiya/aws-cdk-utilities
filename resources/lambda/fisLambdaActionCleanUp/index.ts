/**
 * FIS障害注入対象のLambda関数の実験用設定を削除する
 * 注意！東京リージョンのみ使用可能
 * */
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  GetFunctionCommandInput,
  GetFunctionCommandOutput
} from '@aws-sdk/client-lambda'
import { IAMClient, DetachRolePolicyCommand } from '@aws-sdk/client-iam'

const iamClient = new IAMClient({ region: 'ap-northeast-1' })
const lambdaClient = new LambdaClient({ region: 'ap-northeast-1' })

/** 削除するLambda関数環境変数 */
const envVariableKeysToRemove = [
  'AWS_LAMBDA_EXEC_WRAPPER',
  'AWS_FIS_LOG_LEVEL',
  'AWS_FIS_EXTENSION_METRICS',
  'AWS_FIS_CONFIGURATION_LOCATION'
]

/** 削除するLambda Layer */
const FIS_EXTENTION_TOKYO_ARM64 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-arm64:9'
const FIS_EXTENTION_TOKYO_X86 =
  'arn:aws:lambda:ap-northeast-1:339712942424:layer:aws-fis-extension-x86_64:9'

interface Event {
  /** 障害注入対象のLambda関数名 */
  targetLambdaName: string
}

export const handler = async (event: Event) => {
  try {
    const functionName = event?.targetLambdaName
    if (!functionName) throw new Error('Function Name is required.')

    console.log(`input, functionName: ${functionName}`)

    await main(functionName)

    console.log(`function ${functionName} updated successfully.`)

    return { statusCode: 200, body: 'Function updated successfully.' }
  } catch (error) {
    console.error('Error:', error)
    return { statusCode: 500, body: `Error: ${error}` }
  }
}

async function main(functionName: string) {
  // Lambda関数のRoleを取得
  const response: GetFunctionCommandOutput = await getLambdaFunction(functionName)

  // IAM RoleをARNから取得し、S3ポリシーを削除
  const roleArn = response.Configuration?.Role
  if (roleArn === undefined) throw new Error('Failed to get lambda role')
  const roleName = roleArn.split('/')[1]
  await removeS3FullAccessPolicy(roleName)

  // 削除する環境変数を除いた新しい環境変数のリストを作る
  const existingEnvVariables = response.Configuration?.Environment?.Variables ?? {}
  const newEnvVariables = Object.fromEntries(
    Object.entries(existingEnvVariables).filter(([key]) => !envVariableKeysToRemove.includes(key))
  )

  // 削除するLambda Layerを除いた新しい環境変数のリストを作る
  const existingLambdaLayers = response.Configuration?.Layers?.map((layer) => layer.Arn).filter(
    (layerArn) => layerArn !== undefined
  )
  const newLambdaLayers = existingLambdaLayers?.filter(
    (layerArn) => layerArn !== FIS_EXTENTION_TOKYO_ARM64 && layerArn !== FIS_EXTENTION_TOKYO_X86
  )
  await updateLambdaFunction(functionName, newEnvVariables, newLambdaLayers)
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
 * LambdaのIAM PolicyからS3フルアクセスを削除
 * @param roleName
 */
async function removeS3FullAccessPolicy(roleName: string) {
  const command = new DetachRolePolicyCommand({
    RoleName: roleName,
    PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
  })

  await iamClient.send(command)
}
