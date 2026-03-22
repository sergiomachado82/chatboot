/**
 * Load test script for the API.
 * Run with: npx tsx src/__tests__/load/api.load.ts
 *
 * Requires the server to be running on localhost:5050
 * and a valid JWT token.
 */

const API_URL = process.env.API_URL || 'http://localhost:5050';
const TOKEN = process.env.LOAD_TEST_TOKEN || '';
const DURATION_SECONDS = parseInt(process.env.DURATION || '10', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '10', 10);

interface LoadResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestsPerSecond: number;
}

async function runLoadTest(endpoint: string, method = 'GET'): Promise<LoadResult> {
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();
  const endTime = startTime + DURATION_SECONDS * 1000;

  const worker = async () => {
    while (Date.now() < endTime) {
      const reqStart = Date.now();
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        const latency = Date.now() - reqStart;
        latencies.push(latency);
        if (res.ok) successful++;
        else failed++;
      } catch {
        failed++;
        latencies.push(Date.now() - reqStart);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  latencies.sort((a, b) => a - b);
  const totalRequests = successful + failed;
  const durationMs = Date.now() - startTime;

  return {
    endpoint,
    totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    avgLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
    p95LatencyMs: latencies.length > 0 ? (latencies[Math.floor(latencies.length * 0.95)] ?? 0) : 0,
    requestsPerSecond: Math.round((totalRequests / durationMs) * 1000),
  };
}

async function main() {
  if (!TOKEN) {
    console.log('Usage: LOAD_TEST_TOKEN=<jwt> npx tsx src/__tests__/load/api.load.ts');
    console.log('');
    console.log('Environment variables:');
    console.log('  API_URL          - API base URL (default: http://localhost:5050)');
    console.log('  LOAD_TEST_TOKEN  - JWT auth token (required)');
    console.log('  DURATION         - Test duration in seconds (default: 10)');
    console.log('  CONCURRENCY      - Concurrent requests (default: 10)');
    process.exit(1);
  }

  console.log(`\nLoad Test Configuration:`);
  console.log(`  API URL:     ${API_URL}`);
  console.log(`  Duration:    ${DURATION_SECONDS}s`);
  console.log(`  Concurrency: ${CONCURRENCY}\n`);

  const endpoints = ['/api/health', '/api/conversaciones', '/api/reservas', '/api/bot/config'];

  const results: LoadResult[] = [];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    const result = await runLoadTest(endpoint);
    results.push(result);
    console.log(
      `  ${result.requestsPerSecond} req/s | avg ${result.avgLatencyMs}ms | p95 ${result.p95LatencyMs}ms | ${result.successfulRequests}/${result.totalRequests} ok\n`,
    );
  }

  console.log('\n=== RESULTS ===');
  console.table(
    results.map((r) => ({
      Endpoint: r.endpoint,
      'Req/s': r.requestsPerSecond,
      'Avg (ms)': r.avgLatencyMs,
      'P95 (ms)': r.p95LatencyMs,
      Success: r.successfulRequests,
      Failed: r.failedRequests,
    })),
  );
}

main().catch(console.error);
