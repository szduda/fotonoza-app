import { readdirSync, rmSync } from "node:fs"
import { join } from "node:path"

function removeAppConfig() {
  const cwd = process.cwd()
  rmSync(join(cwd, ".fotonoza"), { force: true })
  rmSync(join(cwd, "src-tauri", ".fotonoza"), { force: true })
}

function removeWorkingDirConfigs() {
  const home = process.env.HOME
  if (!home) return

  const importDir = join(home, ".import.fotonoza")
  const entries = readdirSync(importDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!/^\..+\.fotonoza$/.test(entry.name)) continue
    rmSync(join(importDir, entry.name), { force: true })
  }
}

removeAppConfig()
try {
  removeWorkingDirConfigs()
} catch {
  // Import directory may not exist yet.
}
