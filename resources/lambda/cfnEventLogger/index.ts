import {
  CloudFormationClient,
  DescribeStackEventsCommand,
  DescribeStackEventsCommandOutput
} from '@aws-sdk/client-cloudformation'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

interface Event {
  version: string
  id: string
  'detail-type': string
  source: string
  account: string
  time: string
  region: string
  resources: string[]
  detail: {
    'stack-id': string
    'status-details': {
      status: string
      'status-reason': string
    }
    'client-request-token': string
  }
}

const cloudFormationClient = new CloudFormationClient({})
const s3Client = new S3Client({})

/**
 * メイン
 * @param stackName ログ取得対象のスタック名
 * @param requestToken 各デプロイイベントを区別するためのトークン
 */
async function main(stackName: string, requestToken: string) {
  try {
    // CloudFormationの全イベントを取得
    const describeCommand = new DescribeStackEventsCommand({ StackName: stackName })
    const stackEventsResult: DescribeStackEventsCommandOutput =
      await cloudFormationClient.send(describeCommand)

    // 取得したイベントリストからclient-request-tokenでフィルタ
    const filteredEvents = stackEventsResult.StackEvents?.filter(
      (stackEvent) => stackEvent.ClientRequestToken === requestToken
    )

    // フィルタリング後のイベント情報をJSON文字列に変換
    const eventsData = JSON.stringify(filteredEvents, null, 2)

    // S3にフィルタ済みのイベントデータを保存
    const timestamp = new Date().toISOString()
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME!,
      Key: `cloudformation-events/${timestamp}/${stackName}.json`,
      Body: eventsData,
      ContentType: 'application/json'
    })
    await s3Client.send(putObjectCommand)

    console.log(`Successfully saved filtered CloudFormation events for ${stackName}`)
  } catch (error) {
    console.error('Error fetching or saving CloudFormation events:', error)
    throw error
  }
}

/**
 * ハンドラー関数
 * @param event
 */
export const lambdaHandler = async (event: Event): Promise<void> => {
  console.log('Event: ', JSON.stringify(event, null, 2))

  // stack-idからスタック名を抽出
  const stackId = event.detail['stack-id']
  const stackName = stackId.split('/')[1]

  // EventBridgeイベントからclient-request-tokenを取得
  const requestToken = event.detail['client-request-token']

  main(stackName, requestToken)
}
