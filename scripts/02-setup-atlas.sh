#!/bin/bash
# One-time MongoDB Atlas M0 setup using the Atlas CLI.
# Prerequisites:
#   1. Install Atlas CLI:  brew install mongodb-atlas-cli
#   2. Login:             atlas auth login
#   3. Install jq:        brew install jq
#
# Run once. Keep the cluster — M0 is free forever.
set -e

ORG_ID="69ea6221333d06f6bbc9d7b5"
PROJECT_NAME="beingmomin"
CLUSTER_NAME="beingmomin-cluster"
DB_USER="beingmomin-user"
# Change this password before running the script
DB_PASS="beingMomin!379"

echo "=== Creating Atlas project: $PROJECT_NAME ==="
atlas projects create "$PROJECT_NAME" --orgId "$ORG_ID"

PROJECT_ID=$(atlas projects list --output json \
  | jq -r ".results[] | select(.name==\"$PROJECT_NAME\") | .id")

echo "Project ID: $PROJECT_ID"

echo "=== Creating free M0 cluster in Mumbai (AP_SOUTH_1) ==="
echo "This takes ~3 minutes..."
atlas clusters create "$CLUSTER_NAME" \
  --provider AWS \
  --region AP_SOUTH_1 \
  --tier M0 \
  --projectId "$PROJECT_ID"

echo "=== Waiting for cluster to be ready ==="
atlas clusters watch "$CLUSTER_NAME" --projectId "$PROJECT_ID"

echo "=== Creating database user ==="
atlas dbusers create \
  --username "$DB_USER" \
  --password "$DB_PASS" \
  --role readWriteAnyDatabase \
  --projectId "$PROJECT_ID"

echo "=== Allowing all IPs (0.0.0.0/0) for EKS access ==="
atlas accessLists create 0.0.0.0/0 \
  --comment "EKS cluster access" \
  --projectId "$PROJECT_ID"

echo ""
echo "=== Atlas setup complete ==="
echo ""
echo "Next steps:"
echo "1. Go to Atlas web console → your cluster → Connect → Drivers"
echo "2. Copy the connection string — it looks like:"
echo "   mongodb+srv://${DB_USER}:${DB_PASS}@<cluster-host>/beingmomin?retryWrites=true&w=majority"
echo "3. Base64-encode it:  echo -n '<connection-string>' | base64"
echo "4. Paste the encoded value into k8s/secret.yaml under MONGO_URI"
