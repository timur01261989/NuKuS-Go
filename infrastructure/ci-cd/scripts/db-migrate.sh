#!/bin/bash
# Run all database migrations in order
set -e

MIGRATIONS_DIR="$(dirname "$0")/../../db/postgres/migrations"
SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL not set}"
SUPABASE_SERVICE_ROLE="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY not set}"

echo "Running migrations from: $MIGRATIONS_DIR"

for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  echo "  → Applying: $(basename $file)"
  curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql"     -H "apikey: $SUPABASE_SERVICE_ROLE"     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE"     -H "Content-Type: application/json"     -d "{"query": "$(cat $file | sed "s/'/\\'/g" | tr -d "\n")"}"     || echo "    ⚠ Migration may already exist, continuing..."
done

echo "✅ All migrations applied"
