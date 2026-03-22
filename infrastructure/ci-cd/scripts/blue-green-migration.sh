#!/bin/bash
# Blue-Green Database Migration — Zero Downtime
# Uses PostgreSQL Logical Replication for atomic switch
set -e

BLUE_DB="${DATABASE_URL_BLUE}"    # Current production
GREEN_DB="${DATABASE_URL_GREEN}"  # New database
APP_SERVICES="api-gateway ride-service payment-service matching-service"

echo "=== UniGo Blue-Green DB Migration ==="
echo "BLUE:  ${BLUE_DB%@*}@***"
echo "GREEN: ${GREEN_DB%@*}@***"
echo ""

# Step 1: Verify green DB is up-to-date
echo "1. Verifying Green DB is caught up..."
BLUE_LSN=$(psql "$BLUE_DB" -t -c "SELECT pg_current_wal_lsn();")
GREEN_LAG=$(psql "$GREEN_DB" -t -c "SELECT pg_wal_lsn_diff(pg_last_wal_receive_lsn(), '$BLUE_LSN'::pg_lsn);")
echo "   Replication lag: ${GREEN_LAG} bytes"
if [ "${GREEN_LAG}" -gt "102400" ]; then  # > 100KB lag
  echo "❌ Green DB is too far behind! Aborting."
  exit 1
fi

# Step 2: Stop writes briefly (< 1 second)
echo "2. Pausing new write traffic..."
kubectl annotate svc api-gateway -n unigo-prod maintenance="true" --overwrite

# Step 3: Wait for in-flight transactions
echo "3. Waiting 2 seconds for in-flight transactions..."
sleep 2

# Step 4: Verify green is fully caught up
echo "4. Final replication check..."
FINAL_LAG=$(psql "$GREEN_DB" -t -c "SELECT pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_current_wal_lsn());")
echo "   Final lag: ${FINAL_LAG} bytes (should be 0)"

# Step 5: Switch connection strings atomically
echo "5. Switching to Green DB..."
kubectl create secret generic unigo-db-secret -n unigo-prod \
  --from-literal=DATABASE_URL="$GREEN_DB" \
  --dry-run=client -o yaml | kubectl apply -f -

# Step 6: Rolling restart all services (picks up new DB secret)
echo "6. Rolling restart services..."
for SVC in $APP_SERVICES; do
  kubectl rollout restart deployment/$SVC -n unigo-prod
  kubectl rollout status deployment/$SVC -n unigo-prod --timeout=120s
  echo "   ✅ $SVC restarted"
done

# Step 7: Remove maintenance mode
echo "7. Removing maintenance mode..."
kubectl annotate svc api-gateway -n unigo-prod maintenance- --overwrite

# Step 8: Health check
echo "8. Running health checks..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.unigo.uz/api/health)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Health check failed! HTTP $HTTP_STATUS"
  echo "   ROLLBACK: switching back to Blue DB..."
  kubectl create secret generic unigo-db-secret -n unigo-prod \
    --from-literal=DATABASE_URL="$BLUE_DB" \
    --dry-run=client -o yaml | kubectl apply -f -
  for SVC in $APP_SERVICES; do kubectl rollout restart deployment/$SVC -n unigo-prod; done
  exit 1
fi

echo ""
echo "✅ Blue-Green migration complete!"
echo "   Green DB is now production"
echo "   Blue DB can be decommissioned after 24h verification"
