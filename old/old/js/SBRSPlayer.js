function SBRPlayer(t,s,i){if(!(this instanceof SBRPlayer))return new SBRPlayer(t,s,i);var e=this;if(this.CANVAS_WIDTH=764,this.CANVAS_HEIGHT=1136,this.errorFlag=!1,!window.requestAnimationFrame||!document.createElement("canvas").getContext)throw this.errorFlag=!0,new Error("このブラウザは未対応です。");s=s?s:this.CANVAS_WIDTH,s=1e4>s?s:1e4,s=s>0?s:0,i=i?i:s*this.CANVAS_HEIGHT/this.CANVAS_WIDTH,i=1e4>i?i:1e4,i=i>0?i:0,this.DRIFT_WIDTH=304,this.DRIFT_HEIGHT=288,this.DRIFT_INTERVAL=114,this.JUDGE_WIDTH=468,this.JUDGE_HEIGHT=872,this.JUDGE_INTERVAL=230,this.STATUS_INIT=0,this.STATUS_WAIT=1,this.STATUS_PLAY=2,this.STATUS_END=3,this.KEY_A=65,this.KEY_D=68,this.KEY_F=70,this.KEY_J=74,this.KEY_K=75,this.KEY_L=76,this.KEY_Q=81,this.KEY_S=83,this.KEY_SPACE=32,this.KEY_PGUP=33,this.KEY_PGDOWN=34,this.KEY_HOME=36,this.KEY_END=35,this.KEY_1=49,this.KEY_2=50,this.SE_PEFECT=0,this.SE_GOOD=1,this.SE_LONG=2,this.JUDGE_PERFECT=75,this.JUDGE_GOOD=130,this.JUDGE_BAD=150,this.JUDGE_MISS=9,this.JUDGE_LONG_PERFECT=90,this.JUDGE_LONG_END=99,this.id=Math.floor(1e16*Math.random()),this.sbrsUrl=t,this.width=s,this.height=i,window.performance&&window.performance.now?SBRPlayer.prototype.getTime=function(){return performance.now()}:SBRPlayer.prototype.getTime=function(){return new Date},document.write('<canvas id="SBRPlayer-'+this.id+'" width="'+this.width+'" height="'+this.height+'"></canvas>'),this.canvas=document.getElementById("SBRPlayer-"+this.id),this.canvasContext=this.canvas.getContext("2d"),this.key=new Array(256),this.touch=new Object;var a=this.canvas.getBoundingClientRect();this.offsetX=a.left-this.canvas.width/2,this.offsetY=a.top,window.onkeydown=this.keyDown.bind(this),window.onkeyup=this.keyUp.bind(this),"undefined"!=typeof document.ontouchstart&&(this.canvas.ontouchstart=this.touchstart.bind(this),this.canvas.ontouchmove=this.touchmove.bind(this),this.canvas.ontouchend=this.touchend.bind(this),this.canvas.ontouchcancel=this.touchend.bind(this)),this.img=new function(){this.circle=new Image,this.circle.src=e.current+"/img/circle.png",this.lane=new Image,this.lane.src=e.current+"/img/lane.png",this.stage=new Image,this.stage.src=e.current+"/img/stage.png",this.marker=new Image,this.marker.src=e.current+"/img/marker.png",this.longMarker=new Image,this.longMarker.src=e.current+"/img/long_marker.png",this.longMarkerLane=new Array(3),this.longMarkerLane[0]=new Image,this.longMarkerLane[0].src=e.current+"/img/long_marker_lane1.png",this.longMarkerLane[1]=new Image,this.longMarkerLane[1].src=e.current+"/img/long_marker_lane2.png",this.longMarkerLane[2]=new Image,this.longMarkerLane[2].src=e.current+"/img/long_marker_lane3.png"},this.timeout=[],this.timeoutCount=0,this.initCount=0,this.init(),this.draw()}SBRPlayer.prototype.current=function(){var t;if(document.currentScript)t=document.currentScript;else{var s=s=document.getElementsByTagName("script");t=s[s.length-1]}return t.src.match(/(.+)\/[^\/]+/)[1]+"/.."}(),SBRPlayer.prototype.init=function(){var t=this;this.status=this.STATUS_INIT,this.loadSbrsFlag=!1,this.bgm&&this.bgm.pause(),this.se&&this.se[this.SE_LONG]&&this.se[this.SE_LONG].pause();for(var s=0;s<this.timeoutCount;s++)clearTimeout(this.timeout[s]);this.timeout=[],this.timeoutCount=0;for(var s=0;256>s;s++)this.key[s]=!1;if(this.startTime=-1e9,0===this.initCount&&(this.option=new Object,this.option.scroll=1,this.option.startMeasure=0),this.option.autoPlay=!1,this.option.scroll=1.7,this.initCount++,this.sbrsUrl.match(/\.sbrs/i)){var i=new XMLHttpRequest;i.open("GET",this.sbrsUrl,!0),i.setRequestHeader("Cache-Control","no-cache"),i.onload=function(){4===i.readyState&&(200===i.status?t.onSbrsLoad(i.responseText):console.error("譜面読み込み失敗(status : "+i.status+")"))},i.send()}else t.onSbrsLoad(this.sbrsUrl)},SBRPlayer.prototype.onSbrsLoad=function(t){var s=this;try{s.sbrs=SBRS.parse(t)}catch(i){return console.error(i.message),void console.error("譜面解析失敗")}if(s.loadSbrsFlag=!0,s.startTime=s.sbrs.offset<-2e3?s.sbrs.offset:-2e3,s.initPlayData(),s.option.startMeasure=Math.min(s.option.startMeasure,s.sbrs.measureCount),1===s.initCount){s.se=[null,null,null];try{s.se[s.SE_PEFECT]=WebAudio.Sound(s.current+"/se/perfect.wav"),s.se[s.SE_GOOD]=WebAudio.Sound(s.current+"/se/good.wav"),s.se[s.SE_LONG]=WebAudio.Sound(s.current+"/se/long.wav"),s.se[s.SE_LONG].loop=!0}catch(i){console.error(i.message),console.error("効果音読み込み失敗")}try{var e="";e=s.sbrsUrl.match(/\.sbrs/i)&&-1!==s.sbrsUrl.indexOf("/")?s.sbrsUrl.substring(0,s.sbrsUrl.lastIndexOf("/"))+"/"+s.sbrs.sound:document.URL.substring(0,document.URL.lastIndexOf("/"))+"/"+s.sbrs.sound,s.bgm=WebAudio.Sound(e),s.bgm.onload=function(){s.status=s.STATUS_WAIT},s.bgm.error=function(){s.status=s.STATUS_WAIT}}catch(i){console.error(i.message),console.error("音声読み込み失敗"),s.timeout[s.timeoutCount++]=setTimeout(function(){s.status=s.STATUS_WAIT},0)}}else s.status=s.STATUS_WAIT},SBRPlayer.prototype.initPlayData=function(){this.playData=new Object,this.playData.markerDrawFrom=0,this.playData.lastSePlay=[this.getTime()-1e3,this.getTime()-1e3,this.getTime()-1e3],this.playData.marker=new Array(this.sbrs.markerCount);for(var t=0;t<this.sbrs.markerCount;t++)this.playData.marker[t]=new Object,this.playData.marker[t].show=!0;this.playData["long"]=[];for(var t=0;3>t;t++)this.playData["long"][t]=new Object,this.playData["long"][t].inputFlag=!1,this.playData["long"][t].index=-1;this.playData.markerSpeed=this.sbrs.bpm[0].value/260,this.playData.judgeCount=[0,0,0,0],this.playData.combo=0},SBRPlayer.prototype.draw=function(){this.drawMain(),requestAnimationFrame(this.draw.bind(this))},SBRPlayer.prototype.drawMain=function(){var t,s,i,e,a,h=this.canvasContext,r=this.playData,o=null,n=this.loadSbrsFlag?this.sbrs.markerCount-1:-1,l=[],c=!0,u=null,g=0,T=0,y=0,p=0,E=0,m=0,D=0,_=0;switch(h.save(),h.scale(this.width/this.CANVAS_WIDTH,this.height/this.CANVAS_HEIGHT),h.clearRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),this.status){case this.STATUS_INIT:h.fillStyle="rgb(74, 171, 190)",h.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),h.font="bold 22px 'メイリオ'",h.fillStyle="rgb(0, 0, 0)",h.fillText("譜面 : ",10,30),h.fillText(this.loadSbrsFlag?"読み込み完了":"読み込み中",100,30),h.fillText("音声 : ",10,60),h.fillText(this.bgm&&this.bgm.loadFlag?"読み込み完了":"読み込み中",100,60);break;case this.STATUS_WAIT:case this.STATUS_PLAY:case this.STATUS_END:y=this.status===this.STATUS_WAIT?0===this.option.startMeasure?this.startTime:this.sbrs.measure[this.option.startMeasure-1].time:this.getTime()-this.startTime;var S=h.createLinearGradient(0,0,0,this.CANVAS_HEIGHT);S.addColorStop(0,"#1e668c"),S.addColorStop(1,"#1f2629"),h.fillStyle=S,h.fillRect(0,0,this.CANVAS_WIDTH,this.CANVAS_HEIGHT),h.drawImage(this.img.lane,0,0),h.drawImage(this.img.stage,0,0),h.fillStyle="rgb(255, 255, 255)";for(var d=0;d<this.sbrs.measureCount;d++)if(u=this.sbrs.measure[d],g=u.time-y,T=g*this.playData.markerSpeed*this.option.scroll*this.sbrs.scroll,E=this.calcLaneY(T),m=this.DRIFT_WIDTH+2*(this.JUDGE_WIDTH-this.DRIFT_WIDTH)*((E-this.DRIFT_HEIGHT)/(this.JUDGE_HEIGHT-this.DRIFT_HEIGHT)),p=(this.CANVAS_WIDTH-m)/2,!(E>this.JUDGE_HEIGHT)){if(E<this.DRIFT_HEIGHT-1||this.JUDGE_HEIGHT-T<0)break;h.fillRect(p,E-1,m,3)}h.drawImage(this.img.circle,0,this.JUDGE_HEIGHT-this.img.circle.height/2);for(var d=r.markerDrawFrom;n>=d;d++){if(o=this.sbrs.marker[d],g=o.time-y,T=g*this.playData.markerSpeed*this.option.scroll*this.sbrs.scroll,2===o.type?(l[d]=this.calcMarkerPoint(T,o,1),l[d]["long"]=this.calcMarkerPoint((o["long"].time-y)*this.playData.markerSpeed*this.option.scroll*this.sbrs.scroll,o,2)):l[d]=this.calcMarkerPoint(T,o,0),l[d].y<this.DRIFT_HEIGHT-l[d].dh||this.JUDGE_HEIGHT-T<0){n=d-1;break}c&&l[d].y>1136+l[d].dh&&0>T&&(2!=l[d].type||l[d]["long"].y>1136+l[d]["long"].dh)?r.markerDrawFrom=d+1:c=!1}for(var d=n;d>=r.markerDrawFrom;d--)if(this.playData.marker[d].show!==!1)switch(l[d].type){case 2:p=l[d].x-this.img.longMarker.width/2*l[d].size,E=l[d].y-this.img.longMarker.height/2*l[d].size,D=l[d]["long"].x-this.img.longMarker.width/2*l[d]["long"].size,_=l[d]["long"].y-this.img.longMarker.height/2*l[d]["long"].size,a=l[d].y,t=0,s=l[d]["long"].y,i=this.img.longMarkerLane[l[d].lane-1].width,e=s+(l[d].y-l[d]["long"].y)>=this.CANVAS_HEIGHT?this.CANVAS_HEIGHT-l[d]["long"].y:l[d].y-l[d]["long"].y,e>0&&h.drawImage(this.img.longMarkerLane[l[d].lane-1],t,s,i,e,t,s,i,e),h.drawImage(this.img.longMarker,D,_,l[d]["long"].dw,l[d]["long"].dh)}for(var d=n;d>=r.markerDrawFrom;d--)if(this.playData.marker[d].show!==!1)switch(l[d].type){case 1:p=l[d].x-this.img.marker.width/2*l[d].size,E=l[d].y-this.img.marker.height/2*l[d].size,h.drawImage(this.img.marker,p,E,l[d].dw,l[d].dh);break;case 2:p=l[d].x-this.img.longMarker.width/2*l[d].size,E=l[d].y-this.img.longMarker.height/2*l[d].size,h.drawImage(this.img.longMarker,p,E,l[d].dw,l[d].dh)}h.font="bold 22px 'メイリオ'",h.fillStyle="rgb(255,255,255)",h.fillText("combo",10,1006),h.fillText("perfect",10,1036),h.fillText("good",10,1066),h.fillText("bad",10,1096),h.fillText("miss",10,1126),h.fillText(":",100,1006),h.fillText(":",100,1036),h.fillText(":",100,1066),h.fillText(":",100,1096),h.fillText(":",100,1126),h.fillText(r.combo,120,1006),h.fillText(r.judgeCount[0],120,1036),h.fillText(r.judgeCount[1],120,1066),h.fillText(r.judgeCount[2],120,1096),h.fillText(r.judgeCount[3],120,1126),h.fillStyle="rgb(0, 0, 0)",h.fillText(this.sbrs.title+" ★"+this.sbrs.level,10,30),""!==this.sbrs.artist&&h.fillText("Artist : "+this.sbrs.artist,10,60),this.status===this.STATUS_WAIT&&(h.fillText("Scroll : "+SBRS.roundTime(this.option.scroll),10,120),0!==this.option.startMeasure&&h.fillText("Measure : "+this.option.startMeasure+" / "+this.sbrs.measureCount,10,60))}h.restore()},SBRPlayer.prototype.calcMarkerPoint=function(t,s,i){var e=new Object;switch(e.y=this.calcLaneY(t),i){case 1:this.playData["long"][s.lane-1].inputFlag===!0&&e.y>this.JUDGE_HEIGHT&&(e.y=this.JUDGE_HEIGHT);break;case 2:this.playData["long"][s.lane-1].inputFlag===!0&&e.y>this.JUDGE_HEIGHT&&0>t?e.y=this.JUDGE_HEIGHT:(e.y<this.DRIFT_HEIGHT||this.JUDGE_HEIGHT-t<0)&&(e.y=this.DRIFT_HEIGHT)}markerSize=.4+(e.y-this.DRIFT_HEIGHT)/(this.JUDGE_HEIGHT-this.DRIFT_HEIGHT)*.5;var a=this.CANVAS_WIDTH/2;switch(s.lane){case 1:e.x=a-this.DRIFT_INTERVAL,e.x-=(e.y-this.DRIFT_HEIGHT)/(this.JUDGE_HEIGHT-this.DRIFT_HEIGHT)*(this.JUDGE_INTERVAL-this.DRIFT_INTERVAL);break;case 2:e.x=a;break;case 3:e.x=a+this.DRIFT_INTERVAL,e.x+=(e.y-this.DRIFT_HEIGHT)/(this.JUDGE_HEIGHT-this.DRIFT_HEIGHT)*(this.JUDGE_INTERVAL-this.DRIFT_INTERVAL)}return e.dw=this.img.marker.width*markerSize,e.dh=this.img.marker.width*markerSize,e.type=s.type,e.lane=s.lane,e.size=markerSize,e},SBRPlayer.prototype.calcLaneY=function(t){return this.JUDGE_HEIGHT-t+t*t/2900},SBRPlayer.prototype.keyDown=function(t){var s=t.keyCode;if(!this.key[s])switch(this.key[s]=!0,this.status){case this.STATUS_INIT:break;case this.STATUS_WAIT:if(s===this.KEY_PGUP&&this.option.startMeasure<this.sbrs.measureCount?(this.option.startMeasure++,this.playData.markerDrawFrom=0):s===this.KEY_PGDOWN&&this.option.startMeasure>0?(this.option.startMeasure--,this.playData.markerDrawFrom=0):s===this.KEY_HOME?(this.option.startMeasure=0,this.playData.markerDrawFrom=0):s===this.KEY_END&&(this.option.startMeasure=this.sbrs.measureCount,this.playData.markerDrawFrom=0),s===this.KEY_1&&this.option.scroll>.11?this.option.scroll-=.1:s===this.KEY_2&&this.option.scroll<4.99&&(this.option.scroll+=.1),s===this.KEY_Q&&this.init(),s===this.KEY_SPACE){if(0!==this.option.startMeasure&&(this.startTime=this.sbrs.measure[this.option.startMeasure-1].time),this.key[this.KEY_A]){this.option.autoPlay=!0,this.playData.lastSePlay[this.SE_PEFECT]=this.getTime(),this.playData.lastSePlay[this.SE_GOOD]=this.getTime(),this.playData.lastSePlay[this.SE_LONG]=this.getTime();for(var i=0;i<this.sbrs.markerCount;i++)switch(this.sbrs.marker[i].type){case 1:h=this.sbrs.marker[i].time-this.startTime,0>=h?this.judge(i,this.JUDGE_PERFECT):this.timeout[this.timeoutCount++]=setTimeout(this.judge.bind(this),h,i,this.JUDGE_PERFECT);break;case 2:h=this.sbrs.marker[i].time-this.startTime,0>=h?this.judge(i,this.JUDGE_PERFECT):this.timeout[this.timeoutCount++]=setTimeout(this.judge.bind(this),h,i,this.JUDGE_PERFECT),h=this.sbrs.marker[i]["long"].time-this.startTime,0>=h?this.judge(i,this.JUDGE_LONG_END):this.timeout[this.timeoutCount++]=setTimeout(this.judge.bind(this),h,i,this.JUDGE_LONG_END)}}for(var e=1,a=0;;)if(a=++e*this.playData.markerSpeed/this.sbrs.judgeRange,a+a*a/2900>this.JUDGE_GOOD)break;for(var h=0,i=0;i<this.sbrs.markerCount;i++){switch(this.sbrs.marker[i].type){case 1:h=this.sbrs.marker[i].time-this.startTime+e;break;case 2:for(var r=0;r<this.sbrs.marker[i]["long"].longCount;r++)h=this.sbrs.marker[i]["long"].marker[r].time-this.startTime,h>0?this.timeout[this.timeoutCount++]=setTimeout(this.longJudge.bind(this),h,i):this.option.autoPlay&&this.longJudge(i);h=this.sbrs.marker[i]["long"].time-this.startTime+e}0>h-e?(this.missJudge(i),this.playData.marker[i].show=!1):this.timeout[this.timeoutCount++]=setTimeout(this.missJudge.bind(this),h,i)}if(this.bgm){this.bgm.setVolume(this.sbrs.soundVolume);var o=(this.sbrs.offset-this.startTime)/1e3;0>o?this.bgm.play(0,-o):this.bgm.play(o)}this.startTime=this.getTime()-this.startTime,this.status=this.STATUS_PLAY}break;case this.STATUS_PLAY:var n=this.getTime()-this.startTime;if(s===this.KEY_Q){this.init();break}if(this.option.autoPlay)break;s===this.KEY_D?this.judgeCheck(n,1):s===this.KEY_F||s===this.KEY_J?this.judgeCheck(n,2):s===this.KEY_K&&this.judgeCheck(n,3);break;case this.STATUS_END:break;default:return void console.error("status error")}},SBRPlayer.prototype.judgeCheck=function(t,s){for(var i=this.playData,e=this.sbrs.markerCount-1,a=new Array,h=!0,r=0,o=null,n=i.markerDrawFrom;e>=n;n++){if(o=this.sbrs.marker[n],time=o.time-t,speed=time*this.playData.markerSpeed/this.sbrs.judgeRange,a[n]=this.calcMarkerPoint(speed,o,0),2==o.type&&(a[n]["long"]=this.calcMarkerPoint((o["long"].time-t)*this.playData.markerSpeed,o,2)),a[n].y<this.DRIFT_HEIGHT-a[n].dh||this.JUDGE_HEIGHT-speed<0){e=n-1;break}h&&a[n].y>1136+a[n].dh&&speed<0&&(2!=a[n].type||a[n]["long"].y>1136+a[n]["long"].dh)?i.markerDrawFrom=n+1:h=!1}for(var n=i.markerDrawFrom;e>=n;n++)if(o=this.sbrs.marker[n],this.playData.marker[n].show!==!1&&o.lane===s){if(r=Math.abs(this.JUDGE_HEIGHT-a[n].y),2===o.type&&this.JUDGE_HEIGHT-a[n].y<0&&this.JUDGE_HEIGHT-a[n]["long"].y>-this.JUDGE_GOOD){this.judge(n,this.JUDGE_PERFECT);break}if(r<this.JUDGE_PERFECT){this.judge(n,this.JUDGE_PERFECT);break}if(r<this.JUDGE_GOOD){this.judge(n,this.JUDGE_GOOD);break}if(r<this.JUDGE_BAD&&r>0){this.judge(n,this.JUDGE_BAD);break}}},SBRPlayer.prototype.judge=function(t,s){var i=this.getTime(),e=this.sbrs.marker[t].type,a=this.sbrs.marker[t].lane;switch(s){case this.JUDGE_PERFECT:switch(this.playData.judgeCount[0]++,this.playData.combo++,e){case 1:i-this.playData.lastSePlay[this.SE_PEFECT]>=20&&(this.se[this.SE_PEFECT]&&this.se[this.SE_PEFECT].play(),this.playData.lastSePlay[this.SE_PEFECT]=i),this.playData.marker[t].show=!1;break;case 2:this.playData["long"][0].inputFlag===!1&&this.playData["long"][1].inputFlag===!1&&this.playData["long"][2].inputFlag===!1&&i-this.playData.lastSePlay[this.SE_LONG]>=20&&this.se[this.SE_LONG]&&this.se[this.SE_LONG].play(),i-this.playData.lastSePlay[this.SE_PEFECT]>=20&&(this.se[this.SE_PEFECT]&&this.se[this.SE_PEFECT].play(),this.playData.lastSePlay[this.SE_PEFECT]=i),this.playData["long"][a-1].inputFlag=!0,this.playData["long"][a-1].index=t}break;case this.JUDGE_GOOD:switch(this.playData.judgeCount[1]++,this.playData.combo++,e){case 1:i-this.playData.lastSePlay[this.SE_GOOD]>=20&&(this.se[this.SE_GOOD]&&this.se[this.SE_GOOD].play(),this.playData.lastSePlay[this.SE_GOOD]=i),this.playData.marker[t].show=!1;break;case 2:this.playData["long"][0].inputFlag===!1&&this.playData["long"][1].inputFlag===!1&&this.playData["long"][2].inputFlag===!1&&i-this.playData.lastSePlay[this.SE_LONG]>=20&&this.se[this.SE_LONG]&&this.se[this.SE_LONG].play(),i-this.playData.lastSePlay[this.SE_GOOD]>=20&&(this.se[this.SE_GOOD]&&this.se[this.SE_GOOD].play(),this.playData.lastSePlay[this.SE_GOOD]=i),this.playData["long"][a-1].inputFlag=!0,this.playData["long"][a-1].index=t}break;case this.JUDGE_BAD:this.playData.judgeCount[2]++,this.playData.combo=0,this.playData.marker[t].show=!1;break;case this.JUDGE_MISS:this.playData.judgeCount[3]++,this.playData.combo=0,this.playData["long"][a-1].inputFlag===!0&&t===this.playData["long"][a-1].index&&(this.playData["long"][a-1].inputFlag=!1,this.playData.marker[t].show=!1,this.stopLongSe());break;case this.JUDGE_LONG_PERFECT:this.playData.judgeCount[0]++,this.playData.combo++;break;case this.JUDGE_LONG_END:this.playData.judgeCount[0]++,this.playData.combo++,this.playData["long"][a-1].inputFlag=!1,this.stopLongSe(),this.playData.marker[t].show=!1}},SBRPlayer.prototype.missJudge=function(t){this.option.autoPlay||this.playData.marker[t].show!==!0||this.judge(t,this.JUDGE_MISS)},SBRPlayer.prototype.longJudge=function(t){var s=this.sbrs.marker[t].lane-1;(this.option.autoPlay||this.playData["long"][s].inputFlag===!0&&this.playData["long"][s].index===t)&&this.judge(t,this.JUDGE_LONG_PERFECT)},SBRPlayer.prototype.stopLongSe=function(t){for(var s=0;3>s;s++)if(this.playData["long"][s].inputFlag!==!1)return;this.se[this.SE_LONG]&&this.se[this.SE_LONG].pause(.1)},SBRPlayer.prototype.keyUp=function(t){var s=t.keyCode;switch(this.key[s]=!1,this.status){case this.STATUS_INIT:break;case this.STATUS_WAIT:break;case this.STATUS_PLAY:if(this.option.autoPlay)break;s===this.KEY_D&&this.playData["long"][0].inputFlag===!0?this.judge(this.playData["long"][0].index,this.JUDGE_LONG_END):s!==this.KEY_F&&s!==this.KEY_J||this.playData["long"][1].inputFlag!==!0?s===this.KEY_K&&this.playData["long"][2].inputFlag===!0&&this.judge(this.playData["long"][2].index,this.JUDGE_LONG_END):this.judge(this.playData["long"][1].index,this.JUDGE_LONG_END);break;case this.STATUS_END:break;default:return void console.error("status error")}},SBRPlayer.prototype.touchstart=function(t){t.preventDefault();var s=t.target.width,i=t.target.height;switch(this.status){case this.STATUS_INIT:break;case this.STATUS_WAIT:t.pageY<i/5&&(this.key[this.KEY_A]=!0),this.keyDown({keyCode:this.KEY_SPACE}),this.key[this.KEY_A]=!1,this.key[this.KEY_SPACE]=!1;break;case this.STATUS_PLAY:for(var e=0;e<t.changedTouches.length;e++){var a=t.changedTouches[e].pageX-this.offsetX,h=t.changedTouches[e].pageY,r=t.changedTouches[e].identifier;switch(this.getTouchLane(a,s)){case 1:this.key[this.KEY_D]===!1&&(this.keyDown({keyCode:this.KEY_D}),this.touch["t"+r]=[a,h]);break;case 2:this.key[this.KEY_F]===!1&&(this.keyDown({keyCode:this.KEY_F}),this.touch["t"+r]=[a,h]);break;case 3:this.key[this.KEY_K]===!1&&(this.keyDown({keyCode:this.KEY_K}),this.touch["t"+r]=[a,h])}}}},SBRPlayer.prototype.touchmove=function(t){t.preventDefault();var s=t.target.width;t.target.height;switch(this.status){case this.STATUS_INIT:case this.STATUS_WAIT:break;case this.STATUS_PLAY:for(var i=0;i<t.changedTouches.length;i++){var e=t.changedTouches[i].identifier;if(this.touch["t"+e]){var a=this.touch["t"+e][0],h=(this.touch["t"+e][1],this.getTouchLane(a,s)),r=t.changedTouches[i].pageX-this.offsetX,o=t.changedTouches[i].pageY,n=this.getTouchLane(r,s);if(h!==n){switch(this.touch["t"+e]=null,n){case 1:this.key[this.KEY_D]===!1&&(this.keyDown({keyCode:this.KEY_D}),this.touch["t"+e]=[r,o]);break;case 2:this.key[this.KEY_F]===!1&&(this.keyDown({keyCode:this.KEY_F}),this.touch["t"+e]=[r,o]);break;case 3:this.key[this.KEY_K]===!1&&(this.keyDown({keyCode:this.KEY_K}),this.touch["t"+e]=[r,o])}switch(h){case 1:this.keyUp({keyCode:this.KEY_D});break;case 2:this.keyUp({keyCode:this.KEY_F});break;case 3:this.keyUp({keyCode:this.KEY_K})}}}}}},SBRPlayer.prototype.checkTouched=function(){},SBRPlayer.prototype.touchend=function(t){var s=t.target.width;t.target.height;switch(this.status){case this.STATUS_INIT:case this.STATUS_WAIT:break;case this.STATUS_PLAY:for(var i=0;i<t.changedTouches.length;i++){var e=t.changedTouches[i].pageX-this.offsetX,a=(t.changedTouches[i].pageY,t.changedTouches[i].identifier);if(this.touch["t"+a])switch(this.getTouchLane(e,s)){case 1:this.keyUp({keyCode:this.KEY_D});break;case 2:this.keyUp({keyCode:this.KEY_F});break;case 3:this.keyUp({keyCode:this.KEY_K})}}}},SBRPlayer.prototype.getTouchLane=function(t,s){return Math.ceil(result=t/s*3)},SBRPlayer.prototype.changeScroll=function(t){this.errorFlag||this.loadSbrsFlag!==!1&&(this.option.scroll=t)},SBRPlayer.prototype.changeSize=function(t,s){if(!this.errorFlag){t=t?t:this.CANVAS_WIDTH,t=1e4>t?t:1e4,t=t>0?t:0,s=s?s:t*this.CANVAS_HEIGHT/this.CANVAS_WIDTH,s=1e4>s?s:1e4,s=s>0?s:0,this.width=t,this.height=s,this.canvas.width=this.width,this.canvas.height=this.height;var i=this.canvas.getBoundingClientRect();this.offsetX=i.left-this.canvas.width/2,this.offsetY=i.top}};