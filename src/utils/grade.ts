export type Grade = 'S'|'A'|'B'|'C'|'D'
export function getGrade(done:number,total:number):Grade {
  if(!total) return 'D'
  const r=done/total
  if(r>=.7) return 'S'; if(r>=.5) return 'A'; if(r>=.3) return 'B'; if(r>=.15) return 'C'; return 'D'
}
export function getGradeLabel(g:Grade):string {
  return {S:'알찬 한국 여행',A:'든든한 한국 여행',B:'소소한 한국 여행',C:'가벼운 한국 여행',D:'다음엔 더 알차게!'}[g]
}
export function getGradeColor(g:Grade):string {
  return {S:'#e8420a',A:'#ff7b2c',B:'#ffb347',C:'#ff9800',D:'#e8420a'}[g]
}
