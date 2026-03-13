
Realtime architecture

API servers should NOT host websocket connections.

Recommended:

API Cluster
Realtime Websocket Cluster

Websocket nodes only handle:

driver location updates
dispatch offers
ride state updates
