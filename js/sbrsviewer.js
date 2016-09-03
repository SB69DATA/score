// ver 1.4.1
var SBRSViewer = (function() {
  'use strict';

  var viewer = new SBRSViewer();

  var PLAYER_ATTACK_TIME = 10000; // プレイヤーの攻撃時間
  var PLAYER_LONG_ATTACK_TIME = 22000; // ボスの攻撃頻度を下げる使用時のプレイヤーの攻撃時間
  var BOSS_ATTACK_TIME = 8500; // ボスの攻撃時間
  var BOSS_SHORT_ATTACK_TIME = 7000; // ボスの攻撃時間が短くなる使用時のボスの攻撃時間
  var FEVER_TIME = 10000; // フィーバータイムの時間
  var DEFAULT_START_OFFSET = -2200; // 演奏開始から1小節目が流れてくるまでの時間
  var FEVER_HIGH_MAGNIFICATION = 7; // フィーバーゲージがたまりやすくなるのスキル使用時のゲージ増加倍率
  var SCORE_BOOST_COMBO_INTERVAL = 40; // スコアブースト発動に必要なコンボ数

  var DEFAULT_BEAT_HEIGHT = 20; // 拍の高さのデフォルト
  var DEFAULT_LANE_WIDTH = 13; // レーンの幅のデフォルト
  var DEFAULT_MARKER_SIZE = 13; // マーカーの大きさのデフォルト
  var DEFAULT_COL_BEAT = 32; // 列の拍数のデフォルト
  var DEFAULT_FONT_SIZE = 10; // フォントの大きさのデフォルト
  var DEFAULT_LONG_MARKER_FAST_TAP = false; // ロングマーカーの強調表示設定のデフォルト
  var DEFAULT_SCORE_BOOST_MARKER = false; // スコアブーストマーカーの表示設定のデフォルト
  var DEFAULT_SCORE_BOOST_COUNT = 6; // スコアブーストのスキル所持ブロマイド数のデフォルト
  var DEFAULT_SCROLL_SPEED = 1.0; // マーカーのスクロール速度のデフォルト

  var VIEWER_STORAGE_KEY = 'VIEWER_OPTION_DATA'; // オプション保存用ローカルストレージのキー

  /**
   * ビュワーの情報を保持します
   * @constructor
   */
  function SBRSViewer() {
    this.sbrs = null; // sbrスクリプトオブジェクト
    this.title = 'No Title ★0'; // タイトル
    this.info = new Info(); // 譜面の情報
    this.option = new Option(); // 表示オプション
  }

  /**
   * 譜面の情報を保持します
   * @constructor
   */
  function Info() {
    this.bpm = '-'; // BPM
    this.combo = '-'; // COMBO数理論値
    this.marker = '-'; // マーカー数
    this.fevercombo = '-'; // フィーバー中のコンボ数
    this.fevergauge = '-'; // フィーバーゲージの長さ
    this.bossattack = '-'; // ボスの攻撃回数
    this.playercombo = '-'; // プレイヤー攻撃中のコンボ数
    this.bosscombo = '-'; // ボス攻撃中のコンボ数
    this.time = '-'; // 演奏時間
  }

  /**
   * 表示オプションを保持します
   * @constructor
   */
  function Option() {
    this.beatHeight = DEFAULT_BEAT_HEIGHT; // 拍の高さ
    this.laneWidth = DEFAULT_LANE_WIDTH; // レーンの幅
    this.colBeat = DEFAULT_COL_BEAT; // 列の拍数
    this.markerSize = DEFAULT_MARKER_SIZE; // マーカーの大きさ
    this.fontSize = DEFAULT_FONT_SIZE; // フォントの大きさ
    this.startOffset = DEFAULT_START_OFFSET; // 演奏開始から1小節目が流れてくるまでの時間
    this.longMarkerFastTap = DEFAULT_LONG_MARKER_FAST_TAP; // ロングマーカーの強調表示設定
    this.stageType = 'score'; // 選択中のステージタイプ
    this.feverGaugeHigh = false; // フィーバーゲージがたまりやすくなるのスキルの使用有無
    this.bossAttackFrequently = false; // ボスの攻撃頻度を下げるのスキルの使用有無
    this.bossAttackShort = false; // ボスの攻撃時間が短くなるのスキルの使用有無
    this.scoreboost = false; // スコアブーストマーカーの表示有無
    this.scoreboostCount = 0; // スコアブーストのスキル所持ブロマイド数
    this.scrollSpeed = 1.0; // マーカーのスクロール速度
  }

  /**
   * コンボ毎の情報を保持します
   * @constructor
   */
  function ComboInfo() {
    this.index = 0; // 対応するマーカーオブジェクトのインデックス
    this.longIndex = 0; // 対応するロングマーカーオブジェクトのインデックス
    this.type = 0; // マーカーの種類
    this.time = 0.0; // 時間(ms)
    this.bpm = 0.0; // BPM
    this.scroll = 0.0; // SCROLL
    this.measure = 0; // 小節
    this.point = 0; // 拍
    this.judge = 0; // 判定(未使用)
    this.skill = 0; // スキル(0:なし 1:スコアブースト)
  }

  /**
   * マーカーの情報とコンボ毎の情報の関連を保持します
   * marker[i] = comboInfo[markerComboRelation[i].index]
   * marker[i].long[j] = comboInfo[markerComboRelation[i].long[j].index]
   * @constructor
   */
  function MarkerComboRelation() {
    this.index = 0; // コンボ毎の情報のインデックス
    this.long = null; // ローングマーカーのホールド情報に対応するコンボ情報オブジェクトのインデックスを配列で格納
  }

  /**
   * ローカルストレージに格納する情報を保持します
   * @constructor
   * @param {Object} option 表示オプション
   */
  function ScoreViewerOptionStorage(option) {
    this.beatHeight = option.beatHeight;
    this.laneWidth = option.laneWidth;
    this.colBeat = option.colBeat;
    this.markerSize = option.markerSize;
    this.fontSize = option.fontSize;
    this.longMarkerFastTap = option.longMarkerFastTap;
    this.scoreboost = option.scoreboost;
  }

  /**
   * 動作環境を満たしているか確認します
   * @return {boolean} true : 動作環境を満たす / false : 動作環境を満たさない
   */
  function checkEnvironment() {

    if (!window.addEventListener) {
      return false;
    }
    if (!Array.prototype.forEach) {
      return false;
    }
    if (!window.addEventListener) {
      return false;
    }

    return true;
  }

  // 動作環境確認
  if (checkEnvironment()) {
    // 動作環境を満たす場合

    window.addEventListener('DOMContentLoaded', function() {

      var viewElement = document.getElementById('view');
      var sbrsPath;

      try {

        // パラメータから譜面のパス取得
        sbrsPath = location.search.match(/load=([^&]*)(&|$)/)[1];

        // 譜面読み込み
        viewer.sbrs = SBRScript.load(sbrsPath, true, {

          // 読み込み成功
          load: function() {

            try {

              // スクロール速度の値変更
              viewer.option.scrollSpeed = viewer.sbrs.baseScroll;
              document.getElementById('scroll-speed').value = ('' + (viewer.option.scrollSpeed + 0.001)).substring(0, 3);

              // 譜面描画
              draw();

            } catch (e) {

              // 描画に失敗した場合は、画面にメッセージ表示
              viewElement.innerHTML = '譜面の描画に失敗しました';
              console.error(e.stack);

              // エラー表示用のスタイルを適用
              addErrorStyle();
            }
          },
          // 読み込み失敗
          error: function() {

            // 読み込みに失敗した場合は、画面にメッセージ表示
            viewElement.innerHTML = '読み込みに失敗しました(load:' + decodeURI(sbrsPath) + ')';
            console.error(e.stack);

            // エラー表示用のスタイルを適用
            addErrorStyle();
          }
        });

        // イベント登録
        addEvent();

        // フォームの選択状態をリセット
        resetForm();

        // ローカルストレージに保存した表示設定を反映
        loadLocalStorageOption();

      } catch (e) {

        // パラメータの取得に失敗した場合は、画面にメッセージ表示
        viewElement.innerHTML = 'パラメータエラー';
        console.error(e.stack);

        // エラー表示用のスタイルを適用
        addErrorStyle();
      }
    });
  } else {
    // 動作環境を満たさない場合

    window.onload = function() {

      // 画面にメッセージ表示
      document.getElementById('view').innerHTML = 'このページはご利用中のブラウザに対応していません';

      // エラー表示用のスタイルを適用
      addErrorStyle();
    };

    throw new Error('動作環境を満たしていません');
  }

  /**
   * イベントを登録します
   */
  function addEvent() {

    // ステージタイプの変更
    Array.prototype.forEach.call(document.getElementsByName('stage-type'), function(element) {
      element.addEventListener('change', changeStageType);
    });

    // オプションの変更
    Array.prototype.forEach.call(document.getElementsByName('option'), function(element) {
      element.addEventListener('change', changeOption);
    });

    // フィーバーゲージがたまりやすくなるのスキル切り替え
    document.getElementById('option-skill-fever').addEventListener('change', function(e) {
      viewer.option.feverGaugeHigh = e.target.checked;
      draw();
    });

    // ボスの攻撃頻度を下げるのスキル切り替え
    document.getElementById('option-skill-bossattackfrequently').addEventListener('change', function(e) {
      viewer.option.bossAttackFrequently = e.target.checked;
      draw();
    });

    // ボスの攻撃時間が短くなるのスキル切り替え
    document.getElementById('option-skill-bossattackshort').addEventListener('change', function(e) {
      viewer.option.bossAttackShort = e.target.checked;
      draw();
    });

    // レーンの幅変更
    document.getElementById('display-lane-width').addEventListener('change', function(e) {
      viewer.option.laneWidth = parseInt(e.target.value);
      draw();
    });

    // 拍の高さ変更
    document.getElementById('display-beat-height').addEventListener('change', function(e) {
      viewer.option.beatHeight = parseInt(e.target.value);
      draw();
    });

    // 1列の拍数変更
    document.getElementById('display-col-beat').addEventListener('change', function(e) {
      viewer.option.colBeat = parseInt(e.target.value);
      draw();
    });

    // マーカーの大きさ変更
    document.getElementById('display-marker-size').addEventListener('change', function(e) {
      viewer.option.markerSize = parseInt(e.target.value);
      draw();
    });

    // フォントサイズ変更
    document.getElementById('display-font-size').addEventListener('change', function(e) {
      viewer.option.fontSize = parseInt(e.target.value);
      draw();
    });

    // ロングマーカーの強調表示変更
    document.getElementById('long-marker-fast-tap').addEventListener('change', function(e) {
      viewer.option.longMarkerFastTap = e.target.checked;
      draw();
    });

    // スコアブーストマーカーの表示変更
    document.getElementById('scoreboost-marker').addEventListener('change', function(e) {
      viewer.option.scoreboost = e.target.checked;
      draw();
      if (e.target.checked) {
        document.getElementById('scoreboost-count-item').style.display = 'inline';
        document.getElementById('scroll-speed-item').style.display = 'inline';
      } else {
        document.getElementById('scoreboost-count-item').style.display = 'none';
        document.getElementById('scroll-speed-item').style.display = 'none';
      }
    });

    // スコアブーストのスキル所持ブロマイド数変更
    document.getElementById('scoreboost-count').addEventListener('change', function(e) {
      viewer.option.scoreboostCount = parseInt(e.target.value);
      draw();
    });

    // スクロール速度変更
    document.getElementById('scroll-speed').addEventListener('change', function(e) {
      viewer.option.scrollSpeed = parseFloat(e.target.value);
      draw();
    });

    // オプションの保存
    document.getElementById('option-save').addEventListener('click', function(e) {
      var storage = new ScoreViewerOptionStorage(viewer.option);
      if (confirm('表示設定の内容を保存します。よろしいですか？')) {
        try {
          localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(storage));
          alert('保存しました');
        } catch (ex) {
          alert('保存に失敗しました');
        }
      }
    });

    // オプションのリセット
    document.getElementById('option-reset').addEventListener('click', function(e) {
      if (confirm('表示設定の内容をリセットします。よろしいですか？')) {
        try {
          localStorage.removeItem(VIEWER_STORAGE_KEY);
          loadLocalStorageOption();
          draw();
          alert('リセットしました');
        } catch (ex) {
          alert('リセットに失敗しました');
        }
      }
    });

    // ドラッグオーバー時の処理キャンセル
    window.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    // sbrsファイルのドロップによる読み込み
    window.addEventListener('drop', function(e) {

      var viewElement = document.getElementById('view');
      var file = e.dataTransfer.files[0];
      var fr = new FileReader();

      e.preventDefault();

      // 1MBまで許容
      if (file.size > 1024 * 1024) {
        throw new Error('ファイルサイズが大きすぎます');
      }

      fr.addEventListener('load', function(e) {
        try {

          // 譜面読み込み
          viewer.sbrs = SBRScript.parse(e.target.result);

          // 譜面描画
          draw();

        } catch (ex) {
          viewElement.innerHTML = '譜面の描画に失敗しました';
          console.error(ex.stack);

          // エラー表示用のスタイルを適用
          addErrorStyle();
        }
      });

      fr.readAsText(file);
    });
  }

  /**
   * ローカルストレージから表示オプションを読み込み、画面に反映します
   */
  function loadLocalStorageOption() {

    var item;
    var option;

    if ((item = localStorage.getItem(VIEWER_STORAGE_KEY))) {
      option = JSON.parse(item);
      viewer.option.beatHeight = option.beatHeight || DEFAULT_BEAT_HEIGHT;
      viewer.option.laneWidth = option.laneWidth || DEFAULT_LANE_WIDTH;
      viewer.option.colBeat = option.colBeat || DEFAULT_COL_BEAT;
      viewer.option.markerSize = option.markerSize || DEFAULT_MARKER_SIZE;
      viewer.option.fontSize = option.fontSize || DEFAULT_FONT_SIZE;
      viewer.option.longMarkerFastTap = option.longMarkerFastTap || DEFAULT_LONG_MARKER_FAST_TAP;
      viewer.option.scoreboost = option.scoreboost || DEFAULT_SCORE_BOOST_MARKER;
    } else {
      viewer.option.beatHeight = DEFAULT_BEAT_HEIGHT;
      viewer.option.laneWidth = DEFAULT_LANE_WIDTH;
      viewer.option.colBeat = DEFAULT_COL_BEAT;
      viewer.option.markerSize = DEFAULT_MARKER_SIZE;
      viewer.option.fontSize = DEFAULT_FONT_SIZE;
      viewer.option.longMarkerFastTap = DEFAULT_LONG_MARKER_FAST_TAP;
      viewer.option.scoreboost = DEFAULT_SCORE_BOOST_MARKER;
    }

    viewer.option.scoreboostCount = DEFAULT_SCORE_BOOST_COUNT;
    viewer.option.scrollSpeed = DEFAULT_SCROLL_SPEED;
    viewer.option.startOffset = DEFAULT_START_OFFSET;

    if (viewer.option.scoreboost) {
      document.getElementById('scoreboost-count-item').style.display = 'inline';
    } else {
      document.getElementById('scoreboost-count-item').style.display = 'none';
    }

    document.getElementById('display-lane-width').value = viewer.option.laneWidth;
    document.getElementById('display-beat-height').value = viewer.option.beatHeight;
    document.getElementById('display-col-beat').value = viewer.option.colBeat;
    document.getElementById('display-marker-size').value = viewer.option.markerSize;
    document.getElementById('display-font-size').value = viewer.option.fontSize;
    document.getElementById('long-marker-fast-tap').checked = viewer.option.longMarkerFastTap;
    document.getElementById('scoreboost-marker').checked = viewer.option.scoreboost;
  }

  /**
   * フォームの選択状態をリセットします(更新してもフォームの選択がリセットされないブラウザ用)
   */
  function resetForm() {

    // ステージの種類をリセット
    document.getElementById('stage-type-score').checked = true;

    // スキルの使用有無をリセット
    document.getElementById('option-skill-fever').checked = false;
    document.getElementById('option-skill-bossattackfrequently').checked = false;
    document.getElementById('option-skill-bossattackshort').checked = false;

    // オプションの設定選択をリセット
    document.getElementById('option-skill').checked = true;

    // ロングマーカーの強調表示をリセット
    document.getElementById('long-marker-fast-tap').checked = false;

  }

  /**
   * 描画成功用のスタイルを適用します
   */
  function addLoadStyle() {
    document.getElementById('title').style.display = 'block';
    document.getElementById('info').style.display = 'block';
    document.getElementById('option').style.display = 'inline-block';
    document.body.className = 'fadein';
  }

  /**
   * エラー表示用のスタイルを適用します
   */
  function addErrorStyle() {
    document.getElementById('title').style.display = 'none';
    document.getElementById('info').style.display = 'none';
    document.getElementById('option').style.display = 'none';
    document.body.className = 'fadein';
  }

  /**
   * ステージの種類に応じて、画面に表示する項目を変更します
   */
  function changeStageType() {

    var stageType;
    var typeScoreStyle, typeBossStyle;

    // 選択されているステージタイプを取得('score' : スコアアタック, 'boss' : BOSSバトル)
    stageType = document.getElementById('stage-type-score').checked ? 'score' : 'boss';

    viewer.option.stageType = stageType;

    // displayプロパティに適用する値を指定
    switch (stageType) {
      case 'score':
        typeScoreStyle = 'block';
        typeBossStyle = 'none';
        break;
      case 'boss':
        typeScoreStyle = 'none';
        typeBossStyle = 'block';
        break;
      default:
        throw new Error();
    }

    // スコアアタック選択時にのみ表示する要素のdisplayプロパティに値を設定
    Array.prototype.forEach.call(document.getElementsByClassName('type-score'), function(element) {
      element.style.display = typeScoreStyle;
    });

    // BOSSバトル選択時にのみ表示する要素のdisplayプロパティに値を設定
    Array.prototype.forEach.call(document.getElementsByClassName('type-boss'), function(element) {
      element.style.display = typeBossStyle;
    });
  }

  /**
   * オプションで設定可能な項目を切り替えます
   */
  function changeOption() {

    var selectOption;
    var typeSkillStyle, typeDisplayStyle;

    // 選択されているオプションを取得('skill' : スキル設定, 'display' : 表示設定)
    selectOption = document.getElementById('option-skill').checked ? 'skill' : 'display';

    // displayプロパティに適用する値を指定
    switch (selectOption) {
      case 'skill':
        typeSkillStyle = 'block';
        typeDisplayStyle = 'none';
        break;
      case 'display':
        typeSkillStyle = 'none';
        typeDisplayStyle = 'block';
        break;
      default:
        throw new Error();
    }

    // スキル設定選択時にのみ表示する要素のdisplayプロパティに値を設定
    Array.prototype.forEach.call(document.getElementsByClassName('option-skill'), function(element) {
      element.style.display = typeSkillStyle;
    });

    // 表示設定選択時にのみ表示する要素のdisplayプロパティに値を設定
    Array.prototype.forEach.call(document.getElementsByClassName('option-display'), function(element) {
      element.style.display = typeDisplayStyle;
    });
  }

  /**
   * 解析した譜面データを元に、譜面を描画します
   */
  function draw() {

    var sbrs = viewer.sbrs;
    var viewElement;
    var colTable, colTr, colTd;
    var measureTable, measureTr, measureTh, measureTd;
    var measure, measureIndex, measureIndexLength;
    var measureBeat, measureS, measureB, measureHeight;
    var markerAriaDiv, lineAriaDiv;
    var markerIndex;
    var colDrawBeat;
    var laneCount;
    var comboInfo = [];
    var longMakrerInfo = [];
    var backgroundInfo = [];
    var markerComboRelation = [];

    viewElement = document.getElementById('view');
    laneCount = sbrs.laneCount;

    // viewを初期化
    viewElement.innerHTML = '';

    // 列データ格納用テーブル作成
    colTable = document.createElement('table');
    colTr = document.createElement('tr');
    colTable.appendChild(colTr);

    // 描画済みマーカーのindexを初期化
    markerIndex = 0;

    // コンボ毎の情報を格納する配列とマーカーとコンボ情報の関連付けを格納する配列の初期化
    initcomboInfo(comboInfo, markerComboRelation);

    // フィーバーゲージ、ボス攻撃時間の情報をセット
    setBackgroundInfo(backgroundInfo, comboInfo);

    // 全小節の描画が終わるまでループ
    for (measureIndex = 0, measureIndexLength = sbrs.measureCount; measureIndex < measureIndexLength;) {

      // 列データ作成
      colTd = document.createElement('td');
      colTr.appendChild(colTd);

      // 小節データ格納用テーブル作成
      // テーブルのサイズは 各レーンの幅 * レーン数 + ヘッダの幅 + ボーダー
      measureTable = document.createElement('table');
      colTd.appendChild(measureTable);
      measureTable.className = 'col';
      measureTable.style.width = (viewer.option.laneWidth * laneCount + 20 + 3 + (laneCount - 1)) + 'px';

      // 1列の描画済み拍数を初期化
      colDrawBeat = 0;

      // 1列に1小節は必ず表示する
      do {

        // 現在の小節
        measure = measureIndex + 1;

        // 全小節の描画が終わった後は、最終小節の拍子で空の小節データを作成
        if (measureIndex < measureIndexLength) {
          // 拍子の分子と分母、拍数を取得
          measureS = sbrs.measure[measureIndex].valueS;
          measureB = sbrs.measure[measureIndex].valueB;
          measureBeat = measureS / measureB * 4.0;
        }

        // 1小節分の行作成
        measureTr = measureTable.insertRow(0);
        measureTr.id = 'measure-' + measure;

        // 小節のヘッダ作成
        measureTh = document.createElement('th');
        measureTr.appendChild(measureTh);
        measureTh.innerHTML = measure;

        // 小節のデータ作成
        measureHeight = measureBeat * viewer.option.beatHeight - 1;
        measureTd = document.createElement('td');
        measureTr.appendChild(measureTd);
        measureTd.style.height = measureHeight + 'px';

        // レーンの区切り線、拍子線の描画エリア作成
        lineAriaDiv = document.createElement('div');
        lineAriaDiv.className = 'line-aria';
        lineAriaDiv.style.height = measureHeight + 'px';
        measureTd.appendChild(lineAriaDiv);

        // マーカーの描画エリア作成
        markerAriaDiv = document.createElement('div');
        markerAriaDiv.className = 'marker-aria';
        markerAriaDiv.style.height = measureHeight + 'px';
        measureTd.appendChild(markerAriaDiv);

        // フィーバ中、ボス攻撃中用のバックグラウンドを描画
        drawBackground(lineAriaDiv, measure, measureB, backgroundInfo, measureHeight);

        // レーンの区切り線、拍子線の描画
        drawLine(lineAriaDiv, measureS, measureB, laneCount);

        // ロングマーカーの中間線を描画
        drawLongLine(markerAriaDiv, measure, measureHeight, longMakrerInfo, colDrawBeat);

        // マーカーの描画
        markerIndex = drawMarker(markerAriaDiv, markerIndex, measure, measureHeight, longMakrerInfo, comboInfo, markerComboRelation);

        measureIndex++;

      } while ((colDrawBeat += measureBeat) < viewer.option.colBeat);

    }

    // 情報エリアを更新
    updateInfo();

    // viewに反映
    viewElement.appendChild(colTable);

    // 描画成功用のスタイルを適用
    addLoadStyle();
  }

  /**
   * コンボ毎の情報を格納する配列、およびマーカー情報とコンボ情報の関連付けを行う配列を初期化します
   * @param {ComboInfo[]} comboInfo コンボ毎の情報を格納する配列
   * @param {MarkerComboRelation[]} markerComboRelation コンボ情報の関連付けを格納する配列
   */
  function initcomboInfo(comboInfo, markerComboRelation) {

    var sbrs = viewer.sbrs;
    var markerObj;
    var longMarkerObj;
    var comboInfoObj;
    var comboInfoCount;
    var skillInvokeTime;
    var addCount;
    var i, iLen, j, jLen;
    var measure;

    comboInfoCount = 0;

    for (i = 0, iLen = sbrs.markerCount; i < iLen; i++) {

      markerObj = sbrs.marker[i];
      measure = markerObj.measure;

      comboInfoObj = new ComboInfo();
      comboInfoObj.index = i;
      comboInfoObj.longIndex = null;
      comboInfoObj.type = markerObj.type;
      comboInfoObj.time = markerObj.time;
      comboInfoObj.bpm = markerObj.bpm;
      comboInfoObj.scroll = markerObj.scroll;
      comboInfoObj.measure = measure;
      comboInfoObj.point = markerObj.point;
      comboInfoObj.judge = 0;
      comboInfo[comboInfoCount] = comboInfoObj;

      markerComboRelation[i] = 　new MarkerComboRelation();

      comboInfoCount++;

      if (markerObj.long) {

        markerComboRelation[i].long = [];

        for (j = 0, jLen = markerObj.long.length; j < jLen; j++) {

          longMarkerObj = sbrs.marker[i].long[j];
          measure = longMarkerObj.measure;

          comboInfoObj = new ComboInfo();
          comboInfoObj.index = i;
          comboInfoObj.longIndex = j;
          comboInfoObj.type = longMarkerObj.type;
          comboInfoObj.time = longMarkerObj.time;
          comboInfoObj.bpm = longMarkerObj.bpm;
          comboInfoObj.scroll = longMarkerObj.scroll;
          comboInfoObj.measure = measure;
          comboInfoObj.point = longMarkerObj.point;
          comboInfoObj.judge = 0;
          comboInfo[comboInfoCount] = comboInfoObj;

          markerComboRelation[i].long[j] = 　new MarkerComboRelation();

          comboInfoCount++;
        }
      }
    }

    // 時間順でソート
    comboInfo.sort(function(a, b) {
      return a.time - b.time;
    });

    // index付与
    for (i = 0, iLen = comboInfo.length; i < iLen; i++) {
      if (comboInfo[i].type !== 4) {
        // ロングのホールド以外
        markerComboRelation[comboInfo[i].index].index = i;
      } else {
        // ロングのホールド
        markerComboRelation[comboInfo[i].index].long[comboInfo[i].longIndex].index = i;
      }
    }

    // スコアブーストの情報付与
    for (i = SCORE_BOOST_COMBO_INTERVAL - 1, iLen = comboInfo.length; i < iLen; i += SCORE_BOOST_COMBO_INTERVAL) {

      // BPM120時,2600msが基準
      skillInvokeTime = comboInfo[i].time + 2600 * (120.0 / ((comboInfo[i].bpm / 2.0) * comboInfo[i].scroll * viewer.option.scrollSpeed));

      for (addCount = 0, j = i + 1, jLen = iLen; j < jLen && addCount < viewer.option.scoreboostCount; j++) {

        // スキル発動時間経過後の通常マーカーにスキル「スコアブースト」の発動情報を付与
        if (comboInfo[j].time >= skillInvokeTime && comboInfo[j].type === 1 && comboInfo[i].skill === 0) {

          comboInfo[j].skill = 1;
          addCount++;
        } else {

        }
      }
    }
  }

  /**
   * フィーバーゲージ、ボス攻撃時間の情報をセットします
   * @param {Object[]} backgroundInfo フィーバーゲージ、ボス攻撃時間の情報を格納する配列
   * @param {ComboInfo[]} comboInfo コンボ毎の情報を格納する配列
   */
  function setBackgroundInfo(backgroundInfo, comboInfo) {

    var sbrs = viewer.sbrs;
    var addGaugeIncrement = 4 * (viewer.option.feverGaugeHigh ? FEVER_HIGH_MAGNIFICATION : 1);
    var markerHitLength = comboInfo.length;
    var normalComboCount = 0;
    var feverComboCount = 0;
    var feverEndTime = 0;
    var feverGauge = 0;
    var markerHitIndex = 0;
    var measureIndex, measureIndexLength;
    var playerAttackTime, bossAttackTime;
    var playerComboCount, bossComboCount;
    var hitInfo, hitTime, hitPoint;
    var bossAttackCount;
    var fromTime, toTime, time;
    var fromData, toData;
    var i, iLen;

    // フィーバーゲージの範囲セット
    for (measureIndex = 0, measureIndexLength = sbrs.measureCount; measureIndex < measureIndexLength; measureIndex++) {

      while (markerHitIndex < markerHitLength && comboInfo[markerHitIndex].measure === measureIndex + 1) {

        hitInfo = comboInfo[markerHitIndex];
        hitTime = hitInfo.time;
        hitPoint = hitInfo.point;

        if (hitTime < feverEndTime) {
          // フィーバー中

          feverComboCount++;

        } else {
          // 非フィーバー

          normalComboCount++;
          feverGauge += addGaugeIncrement;
        }
        // フィーバー開始
        if (feverGauge >= sbrs.feverGaugeLength) {

          feverEndTime = hitTime + FEVER_TIME;
          feverGauge = 0;

          toData = SBRScript.getMeasurePointFromTime(sbrs, feverEndTime);
          backgroundInfo.push({
            from: {
              measure: measureIndex + 1,
              point: hitPoint,
              time: hitTime
            },
            to: {
              measure: toData.measure,
              point: toData.point,
              time: feverEndTime
            },
            type: 1
          });
        }
        markerHitIndex++;
      }
    }

    markerHitIndex = 0;
    bossAttackCount = 0;
    playerComboCount = 0;
    bossComboCount = 0;
    time = viewer.option.startOffset;
    playerAttackTime = viewer.option.bossAttackFrequently ? PLAYER_LONG_ATTACK_TIME : PLAYER_ATTACK_TIME;
    bossAttackTime = viewer.option.bossAttackShort ? BOSS_SHORT_ATTACK_TIME : BOSS_ATTACK_TIME;

    // ボス攻撃の範囲セット
    while (time + playerAttackTime < sbrs.endTime) {

      fromTime = (time += playerAttackTime);
      toTime = (time += bossAttackTime);
      fromData = SBRScript.getMeasurePointFromTime(sbrs, fromTime);
      toData = SBRScript.getMeasurePointFromTime(sbrs, toTime);

      backgroundInfo.push({
        from: {
          measure: fromData.measure,
          point: fromData.point,
          time: fromTime
        },
        to: {
          measure: toData.measure,
          point: toData.point,
          time: toTime
        },
        type: 2
      });

      // 通常マーカーのカウント
      while (markerHitIndex < markerHitLength && comboInfo[markerHitIndex].time < fromTime) {
        playerComboCount++;
        markerHitIndex++;
      }

      // BOSSアタックマーカーのカウント
      while (markerHitIndex < markerHitLength && comboInfo[markerHitIndex].time < toTime) {
        bossComboCount++;
        markerHitIndex++;
      }

      bossAttackCount++;
    }
    // 通常マーカーのカウント
    while (markerHitIndex < markerHitLength) {
      playerComboCount++;
      markerHitIndex++;
    }

    // 描画開始時間順にソート
    backgroundInfo.sort(function(a, b) {
      return a.from.time - b.from.time;
    });

    viewer.info.fevercombo = feverComboCount;
    viewer.info.bossattack = bossAttackCount;
    viewer.info.playercombo = playerComboCount;
    viewer.info.bosscombo = bossComboCount;
  }

  /**
   * ラインエリアのdiv要素にフィーバー中、ボス攻撃中のバックグラウンドを追加します
   * @param {Object} lineAriaDiv ラインdiv要素
   * @param {number} measure 現在の小節
   * @param {number} measureB 現在の小節の分母
   * @param {Object[]} backgroundInfo フィーバーゲージ、ボス攻撃時間の情報を格納する配列
   * @param {number} measureHeight 描画エリアの高さ
   */
  function drawBackground(lineAriaDiv, measure, measureB, backgroundInfo, measureHeight) {

    var bgInfo;
    var bgDiv;
    var top, bottom;
    var i, iLen;

    for (i = 0, iLen = backgroundInfo.length; i < iLen; i++) {

      bgInfo = backgroundInfo[i];

      if (measure < bgInfo.from.measure) {
        continue;
      }

      bgDiv = document.createElement('div');

      if (bgInfo.type === 1) {
        // フィーバー
        bgDiv.className = 'fever-background type-score';
        bgDiv.style.display = viewer.option.stageType === 'score' ? 'block' : 'none';
      } else if (bgInfo.type === 2) {
        // ボス攻撃
        bgDiv.className = 'boss-background type-boss';
        bgDiv.style.display = viewer.option.stageType === 'boss' ? 'block' : 'none';
      }

      if (measure === bgInfo.from.measure && measure === bgInfo.to.measure) {
        // 開始小節と終了小節が同じ
        top = (bgInfo.to.point * viewer.option.beatHeight * 4 / measureB);
        bottom = (bgInfo.from.point * viewer.option.beatHeight * 4 / measureB);
        bgDiv.style.height = (top - bottom) + 'px';
        bgDiv.style.bottom = bottom + 'px';
      } else if (measure === bgInfo.from.measure) {
        // 開始小節
        bottom = (bgInfo.from.point * viewer.option.beatHeight * 4 / measureB);
        bgDiv.style.height = (measureHeight - bottom) + 'px';
        bgDiv.style.bottom = bottom + 'px';
      } else if (measure === bgInfo.to.measure) {
        // 終了小節
        bottom = 0;
        bgDiv.style.height = (bgInfo.to.point * 4 / measureB) * viewer.option.beatHeight + 'px';
        bgDiv.style.bottom = bottom + 'px';
      } else if (measure > bgInfo.from.measure && measure < bgInfo.to.measure) {
        // 中間
        bottom = 0;
        bgDiv.style.height = (measureHeight - bottom) + 'px';
        bgDiv.style.bottom = bottom + 'px';
      }

      lineAriaDiv.appendChild(bgDiv);
    }
  }

  /**
   * マーカーエリアのdiv要素にマーカーを追加します
   * @param {Object} markerAriaDiv マーカーdiv要素
   * @param {number} markerIndex 描画済みマーカーのindex
   * @param {number} measure 現在の小節
   * @param {number} measureHeight 描画エリアの高さ
   * @param {Object[]} longMakrerInfo ロングマーカーの描画情報
   * @param {ComboInfo[]} comboInfo コンボ毎の情報を格納する配列
   * @param {MarkerComboRelation[]} markerComboRelation コンボ情報の関連付けを格納する配列
   * @return {number} 次に処理するマーカーのインデックス
   */
  function drawMarker(markerAriaDiv, markerIndex, measure, measureHeight, longMakrerInfo, comboInfo, markerComboRelation) {

    var sbrs = viewer.sbrs;
    var len;
    var marker;
    var markerDiv;
    var markerValueDiv;
    var measureObj;
    var measureB;
    var comboInfoIndex;

    if (measure <= sbrs.measureCount) {

      measureObj = sbrs.measure[measure - 1];
      measureB = measureObj.valueB;

      for (len = sbrs.markerCount; markerIndex < len && sbrs.marker[markerIndex].measure === measure; markerIndex++) {
        marker = sbrs.marker[markerIndex];

        markerDiv = document.createElement('div');
        markerDiv.style.height = (viewer.option.markerSize - 2) + 'px';
        markerDiv.style.width = (viewer.option.markerSize - 2) + 'px';
        markerDiv.style.borderRadius = (viewer.option.markerSize / 2) + 'px';
        markerDiv.style.left = ((marker.lane - 1) * (viewer.option.laneWidth + 1) + ((viewer.option.laneWidth - viewer.option.markerSize) / 2)) + 'px';
        markerDiv.style.bottom = (marker.point * viewer.option.beatHeight * 4 / measureB - (viewer.option.markerSize - 1) / 2 - 1) + 'px';
        markerDiv.style.lineHeight = (viewer.option.markerSize - 2) + 'px';

        comboInfoIndex = markerComboRelation[markerIndex].index;

        switch (marker.type) {
          case 1:
            // 通常マーカー
            if (comboInfo[comboInfoIndex].skill === 1 && viewer.option.scoreboost) {
              markerDiv.className = 'normal-marker skill-scoreboost';
            } else {
              markerDiv.className = 'normal-marker';
            }
            markerDiv.style.zIndex = 200 + len - markerIndex;
            break;
          case 2:
            // ロング開始
            if (viewer.option.longMarkerFastTap && (marker.point + 0.125) % 1 <= 0.125) {
              markerDiv.className = 'long-marker emphasis';
            } else {
              markerDiv.className = 'long-marker';
            }
            markerDiv.style.zIndex = 300 + len - markerIndex;

            markerValueDiv = document.createElement('div');
            markerValueDiv.className = 'value';
            markerDiv.appendChild(markerValueDiv);
            markerValueDiv.innerHTML = 2 + marker.long.length;
            markerValueDiv.style.webkitTransform = 'scale(' + (viewer.option.fontSize / 10) + ')';
            markerValueDiv.style.transform = 'scale(' + (viewer.option.fontSize / 10) + ')';
            markerValueDiv.style.left = (-20 + 0.5 + (viewer.option.markerSize - 2) / 2) + 'px';

            longMakrerInfo[marker.lane - 1] = {
              start: {
                measure: marker.measure,
                point: marker.point
              },
              end: {
                measure: sbrs.marker[marker.pair].measure,
                point: sbrs.marker[marker.pair].point
              },
              style: {
                width: markerDiv.style.width,
                left: markerDiv.style.left
              }
            };

            // ロングマーカーの中間線を描画
            drawLongLine(markerAriaDiv, measure, measureHeight, longMakrerInfo);
            break;
          case 3:
            // ロング終了
            if (viewer.option.longMarkerFastTap && ((marker.point % 1 > 0 && marker.point % 1 <= 0.25) || marker.longEndCountFlag)) {
              markerDiv.className = 'long-marker emphasis';
            } else {
              markerDiv.className = 'long-marker';
            }
            markerDiv.style.zIndex = 100 + len - markerIndex;
            break;
          default:
            throw new Error();
        }

        markerAriaDiv.appendChild(markerDiv);
      }
    }

    return markerIndex;
  }

  /**
   * マーカーエリアのdiv要素にロングマーカーの中間線を追加します
   * @param {Object} markerAriaDiv マーカーdiv要素
   * @param {number} measure 現在の小節
   * @param {number} measureHeight 描画エリアの高さ
   * @param {Object[]} longMakrerInfo ロングマーカーの描画情報
   * @param {number} colDrawBeat 1列の描画済み拍数
   */
  function drawLongLine(markerAriaDiv, measure, measureHeight, longMarkerInfo, colDrawBeat) {

    var sbrs = viewer.sbrs;
    var laneCount = sbrs.laneCount;
    var fromY, toY;
    var markerDiv;
    var i, iLen;
    var measureObj;
    var measureB;

    if (measure <= sbrs.measureCount) {

      measureObj = sbrs.measure[measure - 1];
      measureB = measureObj.valueB;

      for (i = 0, iLen = laneCount; i < iLen; i++) {

        if (longMarkerInfo[i] && measure === longMarkerInfo[i].start.measure) {

          fromY = longMarkerInfo[i].start.point * 4 / measureB * viewer.option.beatHeight;
          if (measure < longMarkerInfo[i].end.measure) {
            toY = measureHeight;
          } else {
            toY = longMarkerInfo[i].end.point * 4 / measureB * viewer.option.beatHeight;
          }

          markerDiv = document.createElement('div');
          markerDiv.className = 'long-line';
          markerDiv.style.height = Math.ceil(toY - fromY + 1) + 'px';
          markerDiv.style.width = longMarkerInfo[i].style.width;
          markerDiv.style.left = longMarkerInfo[i].style.left;

          if (colDrawBeat === 0) {
            // 列の1小節目はbottomの位置を1px高めに
            markerDiv.style.bottom = Math.floor(fromY - 0) + 'px';
          } else {
            markerDiv.style.bottom = Math.floor(fromY - 1) + 'px';
          }

          markerAriaDiv.appendChild(markerDiv);

          if (measure === longMarkerInfo[i].end.measure + 1 && longMarkerInfo[i].end.point === 0) {
            longMarkerInfo[i] = null;
          } else if (measure < longMarkerInfo[i].end.measure) {
            longMarkerInfo[i].start.measure = measure + 1;
            longMarkerInfo[i].start.point = 0;
          } else {
            longMarkerInfo[i] = null;
          }
        }
      }
    }
  }

  /**
   * ラインエリアのdiv要素に拍子線、レーンの区切り線を追加します
   * @param {Object} lineAriaDiv ラインdiv要素
   * @param {number} measureS 拍子の分子
   * @param {number} measureB 拍子の分母
   * @param {number} laneCount レーン数
   * @param {number} divHeight 描画エリアの高さ
   */
  function drawLine(lineAriaDiv, measureS, measureB, laneCount, divHeight) {

    var beatHeight = viewer.option.beatHeight * 4 / measureB;
    var lineDiv;
    var i, iLen;

    // 拍子の線
    for (i = 1, iLen = measureS; i < iLen; i++) {
      lineDiv = document.createElement('div');
      lineDiv.className = 'beat-line';
      lineDiv.style.bottom = (beatHeight * i - 1) + 'px';
      lineAriaDiv.appendChild(lineDiv);
    }

    // 拍子の線2
    for (i = 0, iLen = measureS; i < iLen; i++) {
      lineDiv = document.createElement('div');
      lineDiv.className = 'beat-subline';
      lineDiv.style.bottom = (beatHeight * (i + 0.5) - 1) + 'px';
      lineAriaDiv.appendChild(lineDiv);
    }

    // レーンの線
    for (i = 1, iLen = laneCount; i < iLen; i++) {
      lineDiv = document.createElement('div');
      lineDiv.className = 'lane-line';
      lineDiv.style.left = ((viewer.option.laneWidth + 1) * i + -1) + 'px';
      lineAriaDiv.appendChild(lineDiv);
    }
  }

  /**
   * SBRスクリプトオブジェクトから情報エリアに必要な値を取得、画面に反映します
   */
  function updateInfo() {

    var sbrs = viewer.sbrs;
    var bpmMagnification = sbrs.bpmHalfMode ? 0.5 : 1;

    // タイトル取得
    viewer.title = viewer.sbrs.title + ' ★' + viewer.sbrs.level;

    // BPM取得
    if (sbrs.bpmCount === 1) {
      viewer.info.bpm = Math.round(sbrs.maxBpm * bpmMagnification);
    } else {
      viewer.info.bpm = Math.roundeInt(sbrs.minBpm * bpmMagnification) + ' - ' + Math.round(sbrs.maxBpm * bpmMagnification);
    }

    // コンボ数取得
    viewer.info.combo = sbrs.comboCount;

    // マーカー数取得
    viewer.info.marker = sbrs.normalMarkerCount + sbrs.longMarkerCount;

    // ゲージの長さ取得
    viewer.info.fevergauge = sbrs.feverGaugeLength;

    // 演奏時間取得
    viewer.info.time = Math.round(sbrs.endTime / 1000);

    document.title = viewer.title + ' | SB69 Score Viewer';
    document.querySelector('#title .value').innerHTML = viewer.title;
    document.querySelector('#info-bpm .value').innerHTML = viewer.info.bpm;
    document.querySelector('#info-combo .value').innerHTML = viewer.info.combo;
    document.querySelector('#info-marker .value').innerHTML = viewer.info.marker;
    document.querySelector('#info-fevercombo .value').innerHTML = viewer.info.fevercombo;
    document.querySelector('#info-fevergauge .value').innerHTML = viewer.info.fevergauge;
    document.querySelector('#info-bossattack .value').innerHTML = viewer.info.bossattack;
    document.querySelector('#info-playercombo .value').innerHTML = viewer.info.playercombo;
    document.querySelector('#info-bosscombo .value').innerHTML = viewer.info.bosscombo;
    document.querySelector('#info-time .value').innerHTML = viewer.info.time;
  }

  return viewer;

}());