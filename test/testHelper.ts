import { type Stack } from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'

/**
 * スタックのセットからテスト用のテンプレートセットを生成する
 * @param stacks
 * @returns
 */
export function createTemplates(stacks: Record<string, Stack>): Record<string, Template> {
  const templates: Record<string, Template> = {}
  for (const key in stacks) {
    if (Object.prototype.hasOwnProperty.call(stacks, key)) {
      templates[key] = Template.fromStack(stacks[key])
    }
  }
  return templates
}

/**
 * 開発と本番共通のテストを実行する
 * @param templates
 */
export function executeCommonTests(templates: Record<string, Template>): void {
  describe('BaseStack', () => {
    test('すべてのS3バケットが暗号化されている', () => {
      templates.baseStack.allResourcesProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      })
    })
  })

  describe('MainAppStack', () => {
    test('関数がTABLE_NAMEというkeyの環境変数を持っている', () => {
      templates.mainAppStack.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue()
          }
        }
      })
    })
  })
}
