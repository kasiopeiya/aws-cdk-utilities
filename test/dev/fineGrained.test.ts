import { App, type Environment } from 'aws-cdk-lib'
import { type Template } from 'aws-cdk-lib/assertions'

import { DevStage } from '../../lib/stage/devStage'
import * as testHelper from '../testHelper'

const app = new App()
const env: Environment = { account: undefined, region: 'ap-northeast-1' }
const stage = new DevStage(app, 'dev', { env })
const templates: Record<string, Template> = testHelper.createTemplates(stage.stacks)

testHelper.executeCommonTests(templates)
