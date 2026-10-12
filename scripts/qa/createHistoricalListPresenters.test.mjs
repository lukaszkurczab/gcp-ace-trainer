import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {BASELINE_SHA,buildHistoricalPresenters} from './createHistoricalListPresenters.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const old=path=>execFileSync('git',['show',BASELINE_SHA+':'+path],{cwd:root,encoding:'utf8'});
const originals=[old('src/features/home/ActivityScreen.tsx'),old('src/features/review/MistakesReviewScreen.tsx')];
const current=['src/features/home/ActivityView.tsx','src/features/review/MistakesReviewView.tsx'].map(path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8'));
const parse=text=>ts.createSourceFile('view.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function presentation(text,name) {
  const tree=parse(text),node=tree.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
  const tags=[],styles=[];
  function visit(node) {
    if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)) tags.push(node.tagName.getText(tree).replace('ReviewPresentationRow','ListRow'));
    if(ts.isJsxAttribute(node)&&node.name.getText(tree)==='style') styles.push(node.initializer?.getText(tree));
    ts.forEachChild(node,visit);
  }
  visit(node.body);
  const styleDeclaration=tree.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(tree)==='createStyles'));
  return {tags,styles,styleDeclaration:styleDeclaration.getText(tree)};
}
test('historical candidates retain original JSX hierarchy, style uses and complete style declarations',()=>{
  const result=buildHistoricalPresenters(originals[0],current[0],originals[1],current[1]);
  assert.deepEqual(presentation(result.activity,'ActivityView'),presentation(originals[0],'ActivityScreen'));
  assert.deepEqual(presentation(result.review,'MistakesReviewView'),presentation(originals[1],'MistakesReviewScreen'));
  assert.match(result.activity,/model\.groups\.map/);
  assert.match(result.activity,/group\.items\.map/);
  assert.match(result.review,/visibleRows\.map/);
  assert.match(result.review,/model\.unavailableRows\.map/);
  assert.doesNotMatch(result.activity+result.review,/SectionList|useFocusEffect|navigation\.|setSelected|removeSelectedUnavailable/);
});
test('generator rejects a changed historical callback contract or malformed source',()=>{
  assert.throws(()=>buildHistoricalPresenters(originals[0].replace('navigateToActivityResult(navigation, item);','changedCallback(item);'),current[0],originals[1],current[1]),/baseline_contract_changed/);
  assert.throws(()=>buildHistoricalPresenters(originals[0],current[0]+'\nfunction {',originals[1],current[1]),/baseline_source_rejected/);
});
