#!/bin/bash
# Create all UniGo Kafka topics
KAFKA_BOOTSTRAP="kafka:9092"

create_topic() {
  local name=$1
  local partitions=$2
  local replication=$3
  kafka-topics.sh --create     --bootstrap-server $KAFKA_BOOTSTRAP     --topic $name     --partitions $partitions     --replication-factor $replication     --if-not-exists
  echo "✓ $name (${partitions}p x ${replication}r)"
}

echo "Creating UniGo Kafka topics..."
create_topic "ride.created"        48 3
create_topic "ride.matched"        48 3
create_topic "ride.completed"      24 3
create_topic "ride.cancelled"      24 3
create_topic "driver.location"     96 2
create_topic "driver.status"       24 3
create_topic "payment.initiated"   24 3
create_topic "payment.completed"   24 3
create_topic "notification.push"   48 2
create_topic "notification.sms"    24 2
create_topic "user.events"         24 3
create_topic "analytics.stream"    12 2
create_topic "fraud.events"        12 3
create_topic "delivery.events"     24 3
create_topic "marketplace.events"  12 2
echo "All topics created ✅"
