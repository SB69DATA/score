/*
 * 履歴
 */
var SBRSViewer = (function() {

  var SBRSViewer = {};

  var PLAYER_ATTACK_TIME = 10000; // プレイヤーの攻撃時間
  var PLAYER_LONG_ATTACK_TIME = 22000; // ボウスの攻撃頻度を下げる使用時のプレイヤーの攻撃時間
  var BOSS_ATTACK_TIME = 8500; // ボスの攻撃時間
  var BOSS_SHORT_ATTACK_TIME = 7000; // ボスの攻撃時間が短くなる使用時のボスの攻撃時間
  var FEVER_TIME = 10000; // フィーバータイムの時間
  var DEFAULT_START_OFFSET = -2200; // 演奏開始から1小節目が流れてくるまでの時間
  var FEVER_HIGH_MAGNIFICATION = 7; // フィーバーゲージがたまりやすくなるのスキル使用時のゲージ増加倍率

  var BEAT_HEIGHT_DEFAULT = 20; // 拍の高さのデフォルト
  var LANE_WIDTH_DEFAULT = 13; // レーンの幅のデフォルト
  var MARKER_SIZE_DEFAULT = 13; // マーカーの大きさのデフォルト
  var COL_BEAT_DEFAULT = 32; // 列の拍数のデフォルト
  var FONT_SIZE_DEFAULT = 10; // フォントの大きさのデフォルト

  var VIEWER_STORAGE_KEY = "VIEWER_OPTION_DATA"; // オプション保存用ローカルストレージのキー

  SBRSViewer.sbrs = null; // sbrスクリプトオブジェクト
  SBRSViewer.title = "No Title ★0"; // タイトル
  SBRSViewer.info = {}; // 表示情報関連オブジェクト
  SBRSViewer.info.bpm = "-"; // BPM
  SBRSViewer.info.combo = "-"; // COMBO数理論値
  SBRSViewer.info.marker = "-"; // マーカー数
  SBRSViewer.info.fevercombo = "-"; // フィーバー中のコンボ数
  SBRSViewer.info.fevergauge = "-"; // フィーバーゲージの長さ
  SBRSViewer.info.bossattack = "-"; // ボスの攻撃回数
  SBRSViewer.info.playercombo = "-"; // プレイヤー攻撃中のコンボ数
  SBRSViewer.info.bosscombo = "-"; // ボス攻撃中のコンボ数
  SBRSViewer.info.time = "-"; // 演奏時間
  SBRSViewer.option = {}; // 表示設定関連のオブジェクト
  SBRSViewer.option.beatHeight = BEAT_HEIGHT_DEFAULT; // 拍の高さ
  SBRSViewer.option.laneWidth = LANE_WIDTH_DEFAULT; // レーンの幅
  SBRSViewer.option.colBeat = COL_BEAT_DEFAULT; // 列の拍数
  SBRSViewer.option.markerSize = MARKER_SIZE_DEFAULT; // マーカーの大きさ
  SBRSViewer.option.fontSize = FONT_SIZE_DEFAULT; // フォントの大きさ
  SBRSViewer.option.startOffset = DEFAULT_START_OFFSET; // 演奏開始から1小節目が流れてくるまでの時間
  SBRSViewer.option.stageType = "score"; // 選択中のステージタイプ
  SBRSViewer.option.feverGaugeHigh = false; // フィーバーゲージがたまりやすくなるのスキルの使用有無
  SBRSViewer.option.bossAttackFrequently = false; // ボスの攻撃頻度を下げるのスキルの使用有無
  SBRSViewer.option.bossAttackShort = false; // ボスの攻撃時間が短くなるのスキルの使用有無

  // ローカルストレージ格納用オブジェクト
  function ScoreViewerOptionStorage(option) {
    this.beatHeight = option.beatHeight;
    this.laneWidth = option.laneWidth;
    this.colBeat = option.colBeat;
    this.markerSize = option.markerSize;
    this.fontSize = option.fontSize;
  }

  // 対応チェック
  if (!window.addEventListener) {
    window.onload = function() {
      document.getElementById("view").innerHTML = "このページはご利用中のブラウザに対応していません";

      // エラー表示用のスタイルを適用
      addErrorStyle();
    };
    return;
  }

  window.addEventListener("DOMContentLoaded", function() {

    var viewElement = document.getElementById("view");
    var sbrsPath;

    try {

      // パラメータから譜面のパス取得
      sbrsPath = location.search.match(/load=([^&]*)(&|$)/)[1];

      // 譜面読み込み
      SBRSViewer.sbrs = SBRScript.load(sbrsPath, true, {

        // 読み込み成功
        load: function() {

          try {

            // 譜面描画
            draw();

          } catch (e) {
            viewElement.innerHTML = "譜面の描画に失敗しました";
            console.error(e.stack);

            // エラー表示用のスタイルを適用
            addErrorStyle();
          }
        },
        // 読み込み失敗
        error: function() {
          viewElement.innerHTML = "読み込みに失敗しました(load:" + decodeURI(sbrsPath) + ")";

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
      viewElement.innerHTML = "パラメータエラー";
      console.error(e);

      // エラー表示用のスタイルを適用
      addErrorStyle();
    }
  });

  // ドラッグオーバー時の処理キャンセル
  window.addEventListener("dragover", function(e) {
    e.preventDefault();
  });

  // sbrsファイルのドロップによる読み込み
  window.addEventListener("drop", function(e) {

    var viewElement = document.getElementById("view");
    var file = e.dataTransfer.files[0];
    var fr = new FileReader();

    e.preventDefault();

    // 1MBまで許容
    if (file.size > 1024 * 1024) {
      throw new Error("ファイルサイズが大きすぎます");
    }

    fr.addEventListener("load", function(e) {
      try {

        // 譜面読み込み
        SBRSViewer.sbrs = SBRScript.parse(e.target.result);

        // 譜面描画
        draw();

      } catch (ex) {
        viewElement.innerHTML = "譜面の描画に失敗しました";
        console.error(ex.stack);

        // エラー表示用のスタイルを適用
        addErrorStyle();
      }
    });

    fr.readAsText(file);
  });

  /* function addEvent
   * イベントを登録します
   * 戻り値 : なし
   */
  function addEvent() {

    var elements;
    var i, iLen;

    // ステージタイプの変更イベントを登録
    elements = document.getElementsByName("stage-type");
    for (i = 0, iLen = elements.length; i < iLen; i++) {
      elements[i].addEventListener("change", changeStageType);
    }

    // オプションの変更イベントを登録
    elements = document.getElementsByName("option");
    for (i = 0, iLen = elements.length; i < iLen; i++) {
      elements[i].addEventListener("change", changeOption);
    }

    // フィーバーゲージがたまりやすくなるのスキル切り替えイベントを登録
    document.getElementById("option-skill-fever").addEventListener("change", function(e) {
      SBRSViewer.option.feverGaugeHigh = e.target.checked;
      draw();
    });

    // ボスの攻撃頻度を下げるのスキル切り替えイベントを登録
    document.getElementById("option-skill-bossattackfrequently").addEventListener("change", function(e) {
      SBRSViewer.option.bossAttackFrequently = e.target.checked;
      draw();
    });

    // ボスの攻撃時間が短くなるのスキル切り替えイベントを登録
    document.getElementById("option-skill-bossattackshort").addEventListener("change", function(e) {
      SBRSViewer.option.bossAttackShort = e.target.checked;
      draw();
    });

    // レーンの幅変更
    document.getElementById("display-lane-width").addEventListener("change", function(e) {
      SBRSViewer.option.laneWidth = parseInt(e.target.value);
      draw();
    });

    // 拍の高さ変更
    document.getElementById("display-beat-height").addEventListener("change", function(e) {
      SBRSViewer.option.beatHeight = parseInt(e.target.value);
      draw();
    });

    // 1列の拍数変更
    document.getElementById("display-col-beat").addEventListener("change", function(e) {
      SBRSViewer.option.colBeat = parseInt(e.target.value);
      draw();
    });

    // マーカーの大きさ変更
    document.getElementById("display-marker-size").addEventListener("change", function(e) {
      SBRSViewer.option.markerSize = parseInt(e.target.value);
      draw();
    });

    // フォントサイズ変更
    document.getElementById("display-font-size").addEventListener("change", function(e) {
      SBRSViewer.option.fontSize = parseInt(e.target.value);
      draw();
    });

    // オプションの保存
    document.getElementById("option-save").addEventListener("click", function(e) {
      var storage = new ScoreViewerOptionStorage(SBRSViewer.option);
      if (confirm("表示設定の内容を保存します。よろしいですか？")) {
        try {
          localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(storage));
          alert("保存しました");
        } catch (ex) {
          alert("保存に失敗しました");
        }
      }
    });

    // オプションのリセット
    document.getElementById("option-reset").addEventListener("click", function(e) {
      var storage = new ScoreViewerOptionStorage(SBRSViewer.option);
      if (confirm("表示設定の内容をリセットします。よろしいですか？")) {
        try {
          localStorage.removeItem(VIEWER_STORAGE_KEY);
          loadLocalStorageOption();
          draw();
          alert("リセットしました");
        } catch (ex) {
          alert("リセットに失敗しました");
        }
      }
    });
  }

  /* function loadLocalStorageOption
   * ローカルストレージに保存したオプションを読み込み、画面に反映します
   * 戻り値 : なし
   */
  function loadLocalStorageOption() {

    var item;
    var option;

    if ((item = localStorage.getItem(VIEWER_STORAGE_KEY))) {
      option = JSON.parse(item);
      SBRSViewer.option.beatHeight = option.beatHeight;
      SBRSViewer.option.laneWidth = option.laneWidth;
      SBRSViewer.option.colBeat = option.colBeat;
      SBRSViewer.option.markerSize = option.markerSize;
      SBRSViewer.option.fontSize = option.fontSize;
    } else {
      option = SBRSViewer.option;
      SBRSViewer.option.beatHeight = BEAT_HEIGHT_DEFAULT;
      SBRSViewer.option.laneWidth = LANE_WIDTH_DEFAULT;
      SBRSViewer.option.colBeat = COL_BEAT_DEFAULT;
      SBRSViewer.option.markerSize = MARKER_SIZE_DEFAULT;
      SBRSViewer.option.fontSize = FONT_SIZE_DEFAULT;
    }

    document.getElementById("display-lane-width").value = option.laneWidth;
    document.getElementById("display-beat-height").value = option.beatHeight;
    document.getElementById("display-col-beat").value = option.colBeat;
    document.getElementById("display-marker-size").value = option.markerSize;
    document.getElementById("display-font-size").value = option.fontSize;
  }

  /* function resetForm
   * フォームの選択状態をリセットします(更新してもフォームの選択がリセットされないブラウザ用)
   * 戻り値 : なし
   */
  function resetForm() {

    // ステージの種類をリセット
    document.getElementById("stage-type-score").checked = true;

    // スキルの使用有無をリセット
    document.getElementById("option-skill-fever").checked = false;
    document.getElementById("option-skill-bossattackfrequently").checked = false;
    document.getElementById("option-skill-bossattackshort").checked = false;

    // オプションの設定選択をリセット
    document.getElementById("option-skill").checked = true;
  }

  /* function addLoadStyle
   * 描画成功用のスタイルを適用します
   * 戻り値 : なし
   */
  function addLoadStyle() {
    document.getElementById("title").style.display = "block";
    document.getElementById("info").style.display = "block";
    document.getElementById("option").style.display = "inline-block";
    document.body.className = "fadein";
  }

  /* function addErrorStyle
   * エラー表示用のスタイルを適用します
   * 戻り値 : なし
   */
  function addErrorStyle() {
    document.getElementById("title").style.display = "none";
    document.getElementById("info").style.display = "none";
    document.getElementById("option").style.display = "none";
    document.body.className = "fadein";
  }

  /* function changeStageType
   * ステージの種類に応じて、画面に表示する項目を変更します
   * 戻り値 : なし
   */
  function changeStageType() {

    var stageType;
    var typeScoreElements, typeBossElements;
    var typeScoreStyle, typeBossStyle;
    var i, iLen;

    // 選択されているステージタイプを取得("score" : スコアアタック, "boss" : BOSSバトル)
    stageType = document.getElementById("stage-type-score").checked ? "score" : "boss";

    SBRSViewer.option.stageType = stageType;

    // displayプロパティに適用する値を指定
    switch (stageType) {
      case "score":
        typeScoreStyle = "block";
        typeBossStyle = "none";
        break;
      case "boss":
        typeScoreStyle = "none";
        typeBossStyle = "block";
        break;
      default:
        throw new Error();
    }

    // スコアアタック選択時にのみ表示する要素のdisplayプロパティに値を設定
    typeScoreElements = document.getElementsByClassName("type-score");
    for (i = 0, iLen = typeScoreElements.length; i < iLen; i++) {
      typeScoreElements[i].style.display = typeScoreStyle;
    }

    // BOSSバトル選択時にのみ表示する要素のdisplayプロパティに値を設定
    typeBossElements = document.getElementsByClassName("type-boss");
    for (i = 0, iLen = typeBossElements.length; i < iLen; i++) {
      typeBossElements[i].style.display = typeBossStyle;
    }
  }

  /* function changeOption
   * オプションで設定可能な項目を切り替えます
   * 戻り値 : なし
   */
  function changeOption() {

    var selectOption;
    var typeSkillElements, typeDisplayElements;
    var typeSkillStyle, typeDisplayStyle;
    var i, iLen;

    // 選択されているオプションを取得("skill" : スキル設定, "display" : 表示設定)
    selectOption = document.getElementById("option-skill").checked ? "skill" : "display";

    // displayプロパティに適用する値を指定
    switch (selectOption) {
      case "skill":
        typeSkillStyle = "block";
        typeDisplayStyle = "none";
        break;
      case "display":
        typeSkillStyle = "none";
        typeDisplayStyle = "block";
        break;
      default:
        throw new Error();
    }

    // スキル設定選択時にのみ表示する要素のdisplayプロパティに値を設定
    typeSkillElements = document.getElementsByClassName("option-skill");
    for (i = 0, iLen = typeSkillElements.length; i < iLen; i++) {
      typeSkillElements[i].style.display = typeSkillStyle;
    }

    // 表示設定選択時にのみ表示する要素のdisplayプロパティに値を設定
    typeDisplayElements = document.getElementsByClassName("option-display");
    for (i = 0, iLen = typeDisplayElements.length; i < iLen; i++) {
      typeDisplayElements[i].style.display = typeDisplayStyle;
    }
  }

  /* function draw
   * 解析した譜面データを元に、譜面を描画します
   * 戻り値 : なし
   */
  function draw() {

    var sbrs = SBRSViewer.sbrs;
    var viewElement;
    var colTable, colTr, colTd;
    var measureTable, measureTr, measureTh, measureTd;
    var measure, measureIndex, measureIndexLength;
    var measureBeat, measureS, measureB, measureHeight;
    var markerAriaDiv, lineAriaDiv;
    var markerIndex;
    var colDrawBeat;
    var laneCount;
    var markerHitInfo = [];
    var longMakrerInfo = [];
    var backgroundInfo = [];
    var i, iLen;

    viewElement = document.getElementById("view");
    laneCount = sbrs.laneCount;

    // viewを初期化
    viewElement.innerHTML = "";

    // 列データ格納用テーブル作成
    colTable = document.createElement("table");
    colTr = document.createElement("tr");
    colTable.appendChild(colTr);

    // 描画済みマーカーのindexを初期化
    markerIndex = 0;

    // マーカーの判定などを格納する配列の初期化
    initMarkerHitInfo(markerHitInfo);

    // フィーバーゲージ、ボス攻撃時間の情報をセット
    setBackgroundInfo(backgroundInfo, markerHitInfo);

    // 全小節の描画が終わるまでループ
    for (measureIndex = 0, measureIndexLength = sbrs.measureCount; measureIndex < measureIndexLength;) {

      // 列データ作成
      colTd = document.createElement("td");
      colTr.appendChild(colTd);

      // 小節データ格納用テーブル作成
      // テーブルのサイズは 各レーンの幅 * レーン数 + ヘッダの幅 + ボーダー
      measureTable = document.createElement("table");
      colTd.appendChild(measureTable);
      measureTable.className = "col";
      measureTable.style.width = (SBRSViewer.option.laneWidth * laneCount + 20 + 3 + (laneCount - 1)) + "px";

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
        measureTr.id = "measure-" + measure;

        // 小節のヘッダ作成
        measureTh = document.createElement("th");
        measureTr.appendChild(measureTh);
        measureTh.innerHTML = measure;

        // 小節のデータ作成
        measureHeight = measureBeat * SBRSViewer.option.beatHeight - 1;
        measureTd = document.createElement("td");
        measureTr.appendChild(measureTd);
        measureTd.style.height = measureHeight + "px";

        // レーンの区切り線、拍子線の描画エリア作成
        lineAriaDiv = document.createElement("div");
        lineAriaDiv.className = "line-aria";
        lineAriaDiv.style.height = measureHeight + "px";
        measureTd.appendChild(lineAriaDiv);

        // マーカーの描画エリア作成
        markerAriaDiv = document.createElement("div");
        markerAriaDiv.className = "marker-aria";
        markerAriaDiv.style.height = measureHeight + "px";
        measureTd.appendChild(markerAriaDiv);

        // フィーバ中、ボス攻撃中用のバックグラウンドを描画
        drawBackground(lineAriaDiv, measure, measureB, backgroundInfo, measureHeight);

        // レーンの区切り線、拍子線の描画
        drawLine(lineAriaDiv, measureS, measureB, laneCount);

        // ロングマーカーの中間線を描画
        drawLongLine(markerAriaDiv, measure, measureHeight, longMakrerInfo, colDrawBeat);

        // マーカーの描画
        markerIndex = drawMarker(markerAriaDiv, markerIndex, measure, measureHeight, longMakrerInfo);

        measureIndex++;

      } while ((colDrawBeat += measureBeat) < SBRSViewer.option.colBeat);

    }

    // 情報エリアを更新
    updateInfo();

    // viewに反映
    viewElement.appendChild(colTable);

    // 描画成功用のスタイルを適用
    addLoadStyle();
  }

  /* function initMarkerHitInfo
   * マーカーの判定などを格納する配列を初期化します
   * 引数1 : マーカーの判定などを格納する配列
   * 戻り値 : なし
   */
  function initMarkerHitInfo(markerHitInfo) {

    var sbrs = SBRSViewer.sbrs;
    var markerObj;
    var longMarkerObj;
    var i, iLen, j, jLen;
    var measure;

    for (i = 0, iLen = sbrs.markerCount; i < iLen; i++) {

      markerObj = sbrs.marker[i];
      measure = markerObj.measure;

      markerHitInfo.push({
        type: markerObj.type,
        time: markerObj.time,
        measure: measure,
        point: markerObj.point,
        judge: 0
      });

      if (markerObj.long) {
        for (j = 0, jLen = markerObj.long.length; j < jLen; j++) {

          longMarkerObj = sbrs.marker[i].long[j];
          measure = longMarkerObj.measure;

          markerHitInfo.push({
            type: longMarkerObj.type,
            time: longMarkerObj.time,
            measure: measure,
            point: longMarkerObj.point,
            judge: 0
          });
        }
      }
    }

    // 時間順でソート
    markerHitInfo.sort(function(a, b) {
      return a.time - b.time;
    });
  }

  /* function setBackgroundInfo
   * フィーバーゲージ、ボス攻撃時間の情報をセットします
   * 引数1 : フィーバーゲージ、ボス攻撃時間の情報を格納する配列
   * 引数2 : マーカーの判定などを格納する配列
   * 戻り値 : なし
   */
  function setBackgroundInfo(backgroundInfo, markerHitInfo) {

    var sbrs = SBRSViewer.sbrs;
    var addGaugeIncrement = 4 * (SBRSViewer.option.feverGaugeHigh ? FEVER_HIGH_MAGNIFICATION : 1);
    var markerHitLength = markerHitInfo.length;
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

      while (markerHitIndex < markerHitLength && markerHitInfo[markerHitIndex].measure === measureIndex + 1) {

        hitInfo = markerHitInfo[markerHitIndex];
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
    time = SBRSViewer.option.startOffset;
    playerAttackTime = SBRSViewer.option.bossAttackFrequently ? PLAYER_LONG_ATTACK_TIME : PLAYER_ATTACK_TIME;
    bossAttackTime = SBRSViewer.option.bossAttackShort ? BOSS_SHORT_ATTACK_TIME : BOSS_ATTACK_TIME;

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
      while (markerHitIndex < markerHitLength && markerHitInfo[markerHitIndex].time < fromTime) {
        playerComboCount++;
        markerHitIndex++;
      }

      // BOSSアタックマーカーのカウント
      while (markerHitIndex < markerHitLength && markerHitInfo[markerHitIndex].time < toTime) {
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

    SBRSViewer.info.fevercombo = feverComboCount;
    SBRSViewer.info.bossattack = bossAttackCount;
    SBRSViewer.info.playercombo = playerComboCount;
    SBRSViewer.info.bosscombo = bossComboCount;
  }

  /* function drawBackground
   * ラインエリアのdiv要素にフィーバー中、ボス攻撃中のバックグラウンドを追加します
   * 引数1 : ラインdiv要素
   * 引数2 : 現在の小節
   * 引数3 : 現在の小節の分母
   * 引数4 : フィーバーゲージ、ボス攻撃時間の情報を格納する配列
   * 引数5 : 描画エリアの高さ
   * 戻り値 : なし
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

      bgDiv = document.createElement("div");

      if (bgInfo.type === 1) {
        // フィーバー
        bgDiv.className = "fever-background type-score";
        bgDiv.style.display = SBRSViewer.option.stageType === "score" ? "block" : "none";
      } else if (bgInfo.type === 2) {
        // ボス攻撃
        bgDiv.className = "boss-background type-boss";
        bgDiv.style.display = SBRSViewer.option.stageType === "boss" ? "block" : "none";
      }

      if (measure === bgInfo.from.measure && measure === bgInfo.to.measure) {
        // 開始小節と終了小節が同じ
        top = (bgInfo.to.point * SBRSViewer.option.beatHeight * 4 / measureB);
        bottom = (bgInfo.from.point * SBRSViewer.option.beatHeight * 4 / measureB);
        bgDiv.style.height = (top - bottom) + "px";
        bgDiv.style.bottom = bottom + "px";
      } else if (measure === bgInfo.from.measure) {
        // 開始小節
        bottom = (bgInfo.from.point * SBRSViewer.option.beatHeight * 4 / measureB);
        bgDiv.style.height = (measureHeight - bottom) + "px";
        bgDiv.style.bottom = bottom + "px";
      } else if (measure === bgInfo.to.measure) {
        // 終了小節
        bottom = 0;
        bgDiv.style.height = (bgInfo.to.point * 4 / measureB) * SBRSViewer.option.beatHeight + "px";
        bgDiv.style.bottom = bottom + "px";
      } else if (measure > bgInfo.from.measure && measure < bgInfo.to.measure) {
        // 中間
        bottom = 0;
        bgDiv.style.height = (measureHeight - bottom) + "px";
        bgDiv.style.bottom = bottom + "px";
      }

      lineAriaDiv.appendChild(bgDiv);
    }
  }

  /* function drawMarker
   * マーカーエリアのdiv要素にマーカーを追加します
   * 引数1 : マーカーdiv要素
   * 引数2 : 描画済みマーカーのindex
   * 引数3 : 現在の小節
   * 引数4 : 描画エリアの高さ
   * 引数5 : ロングマーカーの描画情報
   * 戻り値 : 次に処理するマーカーのインデックス
   */
  function drawMarker(markerAriaDiv, markerIndex, measure, measureHeight, longMakrerInfo) {

    var sbrs = SBRSViewer.sbrs;
    var len;
    var marker;
    var markerDiv;
    var markerValueDiv;
    var measureObj;
    var measureB;

    if (measure <= sbrs.measureCount) {

      measureObj = sbrs.measure[measure - 1];
      measureB = measureObj.valueB;

      for (len = sbrs.markerCount; markerIndex < len && sbrs.marker[markerIndex].measure === measure; markerIndex++) {
        marker = sbrs.marker[markerIndex];

        markerDiv = document.createElement("div");
        markerDiv.style.height = (SBRSViewer.option.markerSize - 2) + "px";
        markerDiv.style.width = (SBRSViewer.option.markerSize - 2) + "px";
        markerDiv.style.borderRadius = (SBRSViewer.option.markerSize / 2) + "px";
        markerDiv.style.left = ((marker.lane - 1) * (SBRSViewer.option.laneWidth + 1) + ((SBRSViewer.option.laneWidth - SBRSViewer.option.markerSize) / 2)) + "px";
        markerDiv.style.bottom = (marker.point * SBRSViewer.option.beatHeight * 4 / measureB - (SBRSViewer.option.markerSize - 1) / 2 - 1) + "px";
        markerDiv.style.lineHeight = (SBRSViewer.option.markerSize - 2) + "px";

        switch (marker.type) {
          case 1:
            // 通常マーカー
            markerDiv.className = "normal-marker";
            markerDiv.style.zIndex = 200 + len - markerIndex;
            break;
          case 2:
            // ロング開始
            markerDiv.className = "long-marker";
            markerDiv.style.zIndex = 300 + len - markerIndex;

            markerValueDiv = document.createElement("div");
            markerValueDiv.className = "value";
            markerDiv.appendChild(markerValueDiv);
            markerValueDiv.innerHTML = 2 + marker.long.length;
            markerValueDiv.style.webkitTransform = "scale(" + (SBRSViewer.option.fontSize / 10) + ")";
            markerValueDiv.style.transform = "scale(" + (SBRSViewer.option.fontSize / 10) + ")";
            markerValueDiv.style.left = (-20 + 0.5 + (SBRSViewer.option.markerSize - 2) / 2) + "px";

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
            markerDiv.className = "long-marker";
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

  /* function drawLongLine
   * マーカーエリアのdiv要素にロングマーカーの中間線を追加します
   * 引数1 : マーカーdiv要素
   * 引数2 : 現在の小節
   * 引数3 : 描画エリアの高さ
   * 引数4 : ロングマーカーの描画情報
   * 引数5 : 1列の描画済み拍数
   * 戻り値 : なし
   */
  function drawLongLine(markerAriaDiv, measure, measureHeight, longMarkerInfo, colDrawBeat) {

    var sbrs = SBRSViewer.sbrs;
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

          fromY = longMarkerInfo[i].start.point * 4 / measureB * SBRSViewer.option.beatHeight;
          if (measure < longMarkerInfo[i].end.measure) {
            toY = measureHeight;
          } else {
            toY = longMarkerInfo[i].end.point * 4 / measureB * SBRSViewer.option.beatHeight;
          }

          markerDiv = document.createElement("div");
          markerDiv.className = "long-line";
          markerDiv.style.height = Math.ceil(toY - fromY + 1) + "px";
          markerDiv.style.width = longMarkerInfo[i].style.width;
          markerDiv.style.left = longMarkerInfo[i].style.left;

          if (colDrawBeat === 0) {
            // 列の1小節目はbottomの位置を1px高めに
            markerDiv.style.bottom = Math.floor(fromY - 0) + "px";
          } else {
            markerDiv.style.bottom = Math.floor(fromY - 1) + "px";
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

  /* function drawLine
   * ラインエリアのdiv要素に拍子線、レーンの区切り線を追加します
   * 引数1 : ラインdiv要素
   * 引数2 : 拍子の分子
   * 引数3 : 拍子の分母
   * 引数4 : レーン数
   * 引数5 : 描画エリアの高さ
   * 戻り値 : なし
   */
  function drawLine(lineAriaDiv, measureS, measureB, laneCount, divHeight) {

    var beatHeight = SBRSViewer.option.beatHeight * 4 / measureB;
    var lineDiv;
    var i, iLen;

    // 拍子の線
    for (i = 1, iLen = measureS; i < iLen; i++) {
      lineDiv = document.createElement("div");
      lineDiv.className = "beat-line";
      lineDiv.style.bottom = (beatHeight * i - 1) + "px";
      lineAriaDiv.appendChild(lineDiv);
    }

    // 拍子の線2
    for (i = 0, iLen = measureS; i < iLen; i++) {
      lineDiv = document.createElement("div");
      lineDiv.className = "beat-subline";
      lineDiv.style.bottom = (beatHeight * (i + 0.5) - 1) + "px";
      lineAriaDiv.appendChild(lineDiv);
    }

    // レーンの線
    for (i = 1, iLen = laneCount; i < iLen; i++) {
      lineDiv = document.createElement("div");
      lineDiv.className = "lane-line";
      lineDiv.style.left = ((SBRSViewer.option.laneWidth + 1) * i + -1) + "px";
      lineAriaDiv.appendChild(lineDiv);
    }
  }

  /* function updateInfo
   * sbrsから情報エリアに必要な値を取得、画面に反映します
   * 戻り値 : なし
   */
  function updateInfo() {

    var sbrs = SBRSViewer.sbrs;
    var bpmMagnification = sbrs.bpmHalfMode ? 0.5 : 1;

    // タイトル取得
    SBRSViewer.title = SBRSViewer.sbrs.title + " ★" + SBRSViewer.sbrs.level;

    // BPM取得
    if (sbrs.bpmCount === 1) {
      SBRSViewer.info.bpm = (sbrs.maxBpm * bpmMagnification);
    } else {
      SBRSViewer.info.bpm = (sbrs.minBpm * bpmMagnification) + " - " + (sbrs.maxBpm * bpmMagnification);
    }

    // コンボ数取得
    SBRSViewer.info.combo = sbrs.comboCount;

    // マーカー数取得
    SBRSViewer.info.marker = sbrs.normalMarkerCount + sbrs.longMarkerCount;

    // ゲージの長さ取得
    SBRSViewer.info.fevergauge = sbrs.feverGaugeLength;

    // 演奏時間取得
    SBRSViewer.info.time = Math.round(sbrs.endTime / 1000);

    document.title = SBRSViewer.title + " | Sb69 Score Viewer";
    document.querySelector("#title .value").innerHTML = SBRSViewer.title;
    document.querySelector("#info-bpm .value").innerHTML = SBRSViewer.info.bpm;
    document.querySelector("#info-combo .value").innerHTML = SBRSViewer.info.combo;
    document.querySelector("#info-marker .value").innerHTML = SBRSViewer.info.marker;
    document.querySelector("#info-fevercombo .value").innerHTML = SBRSViewer.info.fevercombo;
    document.querySelector("#info-fevergauge .value").innerHTML = SBRSViewer.info.fevergauge;
    document.querySelector("#info-bossattack .value").innerHTML = SBRSViewer.info.bossattack;
    document.querySelector("#info-playercombo .value").innerHTML = SBRSViewer.info.playercombo;
    document.querySelector("#info-bosscombo .value").innerHTML = SBRSViewer.info.bosscombo;
    document.querySelector("#info-time .value").innerHTML = SBRSViewer.info.time;
  }

  return SBRSViewer;

}());