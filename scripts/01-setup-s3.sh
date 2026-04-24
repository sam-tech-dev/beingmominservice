#!/bin/bash
# One-time permanent setup: S3 bucket + IAM user for S3 writes.
# Run once. Keep both — S3 costs ~$0.023/GB/month, IAM user is free.
set -e

BUCKET="beingmomin-uploads"
REGION="ap-south-1"

# ---------------------------------------------------------------
echo "=== Creating S3 bucket: $BUCKET in $REGION ==="
# ---------------------------------------------------------------
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

echo "=== Disabling public access block (needed for public image URLs) ==="
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "=== Attaching public-read bucket policy ==="
aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
    }]
  }"

# ---------------------------------------------------------------
echo ""
echo "=== Creating IAM user: beingmomin-s3-writer ==="
# ---------------------------------------------------------------
aws iam create-user --user-name beingmomin-s3-writer

aws iam put-user-policy \
  --user-name beingmomin-s3-writer \
  --policy-name BeingMominS3WritePolicy \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Action\": [\"s3:PutObject\", \"s3:DeleteObject\", \"s3:GetObject\"],
      \"Resource\": \"arn:aws:s3:::${BUCKET}/*\"
    }]
  }"

echo ""
echo "=== Creating IAM access keys (SAVE THESE — shown only once) ==="
aws iam create-access-key --user-name beingmomin-s3-writer

# ---------------------------------------------------------------
echo ""
echo "=== One-time setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Base64-encode the AccessKeyId:     echo -n 'AKIA...' | base64"
echo "  2. Base64-encode the SecretAccessKey: echo -n 'xxx...' | base64"
echo "  3. Paste both into k8s/secret.yaml under AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
echo ""
echo "Kept permanently:"
echo "  S3 bucket: https://${BUCKET}.s3.${REGION}.amazonaws.com"
echo "  IAM user:  beingmomin-s3-writer"
