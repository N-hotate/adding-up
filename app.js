'use strict';

const fs = require('node:fs');
const readline = require('node:readline');
const rs = fs.createReadStream('./popu-pref.csv'); // Stream を生成するファイルを指定
// readline モジュールを使うStream を指定（input: 1行ずつ読み込むファイル、ouput: 1行ずつ書き出すファイル）
const rl = readline.createInterface({ input: rs });

const prefDataMap = new Map(); // key:都道府県, value:集計データのオブジェクト

// rlオブジェクトに対してlineイベント（= 1行分の読み込み処理）が発生したら、引数lineString の無名関数を実行する
// ※ lineString には読み込んだ1行分の文字列が格納されている
rl.on('line', lineString => {
  // 読み込んだStream から必要なデータを抜き出す
  const colums = lineString.split(',');
  const year = parseInt(colums[0]);
  const pref = colums[1];
  const popu = parseInt(colums[3]);

  if (year === 2016 || year === 2021) {
    // prefDataMap のvalue に格納するオブジェクトを準備する
    let value = null;
    if (prefDataMap.has(pref)) {
      value = prefDataMap.get(pref);
    } else {
      value = {
        before: 0, 
        after:  0, 
        change: null
      };
    }
    if (year === 2016) {
      value.before = popu;
    }
    if (year === 2021) {
      value.after = popu;
    }
    // value に値が入ったら連想配列に格納する
    prefDataMap.set(pref, value);
  }
});

// closeイベント（= 全ての行の読み込み処理）が発生したら、出揃ったデータを元に変化率を計算する
rl.on('close', () => {
  // 分割代入を使ったfor-of構文（連想配列のkeyとvalueを、それぞれ変数keyと変数valueに代入してループさせる）
  // ※ constでもエラーにならないのは、valueオブジェクトそのものではなく、オブジェクト内のプロパティだけを変更しているから
  for (const [key, value] of prefDataMap) {
    value.change = value.after / value.before;
  }
  // 変化率順に並び替える（sort関数を使うために、まず連想配列を普通の配列に変換する）
  const rankingArray = Array.from(prefDataMap).sort((pair1, pair2) => {
    // return pair2[1].change - pair1[1].change; // 変化率の降順（大きい順）
    return pair1[1].change - pair2[1].change; // 変化率の昇順（小さい順）
  });
  // map関数を使って配列を整形する（第二引数で添字を取得できる）
  const rankingStrings = rankingArray.map(([key, value], i) => {
    return `${i + 1}位 ${key}: ${value.before} => ${value.after} 変化率： ${value.change}`;
  });
  console.log(rankingStrings);
});