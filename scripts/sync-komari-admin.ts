import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

const projectRoot = resolve(import.meta.dirname, '..')
const sourceRoot = resolve(process.argv[2] || process.env.KOMARI_WEB_DIR || resolve(projectRoot, '..', 'komari-web'))
const sourceDist = resolve(sourceRoot, 'dist')
const sourceThemeManaged = resolve(sourceRoot, 'src', 'pages', 'admin', 'theme_managed.tsx')
const targetDir = resolve(projectRoot, 'public', 'admin-app')
const overrideCss = resolve(projectRoot, 'scripts', 'assets', 'glass-admin.css')
const charsetMarker = '<meta charset="UTF-8" />'
const pwaRegisterPattern = /<script[^>]+id="vite-plugin-pwa:register-sw"[^>]*><\/script>/g
const workboxFilenamePattern = /^workbox-[\w-]+\.js$/
const runtimeAssetPathRewrites = [
  ['/assets/flags/', '/admin-app/assets/flags/'],
  ['/assets/logo/', '/admin-app/assets/logo/'],
] as const
const runtimeAssetReferencePattern = /assets\/(?:flags|logo)\//g
const adminCssVersion = createHash('sha256').update(readFileSync(overrideCss)).digest('hex').slice(0, 12)

function replaceSourceOrThrow(source: string, search: string, replacement: string, label: string): string {
  if (!source.includes(search))
    throw new Error(`komari-web theme manager override anchor not found: ${label}`)
  return source.replace(search, replacement)
}

function copyDirectoryContents(source: string, target: string): void {
  mkdirSync(target, { recursive: true })
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = resolve(source, entry.name)
    const targetPath = resolve(target, entry.name)
    if (entry.isDirectory())
      copyDirectoryContents(sourcePath, targetPath)
    else
      copyFileSync(sourcePath, targetPath)
  }
}

function applyPingTaskSelectOverride(): () => void {
  if (!existsSync(sourceThemeManaged))
    throw new Error(`komari-web managed theme page not found: ${sourceThemeManaged}`)

  const original = readFileSync(sourceThemeManaged, 'utf8')
  let overridden = original

  overridden = replaceSourceOrThrow(
    overridden,
    'type: "title" | "switch" | "select" | "number" | "string" | "richtext";',
    'type: "title" | "switch" | "select" | "pingtask" | "number" | "string" | "richtext";',
    'ThemeFieldBase.type',
  )

  overridden = replaceSourceOrThrow(
    overridden,
    '  const [firstLoading, setFirstLoading] = useState(true);',
    `  const [firstLoading, setFirstLoading] = useState(true);
  const [pingTasks, setPingTasks] = useState<Array<{
    id: number;
    name?: string;
    target?: string;
    type?: string;
  }>>([]);
  const [pingTasksError, setPingTasksError] = useState("");

  useEffect(() => {
    if (!fields.some((field) => field.type === "pingtask")) {
      setPingTasks([]);
      setPingTasksError("");
      return;
    }

    const controller = new AbortController();
    setPingTasksError("");
    fetch("/api/admin/ping", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return response.json();
      })
      .then((response) => {
        const tasks = Array.isArray(response?.data) ? response.data : [];
        setPingTasks(
          tasks.filter(
            (task: { id?: unknown }) =>
              Number.isInteger(task?.id) && Number(task.id) > 0,
          ),
        );
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setPingTasks([]);
        setPingTasksError("Ping 任务列表加载失败，请刷新后重试。");
      });

    return () => controller.abort();
  }, [fields]);`,
    'ThemeManaged ping task state',
  )

  overridden = replaceSourceOrThrow(
    overridden,
    '            case "number":',
    `            case "pingtask": {
              const selectedValue = String(val ?? 0);
              const otherSelectedIds = new Set(
                fields
                  .filter(
                    (field) =>
                      field.type === "pingtask" &&
                      field.key &&
                      field.key !== f.key,
                  )
                  .map((field) => Number(values[field.key!]))
                  .filter((taskId) => Number.isInteger(taskId) && taskId > 0),
              );
              const opts = [
                { value: "0", label: "自动选择" },
                ...pingTasks.map((task) => ({
                  value: String(task.id),
                  label:
                    task.name ||
                    task.target ||
                    task.type ||
                    \`任务 #\${task.id}\`,
                  disabled:
                    selectedValue !== String(task.id) &&
                    otherSelectedIds.has(task.id),
                })),
              ];
              return (
                <SettingCardSelect
                  key={f.key}
                  title={title}
                  description={
                    pingTasksError
                      ? \`\${description} \${pingTasksError}\`.trim()
                      : description
                  }
                  value={selectedValue}
                  options={opts}
                  OnSave={(v) => handleValueChange(f.key!, Number(v))}
                  label={
                    opts.find((option) => option.value === selectedValue)
                      ?.label || t("common.select")
                  }
                />
              );
            }
            case "number":`,
    'ThemeManaged pingtask renderer',
  )

  writeFileSync(sourceThemeManaged, overridden)
  return () => writeFileSync(sourceThemeManaged, original)
}

interface WebAppManifest {
  icons?: Array<Record<string, unknown> & { src?: unknown }>
}

function normalizePwaManifests(directory: string): number {
  const filenames = ['manifest.json', 'manifest.webmanifest']
  const existing = filenames.filter(filename => existsSync(resolve(directory, filename)))
  if (!existing.length)
    return 0

  let canonicalManifest: WebAppManifest | null = null
  for (const filename of existing) {
    const path = resolve(directory, filename)
    const manifest = JSON.parse(readFileSync(path, 'utf8')) as WebAppManifest
    if (Array.isArray(manifest.icons)) {
      manifest.icons = manifest.icons.map((icon) => {
        if (typeof icon.src !== 'string' || !icon.src.startsWith('/assets/'))
          return icon
        return { ...icon, src: `/admin-app${icon.src}` }
      })
    }
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
    canonicalManifest ??= manifest
  }

  if (!existsSync(resolve(directory, 'manifest.json')) && canonicalManifest)
    writeFileSync(resolve(directory, 'manifest.json'), `${JSON.stringify(canonicalManifest, null, 2)}\n`)
  return existing.length
}

function rewriteRuntimeAssetPaths(directory: string): number {
  let replacements = 0

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      replacements += rewriteRuntimeAssetPaths(entryPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.js'))
      continue

    const source = readFileSync(entryPath, 'utf8')
    let rewritten = source
    let fileReplacements = 0

    for (const [runtimePath, embeddedPath] of runtimeAssetPathRewrites) {
      const occurrences = rewritten.split(runtimePath).length - 1
      rewritten = rewritten.replaceAll(runtimePath, embeddedPath)
      fileReplacements += occurrences
    }

    if (fileReplacements === 0)
      continue

    writeFileSync(entryPath, rewritten)
    replacements += fileReplacements
  }

  return replacements
}

function countRuntimeAssetReferences(directory: string): number {
  let references = 0

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      references += countRuntimeAssetReferences(entryPath)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.js'))
      continue

    references += readFileSync(entryPath, 'utf8').match(runtimeAssetReferencePattern)?.length ?? 0
  }

  return references
}

if (!existsSync(resolve(sourceRoot, 'package.json')))
  throw new Error(`komari-web source not found: ${sourceRoot}`)

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmCli = resolve(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
const buildCommand = process.platform === 'win32' && existsSync(npmCli) ? process.execPath : npmCommand
const buildArgs = buildCommand === process.execPath
  ? [npmCli, 'run', 'build', '--', '--base=/admin-app/']
  : ['run', 'build', '--', '--base=/admin-app/']
if (process.env.KOMARI_WEB_SKIP_BUILD !== '1') {
  const restoreThemeManaged = applyPingTaskSelectOverride()
  try {
    execFileSync(buildCommand, buildArgs, {
      cwd: sourceRoot,
      stdio: 'inherit',
    })
  }
  finally {
    restoreThemeManaged()
  }
}

rmSync(targetDir, { recursive: true, force: true })
copyDirectoryContents(sourceDist, targetDir)

const rewrittenRuntimeAssetPaths = rewriteRuntimeAssetPaths(targetDir)
const runtimeAssetReferences = countRuntimeAssetReferences(targetDir)
const pwaManifestCount = normalizePwaManifests(targetDir)
if (runtimeAssetReferences === 0)
  throw new Error('komari-web build output no longer contains runtime flag or OS logo asset references')
if (pwaManifestCount === 0)
  throw new Error('komari-web build output no longer contains a PWA manifest')

const indexPath = resolve(targetDir, 'index.html')
let html = readFileSync(indexPath, 'utf8')
if (!html.includes(charsetMarker))
  throw new Error('komari-web index.html no longer contains the expected charset marker')

const bridge = `<script>;(()=>{let t='';try{t=sessionStorage.getItem('komariOfficialAppRoute')||'';if(t)sessionStorage.removeItem('komariOfficialAppRoute')}catch(e){console.warn('[Glassmorphism] Session storage is unavailable.',e)}if(!t){try{t=new URL(location.href).searchParams.get('__komari_route')||''}catch{}}if(t&&/^\\/(admin|terminal|manage)(\\/|\\?|#|$)/.test(t))history.replaceState(null,'',t)})();</script><link rel="stylesheet" href="/admin-app/glass-admin.css?v=${adminCssVersion}">`
html = html.replace(charsetMarker, `${charsetMarker}${bridge}`)

// Keep install metadata, but remove the service worker: it only controls /admin-app/
// and can serve stale admin assets after the bridge restores /admin or /terminal.
html = html.replace(pwaRegisterPattern, '')
for (const filename of ['registerSW.js', 'sw.js'])
  rmSync(resolve(targetDir, filename), { force: true })
for (const filename of readdirSync(targetDir).filter(filename => workboxFilenamePattern.test(filename)))
  rmSync(resolve(targetDir, filename), { force: true })

if (!html.includes(`/admin-app/glass-admin.css?v=${adminCssVersion}`) || !html.includes('/admin-app/assets/'))
  throw new Error('komari-web build output is missing the admin bridge stylesheet or /admin-app/ asset base')

writeFileSync(indexPath, `${html.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trimEnd()}\n`)
copyFileSync(overrideCss, resolve(targetDir, 'glass-admin.css'))

let commit = process.env.KOMARI_WEB_COMMIT?.trim() || 'unknown'
if (commit === 'unknown') {
  try {
    commit = execFileSync('git', ['-c', `safe.directory=${sourceRoot}`, 'rev-parse', 'HEAD'], {
      cwd: sourceRoot,
      encoding: 'utf8',
    }).trim()
  }
  catch {}
}

writeFileSync(resolve(targetDir, 'komari-admin-source.json'), `${JSON.stringify({
  repository: 'https://github.com/komari-monitor/komari-web',
  commit,
  synced_at: new Date().toISOString(),
}, null, 2)}\n`)

console.log(`[sync-komari-admin] Synced complete admin app from ${sourceRoot} (${runtimeAssetReferences} runtime asset paths found, ${rewrittenRuntimeAssetPaths} rewritten, ${pwaManifestCount} PWA manifest normalized)`)
