import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { aws_s3 as s3 } from 'aws-cdk-lib'

export class MyS3Bucket extends Construct {
  public readonly bucket: s3.IBucket

  constructor(scope: Construct, id: string, props: s3.BucketProps) {
    super(scope, id)

    // S3 Bucket
    this.bucket = new s3.Bucket(this, 'Bucket', {
      ...props,
      autoDeleteObjects: props.autoDeleteObjects ?? true,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
      encryption: props.encryption ?? s3.BucketEncryption.S3_MANAGED,
      enforceSSL: props.enforceSSL ?? true
    })
  }
}
