#!/bin/bash
# Creates ECR + EKS cluster, builds & pushes the Docker image, deploys to K8s.
# Run from the beingmominservice/ directory.
# Prerequisites: aws CLI, eksctl, kubectl, docker — all configured and logged in.
#
# Before running:
#   - Run scripts/01-setup-s3.sh (once) and update k8s/secret.yaml with AWS credentials
#   - Run scripts/02-setup-atlas.sh (once) and update k8s/secret.yaml with MONGO_URI
#   - Update k8s/secret.yaml with your JWT_SECRET
set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="ap-south-1"
CLUSTER_NAME="beingmomin-cluster"
ECR_REPO="beingmominservice"
IMAGE_TAG="v1.0.0"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"

echo "AWS Account: $ACCOUNT_ID"
echo "ECR URI:     $ECR_URI"
echo ""

# ---------------------------------------------------------------
echo "=== Step 1: Create ECR repository ==="
# ---------------------------------------------------------------
aws ecr create-repository \
  --repository-name "$ECR_REPO" \
  --region "$REGION"

# ---------------------------------------------------------------
echo "=== Step 2: Build and push Docker image to ECR ==="
# ---------------------------------------------------------------
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin \
    "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# --platform linux/amd64 is required on Apple Silicon (M1/M2/M3/M4).
# EKS nodes are x86_64; omitting this flag produces an arm64 image that
# will crash with "exec format error" on EKS nodes.
docker build --platform linux/amd64 \
  -t "$ECR_URI" \
  .

docker push "$ECR_URI"

# ---------------------------------------------------------------
echo "=== Step 3: Patch deployment.yaml with real account ID ==="
# ---------------------------------------------------------------
sed -i.bak "s|ACCOUNT_ID\.dkr\.ecr|${ACCOUNT_ID}.dkr.ecr|g" k8s/deployment.yaml
echo "Image in k8s/deployment.yaml updated to: $ECR_URI"

# ---------------------------------------------------------------
echo "=== Step 4: Create EKS cluster — t3.small spot x2 (~15 min) ==="
# ---------------------------------------------------------------
# t3.small = 2 vCPU, 2 GB RAM, up to 11 pods per node.
# t2.micro (1 GB, 4 pods max) is too small for EKS — system pods alone
# (aws-node, kube-proxy, coredns x2, metrics-server) fill all 4 slots.
eksctl create cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --nodegroup-name workers \
  --node-type t3.small \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --spot \
  --managed

echo "Cluster ready. kubectl context updated automatically."

# ---------------------------------------------------------------
echo "=== Step 5: Grant cluster access ==="
# ---------------------------------------------------------------
# beingmomin-deployer — full admin (needed to run kubectl from CI / local)
aws eks create-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --principal-arn "arn:aws:iam::${ACCOUNT_ID}:user/beingmomin-deployer"

aws eks associate-access-policy \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --principal-arn "arn:aws:iam::${ACCOUNT_ID}:user/beingmomin-deployer" \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster

# root account — read-only view access
aws eks create-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --principal-arn "arn:aws:iam::${ACCOUNT_ID}:root"

aws eks associate-access-policy \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  --principal-arn "arn:aws:iam::${ACCOUNT_ID}:root" \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy \
  --access-scope type=cluster

echo "Access entries configured."

# ---------------------------------------------------------------
echo "=== Step 6: Deploy to Kubernetes ==="
# ---------------------------------------------------------------
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "Waiting for rollout..."
kubectl rollout status deployment/beingmominservice -n beingmomin

# ---------------------------------------------------------------
echo ""
echo "=== Step 7: Deployment complete ==="
echo ""
kubectl get service beingmominservice -n beingmomin
echo ""
echo "Wait ~2 min for EXTERNAL-IP to appear, then test:"
echo "  LB=\$(kubectl get svc beingmominservice -n beingmomin -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
echo "  curl http://\$LB/api/health"
