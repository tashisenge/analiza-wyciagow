import { execSync } from "node:child_process";

const port = process.env.PORT ?? "3000";

try {
  const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

  if (pids.length > 0) {
    console.warn(
      `Port ${port} in use (PIDs: ${pids.join(", ")}). Stopping old dev server…`,
    );
    execSync(`kill -9 ${pids.join(" ")}`);
  }
} catch {
  // lsof exits 1 when nothing listens on the port
}

try {
  execSync('pkill -f "analiza-wyciagow/node_modules/.bin/next dev"', {
    stdio: "ignore",
  });
} catch {
  // no matching processes
}
