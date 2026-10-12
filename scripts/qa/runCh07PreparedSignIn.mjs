// Credentials are rendered only into a private flow; never command arguments or stdout.
import { createHash } from 'node:crypto';
import { lstatSync, realpathSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const sha = value => createHash('sha256').update(value).digest('hex');
function requirePrivate(path, directory) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || stat.uid !== process.getuid() || realpathSync(path) !== path
    || (directory ? !stat.isDirectory() : !stat.isFile())
    || (stat.mode & 0o777) !== (directory ? 0o700 : 0o600)) throw Error('private_path_rejected');
}
export function renderPreparedFlow(credentials, manifest, template) {
  if (credentials.schemaVersion !== 1 || manifest.schemaVersion !== 1
    || manifest.projectId !== 'patternly-app-sandbox' || manifest.stage !== 'registered'
    || !['uid', 'email', 'password'].every(k => typeof credentials[k] === 'string' && credentials[k].length > 0)
    || sha(`${JSON.stringify(credentials)}\n`) !== manifest.credentialSha256
    || sha(credentials.uid) !== manifest.uidSha256 || sha(credentials.email) !== manifest.emailSha256)
    throw Error('prepared_actor_rejected');
  // JSON strings are valid YAML quoted scalars; literal content cannot become flow commands.
  return template.replace('---\n', `env:\n  CH07_EMAIL: ${JSON.stringify(credentials.email)}\n  CH07_PASSWORD: ${JSON.stringify(credentials.password)}\n---\n`);
}
function main() {
  process.umask(0o077);
  const [actorDirectory, privateDirectory, ...extra] = process.argv.slice(2);
  if (!actorDirectory || !privateDirectory || extra.length) throw Error('arguments_rejected');
  const actor = resolve(actorDirectory), output = resolve(privateDirectory);
  requirePrivate(actor, true); requirePrivate(output, true);
  for (const name of ['credentials.json', 'manifest.json']) requirePrivate(join(actor, name), false);
  const flow = renderPreparedFlow(JSON.parse(readFileSync(join(actor, 'credentials.json'))),
    JSON.parse(readFileSync(join(actor, 'manifest.json'))), readFileSync(join(root, '.maestro/ch07-account-sign-in.yaml'), 'utf8'));
  const flowPath = join(output, 'prepared-sign-in.yaml');
  writeFileSync(flowPath, flow, {mode:0o600, flag:'wx'});
  const logPath = join(output, 'sign-in.log');
  // Private debug artifacts may contain form values; no raw output is forwarded.
  const result = spawnSync('maestro', ['--device', '7F315654-3175-4F3C-BB24-B0263F59360C',
    'test', flowPath, '--debug-output', join(output, 'sign-in-debug')], {encoding:'utf8'});
  writeFileSync(logPath, (result.stdout ?? '') + (result.stderr ?? ''), {mode:0o600,flag:'wx'});
  console.log(JSON.stringify({stage:'ch07_prepared_sign_in', exitCode:result.status, privateLogWritten:true}));
  process.exitCode = result.status === 0 && !result.error ? 0 : 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch { console.error(JSON.stringify({stage:'ch07_prepared_sign_in',category:'stopped_inspect_private_state_do_not_retry'})); process.exitCode=1; }
}
