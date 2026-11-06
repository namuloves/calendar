export const pad = (n: number) => String(n).padStart(2, '0');
export const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const todayKey = () => { const t = new Date(); return key(t.getFullYear(), t.getMonth(), t.getDate()); };
export const parseKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return { y, m: m - 1, d }; };
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const longLabel = (k: string) => { const { y, m, d } = parseKey(k); return `${WEEKDAYS[new Date(y, m, d).getDay()]}, ${MONTHS[m].slice(0, 3)} ${d}`; };

// Day pillar (일주): 60-day cycle anchored at 1900-01-01 = 甲戌 (index 10).
const HS = '甲乙丙丁戊己庚辛壬癸', EB = '子丑寅卯辰巳午未申酉戌亥';
export const dayPillar = (y: number, m: number, d: number) => {
  const n = Math.round((Date.UTC(y, m, d) - Date.UTC(1900, 0, 1)) / 86400000);
  const i = (((10 + n) % 60) + 60) % 60;
  return HS[i % 10] + EB[i % 12];
};
