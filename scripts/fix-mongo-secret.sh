#!/bin/bash
set -e

MONGO_URI='mongodb+srv://beingmomin-user:beingMomin!379@beingmomin-cluster.t9bzzty.mongodb.net/?appName=beingmomin-cluster'
ENCODED=$(printf '%s' "$MONGO_URI" | base64)

kubectl patch secret beingmomin-secret -n beingmomin \
  --type=json \
  --patch "[{\"op\":\"replace\",\"path\":\"/data/MONGO_URI\",\"value\":\"${ENCODED}\"}]"

kubectl rollout restart deployment/beingmominservice -n beingmomin
echo "Secret updated and pods restarting..."
kubectl rollout status deployment/beingmominservice -n beingmomin
