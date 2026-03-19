import cluster from 'cluster';
import os from 'os';

const port = Number(process.env.PORT || 4000);

if (cluster.isPrimary) {
  const cpuCount = Math.max(1, os.cpus().length);
  for (let i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`[backend-cluster] worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting...`);
    cluster.fork();
  });
} else {
  await import('./src/server.js');
  console.log(`[backend-cluster] worker ${process.pid} booted on :${port}`);
}
