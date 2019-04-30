/**
 * Список resurs с родительским контролем
 */
var PARENT_CONTROL_CONFIG = {
  ivi: true,
  vcat: true,
  yout: true
};

/**
 * Это белый список resurs для которых не нужно проверять наличие интернет соединения
 */
var INTERNET_CONNECTION_CHECK_WHITE_LIST_CONFIG = {
  vcat: true,
  mults: true
};

/**
 * Список соответсвия resurs c названиями приложений (путь отсносительно директории external)
 */
var RESURS_TO_APP_NAMES = {
  ivi: "ivi",
  vcat: "videocatalog",
  yout: "youtube",
  "youtube-kids": "youtube-kids",
  "youtube-tv": "youtube-tv",
  twitch: "twitch",
  "youtube-rikt": "youtube-rikt",
  mults: "mults"
};

/**
 * Список соответсвия resurs c человекочитаемыми названиями приложений
 */
var HUMAN_READABLE_NAMES_RESURS = {
  yout: "YouTube",
  ivi: "IVI.RU",
  "youtube-kids": "Youtube Детям",
  "youtube-tv": "Youtube TV",
  twitch: "TWITCH",
  "youtube-rikt": "Youtube ТЕСТ"
};

// инициализция stb api
var stb;
try {
  stb = gSTB;
} catch (e) {
  console.log(e);
}

// добавление файла стилей
var gmode;
try {
  gmode = stb.RDir("gmode");
} catch (e) {
  console.log(e);
  gmode = 1280;
}
document.write(
  '<link rel="stylesheet" type="text/css" href="' + gmode + '.css" />'
);

// проверяем наличие интернет
var internet_connection_check = new Internet_connection_check();
(function() {
  var resurs = getUrlVars()["resurs"];
  if (
    // если не в белом списке
    typeof INTERNET_CONNECTION_CHECK_WHITE_LIST_CONFIG[resurs] === "undefined"
  ) {
    internet_connection_check.check(); // то выполняем проверку
  } else {
    // иначе сразу проверяем родительский контроль
    if (typeof PARENT_CONTROL_CONFIG[resurs] !== "undefined") {
      checkParentControl(resurs);
      return;
    }
    redirectApp(resurs); // если родитеский контроль не нужен: перенаправляем в приложение
  }
})();

// интернет есть:
internet_connection_check.successfully = function() {
  var resurs = getUrlVars()["resurs"];
  if (typeof PARENT_CONTROL_CONFIG[resurs] !== "undefined") {
    checkParentControl(resurs);
    return;
  }
  redirectApp(resurs);
};

// интернета нет:
internet_connection_check.fail = function() {
  var body = document.getElementsByTagName("body")[0];
  var fontSize = screen.width > 1000 ? "" : "font-size: 24px;";

  var appName = (function() {
    if (
      typeof HUMAN_READABLE_NAMES_RESURS[getUrlVars()["resurs"]] === "undefined"
    ) {
      return "Раздел";
    }
    return '"' + HUMAN_READABLE_NAMES_RESURS[getUrlVars()["resurs"]] + '"';
  })();

  body.innerHTML =
    '<div class="cut_off" style="display: block; height: 100%;"' +
    fontSize +
    ">" +
    '<div class="cut_off_text" >' +
    ' <div style="width: 80%; margin: 0 auto;">' +
    appName +
    " не доступен на Вашем тарифе, для смены тарифа позвоните на 65-000. </div>" +
    '<div class="blocking_buttons"><div class="blocking_account_reboot"><div class="color_btn red"></div>' +
    " Назад" +
    "</div></div></div>";
  body.onkeydown = function(event) {
    switch (event.keyCode) {
      case 8:
        exit();
        break;
      case 27:
        exit();
        break;
      case 112:
        exit();
        break;
    }
  };
};

function checkParentControl(resurs) {
  var pcStatus;
  try {
    pcStatus = stb.RDir("getenv " + resurs + "pass");
  } catch (e) {
    pcStatus = 0;
  }
  if (typeof pcStatus === "string") {
    pcStatus = Boolean(Number(pcStatus));
  }
  if (pcStatus) {
    parentControl(resurs);
    return;
  }
  redirectApp(resurs);
}

function parentControl(resurs) {
  var mac;
  var data;
  try {
    mac = stb.RDir("MACAddress");
  } catch (e) {
    console.log(e);
  }
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "../../custom/get_pass.php?mac=" + mac, true);
  xhr.send();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        data = JSON.parse(xhr.responseText);
      }
    }
  };
  document.getElementById("divpass").style.display = "block";
  document.getElementById("input_pass").value = "";
  document.getElementById("input_pass").focus();

  document.getElementById("input_pass").onkeydown = function handleKeyDownInput(
    event
  ) {
    if (document.getElementById("ico_wrong").style.visibility == "visible")
      document.getElementById("ico_wrong").style.visibility = "hidden";
    if (event.keyCode == 40) {
      document.getElementById("input_pass").blur();
      document.getElementById("ok_button").focus();
    } else if (event.keyCode == 13) {
      ok_pressed(resurs, data.password);
    } else if (event.keyCode == 27) {
      exit();
    }
  };

  document.getElementById("ok_button").onkeydown = function handleKeyDownOk(
    event
  ) {
    if (event.keyCode == 38) {
      document.getElementById("ok_button").blur();
      document.getElementById("input_pass").focus();
    } else if (event.keyCode == 39) {
      document.getElementById("ok_button").blur();
      document.getElementById("cancel_button").focus();
    } else if (event.keyCode == 13) {
      ok_pressed(resurs, data.password);
    } else if (event.keyCode == 27) {
      exit();
    }
  };

  document.getElementById(
    "cancel_button"
  ).onkeydown = function handleKeyDownCancel(event) {
    if (event.keyCode == 38) {
      document.getElementById("cancel_button").blur();
      document.getElementById("input_pass").focus();
    } else if (event.keyCode == 37) {
      document.getElementById("cancel_button").blur();
      document.getElementById("ok_button").focus();
    } else if (event.keyCode == 13 || event.keyCode == 27) {
      exit();
    }
  };
}

function Internet_connection_check() {
  this.check = function() {
    var self = this;
    setTimeout(function() {
      self.checkInternet();
    }, 1);
  };

  this.checkInternet = function() {
    var self = this;
    setTimeout(function() {
      self._failed();
    }, 7000);
    var url = "http://stb-check-internet.rikt.ru/check_internet/test.txt";
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
      self.internetStatus = xmlhttp.status;
      if (xmlhttp.readyState === 4) {
        self.internetStatus = xmlhttp.status;
        if (self.internetStatus == 200) {
          self.successfully();
          self._clear();
        } else {
          self.fail();
          self._clear();
        }
      }
    };
  };

  this.successfully = function successfully() {};
  this.fail = function fail() {};
  this.internetStatus = 0;
  this._clear = function _clear() {
    clearTimeout(this._timeout);
    this.successfully = function() {};
    this.fail = function() {};
    this.internetStatus = 0;
  };
  this._failed = function() {
    this.fail();
    this._clear();
  };
  this._timeout = undefined;
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
    m,
    key,
    value
  ) {
    vars[key] = value;
  });
  return vars;
}

function ok_pressed(resurs, password) {
  if (document.getElementById("input_pass").value == password) {
    redirectApp(resurs);
  } else {
    document.getElementById("input_pass").value = "";
    document.getElementById("ico_wrong").style.visibility = "visible";
  }
}

function redirectApp(resurs) {
  if (typeof RESURS_TO_APP_NAMES[resurs] === "undefined") {
    var ajax_loader = getUrlVars()["ajax_loader"];
    var token = getUrlVars()["token"];
    var timeout = getUrlVars()["timeout"];

    ajax_loader = ajax_loader ? "&ajax_loader=" + ajax_loader : "";
    token = token ? "&token=" + token : "";
    timeout = timeout ? "&timeout=" + timeout : "";

    var url =
      decodeURIComponent(resurs) +
      "?referrer=/stalker_portal/c/index.html" +
      ajax_loader +
      token +
      timeout;

    location = url;
    return;
  }
  var appName = RESURS_TO_APP_NAMES[resurs];
  var l =
    "/stalker_portal/external/" +
    appName +
    "/index.html?referrer=%2Fstalker_portal%2Fc%2Findex.html&ajax_loader=" +
    getUrlVars()["ajax_loader"] +
    "&token=" +
    getUrlVars()["token"] +
    "&timeout=" +
    getUrlVars()["timeout"];
  location = l;
}

function exit() {
  window.location = "/stalker_portal/c/index.html";
}
