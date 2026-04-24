#!/bin/bash
# Deletes EKS cluster + ECR repo + IAM user.
# S3 bucket and MongoDB Atlas are LEFT INTACT.
# Run scripts/03-setup-cluster.sh any time to recreate everything.
set -e

REGION="ap-south-1"
CLUSTER_NAME="beingmomin-cluster"
ECR_REPO="beingmominservice"

# ---------------------------------------------------------------
echo "=== Deleting EKS cluster: $CLUSTER_NAME (~10-15 min) ==="
# ---------------------------------------------------------------
# eksctl also deletes the managed node group, VPC, subnets, security groups,
# IAM roles, and the Classic Load Balancer created by the K8s Service.
eksctl delete cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION"

# ---------------------------------------------------------------
echo "=== Deleting ECR repository (and all images inside it) ==="
# ---------------------------------------------------------------
aws ecr delete-repository \
  --repository-name "$ECR_REPO" \
  --region "$REGION" \
  --force

# ---------------------------------------------------------------
echo ""
echo "=== Teardown complete ==="
echo ""
echo "Kept permanently:"
echo "  S3 bucket:       beingmomin-uploads (ap-south-1)"
echo "  IAM user:        beingmomin-s3-writer"
echo "  MongoDB Atlas:   M0 cluster (free tier)"
echo ""
echo "To redeploy: run scripts/03-setup-cluster.sh"
