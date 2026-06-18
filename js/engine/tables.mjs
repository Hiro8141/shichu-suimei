export const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 五行は木火土金水を wood/fire/earth/metal/water で表す
export const ELEMENTS = ['wood','fire','earth','metal','water'];

export const STEM_INFO = {
  '甲': { element: 'wood',  yin: false }, '乙': { element: 'wood',  yin: true },
  '丙': { element: 'fire',  yin: false }, '丁': { element: 'fire',  yin: true },
  '戊': { element: 'earth', yin: false }, '己': { element: 'earth', yin: true },
  '庚': { element: 'metal', yin: false }, '辛': { element: 'metal', yin: true },
  '壬': { element: 'water', yin: false }, '癸': { element: 'water', yin: true },
};

// 地支の蔵干（先頭が本気）。通変星・五行集計に使う
export const HIDDEN_STEMS = {
  '子': ['癸'],            '丑': ['己','癸','辛'],
  '寅': ['甲','丙','戊'],  '卯': ['乙'],
  '辰': ['戊','乙','癸'],  '巳': ['丙','庚','戊'],
  '午': ['丁','己'],       '未': ['己','丁','乙'],
  '申': ['庚','壬','戊'],  '酉': ['辛'],
  '戌': ['戊','辛','丁'],  '亥': ['壬','甲'],
};

// 地支そのものの五行（十二運や五行表示の補助）
export const BRANCH_ELEMENT = {
  '子':'water','丑':'earth','寅':'wood','卯':'wood','辰':'earth','巳':'fire',
  '午':'fire','未':'earth','申':'metal','酉':'metal','戌':'earth','亥':'water',
};
