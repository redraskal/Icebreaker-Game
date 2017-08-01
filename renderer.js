const {app} = require("electron").remote;
const fs = require("fs");

var $ = global.jQuery = require("./assets/js/jquery.min");
require("./assets/js/jquery-ui.min");
var musicObject = undefined;
var saveLocation = app.getPath("appData") + "\\icebreaker-game\\";

var musicVolume = .53;
var sfxVolume = .78;

function initSaveData() {
  if(!fs.existsSync(saveLocation)) {
    fs.mkdirSync(saveLocation);
  }
  if(fs.existsSync(saveLocation + "options.data")) {
    loadOptions();
  }
}

function loadOptions() {
  var lineReader = require("readline").createInterface({
    input: fs.createReadStream(saveLocation + "options.data")
  });

  lineReader.on("line", function(line) {
    if(line.indexOf("musicVolume") > -1) {
      musicVolume = parseFloat(line.replace("musicVolume|", ""));
    }
    if(line.indexOf("sfxVolume") > -1) {
      sfxVolume = parseFloat(line.replace("sfxVolume|", ""));
    }
    if(line.indexOf("fullscreen") > -1) {
      var remote = require("electron").remote;
      var win = remote.getCurrentWindow();
      win.setFullScreen(line.replace("fullscreen|", "") == "true");
    }
  });
}

function saveOptions() {
  var remote = require("electron").remote;
  var win = remote.getCurrentWindow();
  fs.writeFile(saveLocation + "options.data", "musicVolume|" + musicVolume + "\nsfxVolume|" + sfxVolume + "\nfullscreen|" + win.isFullScreen(), function(err) {
    console.log("Options have been saved!");
  }); 
}

var currentActLocation = undefined;
var currentAct = undefined;
var currentActItem = -1;

function saveGame() {
  fs.writeFile(saveLocation + "save.data", currentActLocation, function(err) {
    console.log("Game has been saved!");
  }); 
}

function initGame(reset) {
  if(reset) {
    if(fs.existsSync(saveLocation + "save.data")) {
      fs.unlinkSync(saveLocation + "save.data");
      loadGame(reset);
    } else {
      loadGame(reset);
    }
  } else {
    loadGame(reset);
  }
}

function loadGame(reset) {
  if(fs.existsSync(saveLocation + "save.data") && !reset) {
    var lineReader = require("readline").createInterface({
      input: fs.createReadStream(saveLocation + "save.data")
    });
    
    lineReader.on("line", function(line) {
      currentActLocation = line;
      startGame();
    });
  } else {
    currentActLocation = "assets/acts/Act_1.txt";
    startGame();
  }
}

function loadCurrentAct(callback) {
  currentAct = [];
  currentActItem = -1;
  var tempLoc = currentActLocation;
  if(!fs.existsSync(currentActLocation)) {
    currentActLocation="resources/app/" + currentActLocation;
  }
  var lineReader = require("readline").createInterface({
    input: fs.createReadStream(currentActLocation)
  });
  
  lineReader.on("line", function(line) {
    currentAct.push(line);
  });
  
  lineReader.on("close", function() {
    callback();
  });
}

function startGame() {
  fadeOutMusic(function() {});
  $("#loading-icon").fadeIn(1000);
  $("#main-menu").fadeOut(500, function() {
    $("#loading-tip-1").show();
    $("#loading-tip-2").hide();
    $("#loading-screen").fadeIn(500, function() {
      setTimeout(function() {
        $("#loading-tip-1").fadeOut(300, function() {
          $("#loading-tip-2").fadeIn(300);
        });
      }, 3000);
      loadCurrentAct(function() {
        $("#game-bg").attr("src", "");
        $("#game-text").hide();
        $("#dialogue-box").hide();
        $("#dialogue-next").hide();
        $("#left-character").attr("src", "");
        $("#right-character").attr("src", "");
        $("#dialogue-text").html("");
        $("#dialogue-sel").html("");
        $("#dialogue-box").removeClass("pointer");
        setTimeout(function() {
          $("#loading-screen").fadeOut(500, function() {
            $("#loading-icon").fadeOut(1000, function() {
              $("#game").show();
              nextActItem();
            });
          });
        }, 5500);
      });
    });
  });
}

function backToMainMenu() {
  fadeOutMusic(function() {});
  $("#loading-icon").fadeIn(1000);
  $("#game").fadeOut(500, function() {
    $("#loading-tip-1").hide();
    $("#loading-tip-2").hide();
    $("#loading-screen").fadeIn(500, function() {
      saveGame();
      setTimeout(function() {
        $("#loading-screen").fadeOut(500, function() {
          $("#loading-icon").fadeOut(1000, function() {
            showMainMenu();
          });
        });
      }, 5500);
    });
  });
}

function joinString(strings, start) {
  var str = "";
  for(var i=0; i<strings.length; i++) {
    if(i >= start) {
      if(str != "") {
        str+=" ";
      }
      str+=strings[i];
    }
  }
  return str;
}

function skipToActItem(line) {
  for(var i=0; i<currentAct.length; i++) {
    var currentItem = currentAct[i].toString();
    if(currentItem == line) {
      currentActItem = i;
      nextActItem();
    }
  }
}

function nextActItem() {
  currentActItem++;
  if(currentActItem >= currentAct.length) {
    return;
  }
  var currentItem = currentAct[currentActItem].toString();
  if(currentItem.length == 0) {
    return;
  }
  $("#dialogue-sel").html("");
  if(currentItem.indexOf("TEXT") > -1) {
    var str = joinString(currentItem.split(" "), 1);
    var cur = -1;
    $("#dialogue-text").html("");
    playSoundEffect("assets/sound/sfx/typing.mp3");
    var inter = setInterval(function() {
      cur++;
      if(cur >= str.length) {
        clearInterval(inter);
        $("#dialogue-box").addClass("pointer");
        $("#dialogue-next").show();
      } else {
        $("#dialogue-text").html(str.substring(0, cur+1));
      }
    }, 50);
    return;
  }
  if(currentItem.indexOf("*") > -1) {
    var fadeOptions = currentItem.replace("*", "").substring(0, currentItem.indexOf(" ")).split(",");
    var gameText = joinString(currentItem.split(" "), 1).split("&");
    if(gameText.length > 1) {
      $("#game-text").html("<h3>" + gameText[0] + "</h3>" + gameText[1]);
    } else {
      $("#game-text").html("<h3>" + gameText[0] + "</h3>");
    }
    var showDialogueBox = $("#dialogue-box").is(":visible");
    var showBG = $("#game-bg").is(":visible");
    $("#dialogue-box").hide();
    $("#game-bg").hide();
    $("#game-text").fadeIn(fadeOptions[0], function() {
      setTimeout(function() {
        $("#game-text").fadeOut(fadeOptions[2], function() {
          if(showDialogueBox) {
            $("#dialogue-box").show();
          }
          if(showBG) {
            $("#game-bg").show();
          }
          nextActItem();
        });
      }, fadeOptions[1]);
    });
    return;
  }
  if(currentItem.indexOf("BG") > -1) {
    $("#game-bg").attr("src", currentItem.split(" ")[1]);
    nextActItem();
    return;
  }
  if(currentItem.indexOf("REMOVE_BG") > -1) {
    $("#game-bg").attr("src", "");
    nextActItem();
    return;
  }
  if(currentItem.indexOf("WAIT") > -1) {
    setTimeout(function() {
      nextActItem();
    }, currentItem.split(" ")[1]);
    return;
  }
  if(currentItem.indexOf("SHOW_BOX") > -1) {
    $("#dialogue-box").show();
    nextActItem();
    return;
  }
  if(currentItem.indexOf("HIDE_BOX") > -1) {
    $("#dialogue-box").hide();
    nextActItem();
    return;
  }
  if(currentItem.indexOf("LEFT") > -1) {
    $("#left-character").attr("src", currentItem.split(" ")[1]);
    nextActItem();
    return;
  }
  if(currentItem.indexOf("RIGHT") > -1) {
    $("#right-character").attr("src", currentItem.split(" ")[1]);
    nextActItem();
    return;
  }
  if(currentItem.indexOf("REMOVE_LEFT") > -1) {
    $("#left-character").attr("src", "");
    nextActItem();
    return;
  }
  if(currentItem.indexOf("REMOVE_RIGHT") > -1) {
    $("#right-character").attr("src", "");
    nextActItem();
    return;
  }
  if(currentItem.indexOf("TEXT_CLEAR") > -1) {
    $("#dialogue-text").html("");
    nextActItem();
    return;
  }
  if(currentItem.indexOf("OPTIONS") > -1) {
    var options = joinString(currentItem.split(" "), 1).split("&");
    var newHTML = "";
    for(var i=0; i<options.length; i++) {
      var arr = options[i].split("|");
      newHTML+="<li next='" + arr[1] + "'>" + arr[0] + "</li>";
    }
    $("#dialogue-sel").html(newHTML);
    return;
  }
  if(currentItem.indexOf("SFX") > -1) {
    playSoundEffect(currentItem.split(" ")[1]);
    nextActItem();
    return;
  }
  if(currentItem.indexOf("MUSIC") > -1) {
    playMusic(currentItem.split(" ")[1]);
    nextActItem();
    return;
  }
  if(currentItem.indexOf("STOP_MUSIC") > -1) {
    fadeOutMusic(function() {
      nextActItem();
    });
    return;
  }
  if(currentItem.indexOf("ROLL_CREDITS") > -1) {
    playMusic("assets/sound/music/credits.mp3");
    $("#game-bg").attr("src", "assets/img/night-background.png");
    $("#left-character").attr("src", "");
    $("#right-character").attr("src", "");
    $("#dialogue-box").hide();
    var credits = ["Game design", "redraskal & CV_", "Programming", "redraskal", "Graphics", "CV_", "Additional Graphics", "redraskal", "Music and sounds", "AudioMicro, Inc"];
    var currentCredits = -2;
    $("#game-text").hide();
    $("#game-text").html("<h1> </h1><h2 style='color: black;'>The End.</h2>");
    $("#game-text").fadeIn(3500);
    var inter = setInterval(function() {
      currentCredits+=2;
      if((currentCredits+2) >= credits.length) {
        clearInterval(inter);
        $("#game-text").fadeOut(1500, function() {
          $("#game-text").html("<h1> </h1><h2 style='color: black;'>Created with Electron.</h2>");
          $("#game-text").fadeIn(1500, function() {
            setTimeout(function() {
              $("#game-text").fadeOut(6000, function() {
                backToMainMenu();
              });
            }, 3000);
          });
        });
      } else {
        $("#game-text").fadeOut(1500, function() {
          $("#game-text").html("<h1 style='color: black;'>" + credits[currentCredits] + "</h1><h3 style='color: black;'>" + credits[currentCredits+1] + "</h3>");
          $("#game-text").fadeIn(1500);
        });
      }
    }, 6000);
    return;
  }
}

$(document).ready(function() {
  initSaveData();
  animateCaret();
  musicObject = document.getElementById("music");
  if(fs.existsSync(saveLocation + "save.data")) {
    $("#main-menu-continue").removeClass("disabled");
  }
  setTimeout(function() {
    playSoundEffect("assets/sound/sfx/ocean_waves.mp3");
    $("#loading-icon").fadeIn(1000);
    $("#splash-screen").fadeIn(2000, function() {
      setTimeout(function() {
        $("#splash-screen").fadeOut(2000, function() {
          $("#loading-icon").fadeOut(500, function() {
            showMainMenu();
          });
        });
        $("#music-slider").slider({
          min: 0,
          max: 100,
          value: (musicVolume*100),
          range: "min",
          slide: function(event, ui) {
            musicVolume = ui.value / 100;
            music.volume = musicVolume;
            saveOptions();
          }
        });
        
        $("#sfx-slider").slider({
          min: 0,
          max: 100,
          value: (sfxVolume*100),
          range: "min",
          slide: function(event, ui) {
            sfxVolume = ui.value / 100;
            saveOptions();
          }
        });
      }, 3500);
    });
  }, 1000);
  
  $("#main-menu-sel li").on("click", function() {
    if(!$(this).hasClass("disabled")) {
      playSoundEffect("assets/sound/sfx/click_reverb.mp3");
      if($(this).attr("id") == "main-menu-continue") {
        loadGame(false);
      }
      if($(this).attr("id") == "main-menu-new") {
        loadGame(true);
      }
      if($(this).attr("id") == "main-menu-options") {
        $("#main-menu-sel").fadeOut(300, function() {
          $("#options-menu").fadeIn(300);
        });
      }
      if($(this).attr("id") == "main-menu-quit") {
        window.close();
      }
    }
  });
  
  $("#options-back").on("click", function() {
    if(!$(this).hasClass("disabled")) {
      playSoundEffect("assets/sound/sfx/click_reverb.mp3");
      $("#options-menu").fadeOut(300, function() {
        $("#main-menu-sel").fadeIn(300);
      });
    }
  });
  
  $("#options-fullscreen").on("click", function() {
    playSoundEffect("assets/sound/sfx/click_reverb.mp3");
    var remote = require("electron").remote;
    var win = remote.getCurrentWindow();
    win.setFullScreen(!win.isFullScreen());
    saveOptions();
  });
  
  $("#dialogue-box").on("click", function() {
    if($("#dialogue-next").is(":visible")) {
      $("#dialogue-next").hide();
      $("#dialogue-box").removeClass("pointer");
      playSoundEffect("assets/sound/sfx/click.mp3");
      nextActItem();
    }
  });
  
  $(document).keypress(function(e) {
    if(e.which == 13) {
      if($("#dialogue-next").is(":visible")) {
        $("#dialogue-next").hide();
        playSoundEffect("assets/sound/sfx/click.mp3");
        nextActItem();
      }
    }
  });
  
  $(document).keydown(function(e) {
    if(e.which == 27) {
      if($("#game").is(":visible")) {
        if($("#pause").is(":visible")) {
          $("#pause").hide();
          $(".pause-backdrop").hide();
        } else {
          $("#pause").show();
          $(".pause-backdrop").show();
        }
      }
    }
  });
  
  $("#pause-sel li").on("click", function() {
    playSoundEffect("assets/sound/sfx/click_reverb.mp3");
    if($(this).attr("id") == "pause-continue") {
      $("#pause").hide();
      $(".pause-backdrop").hide();
    }
    if($(this).attr("id") == "pause-main-menu") {
      $("#pause").hide();
      $(".pause-backdrop").hide();
      backToMainMenu();
    }
    if($(this).attr("id") == "pause-quit") {
      window.close();
    }
  });
  
  $("#dialogue-sel").on("click", "li", function() {
    if(!$(this).hasClass("disabled")) {
      playSoundEffect("assets/sound/sfx/click_reverb.mp3");
      if($(this).is("[next]")) {
        if($(this).attr("next").indexOf(":") > -1) {
          skipToActItem($(this).attr("next"));
        } else {
          currentActLocation = $(this).attr("next");
          saveGame();
          loadCurrentAct(function() {
            nextActItem();
          });
        }
      }
    }
  });
});

var curCaret = true;
function animateCaret() {
  curCaret = !curCaret;
  if(curCaret) {
    $("#dialogue-next").html("▼");
  } else {
    $("#dialogue-next").html("▽");
  }
  setTimeout(function() {
    animateCaret();
  }, 500);
}

function showMainMenu() {
  $("#main-menu-continue").removeClass("disabled");
  if(!fs.existsSync(saveLocation + "save.data")) {
    $("#main-menu-continue").addClass("disabled");
  }
  $("#main-menu").show();
  playMusic("assets/sound/music/main_menu.mp3");
}

function playMusic(src) {
  if(!musicObject.ended) {
    fadeOutMusic(function() {
      musicObject.src = src;
      musicObject.loop = true;
      musicObject.volume = musicVolume;
      musicObject.play();
    });
  } else {
    musicObject.src = src;
    musicObject.loop = true;
    musicObject.volume = musicVolume;
    musicObject.play();
  }
}

function fadeOutMusic(callback) {
  if(!musicObject.ended) {
    var inter = setInterval(function() {
      var newVal = musicObject.volume-0.05;
      if(newVal <= 0) {
        musicObject.volume = 0;
        musicObject.pause();
        clearInterval(inter);
        callback();
      } else {
        musicObject.volume = newVal;
      }
    }, 50);
  } else {
    callback();
  }
}

function playSoundEffect(src) {
  var sound = document.createElement("audio");
  sound.src = src;
  sound.onended = function() {
    $(sound).remove();
  }
  sound.volume = sfxVolume;
  document.getElementById("sound-effects").appendChild(sound);
  sound.play();
}