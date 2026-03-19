import cluster from 'cluster';
import os from 'os';

// NOTE: This file is for self-hosted Node deployments.
// UniGo on Vercel/serverless will ignore it, but self-hosted deployments can
// use it as the cluster entrypoint around api/index.js compatible http server.

const port = Number(process.env.PORT || 3000);

if (cluster.isPrimary) {
  const cpuCount = Math.max(1, os.cpus().length);
  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`[cluster] worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting...`);
    cluster.fork();
  });
} else {
  console.log(`[cluster] worker ${process.pid} ready on :${port}`);
}
