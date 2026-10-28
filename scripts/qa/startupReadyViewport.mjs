/** Native-frame screen for the F01 primary action above the fixed bottom navigation.
 * Does not establish paint, hit testing, VoiceOver or whether the view can scroll.
 */
export function inspectStartupReadyPrimary(hierarchy,window){
 const found=new Map();
 function visit(value){if(Array.isArray(value)){value.forEach(visit);return;}if(!value||typeof value!=='object')return;const a=value.attributes;if(a&&['patternly:home:primary-action','main-tab-bar'].includes(a['resource-id'])){const bounds=a.bounds?.match(/-?\d+/g)?.map(Number);if(bounds?.length===4){const id=a['resource-id'];found.set(id,[...(found.get(id)??[]),bounds]);}}Object.values(value).forEach(visit);}
 visit(hierarchy);const actions=found.get('patternly:home:primary-action')??[],bars=found.get('main-tab-bar')??[];
 if(actions.length!==1||bars.length!==1)return {fullyVisible:false,reason:'missing_or_ambiguous_native_frame'};
 const primary=actions[0],tabBar=bars[0],[left,top,right,bottom]=primary;
 const fullyVisible=Number.isFinite(window?.width)&&Number.isFinite(window?.height)&&0<=left&&left<right&&right<=window.width&&0<=top&&top<bottom&&bottom<=tabBar[1]&&tabBar[1]<tabBar[3]&&tabBar[3]<=window.height;
 return {fullyVisible,reason:fullyVisible?'primary_fully_above_fixed_navigation':'primary_outside_unoccluded_viewport',primary,tabBar,limits:'native-frame screen only; settled original image review remains required'};
}
