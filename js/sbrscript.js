// ver 1.4.0
var SBRScript = (function() {
  'use strict';

  var script = new SBRScript();

  function SBRScript() {}

  var DEFAULT_BPM = 120.0;
  var DEFAULT_MEASURE_S = 4;
  var DEFAULT_MEASURE_B = 4;
  var DEFAULT_SCROLL = 1.0;

  /**
   * SBRスクリプトの解析結果を保持します
   * @constructor
   */
  function Sbrs() {
    this.url = ''; // sbrsファイルのURL
    this.title = 'No Title'; // 曲名
    this.artist = ''; // アーティスト
    this.sound = ''; // 音声ファイル名
    this.soundUrl = ''; // 音声ファイルのURL
    this.soundVolume = 1.0; // 音声ファイルの音量(0.0～1.0)
    this.offset = 0.0; // 再生開始タイミング(ms)
    this.level = 0; // 難易度
    this.scroll = []; // SCROLLの情報(Scrollコンストラクタ)を配列で格納
    this.bpm = []; // BPMの情報(Bpmコンストラクタ)を配列で格納
    this.marker = []; // マーカーの情報(Markerコンストラクタ)を配列で格納
    this.measure = []; // 小節の情報(Measureコンストラクタ)を配列で格納
    this.bpmCount = 0; // BPM数
    this.measureCount = 0; // 小節数
    this.markerCount = 0; // マーカー数(ロングマーカーのホールド除く)
    this.bpmHalfMode = false; // BPMの表記(true:半分の値を表示, false:そのままの値を表示)
    this.normalMarkerCount = 0; // 通常マーカーの数
    this.longMarkerCount = 0; // ロングマーカーの数
    this.maxBpm = 0; // BPMの最大値
    this.minBpm = 0; // BPMの最小値
    this.comboCount = 0; // コンボ数の理論値
    this.judgeRange = 1.0; // 判定の範囲
    this.feverGaugeLength = 0; // フィーバーゲージの長さ
    this.fever = 0; // Feverに必要なマーカー数
    this.feverHigh = 0; //  Feverに必要なマーカー数(フィーバーゲージがたまりやすくなる使用時)
    this.readyState = 0; // sbrsの読み込み状態
    this.laneCount = 0; // レーン数
    this.stage = []; // ステージの情報(Stageコンストラクタ)を配列で格納
    this.endTime = 0.0; // 譜面の終了時間
  }

  /**
   * マーカーの情報を保持します
   * @constructor
   */
  function Marker() {
    this.measure = 0; // 小節(1～n)
    this.point = 0.0; // 拍
    this.time = 0.0; // 時間(ms)
    this.type = 0; // マーカーの種類(1:通常 2:ロング開始 3:ロング終了 4:ロングホールド)
    this.lane = 0; // レーン(1～n)
    this.long = null; // ロングマーカーのホールド判定をMarkerの配列で格納
    this.bpm = 0.0; // BPM
    this.scroll = 0.0; // SCROLL
    this.pair = 0; // type2,3の場合、対になるMarkerのindexを格納
    this.longEndCountFlag = false; // 小節線と重なるロングマーカー終端のカウントフラグ
  }

  /**
   * 小節の情報を保持します
   * @constructor
   */
  function Measure() {
    this.measure = 0; // 小節(1～n)
    this.valueS = 0.0; // 拍子の分子
    this.valueB = 0.0; // 拍子の分母
    this.scroll = 0.0; // SCROLL
    this.time = 0.0; // 時間(ms)
  }

  /**
   * SCROLLの情報を保持します
   * @constructor
   */
  function Scroll() {
    this.measure = 0; // 小節(1～n)
    this.point = 0.0; // 拍
    this.time = 0.0; // 時間(ms)
    this.value = 0.0; // SCROLLの値
  }

  /**
   * BPMの情報を保持します
   * @constructor
   */
  function Bpm() {
    this.measure = 0; // 小節(1～n)
    this.point = 0.0; // 拍
    this.time = 0.0; // 時間(ms)
    this.value = 0.0; // BPMの値
  }

  /**
   * ステージの情報を保持します
   * @constructor
   */
  function Stage() {
    this.x = 0; // x座標
    this.y = 0; // y座標
    this.r = 0; // x,y座標から端点までの長さ
  }

  /**
   * SBRスクリプト形式の譜面データの文字列を解析、解析結果を格納したオブジェクトを返します
   * @param {string} sbrScriptStr 譜面データを格納した文字列
   * @param {Sbrs} [sbrs] SBRスクリプトオブジェクト
   * @return {Sbrs} SBRスクリプトオブジェクト
   */
  SBRScript.prototype.parse = function(sbrScriptStr, sbrs) {

    var sbrScriptArray;
    var measureLineCount;
    var measureLineIndex;
    var line, point, lane;
    var value, obj;
    var type, typeTmp;
    var i, iLen;
    var loop;
    var measure;
    var measureS = DEFAULT_MEASURE_S;
    var measureB = DEFAULT_MEASURE_B;
    var time = 0.0;
    var lastTime = 0.0;
    var bpm = DEFAULT_BPM;
    var scroll = DEFAULT_SCROLL;
    var laneCount;
    var lastLaneType = [];
    var bpmValueArray = [];

    // sbrsオブジェクトの初期化
    if (!sbrs) {
      sbrs = new Sbrs();
      sbrs.readyState = 3;
    }

    // 改行で分割、配列に格納
    sbrScriptArray = sbrScriptStr.split(/\r\n|\r|\n/g);

    // レーン数を取得
    sbrs.laneCount = getLaneCount(sbrScriptArray);
    laneCount = sbrs.laneCount;

    // コメント、空行、想定外の記述を削除
    sbrScriptArray = scriptStrNormalization(sbrScriptArray, sbrs.laneCount);

    // 上から下までのループ
    for (i = 0, measure = 1, iLen = sbrScriptArray.length; i < iLen; i++, measure++) {

      // 小節の行数取得
      measureLineCount = getMeasureLineCount(sbrScriptArray, i);

      // 1小節のループ
      for (measureLineIndex = 0; i < iLen && sbrScriptArray[i].charAt(0) !== ','; i++) {

        line = sbrScriptArray[i];
        point = measureLineIndex / measureLineCount * measureS;

        if (line.charAt(0) === '#') {
          // 命令行の処理

          if (line.match(/^#TITLE:/i) !== null) {
            // 曲名を取得
            sbrs.title = line.slice('#TITLE:'.length);
          } else if (line.match(/^#ARTIST:/i) !== null) {
            // アーティストを取得
            sbrs.artist = line.slice('#ARTIST:'.length);
          } else if (line.match(/^#SOUND:/i) !== null) {
            // 音声ファイル名を取得
            sbrs.sound = line.slice('#SOUND:'.length);
            if (sbrs.url !== '' && sbrs.url.lastIndexOf('/') !== -1) {
              sbrs.soundUrl = sbrs.url.substr(0, sbrs.url.lastIndexOf('/') + 1) + sbrs.sound;
            } else {
              sbrs.soundUrl = sbrs.sound;
            }
          } else if (line.match(/^#SOUNDVOLUME:/i) !== null) {
            // 音声ファイルの音量を取得
            sbrs.soundVolume = parseFloat(line.slice('#SOUNDVOLUME:'.length));
          } else if (line.match(/^#OFFSET:/i) !== null) {
            // 再生開始タイミングを取得
            sbrs.offset = parseFloat(line.slice('#OFFSET:'.length));
          } else if (line.match(/^#LEVEL:/i) !== null) {
            // 難易度を取得
            sbrs.level = parseInt(line.slice('#LEVEL:'.length));
          } else if (line.match(/^#SCROLL:/i) !== null) {
            // スクロール速度を取得
            obj = new Scroll();
            obj.value = parseFloat(line.slice('#SCROLL:'.length));
            obj.measure = measure;
            obj.point = point;
            obj.time = time;
            sbrs.scroll.push(obj);

            // 現在のSCROLL設定
            scroll = obj.value;
          } else if (line.match(/^#JUDGERANGE:/i) !== null) {
            // 判定範囲を取得
            sbrs.judgeRange = parseFloat(line.slice('#JUDGERANGE:'.length));
          } else if (line.match(/^#BPM:/i) !== null) {
            // BPMを取得
            obj = new Bpm();
            obj.value = parseFloat(line.slice('#BPM:'.length));
            obj.measure = measure;
            obj.point = point;
            obj.time = time;
            sbrs.bpm.push(obj);
            bpmValueArray.push(obj.value);

            // 現在のBPM設定
            bpm = obj.value;
          } else if (line.match(/^#BPMHALFMODE:/i) !== null) {
            // BPMの表記を取得
            value = parseInt(line.slice('#BPMHALFMODE:'.length));
            if (value === 0) {
              sbrs.bpmHalfMode = false;
            } else {
              sbrs.bpmHalfMode = true;
            }
          } else if (line.match(/^#STAGE:/i) !== null) {
            // STAGEを取得
            value = line.slice('#STAGE:'.length).match(/([\d\-\.]+),([\d\-\.]+),([\d\-\.]+)/);
            if (value !== null) {
              obj = new Stage();
              obj.x = stageValue[1];
              obj.y = stageValue[2];
              obj.r = stageValue[3];
              sbrs.stage.push(obj);
            }
          } else if (line.match(/^#MEASURE:/i) !== null) {
            // 拍子を取得
            if (measureLineIndex === 0) {
              value = line.slice('#MEASURE:'.length).match(/([\d\-\.]+)\/([\d\-\.]+)/);
              if (value !== null) {
                // 小数点以下は切り捨て
                measureS = parseInt(value[1]);
                measureB = parseInt(value[2]);
              }
            }
          }
        } else {
          // マーカー行の処理

          // 1～nレーンのループ
          for (lane = 1; lane <= laneCount; lane++) {

            type = parseInt(line.charAt(lane - 1));
            typeTmp = type;

            if (type !== 0) {
              for (loop = 0; loop < 2; loop++) {
                if (loop === 0) {
                  // ロングマーカーの終端が見つからなかった場合は、ロングマーカーの終端を追加する
                  if (lastLaneType[lane - 1] === 2 && type !== 3) {
                    type = 3;
                  } else {
                    continue;
                  }
                }

                obj = new Marker();
                obj.measure = measure;
                obj.point = point;
                obj.time = time;
                obj.type = type;
                obj.lane = lane;
                obj.bpm = bpm;
                obj.scroll = scroll;
                obj.pair = -1;
                obj.longEndCountFlag = false;
                sbrs.marker.push(obj);

                type = typeTmp;

                lastLaneType[lane - 1] = type;
              }
            }
          }
          time += 240000.0 / bpm * (measureS / measureB) / measureLineCount;
          measureLineIndex++;
        }
      }

      // 1小節の終了処理
      obj = new Measure();
      obj.measure = measure;
      obj.valueS = measureS;
      obj.valueB = measureB;
      obj.time = lastTime;
      obj.scroll = scroll;
      sbrs.measure.push(obj);
      lastTime = time;
    }

    // #SCROLLの記載なし
    if (sbrs.scroll.length === 0) {
      obj = new Scroll();
      obj.value = scroll;
      obj.measure = 1;
      obj.point = 0;
      obj.time = 0;
      sbrs.scroll.push(obj);
    }

    // #BPMの記載なし
    if (sbrs.bpm.length === 0) {
      obj = new Bpm();
      obj.value = bpm;
      obj.measure = 1;
      obj.point = 0;
      obj.time = 0;
      sbrs.bpm.push(obj);
      bpmValueArray.push(obj.value);
    }

    // オブジェクト数
    sbrs.bpmCount = sbrs.bpm.length;
    sbrs.measureCount = sbrs.measure.length;
    sbrs.markerCount = sbrs.marker.length;

    // ロングマーカーの中間判定情報付与
    addLongHoldData(sbrs);

    // フィーバーゲージの情報付与
    addFeverGaugeData(sbrs);

    // 終了時間
    sbrs.endTime = time;

    // コンボ数の理論値
    sbrs.comboCount = getComboCount(sbrs);

    // マーカー数
    addMarkerCount(sbrs);

    // BPMの最大、最小値取得
    sbrs.maxBpm = Math.max.apply(null, bpmValueArray);
    sbrs.minBpm = Math.min.apply(null, bpmValueArray);

    // 読み込み完了
    sbrs.readyState = 4;

    return sbrs;
  };

  /**
   * 指定されたURLからSBRスクリプト形式の譜面を読み込み、解析結果を格納したオブジェクトを返します
   * @param {string} sbrScriptUrl SBRスクリプトファイルのURL
   * @param {boolean} async 非同期読み込みフラグ(true:非同期読み込み false:同期読み込み)
   * @param {Object} callback 読み込みが完了した時に呼び出すコールバック関数
   *                 callback.load  : 読み込み成功時に実行する関数
   *                 callback.error : 読み込み失敗時に実行する関数
   * @return {Sbrs} SBRスクリプトオブジェクト
   */
  SBRScript.prototype.load = function(sbrScriptUrl, async, callback) {

    var xhr = new XMLHttpRequest();
    var sbrs = new Sbrs();

    sbrs.url = sbrScriptUrl;

    xhr.open('get', sbrScriptUrl, async);
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain');
    }

    // 同期読み込み
    if (!async) {
      xhr.send();
      sbrs.readyState = 3;
      if (xhr.status === 200) {
        // 読み込み成功

        // 読み込んだ譜面を解析
        script.parse(xhr.responseText);
        if (callback && typeof callback.load === 'function') {
          callback.load();
        }
      } else {
        // 読み込み失敗
        console.error('譜面の読み込みに失敗しました(url:%s)', decodeURI(sbrScriptUrl));
        if (callback && typeof callback.error === 'function') {
          callback.error();
        }
      }

      // 非同期読み込み
    } else {

      xhr.addEventListener('readystatechange', function() {
        sbrs.readyState = xhr.readyState;
        switch (xhr.readyState) {
          case 3:
            // 読み込み状況確認
            sbrs.readyState = xhr.readyState;
            break;
          case 4:
            // 譜面の解析が完了した時点で4(完了)とする
            sbrs.readyState = 3;

            if (xhr.status === 200) {
              // 読み込み成功

              // 読み込んだ譜面を解析
              script.parse(xhr.responseText, sbrs);
              if (callback && typeof callback.load === 'function') {
                callback.load();
              }
            } else {
              // 読み込み失敗
              console.error('譜面の読み込みに失敗しました(url:%s)', decodeURI(sbrScriptUrl));
              if (callback && typeof callback.error === 'function') {
                callback.error();
              }
            }
            break;
          default:
            sbrs.readyState = xhr.readyState;
            break;
        }
      });
      xhr.send();
    }

    return sbrs;
  };

  /**
   * 小節と拍数を元に時間を取得します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   * @param {number} measure 時間を確認したい小節
   * @param {number} point 時間を確認したい拍数
   * @return {number} 時間(ms)
   */
  SBRScript.prototype.getTimeFromMeasurePoint = function(sbrs, measure, point) {

    var bpmIndex = -1;
    var time = 0.0;
    var measureObj = sbrs.measure[measure - 1];
    var bpmObj = null;
    var bpm = 120.0;
    var i, iLen;

    // 該当小節のBPM変更確認
    for (i = 0, iLen = sbrs.bpm.length; i < iLen; i++) {
      bpmObj = sbrs.bpm[i];
      if (bpmObj.measure < measure) {
        bpm = sbrs.bpm[i].value;
      } else if (bpmObj.measure === measure) {
        if (point >= bpmObj.point) {
          bpm = sbrs.bpm[i].value;
          bpmIndex = i;
        } else {
          break;
        }
      }
    }

    if (bpmIndex === -1) {
      // 該当小節にBPM変更あり

      time = measureObj.time + (240000.0 / bpm * (measureObj.valueS / measureObj.valueB) * (point / measureObj.valueS));
    } else {
      // 該当小節にBPM変更なし

      bpmObj = sbrs.bpm[bpmIndex];
      if (bpmObj.point === point) {
        // 該当拍と同じ位置にBPM変更あり

        time = bpmObj.time;
      } else {
        // 該当拍と同じ位置にBPM変更なし

        time = bpmObj.time + (240000.0 / bpm * (measureObj.valueS / measureObj.valueB) * ((point - bpmObj.point) / measureObj.valueS));
      }
    }
    return time;
  };

  /**
   * 時間から小節と拍数を取得します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   * @param {number} time 時間(ms)
   * @return {Object} 小節と拍数を格納したオブジェクト({measure:value, point:value})
   */
  SBRScript.prototype.getMeasurePointFromTime = function(sbrs, time) {

    var measureIndex = sbrs.measureCount - 1;
    var measureValue = sbrs.measureCount;
    var measureObj;
    var nextMeasureObj;
    var pointValue;
    var measureTime;
    var measureS, measureB;
    var bpmObj;
    var bpmIndex;
    var bpm;
    var i, iLen;

    // 該当小節確認
    for (i = 0, iLen = sbrs.measureCount - 1; i < iLen; i++) {
      measureObj = sbrs.measure[i];
      nextMeasureObj = sbrs.measure[i + 1];
      if (time >= measureObj.time && time < nextMeasureObj.time) {
        measureIndex = i;
        measureValue = measureObj.measure;
        break;
      }
    }

    measureObj = sbrs.measure[measureIndex];
    measureS = measureObj.valueS;
    measureB = measureObj.valueB;

    // 該当小節のBPM変更確認
    bpmIndex = -1;
    for (i = 0, iLen = sbrs.bpmCount; i < iLen; i++) {
      bpmObj = sbrs.bpm[i];
      if (bpmObj.measure < measureValue) {
        bpm = bpmObj.value;
      } else if (bpmObj.measure === measureValue) {
        if (time >= bpmObj.time) {
          bpmIndex = i;
        }
      }
    }

    if (bpmIndex !== -1) {
      // 該当小節にBPM変更あり

      bpmObj = sbrs.bpm[bpmIndex];

      // 拍数取得
      pointValue = bpmObj.point + measureS * ((time - bpmObj.time) / (240000.0 / bpmObj.value * (measureS / measureB)));

    } else {
      // 該当小節にBPM変更なし

      // 1小節の時間
      measureTime = 240000.0 / bpm * (measureS / measureB);

      // 拍数取得
      pointValue = measureS * ((time - measureObj.time) / measureTime);
    }

    // 拍数が1小節の拍数以上になった場合
    if (pointValue > measureS) {
      measureValue += parseInt(pointValue / measureS);
      pointValue = pointValue % measureS;
    }

    return {
      measure: measureValue,
      point: pointValue
    };
  };

  /**
   * 時間を元にBPMを取得します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   * @param {number} time 時間(ms)
   * @return {number} BPM
   */
  SBRScript.prototype.getBpmFromTime = function(sbrs, time) {

    var bpm = DEFAULT_BPM;
    var i, iLen;

    for (i = 0, iLen = sbrs.bpmCount; i < iLen && sbrs.bpm[i].time <= time; i++) {
      bpm = sbrs.bpm[i].value;
    }

    return bpm;
  };

  /**
   * 譜面のレーン数を取得します
   * @param {string[]} sbrScriptArray SBRスクリプト形式の譜面を格納した配列
   * @return {number} 譜面のレーン数(デフォルト:3)
   */
  function getLaneCount(sbrScriptArray) {

    var laneCount = 3;
    var line;
    var i, iLen;

    for (i = 0, iLen = sbrScriptArray.length; i < iLen; i++) {
      line = sbrScriptArray[i];
      if (line.charAt(0) === '#' && line.match(/^#LANE:/i) !== null) {
        laneCount = parseInt(line.slice('#LANE:'.length));
      }
    }

    return laneCount;
  }

  /**
   * 配列に格納した譜面を正規化。コメントや異常な記述を除去します
   * @param {string[]} sbrScriptArray SBRスクリプト形式の譜面を格納した配列
   * @param {number} laneCount レーン数
   * @return {string[]} 正規化したSBRスクリプト形式の譜面を格納した配列
   */
  function scriptStrNormalization(sbrScriptArray, laneCount) {

    var blankLane = (function() {

      var blankChar = '0';
      var blankLane = '';
      var i, iLen;

      for (i = 0; i < laneCount; i++) {
        blankLane += blankChar;
      }
      return blankLane;
    }());

    var lineCount = 0;
    var commaIndex;
    var line;
    var str;
    var i, iLen, j, jLen;

    for (i = 0, iLen = sbrScriptArray.length; i < iLen; i++) {

      line = sbrScriptArray[i];

      // コメント除去
      if (line.indexOf('//') !== -1) {
        line = line.substring(0, line.indexOf('//'));
      }

      // 想定外の文字除去
      if (line.charAt(0) !== '#') {
        // 数字とコロン以外を除去
        line = line.replace(/[^0-3,]/g, '');
      }

      // 空行除去
      if (line.length === 0) {
        sbrScriptArray.splice(i, 1);
        i--;
        iLen--;
      } else if (line.charAt(0) !== '#') {

        // 行頭以外のカンマを次の行に
        if (line.substr(1).indexOf(',') !== -1) {
          commaIndex = line.substr(1).indexOf(',') + 1;
          sbrScriptArray.splice(i + 1, 0, ',');
          iLen++;
          if (line.substr(commaIndex).length !== 1) {
            sbrScriptArray.splice(i + 2, 0, line.substr(commaIndex + 1));
            iLen++;
          }
          line = line.substr(0, commaIndex);
        }
        // laneCount以上の記述を分割
        if (line.length > laneCount) {
          for (j = 1, jLen = Math.ceil(line.length / laneCount); j < jLen; j++) {
            str = (line.substr(j * laneCount, laneCount) + blankLane).substr(0, laneCount);
            sbrScriptArray.splice(i + j, 0, str);
            iLen++;
          }
          line = line.substr(0, laneCount);
        }

        // laneCount未満の記述を補完
        if (line.length < laneCount) {
          line = (line + blankLane).substring(0, laneCount);
        }

        if (line.charAt(0) !== ',') {
          lineCount++;
          sbrScriptArray[i] = line;
        } else {
          // カンマのみの小節に空マーカー付与
          if (lineCount === 0) {
            sbrScriptArray.splice(i, 0, blankLane.substr(0, laneCount));
            i++;
            iLen++;
          }
          lineCount = 0;
        }
      }
    }

    return sbrScriptArray;
  }

  /**
   * インデックスで指定した小節のマーカー行の行数を取得します
   * @param {string[]} sbrScriptArray SBRスクリプト形式の譜面を格納した配列
   * @param {number} index 行数を確認したい小節の先頭行のindex
   * @return {number} indexで指定した小節のマーカー行の行数
   */
  function getMeasureLineCount(sbrScriptArray, index) {

    var measureCount = 0;
    var line;
    var i, iLen;

    for (i = index, iLen = sbrScriptArray.length; i < iLen; i++) {
      line = sbrScriptArray[i];
      if (line.charAt(0) === ',') {
        break;
      }
      if (line.charAt(0) !== '#') {
        measureCount++;
      }
    }
    return measureCount;
  }

  /**
   * sbrs.markerにロングマーカーのホールド情報を付与します
   * 4/4拍子の場合、1小節フルのロングマーカーだと4コンボ付与
   * 7/8拍子の場合、1小節フルのロングマーカーだと7コンボ付与
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   */
  function addLongHoldData(sbrs) {

    var marker, markerObj;
    var endIndex, endMarker;
    var startMeasure, endMeasure;
    var startPoint, endPoint;
    var measure, measureS;
    var point, pointInit, pointTarget;
    var time, bpm, bpmTmp;
    var lane;
    var i, iLen;

    for (i = 0, iLen = sbrs.marker.length; i < iLen; i++) {

      marker = sbrs.marker[i];

      if (marker.type === 2) {

        lane = marker.lane;
        endIndex = getLongEndIndex(sbrs, i, lane);

        if (endIndex !== -1) {

          endMarker = sbrs.marker[endIndex];
          marker.pair = endIndex;
          endMarker.pair = i;
          marker.long = [];
          startMeasure = marker.measure;
          endMeasure = endMarker.measure;
          startPoint = marker.point;
          endPoint = endMarker.point;

          for (measure = startMeasure; measure <= endMeasure; measure++) {

            measureS = sbrs.measure[measure - 1].valueS;
            pointInit = (measure === startMeasure) ? Math.ceil(startPoint) : 0;
            pointTarget = (measure !== endMeasure) ? measureS : endPoint;

            point = pointInit;
            while (true) {

              time = script.getTimeFromMeasurePoint(sbrs, measure, point);
              bpm = script.getBpmFromTime(sbrs, time);
              bpmTmp = sbrs.bpmHalfMode ? bpm / 2 : bpm;

              if (point > pointTarget) {
                // ロングマーカーの判定範囲外
                break;
              } else if (point === pointTarget) {
                if (measure !== endMeasure) {
                  // ロングマーカー終端以外
                  break;
                } else if (
                  ((60000 / bpmTmp) % 25 === 0 && point % 4 === 0) ||
                  ((60000 / bpmTmp) % 50 === 0 && point % 2 === 0) ||
                  ((60000 / bpmTmp) % 100 === 0 && point % 1 === 0)
                ) {
                  // ロングマーカー終端かつbpmが特定の値かつ終端が特定の位置
                  marker.longEndCountFlag = true;
                  endMarker.longEndCountFlag = true;
                } else {
                  // ロングマーカー終端かつ条件に非該当
                  break;
                }
              }

              markerObj = new Marker();
              markerObj.measure = measure;
              markerObj.point = point;
              markerObj.time = time;
              markerObj.type = 4;
              markerObj.lane = lane;
              markerObj.bpm = bpm;
              markerObj.scroll = 1.0; // 仮
              markerObj.pair = -1;
              markerObj.longEndCountFlag = false;
              marker.long.push(markerObj);

              point++;
            }
          }
        } else {
          // ロングマーカーの終端が見つからなかった場合、通常のマーカーとして扱う
          marker.type = 1;
          console.warn('ロングマーカーの終端情報が見つかりませんでした(%s小節, %s拍目)', marker.measure, marker.point);
        }
      }
    }
  }

  /**
   * ロングの終端のindexを取得します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   * @param {number} index ロングマーカーのindex
   * @param {number} lane ロングマーカーのレーン
   * @return {number} ロングマーカー終端のindex(見つからない場合は-1を返す)
   */
  function getLongEndIndex(sbrs, index, lane) {

    var endIndex = -1;
    var marker;
    var i, iLen;

    for (i = index + 1, iLen = sbrs.marker.length; i < iLen; i++) {

      marker = sbrs.marker[i];

      if (marker.lane === lane) {
        if (marker.type === 3) {
          endIndex = i;
        }
        break;
      }
    }

    return endIndex;
  }

  /**
   * フィーバーゲージの長さを付与します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   */
  function addFeverGaugeData(sbrs) {

    var count = 0;
    var i, iLen;

    for (i = 0, iLen = sbrs.marker.length; i < iLen; i++) {
      if (sbrs.marker[i].type === 1 || sbrs.marker[i].type === 2) {
        count++;
      }
    }
    // フィーバーゲージの長さ
    sbrs.feverGaugeLength = Math.floor(count * 2.0 * 0.8);

    // Feverに必要なマーカー数
    sbrs.fever = Math.ceil(sbrs.feverGaugeLength / (4.0 * 1));
    sbrs.feverHigh = Math.ceil(sbrs.feverGaugeLength / (4.0 * 7));
  }

  /**
   * コンボ数の理論値を取得します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   * @return {number} コンボ数の理論値
   */
  function getComboCount(sbrs) {

    var count = 0;
    var i, iLen;

    for (i = 0, iLen = sbrs.marker.length; i < iLen; i++) {
      if (sbrs.marker[i].type === 1 || sbrs.marker[i].type === 2) {

        count++;

        if (sbrs.marker[i].type === 2) {

          count++;
          count += sbrs.marker[i].long.length;
        }
      }
    }

    return count;
  }

  /**
   * マーカーオブジェクトの数を付与します
   * @param {Sbrs} sbrs SBRスクリプトオブジェクト
   */
  function addMarkerCount(sbrs) {

    var i, iLen;

    for (i = 0, iLen = sbrs.marker.length; i < iLen; i++) {
      switch (sbrs.marker[i].type) {
        case 1:
          sbrs.normalMarkerCount++;
          break;
        case 2:
          sbrs.longMarkerCount++;
          break;
        default:
          break;
      }
    }
  }

  return script;
}());