// AutoScroll : we compute the scrolling speed in pixels/seconds by knowing the reading speed of the user,
// the number of words per line in the paragraph under the mouse, and the height in pixels of the line
/*global document: false,window: false */

var asSettings = {wordsReadPerMinute: 180,
    interval: null,
    scrolling: 1,
    debug: false,
    curElm: null,
    debugInvokeDelay: 200,
    lastEscPressTime: 0,
    saveInterval: null,
    totalWords: 0,
    guid: null,
    completion: null,
    ps: null,
    progress:null,
    progressUpdated:"0"};


function getAllPs() {
  'use strict';
  
  var psp = document.body.getElementsByTagName('p'),
    psd = document.body.getElementsByTagName('div'),
    ps,
    newc,
    currentCount;
  psp = Array.prototype.slice.call(psp);
  psp = psp.filter(function (e) {
    if (e.firstChild !== null && (e.firstChild.nodeType === 3 // a text node
         || ["A", "SPAN", "FONT", "STRONG", "IMG"].indexOf(e.firstChild.nodeName) >= 0)) { // a tolerated node
      var nonEmptyWords = e.textContent.split(' ').filter(function (elm) {
        return (elm.length > 0);
      });
      return (nonEmptyWords.length > 10); // more than 10 non empty words
    }
  });
  psd = Array.prototype.slice.call(psd);
  psd = psd.filter(function (e) { // remove div containing divs
    var childNodes = Array.prototype.slice.call(e.childNodes);
    childNodes = childNodes.filter(function (e2) {
      return (e2.nodeName === "DIV");
    });
    return (childNodes.length === 0);
  });

  psd = psd.filter(function (e) {
    // in case of a div, we need to concat all text  nodes in it to evaluate the length in words
    var allTextChilds, nonEmptyWords, cn;
    allTextChilds = "";
    cn = Array.prototype.slice.call(e.childNodes);
    cn.forEach(function (ec) { // only count nodes of type text of a, otherwise we have a 'wrapper' div
      if (ec.nodeName === "A" || ec.nodeName === "#text") {
        allTextChilds += ec.textContent;
      }
    });
    nonEmptyWords = allTextChilds.split(' ').filter(function (elm) {
      return (elm.length > 0);
    });
    asSettings.totalWords += (nonEmptyWords.length > 10) ? nonEmptyWords.length : 0;
    return (nonEmptyWords.length > 10); // more than 10 non empty words
  });
  ps = psp.concat(psd);
  ps.forEach(function (e) {
    var nonEmptyWords = e.textContent.split(' ').filter(function (elm) {
      return (elm.length > 0);
    });
    asSettings.totalWords += nonEmptyWords.length > 10 ? nonEmptyWords.length : 0;
  });
  asSettings.completion = [];
  ps.forEach(function (e) {
    var nonEmptyWords = e.textContent.split(' ').filter(function (elm) {
      return (elm.length > 0);
    });
    newc = nonEmptyWords.length > 10 ? nonEmptyWords.length : 0;
    if (asSettings.completion[asSettings.completion.length - 1] === undefined) {
      currentCount = newc;
    } else {
      currentCount = newc + asSettings.completion[asSettings.completion.length - 1];
    }
    asSettings.completion.push(currentCount);
  });
  asSettings.ps = ps;
  return ps;
}

function unloadAS() {
  'use strict';
  var ps = getAllPs(),
    i,
    iv;
  for (i = 0; i < ps.length; i += 1) {
    ps[i].onmouseover = null;
    ps[i].onmousemove = null;
    ps[i].onmouseout = null;
  }
  iv = document.getElementById('smartscrollbanner').getAttribute("interval");
  window.clearInterval(Math.round(iv));
  document.onkeyup = null; // remove the handler for ESC press
  document.getElementById('smartscrollbanner').remove();
}



function revealStatus(ds) {
  'use strict';
  if (parseInt(ds.style.bottom, 10) < 0) {
    ds.style.bottom = parseInt(ds.style.bottom, 10) + 1 + "px";
    window.setTimeout(function () {
      revealStatus(ds);
    }, 20);
  }
}


function launchScroll(wordsPerLine, pixelsPerLine) {
  'use strict';
//  alert("scrolling !");
  var delay = (wordsPerLine / (asSettings.wordsReadPerMinute / 60)) / pixelsPerLine,
    scrollStep = 1;
  window.clearInterval(asSettings.interval);
  asSettings.interval = window.setInterval(function () {
    window.scrollBy(0, scrollStep * asSettings.scrolling);
  }, 1000 * delay);
  document.getElementById('smartscrollbanner').setAttribute('interval', asSettings.interval);
}


function onP(elm) {
  'use strict';
  var pcopy,
    lineCount,
    pixelsPerLine,
    wordsPerLine,
    psd,
    lpp,
    estimatedTotalTime,
    estimatedRemainingTime;
  asSettings.curElm = elm;
  if (asSettings.debug && elm.className.match(/hover/) === null) {
    elm.className += " " + "hover";
  }
  pcopy = elm.cloneNode(true);
  elm.parentNode.insertBefore(pcopy, elm.nextSibling);
  pcopy.innerHTML = 'A<br>B<br>C<br>D<br>E'; // Create a identical element with a known number of lines : 5
  pcopy.setAttribute("style", 'position:absolute;left:-2000px;');
  lineCount = elm.offsetHeight / (pcopy.offsetHeight / 5);
  pixelsPerLine = elm.offsetHeight / lineCount;
  wordsPerLine = elm.innerHTML.split(' ').filter(function (e) {
    return (e.length > 0);
  }).length / lineCount;
  if (asSettings.debug) {
    psd = (wordsPerLine / (asSettings.wordsReadPerMinute / 60)) / pixelsPerLine;
    elm.className.replace(/ hover\b/, '');
    lpp = Math.round(lineCount * 10) / 10;
    document.getElementById('lpp').innerHTML = lpp + ' line' + ((lpp > 1) ? 's' : '');
    document.getElementById('wpl').innerHTML = Math.round(wordsPerLine);
    estimatedTotalTime = parseInt(asSettings.totalWords / asSettings.wordsReadPerMinute, 10);
    estimatedRemainingTime = parseInt(estimatedTotalTime *
      asSettings.completion[asSettings.ps.indexOf(asSettings.curElm)] / asSettings.totalWords, 10);
    document.getElementById('ert').innerHTML = estimatedRemainingTime + '/' + estimatedTotalTime;
    if (asSettings.scrolling === 1) {
      document.getElementById('psd').innerHTML = Math.round(psd * 1000) / 1000;
    }
  }
  pcopy.parentNode.removeChild(pcopy);
  if (lineCount > 1) { // only scroll when on a real paragraph
    launchScroll(wordsPerLine, pixelsPerLine);
  }
}

function offP(elm) {
  'use strict';
  if (asSettings.debug && elm.className.match(/hover/) !== null) {
    elm.className = elm.className.replace(/ hover\b/, '');
  }
}


function hideStatus(ds) {
  'use strict';
  if (!asSettings.debug && parseInt(ds.style.top, 10) > -(ds.offsetHeight + 2)) {
    ds.style.top = parseInt(ds.style.top, 10) - 1 + "px";
    window.setTimeout(function () {
      hideStatus(ds);
    }, 20);
  }
}



function toggleDebug() {
  'use strict';
  var ddebug = document.getElementById('ddebug'),
    css = document.createElement("style"),
    hoverDiv;
  if (ddebug.style.display === "none") {
    revealStatus(document.getElementById('smartscrollbanner'));
    document.getElementById('cbdebug').checked = true;
    ddebug.style.display = "block";
    asSettings.debug = true;
    // Add the CSS rule to change bgcolor of current paragraph
    css.type = "text/css";
    css.innerHTML = "div.hover {background: #EEEEEE;} p.hover {background: #EEEEEE;}";
    document.body.appendChild(css);
    if (asSettings.curElm !== null) {
      onP(asSettings.curElm);
    }
  } else {
    ddebug.style.display = "none";
    document.getElementById('cbdebug').checked = false;
    hoverDiv = Array.prototype.slice.call(document.getElementsByClassName('hover'));
    hoverDiv.forEach(function(e){
      e.className = e.className.replace(/ hover\b/, '');
    });
    hideStatus(document.getElementById('smartscrollbanner'));
    asSettings.debug = false;
  }
}

function deepCss(who, css) {
  'use strict';
  var sty, val, dv = document.defaultView || window;
  if (who.nodeType === 1) {
    sty = css.replace(/\-([a-z])/g, function (a) {
      return a.toUpperCase();
    });
    val = who.style[sty];
    if (!val) {
      if (who.currentStyle) {
        val = who.currentStyle[sty];
      } else if (dv.getComputedStyle) {
        val = dv.getComputedStyle(who, "").getPropertyValue(css);
      }
    }
  }
  return val || "";
}

function highZ(parent, limit) {
  'use strict';
  limit = limit || Infinity;
  parent = parent || document.body;
  var who, temp, max = 1, i = 0,
    children = parent.childNodes, length = children.length;
  while (i < length) {
    who = children[i];
    i += 1;
    if (who.nodeType !== 1) {
      continue; // element nodes only
    }
    if (deepCss(who, "position") !== "static") {
      temp = deepCss(who, "z-index");
      if (temp === "auto") { // z-index is auto, so not a new stacking context
        temp = highZ(who);
      } else {
        temp = parseInt(temp, 10) || 0;
      }
    } else { // non-positioned element, so not a new stacking context
      temp = highZ(who);
    }
    if (temp > max && temp <= limit) {
      max = temp;
    }
  }
  return max;
}

function hashCode(s){
	var hash = 0;
	if (s.length == 0) return hash;
	for (i = 0; i < s.length; i++) {
		c = s.charCodeAt(i);
		hash = ((hash<<5)-hash)+c;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash+Math.pow(2,32)/2;
}

function saveProgress() {
  'use strict';
  var e=document.body;
  localStorage.progress = e.scrollTop/(e.scrollHeight-e.clientHeight);
  localStorage.progressUpdated = new Date().toISOString();
  asSettings.progress = localStorage.progress;
  asSettings.progressUpdated = localStorage.progressUpdated;
  console.log("progress saved locally");
}

function pauseScroll() {
  'use strict';
  asSettings.scrolling = (asSettings.scrolling > 0) ? 0 : 1;
  if (asSettings.scrolling === 0) {
    setTimeout(saveProgress,0);
    document.getElementById('playpause').innerHTML = "&#9660;";
    if (asSettings.debug === true) {
      document.getElementById('psd').innerHTML = "∞";       
    }
  } else {
    if (asSettings.curElm !== null) {
      document.getElementById('playpause').innerHTML = "&#10074;&#10074;";
      onP(asSettings.curElm);
    }
  }
}

function saveSettings() {
  'use strict';
  var http = new window.XMLHttpRequest(),
    url = APIUrl+"/user/settings",
    params = "wpm=" + asSettings.wordsReadPerMinute;
  http.open("POST", url, true);
  http.setRequestHeader("Authorization", asSettings.guid);
  http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  http.send(params);
}

function wpmChanged() {
  'use strict';
  document.getElementById('wpm').innerText = asSettings.wordsReadPerMinute;
  window.clearInterval(asSettings.saveInterval);
  onP(asSettings.curElm);
  asSettings.saveInterval = window.setTimeout(function () {saveSettings(); }, 2000);
}

function setupPlusMinus() {
  'use strict';
  var mwpm = document.getElementById('mwpm'),
    pwpm = document.getElementById('pwpm');

  mwpm.onclick = function () {
    asSettings.wordsReadPerMinute -= 1;
    wpmChanged();
  };
  pwpm.onclick = function () {
    asSettings.wordsReadPerMinute += 1;
    wpmChanged();
  };
}

function showStatus() {
  'use strict';
  var sdiv = document.createElement('div'),
    spanpause = document.createElement('span'),
    cbpause = document.createElement('input'),
    ddebug = document.createElement('div'),
    elm = document.body,
    sdebug = document.createElement('span'),
    spanautohide = document.createElement('span'),
    cbdebug = document.createElement('input'),
    hlink = document.createElement('a');

  sdiv.id = "smartscrollbanner";
  sdiv.innerHTML = "<span id='playpause'>&#10074;&#10074;</span><span id='chwpm'>"
    + "<span id='mwpm' style='cursor:pointer;'> - </span>"
    + "<span id='wpm'>" + asSettings.wordsReadPerMinute + "</span>"
    + "<span id='pwpm' style='cursor:pointer;'> + </span></span>" + "<span title=\"words per minute\"> wpm</span> ";
  sdiv.setAttribute('style', "background: white;position: fixed;text-align: center;"
    + "text-shadow: 0 1px 0 #fff;color: #696969;font-family: sans-serif;font-size:22px;"
    + "height:40px;bottom: -10px;left: 0;right: 0;border-top: 1px solid #ddd;"
    + "margin: auto;"
    + "-webkit-user-select: none;line-height:normal;");
  spanpause.innerHTML = "pause";
  spanpause.setAttribute('style', "display: none;font-size: x-small;margin-left: 10px;vertical-align: middle;");
  sdiv.appendChild(spanpause);
  cbpause.setAttribute('title', 'Tip : Press ESC anytime to pause/unpause scrolling');
  cbpause.setAttribute('type', "checkbox");
  cbpause.setAttribute('id', "cbpause");
  cbpause.setAttribute('style', "display: none;transform: scale(0.8);vertical-align:middle;margin:0;height:13px;width:13px;-webkit-appearance: checkbox;");
  cbpause.checked = false;
  cbpause.onchange = function () {
    pauseScroll();
  };
  sdiv.onclick = function (e) {
    if (e.target == this || e.toElement.id === "playpause") {
      document.getElementById('cbpause').click();
    }
  };
  sdiv.appendChild(cbpause);
  spanautohide.setAttribute('style', "font-size: x-small;margin-left: 10px;vertical-align: middle;");
  spanautohide.innerHTML = "debug";
  cbdebug.setAttribute('type', "checkbox");
  cbdebug.setAttribute('id', "cbdebug");
  cbdebug.setAttribute('style', "transform: scale(0.8);vertical-align:middle;margin:0;height:13px;width:13px;-webkit-appearance: checkbox;");
  cbdebug.checked = asSettings.statusAutoHide;
  
  hlink.href = "http://trochr.github.io/ScrollStuff";
  hlink.style.position = "absolute";
  hlink.style.right = "7px";
  hlink.style.color = 'rgb(107,107,107)';
  hlink.style.textDecoration = 'none';
  hlink.innerHTML = '⌂'; // text-decoration: none;color: rgb(107,107,107);

  ddebug.id = "ddebug";
  ddebug.setAttribute('style', "display: none;");
  sdebug.setAttribute('style', "font-size: x-small;margin-left: 10px;vertical-align: middle;");
  sdebug.innerHTML = "<span id='lpp'>0</span> | <span id='wpl'>0</span> <span title=\"average words per line\">awpl</span> |"
    + " <span id='psd'>0</span> <span title=\"seconds per line\">spl</span> |"
    + " <span id='ert'>0</span> <span title=\"estimated reading time\">min</span>";
  sdiv.appendChild(spanautohide);
  sdiv.appendChild(cbdebug);
  sdiv.appendChild(hlink);
  ddebug.appendChild(sdebug);
  sdiv.appendChild(ddebug);
  elm.insertBefore(sdiv, elm.firstChild);
  cbdebug.onchange = function (e) {
    asSettings.debug = e.target.checked;
    if (!asSettings.debug) {
      document.getElementById('ddebug').setAttribute('style', "display: none;");
    } else {
      toggleDebug();
    }
  };

  setupPlusMinus();
  revealStatus(sdiv);
}

function loadProgress() {
  'use strict';
  console.log("will load progress");
   if (localStorage.hasOwnProperty('progress')) {
     console.log("localStorage.hasOwnProperty progress");
     window.asSettings.progress = localStorage.progress;
     console.log("values : "+window.asSettings.progress);
     if (asSettings.progressUpdated < localStorage.progressUpdated) {
       asSettings.progressUpdated = localStorage.progressUpdated;
       scrollToPos();            
     }
   }
 console.log("progress loaded");
}
 
function scrollToPos() {
  var progress = asSettings.progress;
  window.scrollTo(0,progress*document.body.scrollHeight);
}


function loadAS() {
  'use strict';
  console.log('Getting progress in local settings : '+localStorage.progress);
  asSettings.progress = loadProgress();
  var ps = getAllPs();
  showStatus();
  if (asSettings.debug) {
    toggleDebug();
  }
  ps.forEach(function (e) {
    e.onmouseover = function () {
      onP(this);
    };
    e.onmousemove = function () {
      if (asSettings.curElm === null) {
        onP(this);
      }
    };
    e.onmouseout = function () {
      offP(this);
    };
  });
  window.setInterval(saveProgress,10000)
}

// Handling of ESC key. One press : stop the scroll, 2 presses : display debug 
document.onkeyup = function (event) {
  'use strict';
  var keyCode = event.keyCode,
    thisKeypressTime;
  if (event.hasOwnProperty('which')) {
    keyCode = event.which;
  }
  if (keyCode === 27) {
    document.getElementById('cbpause').checked = !document.getElementById('cbpause').checked;
    pauseScroll();
    thisKeypressTime = new Date();
    if (thisKeypressTime - asSettings.lastEscPressTime <= asSettings.debugInvokeDelay) {
      toggleDebug();
      thisKeypressTime = 0;
    }
    asSettings.lastEscPressTime = thisKeypressTime;
  }
};
/*
if (document.getElementById('smartscrollbanner') !== null) { // if AS is already there, remove it
  unloadAS();
} else {
  loadAS();
}
*/
