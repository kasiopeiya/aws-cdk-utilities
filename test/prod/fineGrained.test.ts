import { App, type Environment } from 'aws-cdk-lib'
import { type Template } from 'aws-cdk-lib/assertions'

import { ProdStage } from '../../lib/stage/prodStage'
import * as testHelper from '../testHelper'

const app = new App()
const env: Environment = { account: undefined, region: 'ap-northeast-1' }
const stage = new ProdStage(app, 'prod', { env })
const templates: Record<string, Template> = testHelper.createTemplates(stage.stacks)

// describe('Stack DeletionProtection', () => {
//   test('すべてのStackにDeletionProtectionが有効になっている', () => {
//     Object.values(stage.stacks).forEach((stack) => {
//       expect(stack.terminationProtection).toBe(true)
//     })
//   })
// })

testHelper.executeCommonTests(templates)
