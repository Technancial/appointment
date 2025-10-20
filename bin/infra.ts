#!/usr/bin/env node
import 'source-map-support/register';
import { AppointmentStack } from '../lib/appointment-stack';
import * as cdk from "aws-cdk-lib";

const app = new cdk.App();
new AppointmentStack(app, 'AppointmentSchedulerStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    },
});