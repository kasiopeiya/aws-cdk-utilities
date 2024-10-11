#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { Aspects, Stack } from 'aws-cdk-lib'
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'

import { DevStage } from '../lib/stage/devStage'
import { devConfig } from '../config'
import { nagSuppressions } from '../test/nagSuppressions'

const app = new cdk.App()

new DevStage(app, 'dev', {
  env: devConfig.env
})

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))
for (const node of app.node.children) {
  if (Stack.isStack(node)) {
    NagSuppressions.addStackSuppressions(node, nagSuppressions)
  }
}
