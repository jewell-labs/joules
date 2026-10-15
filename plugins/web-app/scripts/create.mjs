#!/usr/bin/env node
// Write a native Void app from flags. Does not deploy.
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const pluginRoot = path.dirname(here)
const NODE_FLOOR = "24.21.0"
const VOID_RANGE = "^1.1.11"

const AUTH_PROVIDERS = [
  "email",
  "apple",
  "atlassian",
  "cognito",
  "discord",
  "dropbox",
  "facebook",
  "figma",
  "github",
  "gitlab",
  "google",
  "huggingface",
  "kakao",
  "kick",
  "line",
  "linear",
  "linkedin",
  "microsoft",
  "naver",
  "notion",
  "paybin",
  "paypal",
  "polar",
  "railway",
  "reddit",
  "roblox",
  "salesforce",
  "slack",
  "spotify",
  "tiktok",
  "twitch",
  "twitter",
  "vercel",
  "vk",
  "zoom",
]

const FLAG_KEY = {
  "--name": "name",
  "--title": "title",
  "--package-manager": "packageManager",
  "--toolchain": "toolchain",
  "--git": "git",
  "--ui": "ui",
  "--shape": "shape",
  "--rendering": "rendering",
  "--markdown": "markdown",
  "--view-transitions": "viewTransitions",
  "--nav": "nav",
  "--offline": "offline",
  "--database": "database",
  "--sessions": "sessions",
  "--seed": "seed",
  "--auth": "auth",
  "--auth-providers": "authProviders",
  "--cognito-domain": "cognitoDomain",
  "--cognito-region": "cognitoRegion",
  "--cognito-pool": "cognitoPool",
  "--mcp": "mcp",
  "--kv": "kv",
  "--storage": "storage",
  "--queues": "queues",
  "--cron": "cron",
  "--email": "email",
  "--email-from": "emailFrom",
  "--email-allow": "emailAllow",
  "--domain": "domain",
  "--ai": "ai",
  "--ai-gateway": "aiGateway",
  "--sandbox": "sandbox",
  "--sandbox-image": "sandboxImage",
  "--durable": "durable",
  "--atomic": "atomic",
  "--live": "live",
  "--replicate": "replicate",
  "--cache": "cache",
  "--secrets": "secrets",
  "--webhook": "webhook",
  "--target": "target",
  "--platform-url": "platformUrl",
  "--environments": "environments",
  "--checks": "checks",
  "--push-deploy": "pushDeploy",
  "--deployer": "deployer",
  "--workers-builds": "workersBuilds",
  "--github-repo": "githubRepo",
  "--github-branch": "githubBranch",
  "--github-installation": "githubInstallation",
  "--create-repo": "createRepo",
}

function die(message, code = 2) {
  process.stderr.write(message.endsWith("\n") ? message : `${message}\n`)
  process.exit(code)
}

function usage() {
  return `Usage: create.sh --dest PATH --name NAME --title TITLE [flags]

Write a native Void app into PATH. Omitted flags other than the destination,
package name, and title use their defaults. Flags are the whole create contract.
This script does not deploy, log in, or spend.

  --dest PATH                 Directory to create. It must not already contain files.
  --name NAME                 Package and Worker name. Lowercase letters, digits, hyphens.
  --title TITLE               Name shown in the app and the manifest.
  --package-manager npm|pnpm|yarn|bun
                              Default npm. Vite+ with no lockfile uses pnpm.
  --toolchain vite|vite-plus  Default vite.
  --git yes|no                Git repository in the destination. Default yes.
  --ui solid|react|vue|svelte Default solid.
  --shape pages|api|spa       Default pages.
  --rendering server|islands  Default server.
  --markdown yes|no           Default no.
  --view-transitions yes|no   Default no.
  --nav SPEC                  Default home. Items separated by ';'.
                              Label=href, or Label>Child=href,Other=href.
  --offline yes|no            Default yes. Requires shape pages.
  --database d1|pg|mysql|none Default d1.
  --sessions yes|no           Default yes when a database is selected.
  --seed yes|no               Default no.
  --auth policy|none|void     Default policy.
  --auth-providers LIST       Comma list. Required when auth is void.
  --cognito-domain VALUE      Required with the cognito provider.
  --cognito-region VALUE      Required with the cognito provider.
  --cognito-pool VALUE        Required with the cognito provider.
  --mcp yes|no                Public HTTP healthcheck. Default yes.
  --kv yes|no                 Default no.
  --storage yes|no            Default no.
  --queues LIST               Default none. Comma-separated queue names.
  --cron LIST                 Default none. name=m h dom mon dow, separated by ';'.
  --email no|send|receive|both
                              Default no.
  --email-from ADDR           Required for send or both. Name <addr@host>
  --email-allow ADDR          Printed later. Not run.
  --domain HOST               Default none.
  --ai no|workers|gateway     Default no.
  --ai-gateway NAME           Required when ai is gateway.
  --sandbox yes|no            Default no.
  --sandbox-image IMAGE       Optional sandbox image.
  --durable NAME              Default no. Module name, or no.
  --atomic yes|no             Default no. Requires a durable module.
  --live yes|no               Default no.
  --replicate yes|no          D1 read replication. Default no.
  --cache SECONDS             Default no. A number sets routing revalidate.
  --secrets LIST              Extra server secret names. Default is the names this round required.
  --webhook yes|no            Default no.
  --target cloudflare|void|local
                              Default cloudflare.
  --platform-url URL          Required when the target is void.
  --environments LIST         Default main=production,staging=staging.
  --checks yes|no             Pull-request checks. Default yes.
  --push-deploy yes|no        Default yes.
  --deployer actions|void-github
                              Default actions.
  --workers-builds yes|no     Default no. Yes with push deploy is refused.
  --github-repo OWNER/NAME    Required for void-github and for creating a repo.
  --github-branch BRANCH      Required for void-github.
  --github-installation ID    Optional void github connect installation.
  --create-repo yes|no        Default no.
`
}

function versionGte(current, floor) {
  const parse = (value) => String(value).replace(/^v/, "").split(".").map((part) => Number(part) || 0)
  const left = parse(current)
  const right = parse(floor)
  for (let i = 0; i < 3; i += 1) {
    if (left[i] > right[i]) return true
    if (left[i] < right[i]) return false
  }
  return true
}

function validName(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
}

function validTitle(value) {
  if (!value || !value.trim() || value.includes("__APP_")) return false
  for (const char of value) {
    const code = char.codePointAt(0)
    if (code < 32 || code === 127) return false
  }
  return true
}

function jsSingle(value) {
  return `'${value
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")}'`
}

function htmlText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function isSymlink(file) {
  try {
    return fs.lstatSync(file).isSymbolicLink()
  } catch {
    return false
  }
}

function resolveDest(input) {
  const abs = path.resolve(input)
  try {
    return fs.realpathSync(abs)
  } catch {
    // The last component may be missing, or the path may be a broken symlink.
  }
  const missing = []
  let current = abs
  while (!fs.existsSync(current) && !isSymlink(current)) {
    const parent = path.dirname(current)
    if (parent === current) break
    missing.push(path.basename(current))
    current = parent
  }
  if (isSymlink(current)) {
    const target = path.resolve(path.dirname(current), fs.readlinkSync(current))
    return path.join(target, ...missing.reverse())
  }
  return path.join(fs.realpathSync(current), ...missing.reverse())
}

function directoryKeys(root) {
  const keys = new Set()
  const walk = (dir) => {
    let stat
    try {
      stat = fs.lstatSync(dir)
    } catch (error) {
      if (error.code === "ENOENT") return
      throw error
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) return
    keys.add(`${stat.dev}:${stat.ino}`)
    let names
    try {
      names = fs.readdirSync(dir)
    } catch (error) {
      if (error.code === "ENOENT") return
      throw error
    }
    for (const name of names) walk(path.join(dir, name))
  }
  walk(root)
  return keys
}

function destinationInsidePlugin(dest) {
  const keys = directoryKeys(pluginRoot)
  let current = resolveDest(dest)
  while (true) {
    if (fs.existsSync(current)) {
      const stat = fs.statSync(current)
      if (keys.has(`${stat.dev}:${stat.ino}`)) return true
    }
    const parent = path.dirname(current)
    if (parent === current) return false
    current = parent
  }
}

function defaults() {
  return {
    packageManager: "npm",
    toolchain: "vite",
    git: "yes",
    ui: "solid",
    shape: "pages",
    rendering: "server",
    markdown: "no",
    viewTransitions: "no",
    nav: "home",
    offline: "yes",
    database: "d1",
    sessions: "yes",
    seed: "no",
    auth: "policy",
    authProviders: "",
    cognitoDomain: "",
    cognitoRegion: "",
    cognitoPool: "",
    mcp: "yes",
    kv: "no",
    storage: "no",
    queues: "none",
    cron: "none",
    email: "no",
    emailFrom: "",
    emailAllow: "",
    domain: "none",
    ai: "no",
    aiGateway: "",
    sandbox: "no",
    sandboxImage: "",
    durable: "no",
    atomic: "no",
    live: "no",
    replicate: "no",
    cache: "no",
    secrets: "",
    webhook: "no",
    target: "cloudflare",
    platformUrl: "",
    environments: "main=production,staging=staging",
    checks: "yes",
    pushDeploy: "yes",
    deployer: "actions",
    workersBuilds: "no",
    githubRepo: "",
    githubBranch: "",
    githubInstallation: "",
    createRepo: "no",
  }
}

function parseArgs(argv) {
  const flags = new Map()
  let dest = ""
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "-h" || arg === "--help") {
      process.stdout.write(usage())
      process.exit(0)
    }
    if (arg === "--dest") {
      dest = argv[i + 1] ?? ""
      if (!argv[i + 1]) die("missing value for --dest")
      i += 1
      continue
    }
    const key = FLAG_KEY[arg]
    if (!key) die(`unknown argument: ${arg}\n${usage()}`)
    const value = argv[i + 1]
    if (value === undefined || value.startsWith("--")) die(`missing value for ${arg}`)
    flags.set(key, value)
    i += 1
  }
  return { dest, flags }
}

function requiredSecrets(answers) {
  const names = []
  if (answers.auth === "policy" || answers.auth === "void") names.push("SESSION_SECRET")
  if (answers.database === "pg" || answers.database === "mysql") names.push("DATABASE_URL")
  if (answers.auth === "void") {
    for (const provider of answers.authProviders.split(",").filter(Boolean)) {
      const upper = provider.toUpperCase().replaceAll("-", "_")
      names.push(`AUTH_${upper}_CLIENT_ID`, `AUTH_${upper}_CLIENT_SECRET`)
      if (provider === "cognito") {
        names.push("AUTH_COGNITO_DOMAIN", "AUTH_COGNITO_REGION", "AUTH_COGNITO_USER_POOL_ID")
      }
    }
  }
  if (answers.webhook === "yes") names.push("DEPLOY_WEBHOOK_URL")
  return names
}

function splitList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function parseEnvironments(value) {
  const map = {}
  if (!value.trim()) return { error: "environments is empty" }
  for (const part of value.split(",")) {
    const pieces = part.split("=")
    if (pieces.length !== 2) return { error: "environments need branch=name pairs" }
    const branch = pieces[0].trim()
    const env = pieces[1].trim()
    if (!/^[A-Za-z0-9._/-]+$/.test(branch) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(env)) {
      return { error: `environments pair is invalid: ${part.trim()}` }
    }
    if (branch in map) return { error: `environments repeats ${branch}` }
    map[branch] = env
  }
  if (!Object.keys(map).length) return { error: "environments is empty" }
  return { map }
}

function parseNavSpec(value) {
  if (value === "home") return { items: [{ label: "Home", href: "/" }] }
  const items = []
  for (const part of value.split(";")) {
    const item = part.trim()
    if (!item) continue
    if (item.includes(">")) {
      const index = item.indexOf(">")
      const label = item.slice(0, index).trim()
      const rest = item.slice(index + 1).trim()
      if (!label || !rest) return { error: "nav is missing a section label or its children" }
      const children = []
      for (const child of rest.split(",")) {
        const eq = child.indexOf("=")
        if (eq <= 0) return { error: `nav child needs Label=href: ${child.trim()}` }
        const childLabel = child.slice(0, eq).trim()
        const href = child.slice(eq + 1).trim()
        if (!childLabel || !href.startsWith("/")) return { error: `nav href must start with /: ${child.trim()}` }
        children.push({ label: childLabel, href })
      }
      items.push({ label, children })
      continue
    }
    if (item === "home") {
      items.push({ label: "Home", href: "/" })
      continue
    }
    const eq = item.indexOf("=")
    if (eq <= 0) return { error: `nav item needs Label=href: ${item}` }
    const label = item.slice(0, eq).trim()
    const href = item.slice(eq + 1).trim()
    if (!label || !href.startsWith("/")) return { error: `nav href must start with /: ${item}` }
    items.push({ label, href })
  }
  if (!items.length) return { error: "nav is empty" }
  return { items }
}

function parseCron(value) {
  if (value === "none") return { jobs: [] }
  const jobs = []
  for (const part of value.split(";")) {
    const item = part.trim()
    if (!item) continue
    const eq = item.indexOf("=")
    if (eq <= 0) return { error: `cron needs name=expression: ${item}` }
    const name = item.slice(0, eq).trim()
    const expression = item.slice(eq + 1).trim()
    const fields = expression.split(/\s+/)
    if (!/^[a-z][a-z0-9-]*$/.test(name) || fields.length !== 5 || fields.some((field) => !/^[0-9*/,\-]+$/.test(field))) {
      return { error: `cron expression must be five fields: ${item}` }
    }
    jobs.push({ name, expression })
  }
  return { jobs }
}

function queueNames(value) {
  if (value === "none") return { names: [] }
  const names = splitList(value)
  for (const name of names) {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(name)) {
      return { error: `queue name is invalid: ${name}` }
    }
  }
  return { names }
}

function resolveAnswers(flags) {
  const errors = []
  const answers = defaults()
  const explicit = new Set()
  for (const [key, value] of flags) {
    answers[key] = value
    explicit.add(key)
  }
  if (!explicit.has("name") || !explicit.has("title")) {
    errors.push("missing answers: name, title")
  }
  if (!explicit.has("sessions")) {
    answers.sessions = answers.database === "none" ? "no" : "yes"
  }
  const extras = explicit.has("secrets") ? splitList(answers.secrets) : []
  const secretNames = [...requiredSecrets(answers), ...extras]
  answers.secrets = [...new Set(secretNames)].join(",")
  if (answers.toolchain === "vite-plus" && answers.packageManager !== "pnpm") {
    answers.packageManager = "pnpm"
    process.stderr.write("Vite+ uses pnpm when the app has no lockfile.\n")
  }
  return { answers, explicit, errors }
}

function validate(answers, explicit) {
  const errors = []
  if (!validName(answers.name)) errors.push("name must be lowercase letters, digits, and hyphens")
  if (!validTitle(answers.title)) errors.push("title is empty, has a control character, or contains a template token")
  const enums = {
    packageManager: ["npm", "pnpm", "yarn", "bun"],
    toolchain: ["vite", "vite-plus"],
    git: ["yes", "no"],
    ui: ["solid", "react", "vue", "svelte"],
    shape: ["pages", "api", "spa"],
    rendering: ["server", "islands"],
    markdown: ["yes", "no"],
    viewTransitions: ["yes", "no"],
    offline: ["yes", "no"],
    database: ["d1", "pg", "mysql", "none"],
    sessions: ["yes", "no"],
    seed: ["yes", "no"],
    auth: ["policy", "none", "void"],
    mcp: ["yes", "no"],
    kv: ["yes", "no"],
    storage: ["yes", "no"],
    email: ["no", "send", "receive", "both"],
    ai: ["no", "workers", "gateway"],
    sandbox: ["yes", "no"],
    atomic: ["yes", "no"],
    live: ["yes", "no"],
    replicate: ["yes", "no"],
    webhook: ["yes", "no"],
    target: ["cloudflare", "void", "local"],
    checks: ["yes", "no"],
    pushDeploy: ["yes", "no"],
    deployer: ["actions", "void-github"],
    workersBuilds: ["yes", "no"],
    createRepo: ["yes", "no"],
  }
  for (const [key, allowed] of Object.entries(enums)) {
    if (!allowed.includes(answers[key])) errors.push(`${key} must be ${allowed.join("|")}`)
  }
  if (answers.database === "none" && answers.sessions === "yes") errors.push("missing sessions: none with database none")
  if (answers.seed === "yes" && answers.database === "none") errors.push("missing seed: a seed needs a database")
  if (answers.shape !== "pages" && (answers.offline === "yes" || answers.nav !== "home" || answers.markdown === "yes" || answers.viewTransitions === "yes" || answers.rendering === "islands")) {
    errors.push("missing shape: offline, navigation, markdown, view transitions, and islands require pages")
  }
  const providers = answers.auth === "void" ? splitList(answers.authProviders) : []
  if (answers.auth === "void" && !providers.length) errors.push("missing authProviders")
  for (const provider of providers) {
    if (!AUTH_PROVIDERS.includes(provider)) errors.push(`authProviders has unknown provider ${provider}`)
  }
  if (providers.includes("cognito")) {
    if (!answers.cognitoDomain) errors.push("missing cognitoDomain")
    if (!answers.cognitoRegion) errors.push("missing cognitoRegion")
    if (!answers.cognitoPool) errors.push("missing cognitoPool")
  }
  if ((answers.email === "send" || answers.email === "both") && !(answers.emailFrom.includes("@") && answers.emailFrom.includes("<") && answers.emailFrom.includes(">"))) {
    errors.push("missing emailFrom")
  }
  if (answers.ai === "gateway" && !/^[a-z0-9][a-z0-9-]*$/.test(answers.aiGateway)) errors.push("missing aiGateway")
  if (answers.atomic === "yes" && answers.durable === "no") errors.push("missing durable")
  if (answers.durable !== "no" && !/^[a-z][a-z0-9-]*$/.test(answers.durable)) errors.push("durable must be no or a module name")
  if (answers.replicate === "yes" && answers.database !== "d1") errors.push("missing replicate: D1 read replication requires database d1")
  if (answers.cache !== "no" && !/^[1-9][0-9]*$/.test(answers.cache)) errors.push("cache must be no or a number of seconds")
  if (answers.target === "void" && !/^https?:\/\//.test(answers.platformUrl)) errors.push("missing platformUrl")
  if (answers.target === "local" && answers.pushDeploy === "yes") errors.push("missing pushDeploy: a local target cannot push deploy")
  if (answers.workersBuilds === "yes" && answers.pushDeploy === "yes") errors.push("missing workersBuilds: Workers Builds and push deploy would both deploy a branch")
  if (answers.deployer === "void-github" && answers.target !== "void") errors.push("missing deployer: void-github deploys a Void platform project")
  if (answers.deployer === "void-github" && !/^[^/\s]+\/[^/\s]+$/.test(answers.githubRepo)) errors.push("missing githubRepo")
  if (answers.deployer === "void-github" && !answers.githubBranch) errors.push("missing githubBranch")
  if (answers.createRepo === "yes" && !/^[^/\s]+\/[^/\s]+$/.test(answers.githubRepo)) errors.push("missing githubRepo")
  if (answers.githubInstallation && !/^[0-9]+$/.test(answers.githubInstallation)) errors.push("githubInstallation must be a number")
  if (answers.domain !== "none" && !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(answers.domain)) errors.push("domain must be none or a hostname")
  const queues = queueNames(answers.queues)
  if (queues.error) errors.push(queues.error)
  const cron = parseCron(answers.cron)
  if (cron.error) errors.push(cron.error)
  const nav = parseNavSpec(answers.nav)
  if (nav.error) errors.push(nav.error)
  const environments = parseEnvironments(answers.environments)
  if (environments.error) errors.push(environments.error)
  const secretNames = splitList(answers.secrets)
  for (const name of secretNames) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) errors.push(`secrets name is invalid: ${name}`)
  }
  if (explicit.has("secrets")) {
    for (const name of requiredSecrets(answers)) {
      if (!secretNames.includes(name)) errors.push(`missing secrets: ${name}`)
    }
  }
  return { errors, providers, queues: queues.names ?? [], cron: cron.jobs ?? [], nav: nav.items ?? [], environments: environments.map ?? {}, secretNames }
}

function deployCommand(answers) {
  if (answers.target === "local") return ""
  const args = ["void", "deploy", "--platform", answers.target === "void" ? "void" : "cloudflare"]
  if (answers.target === "void") args.push("--project", answers.name)
  if (answers.email === "send" || answers.email === "receive" || answers.email === "both") args.push("--require-email")
  if (answers.replicate === "yes") args.push("--provision")
  if (answers.atomic === "yes") args.push("--atomic")
  return args.join(" ")
}

function cssText() {
  return `:root {
  color-scheme: light dark;
  --surface-light: #f3f4f6;
  --surface-dark: #101318;
  --card-light: #ffffff;
  --card-dark: #181c23;
  --text-light: #14181f;
  --text-dark: #f2f4f7;
  --muted-light: #3e4854;
  --muted-dark: #c5ced6;
  --line-light: #e2e5ea;
  --line-dark: #2c3340;
  --accent-light: #1f4fd8;
  --accent-dark: #9db7ff;
  --surface: var(--surface-light);
  --card: var(--card-light);
  --text: var(--text-light);
  --muted: var(--muted-light);
  --line: var(--line-light);
  --accent: var(--accent-light);
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface: var(--surface-dark);
    --card: var(--card-dark);
    --text: var(--text-dark);
    --muted: var(--muted-dark);
    --line: var(--line-dark);
    --accent: var(--accent-dark);
  }
}

html {
  box-sizing: border-box;
  color-scheme: light dark;
  background: var(--surface);
  background: light-dark(var(--surface-light), var(--surface-dark));
  color: var(--text);
  color: light-dark(var(--text-light), var(--text-dark));
  accent-color: var(--accent);
  accent-color: light-dark(var(--accent-light), var(--accent-dark));
}

body,
main,
h1,
p,
a,
button,
summary {
  box-sizing: inherit;
}

body {
  margin: 0;
  min-height: 100dvh;
  padding:
    calc(env(safe-area-inset-top) + clamp(1.25rem, 8dvh, 5rem))
    env(safe-area-inset-right)
    calc(env(safe-area-inset-bottom) + 1.25rem)
    env(safe-area-inset-left);
  background: var(--surface);
  background: light-dark(var(--surface-light), var(--surface-dark));
  color: var(--text);
  color: light-dark(var(--text-light), var(--text-dark));
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}

.nav-bar,
.nav-drawer {
  width: min(36rem, calc(100% - 2rem));
  margin: 0 auto 1rem;
}

.nav-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.nav-drawer {
  display: none;
}

.nav-bar a,
.nav-drawer a,
.nav-bar summary,
.nav-drawer summary {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--line);
  border: 1px solid light-dark(var(--line-light), var(--line-dark));
  border-radius: 999px;
  background: var(--card);
  background: light-dark(var(--card-light), var(--card-dark));
  color: inherit;
  font: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.nav-drawer summary {
  cursor: pointer;
}

.nav-group ul,
.nav-drawer ul {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 40rem) {
  .nav-bar {
    display: none;
  }

  .nav-drawer {
    display: block;
  }
}

main {
  width: min(36rem, calc(100% - 2rem));
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--card);
  background: light-dark(var(--card-light), var(--card-dark));
  border: 1px solid var(--line);
  border: 1px solid light-dark(var(--line-light), var(--line-dark));
  border-radius: 1.5rem;
  corner-shape: squircle;
}

h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 1rem + 2.2vw, 3.25rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
  text-wrap: balance;
  overflow-wrap: break-word;
}

.lede {
  max-width: 42ch;
  margin: 0;
  color: var(--muted);
  color: light-dark(var(--muted-light), var(--muted-dark));
  text-wrap: pretty;
  overflow-wrap: break-word;
}

.action {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  margin-top: 1.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--line);
  border: 1px solid light-dark(var(--line-light), var(--line-dark));
  border-radius: 999px;
  background: var(--card);
  background: light-dark(var(--card-light), var(--card-dark));
  color: inherit;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

a:focus-visible,
summary:focus-visible,
.action:focus-visible {
  outline: 2px solid var(--accent);
  outline: 2px solid light-dark(var(--accent-light), var(--accent-dark));
  outline-offset: 3px;
}

::selection {
  background: light-dark(#d5def8, #2a3a66);
  color: light-dark(var(--text-light), var(--text-dark));
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
`
}

function navTs(items) {
  const body = items.map((item) => {
    if (item.children) {
      const children = item.children.map((child) => `    { label: ${jsSingle(child.label)}, href: ${jsSingle(child.href)} },`).join("\n")
      return `  {\n    label: ${jsSingle(item.label)},\n    children: [\n${children}\n    ],\n  },`
    }
    return `  { label: ${jsSingle(item.label)}, href: ${jsSingle(item.href)} },`
  }).join("\n")
  return `export type NavLink = { label: string; href: string }

export type NavItem = { label: string; href?: string; children?: NavLink[] }

export const nav: NavItem[] = [
${body}
]
`
}

function solidNavBlock() {
  return `<For each={nav}>
          {(item) => {
            const children = item.children
            return children ? (
              <details class="nav-group">
                <summary>{item.label}</summary>
                <ul>
                  <For each={children}>
                    {(child) => (
                      <li>
                        <a href={child.href}>{child.label}</a>
                      </li>
                    )}
                  </For>
                </ul>
              </details>
            ) : (
              <a href={item.href ?? "/"}>{item.label}</a>
            )
          }}
        </For>`
}

function solidLayout() {
  return `import { For, onMount, type JSX } from "solid-js"
import { nav } from "../src/nav"

export default function Layout(props: { children: JSX.Element }) {
  onMount(() => {
    for (const node of document.querySelectorAll('meta[name="theme-color"]')) {
      document.head.appendChild(node)
    }
  })
  return (
    <>
      <meta name="theme-color" content="#f3f4f6" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#101318" media="(prefers-color-scheme: dark)" />
      <header>
        <nav class="nav-bar" aria-label="Sections">
          ${solidNavBlock()}
        </nav>
        <details class="nav-drawer">
          <summary>Menu</summary>
          <nav aria-label="Sections">
            ${solidNavBlock()}
          </nav>
        </details>
      </header>
      <main>{props.children}</main>
    </>
  )
}
`
}

function solidHome(title, offline) {
  const mount = offline
    ? `import { onMount } from "solid-js"
import type { Props } from "./index.server"
import { ready } from "../src/lib/ready"

export default function Home(props: Props) {
  onMount(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")
  })
  return (
    <>
      <h1>{${jsSingle(title)}}</h1>
      <p class="lede">{ready(Boolean(props.ok)) === "ready" ? "Server ready." : "Server not ready."}</p>
    </>
  )
}
`
    : `import type { Props } from "./index.server"
import { ready } from "../src/lib/ready"

export default function Home(props: Props) {
  return (
    <>
      <h1>{${jsSingle(title)}}</h1>
      <p class="lede">{ready(Boolean(props.ok)) === "ready" ? "Server ready." : "Server not ready."}</p>
    </>
  )
}
`
  return mount
}

function solidNotFound() {
  return `export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p class="lede">That page is not here.</p>
      <a class="action" href="/">Back home</a>
    </>
  )
}
`
}

function solidOffline(css) {
  return `export default function Offline() {
  return (
    <>
      <style>{${jsSingle(css)}}</style>
      <h1>You are offline</h1>
      <p class="lede">The network failed. Try again when it is back.</p>
      <a class="action" href="/">Try again</a>
    </>
  )
}
`
}

function reactHome(title, offline) {
  const effect = offline
    ? `  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")
  }, [])
`
    : ""
  const imports = offline
    ? `import { useEffect } from "react"
`
    : ""
  return `${imports}import type { Props } from "./index.server"
import { ready } from "../src/lib/ready"

export default function Home(props: Props) {
${effect}  return (
    <>
      <h1>{${jsSingle(title)}}</h1>
      <p className="lede">{ready(Boolean(props.ok)) === "ready" ? "Server ready." : "Server not ready."}</p>
    </>
  )
}
`
}

function vueHome(title, offline) {
  const mounted = offline
    ? `import { onMounted } from "vue"
onMounted(() => {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")
})
`
    : ""
  return `<script setup lang="ts">
import type { Props } from "./index.server"
import { ready } from "../src/lib/ready"
${mounted}defineProps<Props>()
</script>

<template>
  <h1>${htmlText(title)}</h1>
  <p class="lede">{{ ready(true) === "ready" ? "Server ready." : "Server not ready." }}</p>
</template>
`
}

function svelteHome(title, offline) {
  const mounted = offline
    ? `  import { onMount } from "svelte"
  onMount(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")
  })
`
    : ""
  return `<script lang="ts">
  import type { Props } from "./index.server"
  import { ready } from "../src/lib/ready"
${mounted}  let { ok }: Props = $props()
</script>

<h1>${htmlText(title)}</h1>
<p class="lede">{ready(Boolean(ok)) === "ready" ? "Server ready." : "Server not ready."}</p>
`
}

function loaderSource(answers) {
  const imports = [`import { defineHandler, type InferProps } from "void"`]
  const lines = []
  if (answers.database !== "none") {
    imports.push(`import { db } from "void/db"`)
    lines.push("  void db")
  }
  if (answers.auth === "policy") {
    imports.push(`import { authPolicy } from "../src/server/auth/policy"`)
    lines.push(`  if (authPolicy.primary !== "passkey") throw new Error("auth")`)
  }
  lines.push("  return { ok: true as const }")
  return `${imports.join("\n")}

export type Props = InferProps<typeof loader>

export const loader = defineHandler(async () => {
${lines.join("\n")}
})
`
}

function voidConfig(answers) {
  const meta = [
    `    { charset: "utf-8" },`,
    `    { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },`,
    `    { name: "color-scheme", content: "light dark" },`,
  ]
  const links = [`    { rel: "stylesheet", href: "/app.css" },`, `    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },`]
  if (answers.offline === "yes") links.push(`    { rel: "manifest", href: "/manifest.webmanifest" },`)
  const fields = [
    `  target: "cloudflare",`,
    `  output: "server",`,
    `  cloudflare: { name: workerName(${jsSingle(answers.name)}, process.env.APP_ENV) },`,
  ]
  if (answers.database === "pg" || answers.database === "mysql") fields.push(`  database: ${jsSingle(answers.database)},`)
  if (answers.auth === "void") {
    const providers = splitList(answers.authProviders).map((provider) => jsSingle(provider)).join(", ")
    fields.push(`  auth: { providers: [${providers}] },`)
  }
  if (answers.email !== "no" && answers.emailFrom) fields.push(`  email: { from: ${jsSingle(answers.emailFrom)} },`)
  if (answers.ai === "gateway") fields.push(`  ai: { gateway: ${jsSingle(answers.aiGateway)} },`)
  if (answers.sandbox === "yes" && answers.sandboxImage) fields.push(`  sandbox: { image: ${jsSingle(answers.sandboxImage)} },`)
  if (answers.shape === "spa") fields.push(`  inference: { appType: "spa" },`)
  const routing = [`    notFound: "none",`]
  if (answers.cache !== "no") routing.push(`    revalidate: { "/": ${Number(answers.cache)} },`)
  fields.push(`  routing: {\n${routing.join("\n")}\n  },`)
  fields.push(`  head: {
    title: ${jsSingle(answers.title)},
    htmlAttrs: { lang: "en" },
    meta: [
${meta.join("\n")}
    ],
    link: [
${links.join("\n")}
    ],
  },`)
  return `import { defineConfig } from "void/config"
import { workerName } from "./deploy/name"

// APP_ENV selects the worker. production and an empty value use the package name.
export default defineConfig({
${fields.join("\n")}
})
`
}

function viteConfig(answers) {
  const adapter = {
    solid: ["voidSolid", "@void/solid/plugin"],
    react: ["voidReact", "@void/react/plugin"],
    vue: ["voidVue", "@void/vue/plugin"],
    svelte: ["voidSvelte", "@void/svelte/plugin"],
  }[answers.ui]
  const options = []
  if (answers.ui === "react") options.push("react: { compiler: true }")
  if (answers.viewTransitions === "yes") options.push("viewTransitions: true")
  const call = options.length ? `${adapter[0]}({ ${options.join(", ")} })` : `${adapter[0]}()`
  const imports = [
    `import { defineConfig } from "vite"`,
    `import { voidPlugin } from "void"`,
    `import { ${adapter[0]} } from ${jsSingle(adapter[1])}`,
  ]
  const plugins = ["voidPlugin()", call]
  if (answers.markdown === "yes") {
    imports.push(`import { voidMarkdown } from "@void/md/plugin"`)
    plugins.push("voidMarkdown()")
  }
  return `${imports.join("\n")}

export default defineConfig({
  plugins: [${plugins.join(", ")}],
})
`
}

function envSource(secretNames) {
  if (!secretNames.length) {
    return `import { defineEnv } from "void/env"

export default defineEnv({})
`
  }
  const helpers = new Set(["string"])
  const fields = secretNames.map((name) => {
    if (name === "DATABASE_URL") {
      helpers.add("url")
      return `  DATABASE_URL: url(),`
    }
    return `  ${name}: string(),`
  })
  return `import { defineEnv, ${[...helpers].join(", ")} } from "void/env"

export default defineEnv({
${fields.join("\n")}
})
`
}

function schemaSource(database) {
  if (database === "pg") {
    return `import { integer, pgTable, text } from "void/schema-pg"

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  created_at: integer("created_at").notNull(),
})
`
  }
  if (database === "mysql") {
    return `import { int, mysqlTable, text } from "void/schema-mysql"

export const sessions = mysqlTable("sessions", {
  id: text("id").primaryKey(),
  created_at: int("created_at").notNull(),
})
`
  }
  return `import { integer, sqliteTable, text } from "void/schema-d1"

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  created_at: integer("created_at").notNull(),
})
`
}

function mcpSource(name) {
  return `import { McpServer } from "@modelcontextprotocol/server"
import { createMcpHandler } from "agents/mcp/server"
import { defineHandler } from "void"
import { z } from "zod"

export const mcpPath = "/mcp"

function createServer() {
  const server = new McpServer({
    name: ${jsSingle(name)},
    version: "0.1.0",
  })
  const output = { ok: true as const }
  server.registerTool(
    "healthcheck",
    {
      description: "Report that this app is up.",
      inputSchema: z.object({}),
      outputSchema: z.object({ ok: z.literal(true) }),
    },
    async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    }),
  )
  return server
}

const mcpHandler = createMcpHandler(createServer, { route: mcpPath })

export const POST = defineHandler(async (c) => mcpHandler.fetch(c.req.raw))
export const GET = defineHandler(async (c) => mcpHandler.fetch(c.req.raw))
export const DELETE = defineHandler(async (c) => mcpHandler.fetch(c.req.raw))
`
}

function packageJson(answers) {
  const deps = { hono: "^4.11.9" }
  const dev = {
    void: VOID_RANGE,
    typescript: "^7.0.2",
  }
  if (answers.toolchain === "vite-plus") {
    dev.vite = "npm:@voidzero-dev/vite-plus-core@^1.2.0"
    dev["vite-plus"] = "^1.2.0"
  } else {
    dev.vite = "^8.0.10"
  }
  const uiDeps = {
    solid: { "solid-js": "^1.9.12" },
    react: { react: "^19.2.4", "react-dom": "^19.2.4" },
    vue: { vue: "^3.5.30" },
    svelte: { svelte: "^5.53.9" },
  }
  const uiDev = {
    solid: {},
    react: {
      "@types/react": "^19.2.14",
      "@types/react-dom": "^19.2.3",
      "oxc-transform-react": "^0.149.0",
    },
    vue: {},
    svelte: {},
  }
  const adapter = { solid: "@void/solid", react: "@void/react", vue: "@void/vue", svelte: "@void/svelte" }[answers.ui]
  Object.assign(deps, uiDeps[answers.ui])
  Object.assign(dev, uiDev[answers.ui])
  dev[adapter] = VOID_RANGE
  if (answers.markdown === "yes") dev["@void/md"] = VOID_RANGE
  if (answers.mcp === "yes") {
    deps.agents = "^0.28.1"
    deps["@modelcontextprotocol/server"] = "^2.3.1"
    deps.zod = "^4.6.7"
  }
  const devScript = answers.toolchain === "vite-plus" ? "vp dev" : "vite"
  const buildScript = answers.toolchain === "vite-plus" ? "vp build" : "vite build"
  const previewBin = answers.toolchain === "vite-plus" ? "vp" : "vite"
  const pkg = {
    name: answers.name,
    private: true,
    type: "module",
    engines: { node: `>=${NODE_FLOOR}` },
    scripts: {
      dev: devScript,
      build: buildScript,
      preview: `${previewBin} preview --host 127.0.0.1 --port 4173`,
      test: "node --test tests/ready.test.ts",
      check: "sh scripts/check.sh",
      deploy: "node scripts/deploy.mjs",
    },
    dependencies: deps,
    devDependencies: dev,
  }
  if (answers.packageManager === "pnpm") {
    pkg.pnpm = { onlyBuiltDependencies: ["esbuild", "lightningcss", "sharp", "workerd"] }
  }
  return `${JSON.stringify(pkg, null, 2)}\n`
}

function tsconfig(ui) {
  const compiler = {
    target: "ES2023",
    module: "ESNext",
    moduleResolution: "bundler",
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noEmit: true,
    isolatedModules: true,
    verbatimModuleSyntax: true,
    types: ["void/env"],
    lib: ["ES2023", "DOM", "DOM.Iterable"],
    allowImportingTsExtensions: true,
    skipLibCheck: true,
  }
  if (ui === "solid") {
    compiler.jsx = "preserve"
    compiler.jsxImportSource = "solid-js"
  }
  if (ui === "react") compiler.jsx = "react-jsx"
  return `${JSON.stringify({
    extends: "./.void/tsconfig.json",
    compilerOptions: compiler,
    include: ["**/*.ts", "**/*.tsx"],
    exclude: ["node_modules", "dist", ".void"],
  }, null, 2)}\n`
}

function workflow(answers, command) {
  const branches = Object.keys(parseEnvironments(answers.environments).map)
  const refTest = branches.map((branch) => `github.ref_name == '${branch}'`).join(" || ")
  const lines = [
    "name: void",
    "on:",
    "  pull_request:",
    "  push:",
    "permissions:",
    "  contents: read",
    "concurrency:",
    "  group: void-${{ github.ref_name }}",
    "  cancel-in-progress: false",
  ]
  if (answers.checks === "yes") {
    lines.push(
      "jobs:",
      "  check:",
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 60",
      "    outputs:",
      "      mapped: ${{ steps.map.outputs.mapped }}",
      "    steps:",
      "      - uses: actions/checkout@v6",
      "        with:",
      "          persist-credentials: false",
      "      - id: map",
      "        env:",
      "          BRANCH: ${{ github.event_name == 'pull_request' && github.base_ref || github.ref_name }}",
      "        run: |",
      "          status=0",
      "          env_name=$(sh scripts/branch-env.sh \"$BRANCH\") || status=$?",
      "          if [ \"$status\" = 3 ]; then",
      "            echo \"mapped=false\" >> \"$GITHUB_OUTPUT\"",
      "          elif [ \"$status\" != 0 ]; then",
      "            exit \"$status\"",
      "          else",
      "            echo \"mapped=true\" >> \"$GITHUB_OUTPUT\"",
      "            echo \"app_env=$env_name\" >> \"$GITHUB_OUTPUT\"",
      "          fi",
      "      - if: steps.map.outputs.mapped == 'true'",
      "        uses: actions/setup-node@v6",
      "        with:",
      "          node-version: \"24\"",
      `          cache: ${answers.packageManager === "pnpm" ? "pnpm" : "npm"}`,
    )
    if (answers.packageManager === "pnpm") {
      lines.push("      - if: steps.map.outputs.mapped == 'true'", "        run: corepack enable")
    }
    lines.push(
      "      - if: steps.map.outputs.mapped == 'true'",
      `        run: ${answers.packageManager === "pnpm" ? "pnpm install --frozen-lockfile" : "npm ci"}`,
    )
    if (answers.shape === "pages") {
      lines.push(
        "      - if: steps.map.outputs.mapped == 'true'",
        "        id: chrome",
        "        uses: browser-actions/setup-chrome@v2",
        "        with:",
        "          install-dependencies: true",
      )
    }
    lines.push(
      "      - name: Check",
      "        if: steps.map.outputs.mapped == 'true'",
      "        env:",
      "          APP_ENV: ${{ steps.map.outputs.app_env }}",
      "          BRANCH: ${{ github.event_name == 'pull_request' && github.base_ref || github.ref_name }}",
    )
    if (answers.shape === "pages") lines.push("          CHROME_PATH: ${{ steps.chrome.outputs.chrome-path }}")
    lines.push("        run: sh scripts/check.sh")
    if (answers.shape === "pages") {
      lines.push(
        "      - if: steps.map.outputs.mapped == 'true'",
        "        uses: actions/upload-artifact@v7",
        "        with:",
        "          name: screenshots",
        "          path: screenshots/*.png",
        "          if-no-files-found: error",
      )
    }
  }
  const deploy = answers.pushDeploy === "yes" && answers.deployer === "actions" && answers.target !== "local"
  if (deploy) {
    if (answers.checks !== "yes") lines.push("jobs:")
    lines.push(
      "  deploy:",
      ...(answers.checks === "yes" ? ["    needs: check"] : []),
      answers.checks === "yes"
        ? `    if: github.event_name == 'push' && (${refTest}) && needs.check.outputs.mapped == 'true'`
        : `    if: github.event_name == 'push' && (${refTest})`,
      "    runs-on: ubuntu-latest",
      "    timeout-minutes: 60",
      "    steps:",
      "      - uses: actions/checkout@v6",
      "        with:",
      "          persist-credentials: false",
      "      - id: map",
      "        env:",
      "          BRANCH: ${{ github.ref_name }}",
      "        run: |",
      "          env_name=$(sh scripts/branch-env.sh \"$BRANCH\")",
      "          echo \"app_env=$env_name\" >> \"$GITHUB_OUTPUT\"",
      "      - uses: actions/setup-node@v6",
      "        with:",
      "          node-version: \"24\"",
      `          cache: ${answers.packageManager === "pnpm" ? "pnpm" : "npm"}`,
    )
    if (answers.packageManager === "pnpm") lines.push("      - run: corepack enable")
    lines.push(
      `      - run: ${answers.packageManager === "pnpm" ? "pnpm install --frozen-lockfile" : "npm ci"}`,
      "      - name: Deploy",
      "        env:",
      "          APP_ENV: ${{ steps.map.outputs.app_env }}",
      "          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}",
    )
    if (answers.database === "pg" || answers.database === "mysql") {
      lines.push("          DATABASE_URL: ${{ secrets.DATABASE_URL }}")
    }
    lines.push(`        run: npx ${command}`)
    if (answers.webhook === "yes") {
      lines.push(
        "      - name: Notify",
        "        env:",
        "          DEPLOY_WEBHOOK_URL: ${{ secrets.DEPLOY_WEBHOOK_URL }}",
        "        run: sh scripts/notify.sh",
      )
    }
  }
  if (answers.checks !== "yes" && !deploy) return ""
  return `${lines.join("\n")}\n`
}

function screenshotSh(secretNames) {
  const localSecrets = secretNames.map((name) => `if [ -z "\${${name}:-}" ]; then
  ${name}=$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')
  export ${name}
fi`).join("\n")
  return `#!/bin/sh
# Capture the production preview. A browser is a dev tool; the app does not ship one.
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
# Preview boots only when required server names are present. A missing name gets
# a process-local value. Nothing is written to disk.
${localSecrets}
port=\${PREVIEW_PORT:-4173}
wait_for=\${PREVIEW_WAIT:-90}
out="$root/screenshots"
mkdir -p "$out"
home_png="$out/home.png"
offline_png="$out/offline.png"
base="http://127.0.0.1:$port"

find_chrome() {
  if [ -n "\${CHROME_PATH:-}" ] && [ -x "\${CHROME_PATH}" ]; then
    printf '%s\\n' "$CHROME_PATH"
    return
  fi
  for name in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$name" >/dev/null 2>&1; then
      command -v "$name"
      return
    fi
  done
  mac="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [ -x "$mac" ]; then
    printf '%s\\n' "$mac"
  fi
}

show_commands() {
  browser=\${1:-<chrome>}
  echo "screenshot command: $browser --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$home_png $base/" >&2
  echo "screenshot command: $browser --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$offline_png $base/offline" >&2
}

if [ ! -d dist ]; then
  npm run build
fi

log="$out/preview.log"
npm run preview -- --host 127.0.0.1 --port "$port" --strictPort >"$log" 2>&1 &
pid=$!
cleanup() {
  kill "$pid" 2>/dev/null || true
  pkill -P "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
i=0
while [ "$i" -lt "$wait_for" ]; do
  # A 4xx or 5xx is not a page worth capturing. urlopen raises on those.
  if python3 -c 'import sys, urllib.request
for url in sys.argv[1:]:
    urllib.request.urlopen(url, timeout=2)
' "$base/" "$base/offline" >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$pid" 2>/dev/null; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

chrome=$(find_chrome || true)
if [ "$ready" != 1 ]; then
  show_commands "$chrome"
  echo "preview did not start" >&2
  tail -n 40 "$log" >&2 || true
  exit 1
fi
if [ -z "$chrome" ]; then
  show_commands
  echo "headless browser not found" >&2
  exit 1
fi

profile=$(mktemp -d "\${TMPDIR:-/tmp}/web-app-chrome.XXXXXX")
dump() {
  "$chrome" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --user-data-dir="$profile" --virtual-time-budget=4000 --dump-dom "$1"
}
home_dom=$(dump "$base/")
offline_dom=$(dump "$base/offline")
python3 -c 'import sys
home, offline = sys.argv[1:]
for needle in ("Server ready.", "#f3f4f6", "#101318"):
    if needle not in home:
        sys.stderr.write("home missing %s\\n" % needle)
        sys.exit(1)
if "tagname" in home or "tagname" in offline:
    sys.stderr.write("theme-color used tagname\\n")
    sys.exit(1)
if "You are offline" not in offline:
    sys.stderr.write("offline heading missing\\n")
    sys.exit(1)
' "$home_dom" "$offline_dom"

shot() {
  url=$1
  file=$2
  echo "screenshot command: $chrome --headless=new --disable-gpu --no-sandbox --window-size=1280,720 --screenshot=$file $url"
  "$chrome" \\
    --headless=new \\
    --disable-gpu \\
    --no-sandbox \\
    --hide-scrollbars \\
    --user-data-dir="$profile" \\
    --window-size=1280,720 \\
    --screenshot="$file" \\
    "$url"
}
shot "$base/" "$home_png"
shot "$base/offline" "$offline_png"
[ -s "$home_png" ] && [ -s "$offline_png" ]
`
}

function checkSh() {
  return `#!/bin/sh
# Typecheck, test, and build this app. This script does not deploy.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
if [ -z "\${APP_ENV:-}" ] && [ -n "\${BRANCH:-}" ]; then
  APP_ENV=$(sh scripts/branch-env.sh "$BRANCH")
  export APP_ENV
fi
node --experimental-strip-types scripts/check-names.mjs
npx tsc --noEmit
npm test
npm run build
if [ -f scripts/screenshot.sh ]; then
  sh scripts/screenshot.sh
fi
`
}

function branchEnvSh() {
  return `#!/bin/sh
set -eu
branch=\${1:-\${BRANCH:-}}
python3 -c 'import json, sys
branch = sys.argv[1]
data = json.load(open("deploy/branches.json"))
env = data.get(branch)
if not env:
    sys.exit(3)
print(env)
' "$branch"
`
}

function readme(answers, command) {
  const lines = [`# ${answers.title}`, ""]
  lines.push("This is a Void app on Cloudflare Workers. The worker name is the package name. A push of main deploys production. A push of staging deploys the staging worker, using the same project file with APP_ENV set, so that worker name is the package name plus -staging.")
  lines.push("")
  if (answers.auth === "policy") {
    lines.push("A file in this tree is not a live Cloudflare connection. Auth is recorded and is not implemented: the policy says passkeys, then a phone code, with sessions in the database. This tree does not run a WebAuthn ceremony or send a phone code.")
  } else if (answers.auth === "void") {
    lines.push("A file in this tree is not a live Cloudflare connection. Sign-in uses the providers named in void.config.ts.")
  } else {
    lines.push("A file in this tree is not a live Cloudflare connection. This app does not authenticate users.")
  }
  lines.push("")
  lines.push("One void.lock.json records the resource ids of the last deploy. Each environment is its own Worker, and a shared lock cannot hold two database ids.")
  lines.push("")
  if (command) {
    lines.push("Deploy only when you mean to. The command is:")
    lines.push("")
    lines.push("```")
    lines.push(command)
    lines.push("```")
    lines.push("")
    lines.push("`npm run deploy` prints that command and exits. The workflow runs it on a push of a mapped branch. A pull request runs checks and does not deploy.")
  } else {
    lines.push("This app has no push deploy. Pull-request checks still run when they are enabled.")
  }
  lines.push("")
  lines.push("Only one of Workers Builds, `void github connect`, and this workflow may deploy a branch.")
  lines.push("")
  lines.push("Install talks to the npm registry. The Void docs are in node_modules/void/docs after install, and at https://void.cloud. Deploy talks to Cloudflare when you run it. Connecting a GitHub repository talks to GitHub. Credentials stay with those products. Server secret names are in env.ts. Put values in a gitignored .env locally, or with `void secret put` for production. Do not commit values.")
  lines.push("")
  lines.push("Run `npm test` and `sh scripts/check.sh`. Node must satisfy the engines field.")
  if (answers.mcp === "yes") {
    lines.push("")
    lines.push("The public HTTP path /mcp has one healthcheck tool. It reads no secret, session, or database. A stdio server does not serve that path.")
  }
  lines.push("")
  return `${lines.join("\n")}`
}

function offlineHtml(title, css) {
  const safe = htmlText(title)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#f3f4f6" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#101318" media="(prefers-color-scheme: dark)" />
    <title>${safe}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
${css}
    </style>
  </head>
  <body>
    <main>
      <h1>You are offline</h1>
      <p class="lede">The network failed. Try again when it is back.</p>
      <a class="action" href="/">Try again</a>
    </main>
  </body>
</html>
`
}

function writeFile(dest, rel, content) {
  const file = path.join(dest, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`)
}

function run(bin, args, cwd) {
  const result = spawnSync(bin, args, {
    cwd,
    env: { ...process.env, CI: "1" },
    encoding: "utf8",
  })
  if (result.stdout) process.stderr.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) die(result.error.message, 1)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function writeApp(dest, answers, parsed) {
  const command = deployCommand(answers)
  const css = cssText()
  const files = new Map()
  files.set("package.json", packageJson(answers))
  files.set("vite.config.ts", viteConfig(answers))
  files.set("void.config.ts", voidConfig(answers))
  files.set("tsconfig.json", tsconfig(answers.ui))
  files.set("env.ts", envSource(parsed.secretNames))
  files.set(".gitignore", "node_modules\ndist\n.void\n.wrangler\n.void-wrangler.jsonc\n.env\n.env.*\n*.tsbuildinfo\n.DS_Store\nscreenshots\n")
  files.set("README.md", readme(answers, command))
  files.set("deploy/name.ts", `export function workerName(pkg: string, env: string | undefined) {
  if (!env || env === "production") return pkg
  return \`\${pkg}-\${env}\`
}
`)
  files.set("deploy/branches.json", `${JSON.stringify(parsed.environments, null, 2)}\n`)
  files.set("scripts/check-names.mjs", `import { readFileSync } from "node:fs"
import { workerName } from "../deploy/name.ts"

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).name
if (workerName(pkg, "production") !== pkg) throw new Error("production name")
if (workerName(pkg, undefined) !== pkg) throw new Error("empty name")
if (workerName(pkg, "staging") !== pkg + "-staging") throw new Error("staging name")
`)
  files.set("scripts/branch-env.sh", branchEnvSh())
  files.set("scripts/check.sh", checkSh())
  files.set("scripts/deploy.mjs", command
    ? `console.log(${jsSingle(command)})\nprocess.exit(2)\n`
    : `console.error("Deploy is not configured for a local target.")\nprocess.exit(2)\n`)
  files.set("src/lib/ready.ts", `export function ready(ok: boolean) {
  return ok ? "ready" : "not ready"
}
`)
  files.set("tests/ready.test.ts", `import assert from "node:assert/strict"
import { test } from "node:test"
import { ready } from "../src/lib/ready.ts"

test("ready reports the server state", () => {
  assert.equal(ready(true), "ready")
  assert.equal(ready(false), "not ready")
})
`)
  if (answers.auth === "policy") {
    files.set("src/server/auth/policy.ts", `export const authPolicy = {
  primary: "passkey",
  fallback: "phone-otp",
  sessions: "d1",
} as const
`)
  }
  if (answers.database !== "none" && answers.sessions === "yes") files.set("db/schema.ts", schemaSource(answers.database))
  if (answers.seed === "yes") {
    files.set("db/seed.ts", `import { defineSeed } from "void/seed"

export default defineSeed(async () => {})
`)
  }
  if (answers.mcp === "yes") files.set("routes/mcp.ts", mcpSource(answers.name))
  if (answers.kv === "yes") {
    files.set("routes/kv.ts", `import { defineHandler } from "void"
import { kv } from "void/kv"

export const GET = defineHandler(async () => {
  const value = await kv.get("health")
  return { present: value !== null }
})
`)
  }
  if (answers.storage === "yes") {
    files.set("routes/storage.ts", `import { defineHandler } from "void"
import { storage } from "void/storage"

export const GET = defineHandler(async () => {
  const object = await storage.get("health")
  return { present: object !== null }
})
`)
  }
  for (const name of parsed.queues) {
    files.set(`queues/${name}.ts`, `import { defineQueue } from "void"

export default defineQueue<{ ok: true }>(async (batch) => {
  for (const message of batch.messages) message.ack()
})
`)
  }
  for (const job of parsed.cron) {
    files.set(`crons/${job.name}.ts`, `import { defineScheduled } from "void"

export const cron = ${jsSingle(job.expression)}

export default defineScheduled(async () => {})
`)
  }
  if (answers.email === "receive" || answers.email === "both") {
    files.set("email/_default.ts", `import { defineEmail } from "void/email"

export default defineEmail(async () => {})
`)
  }
  if (answers.ai !== "no") {
    files.set("src/server/ai.ts", `import { ai } from "void/ai"

export function model() {
  return ai
}
`)
    files.set("routes/ai.ts", `import { defineHandler } from "void"
import { model } from "../src/server/ai"

export const GET = defineHandler(() => {
  void model()
  return { ok: true as const }
})
`)
  }
  if (answers.sandbox === "yes") {
    files.set("routes/sandbox.ts", `import { defineHandler } from "void"
import { getSandbox } from "void/sandbox"

export const GET = defineHandler(async () => {
  const sandbox = await getSandbox("health")
  return { id: sandbox.id }
})
`)
  }
  if (answers.durable !== "no") {
    files.set(`durable-objects/${answers.durable}.ts`, `import { defineDurableState } from "void/durable"

export default defineDurableState({
  initialState: { count: 0 },
  methods: {
    read(context) {
      return context.state.count
    },
  },
})
`)
  }
  if (answers.live === "yes") {
    files.set("src/live.ts", `import { defineLiveStream } from "void/live"

export const live = defineLiveStream({
  id: "app",
  allowAnonymousControl: true,
})
`)
    files.set("routes/live.ts", `import { defineHandler } from "void"
import { live } from "../src/live"

export const GET = defineHandler((c) => live.connect(c))
export const POST = defineHandler((c) => live.control(c))
`)
  }
  if (answers.webhook === "yes") {
    files.set("scripts/notify.sh", `#!/bin/sh
set -eu
if [ -z "\${DEPLOY_WEBHOOK_URL:-}" ]; then
  echo "DEPLOY_WEBHOOK_URL is empty" >&2
  exit 1
fi
python3 -c 'import json, os, urllib.request
req = urllib.request.Request(
    os.environ["DEPLOY_WEBHOOK_URL"],
    data=json.dumps({"ok": True}).encode(),
    headers={"content-type": "application/json"},
)
urllib.request.urlopen(req, timeout=30)
'
`)
  }
  const yaml = workflow(answers, command)
  if (yaml) files.set(".github/workflows/void-deploy.yml", yaml)
  if (answers.shape === "pages" || answers.shape === "spa") {
    const page = answers.shape === "pages"
    if (page) {
      files.set("public/app.css", css)
      files.set("public/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#14181f"/>
  <circle cx="16" cy="16" r="6" fill="#f3f4f6"/>
</svg>
`)
      files.set("src/nav.ts", navTs(parsed.nav))
      files.set("pages/index.server.ts", loaderSource(answers))
      files.set("middleware/01-html-cache.ts", `import { defineMiddleware } from "void"

export default defineMiddleware(async (c, next) => {
  await next()
  const type = c.res.headers.get("content-type") ?? ""
  if (type.includes("text/html")) c.res.headers.set("cache-control", "private, no-store")
})
`)
      if (answers.ui === "solid") {
        files.set("pages/layout.tsx", solidLayout())
        const home = solidHome(answers.title, answers.offline === "yes")
        files.set(answers.rendering === "islands" ? "pages/index.island.tsx" : "pages/index.tsx", home)
        files.set("pages/[...path].tsx", solidNotFound())
        if (answers.offline === "yes") files.set("pages/offline.tsx", solidOffline(css))
      } else if (answers.ui === "react") {
        files.set("pages/layout.tsx", `import type { ReactNode } from "react"
import { nav } from "../src/nav"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main>{children}</main>
  )
}
`)
        files.set("pages/index.tsx", reactHome(answers.title, answers.offline === "yes"))
      } else if (answers.ui === "vue") {
        files.set("pages/layout.vue", `<script setup lang="ts">
import { nav } from "../src/nav"
</script>
<template><main><slot /></main></template>
`)
        files.set("pages/index.vue", vueHome(answers.title, answers.offline === "yes"))
      } else {
        files.set("pages/layout.svelte", `<script lang="ts">
  import { nav } from "../src/nav"
</script>
<main><slot /></main>
`)
        files.set("pages/index.svelte", svelteHome(answers.title, answers.offline === "yes"))
      }
      if (answers.markdown === "yes") {
        files.set("pages/guide.md", `# Guide

Notes for ${answers.title}.
`)
      }
    }
    if (answers.offline === "yes") {
      files.set("public/offline.html", offlineHtml(answers.title, css))
      files.set("public/manifest.webmanifest", `${JSON.stringify({
        name: answers.title,
        short_name: answers.title,
        start_url: "/",
        display: "standalone",
        background_color: "#f3f4f6",
        theme_color: "#f3f4f6",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      }, null, 2)}\n`)
      files.set("public/sw.js", `const cacheName = "web-app-offline"
const offline = "/offline"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.add(offline)))
})

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName)
      return (await cache.match(offline)) || new Response("Offline", { status: 503 })
    }),
  )
})
`)
      files.set("scripts/screenshot.sh", screenshotSh(parsed.secretNames))
    }
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const [rel, content] of files) writeFile(dest, rel, content)
  for (const rel of ["scripts/branch-env.sh", "scripts/check.sh", "scripts/screenshot.sh", "scripts/notify.sh"]) {
    const file = path.join(dest, rel)
    if (fs.existsSync(file)) fs.chmodSync(file, 0o755)
  }
  if (answers.git === "yes") {
    const git = spawnSync("git", ["init", "-b", "main"], { cwd: dest, stdio: "ignore" })
    if (git.status !== 0) die("git init failed", git.status ?? 1)
  }
  return command
}

function copyAgents(dest) {
  const pkgPath = path.join(dest, "node_modules/void/package.json")
  const templatePath = path.join(dest, "node_modules/void/AGENTS_TEMPLATE.md")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
  let body = fs.readFileSync(templatePath, "utf8")
  if (!body.endsWith("\n")) body += "\n"
  const block = `<!--injected-by-void-v${pkg.version}-->\n${body}<!--/injected-by-void-->\n`
  fs.writeFileSync(path.join(dest, "AGENTS.md"), block)
  const floor = String(pkg.engines?.node ?? `>=${NODE_FLOOR}`).replace(/^>=\s*/, "")
  if (!versionGte(process.versions.node, floor)) die(`Node ${process.versions.node} is older than void engines ${pkg.engines.node}`, 1)
}

function main() {
  if (!versionGte(process.versions.node, NODE_FLOOR)) {
    die(`Node ${process.versions.node} is older than ${NODE_FLOOR}`)
  }
  const { dest, flags } = parseArgs(process.argv.slice(2))
  if (!dest) die(`missing --dest\n${usage()}`)
  const { answers, explicit } = resolveAnswers(flags)
  const parsed = validate(answers, explicit)
  if (parsed.errors.length) die(parsed.errors.join("\n"))
  if (destinationInsidePlugin(dest)) die("destination is inside the plugin")
  const resolved = resolveDest(dest)
  if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) die(`destination exists and is not a directory: ${resolved}`)
  if (fs.existsSync(resolved) && fs.readdirSync(resolved).length) die(`destination is not empty: ${resolved}`)
  const command = writeApp(resolved, answers, parsed)
  const skip = process.env.JOULES_SKIP_INSTALL === "1"
  if (!skip) {
    const installer = answers.packageManager
    run(installer, ["install"], resolved)
    const voidBin = path.join(resolved, "node_modules/.bin/void")
    if (fs.existsSync(path.join(resolved, "db/schema.ts")) || answers.auth === "void") {
      run(voidBin, ["db", "generate"], resolved)
    }
    run(voidBin, ["init", "--tsconfig"], resolved)
    run(voidBin, ["prepare"], resolved)
    copyAgents(resolved)
  }
  if (answers.createRepo === "yes") {
    process.stderr.write(`gh repo create ${answers.githubRepo} --private --source=. --remote=origin\n`)
    run("gh", ["repo", "create", answers.githubRepo, "--private", "--source=.", "--remote=origin"], resolved)
  }
  if (command) process.stderr.write(`${command}\n`)
  else process.stderr.write("Deploy is not configured for a local target.\n")
  if (answers.target === "void") process.stderr.write(`void connect ${answers.platformUrl}\n`)
  if (answers.deployer === "void-github") {
    const install = answers.githubInstallation ? ` --installation ${answers.githubInstallation}` : ""
    process.stderr.write(`void github connect ${answers.name} --repo ${answers.githubRepo} --branch ${answers.githubBranch} --executor github_actions --workflow .github/workflows/void-deploy.yml${install}\n`)
  }
  if (answers.domain !== "none") process.stderr.write(`void domain add ${answers.domain}\n`)
  if (answers.emailAllow) process.stderr.write(`void email allow ${answers.emailAllow}\n`)
  process.stderr.write("The first deploy opens a Cloudflare login. This script does not deploy.\n")
  process.stdout.write(`${resolved}\n`)
}

main()
