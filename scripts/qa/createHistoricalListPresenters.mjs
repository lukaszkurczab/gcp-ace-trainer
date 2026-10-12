import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const BASELINE_SHA='fc45e053c2222160bacd35fd7320224bf323fbb7';
const CURRENT_PRESENTER_SHA256=['c58413dcec38cddbffedddc0e8f4ddcc449a3c99dc3cdcbbd606052c80378ac4','bae24fa7a3b3a920d049761d0a9dd878892d1538d5f374600470dcb730d9627a'];
const hash=value=>createHash('sha256').update(value).digest('hex');
function source(text) {
  const parsed=ts.createSourceFile('presenter.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if(parsed.parseDiagnostics.length) throw Error('baseline_source_rejected');
  return parsed;
}
function fn(parsed,name) {
  const found=parsed.statements.filter(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
  if(found.length!==1||!found[0].body) throw Error('baseline_source_rejected');
  return found[0];
}
function replaceExact(text,from,to,count=1) {
  if(text.split(from).length-1!==count) throw Error('baseline_contract_changed');
  return text.split(from).join(to);
}
function prefix(current,name) {
  const parsed=source(current),view=fn(parsed,name);
  return current.slice(0,view.body.getStart(parsed)+1).replace('SectionList, ','');
}

// Historical JSX, helper bodies and styles are retained. Only the already-shared
// presentation props/callbacks and inert row-count observer replace screen owners.
export function buildHistoricalPresenters(oldActivity,currentActivity,oldReview,currentReview) {
  const activitySource=source(oldActivity),activity=fn(activitySource,'ActivityScreen');
  const body=oldActivity.slice(activity.body.getStart(activitySource),activity.end);
  const header=body.indexOf('  const header = (');
  if(header<0) throw Error('baseline_contract_changed');
  let activityBody=body.slice(header);
  activityBody=replaceExact(activityBody,'const model = buildActivityModel(state.records, filter);','const model = state.model;');
  const press=/onPress=\{\(\) => \{[\s\S]*?navigateToActivityResult\(navigation, item\);\s*\}\}/g;
  if([...activityBody.matchAll(press)].length!==1) throw Error('baseline_contract_changed');
  activityBody=activityBody.replace(press,'onPress={() => onItemPress(item)}');
  activityBody=replaceExact(activityBody,'navigation.goBack()','onBack()');
  activityBody=replaceExact(activityBody,'onActionPress={retry}','onActionPress={onRetry}');
  activityBody=replaceExact(activityBody,'navigation.navigate(ROUTES.PRACTICE_HUB)','onOpenPractice()');
  activityBody=activityBody.replaceAll('setFilterVisible(','onFilterVisibleChange(').replaceAll('setFilter(','onFilterChange(');
  let activityTail=oldActivity.slice(activity.end);
  const oldRow='function ActivityRow({ expanded, item, last, onPress }: Readonly<{ expanded?: boolean; item: ActivityItem; last: boolean; onPress: () => void }>) {';
  activityTail=replaceExact(activityTail,oldRow,oldRow+'\n  useListPresentationRow();');
  const activityResult=prefix(currentActivity,'ActivityView')+'\n  const styles = useThemedStyles(createStyles);\n  const { colors: palette } = useAppPreferences();\n  const { t } = useTranslation("common");\n'+activityBody+activityTail;

  const reviewSource=source(oldReview),review=fn(reviewSource,'MistakesReviewScreen');
  const returns=review.body.statements.filter(ts.isReturnStatement);
  if(returns.length!==1) throw Error('baseline_contract_changed');
  let reviewBody=oldReview.slice(returns[0].getStart(reviewSource),review.end);
  const availablePress='setConfirmRemoveUnavailable(false);\n                setSelectedRowId((current) => (current === row.id ? null : row.id));';
  const unavailablePress='setConfirmRemoveUnavailable(false);\n                setSelectedRowId((current) => current === row.id ? null : row.id);';
  const selection='onConfirmRemoveChange(false);\n                onSelectRow(row.id);';
  reviewBody=replaceExact(reviewBody,availablePress,selection);
  reviewBody=replaceExact(reviewBody,unavailablePress,selection);
  reviewBody=reviewBody.replaceAll('setConfirmRemoveUnavailable(','onConfirmRemoveChange(');
  reviewBody=replaceExact(reviewBody,'void removeSelectedUnavailable();','onRemoveUnavailable();');
  reviewBody=replaceExact(reviewBody,'<ListRow','<ReviewPresentationRow',2);
  const reviewResult=prefix(currentReview,'MistakesReviewView')+'\n  const styles = useThemedStyles(createStyles);\n  const { locale } = useAppPreferences();\n  const { t } = useTranslation("common");\n  const hasManualRequest = model?.dueRows.some((row) => row.status === "requested") ?? false;\n  '+reviewBody+oldReview.slice(review.end)+'\nfunction ReviewPresentationRow(props: Parameters<typeof ListRow>[0]) {\n  useListPresentationRow();\n  return <ListRow {...props} />;\n}\n';
  for(const result of [activityResult,reviewResult]) {
    source(result);
    if(/navigation\.|setSelected|setConfirmRemove|removeSelectedUnavailable|loadActivity|loadTrackReview|SectionList|useFocusEffect/.test(result)) throw Error('baseline_owner_rejected');
  }
  return {activity:activityResult,review:reviewResult};
}

// Generates non-secret candidates only. Does not overwrite presenters, run Metro,
// launch/build/install the app or touch the simulator or profile data.
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  let stage='configuration';
  try {
    if(process.argv.length!==2) throw Error('arguments_rejected');
    const root=fileURLToPath(new URL('../../',import.meta.url));
    const paths=['src/features/home/ActivityScreen.tsx','src/features/review/MistakesReviewScreen.tsx'];
    stage='historical_source';
    const historical=paths.map(path=>execFileSync('git',['show',BASELINE_SHA+':'+path],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
    const currentPaths=['src/features/home/ActivityView.tsx','src/features/review/MistakesReviewView.tsx'];
    stage='current_source';
    const current=currentPaths.map(path=>readFileSync(resolve(root,path),'utf8'));
    if(current.some((value,index)=>hash(value)!==CURRENT_PRESENTER_SHA256[index])) throw Error('baseline_source_changed');
    stage='candidate_generation';
    const result=buildHistoricalPresenters(historical[0],current[0],historical[1],current[1]);
    const directory=resolve(root,'artifacts/private/perf06-native-20261013/historical-presenters');
    stage='artifact_write';
    mkdirSync(directory,{recursive:true,mode:0o700});
    const outputs=[result.activity,result.review];
    currentPaths.forEach((path,index)=>writeFileSync(resolve(directory,path.split('/').at(-1)),outputs[index],{mode:0o600}));
    const receipt={schema:'patternly.perf06.historical-presenters.v1',baselineSha:BASELINE_SHA,historicalSha256:historical.map(hash),currentSha256:current.map(hash),candidateSha256:outputs.map(hash),scope:'Generated candidates only; independent structure/style review, typecheck/import boundary and native probe required before measurement. Not identical to the earlier uncommitted stage0 source.'};
    writeFileSync(resolve(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
    console.log(JSON.stringify({stage:'candidates_generated',schema:receipt.schema,baselineSha:BASELINE_SHA}));
  } catch(error) {
    const categories=new Set(['arguments_rejected','baseline_source_changed','baseline_source_rejected','baseline_contract_changed','baseline_owner_rejected']);
    console.error(JSON.stringify({error:categories.has(error?.message)?error.message:'historical_presenters_generation_failed',stage}));process.exitCode=1;
  }
}
