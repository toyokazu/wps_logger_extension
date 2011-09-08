function getInputsByType(target, typeName, idName) {
  var elemList = target.getElementsByTagName('input');

  for (var i = 0; i < elemList.length; i++) {
    var elem = elemList[i];

    if (elem.getAttribute('type') == typeName) {
      if(!(typeof this.idName === "undefined" || this.idName === null)
          & this.idName != elem.getAttribute('id')) {
        continue;
      }
      return elem;
    }
  }
  alert('element#' + this.wifiElemId + ' is not defined in this page');
  return null;
};

function WifiListener(wifi_elem, submit_elem) {
  this.wifi_elem = wifi_elem;
  this.submit_elem = submit_elem;
};

WifiListener.prototype =
{
  // default value
  wifi_elem: null,
  submit_elem: null,
  //
  onChange: function (accessPoints) {
    this.wifi_elem.innerHTML = JSON.stringify(accessPoints);
    if(!(typeof this.submit_elem === "undefined" || this.submit_elem === null)) {
      this.submit_elem.click();
    }
  },

  onError: function (value) {
    alert("error: " +value);
  },

  QueryInterface: function(iid) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if (iid.equals(Components.interfaces.nsIWifiListener) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
};

function WifiMonitor() {
  this.prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService)
    .getBranch("extensions.wps_logger.")
    .QueryInterface(Ci.nsIPrefBranch2);
  this.wifiListener = null;
};

WifiMonitor.prototype = {
  //
  startWatching: function() {
    this.wifiElemId = this.prefService.getCharPref("wifi.elem");
    this.autoSubmit = this.prefService.getBoolPref("wifi.auto_submit");
    this.debug = this.prefService.getBoolPref("wifi.debug");
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if(typeof this.wifiListener === "undefined" || this.wifiListener === null) {
      var wifiTowers = content.document.getElementById(this.wifiElemId);
      if (typeof wifiTowers === "undefined" || wifiTowers === null) {
        alert('element#' + this.wifiElemId + ' is not defined in this page');
        return;
      }
      if (this.auto_submit) {
        this.wifiListener = new WifiListener(wifiTowers, getInputsByType(content.document, 'submit'));
      } else {
        this.wifiListener = new WifiListener(wifiTowers);
      }
    }
    if(typeof this.service === "undefined" || this.service === null) {
      this.service = Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);
    }
    this.service.startWatching(this.wifiListener);
    this.warn("WiFi monitoring started");
  },
  stopWatching: function() {
    //netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if(!(typeof this.service === "undefined" || this.service === null)) {
      this.service.stopWatching(this.wifiListener);
    }
    this.wifiListener = null;
    this.warn("WiFi monitoring stopped");
  },
  restartWatching: function() {
    this.stopWatching();
    this.startWatching();
  },
  // error message
  warn: function(message) {
    if (this.debug) {
      window.openDialog("chrome://wps_logger/content/warning.xul", "",
          "chrome, dialog, modal, resizable=yes",
          {title: "WifiMonitor", message: message});
    }
  },
};

function GPSDListener(gpsd_elem, submit_elem) {
  this.gpsd_elem = gpsd_elem;
  this.submit_elem = submit_elem;
};

GPSDListener.prototype = {
  // default value
  gpsd_elem: null,
  submit_elem: null,

  update: function(json) {
    this.gpsd_elem.innerHTML = json;
    if(!(typeof this.submit_elem === "undefined" || this.submit_elem === null)) {
      this.submit_elem.click();
    }
  },
};

function GPSDMonitor() {
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
  this.prefService = Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefService)
    .getBranch("extensions.wps_logger.")
    .QueryInterface(Ci.nsIPrefBranch2);
  this.gpsdListener = null;
};

GPSDMonitor.prototype = {
  //
  startWatching: function() {
    this.gpsdElemId = this.prefService.getCharPref("gpsd.elem");
    this.auto_submit = this.prefService.getBoolPref("gpsd.auto_submit");
    this.debug = this.prefService.getBoolPref("gpsd.debug");
    if(typeof this.gpsdListener === "undefined" || this.gpsdListener === null) {
      var gpsdTpv = content.document.getElementById(this.gpsdElemId);
      if (typeof gpsdTpv === "undefined" || gpsdTpv === null) {
        alert('element#' + this.gpsdElemId + ' is not defined in this page');
        return;
      }
      if (this.autoSubmit) {
        this.gpsdListener = new GPSDListener(gpsdTpv, getInputsByType(content.document, 'submit'));
      } else {
        this.gpsdListener = new GPSDListener(gpsdTpv);
      }
    }
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    var socketService = Cc["@mozilla.org/network/socket-transport-service;1"].getService(Ci.nsISocketTransportService);

    var host_ip_addr = "127.0.0.1";
    var host_port = "2947";

    try {
      host_ip_addr = this.prefService.getCharPref("geo.gpsd.host.ipaddr");    } catch (e) {}
    try {
      host_port = this.prefService.getCharPref("geo.gpsd.host.port");
    } catch (e) {}

    this.transport = socketService.createTransport(null, 0, host_ip_addr, host_port, null);

    // Alright to open streams here as they are non-blocking by default
    this.output_stream = this.transport.openOutputStream(0,0,0);
    this.input_stream = this.transport.openInputStream(0,0,0);

    var command = "?WATCH={\"enable\":true,\"json\":true,\"nmea\":true}\n";
    this.output_stream.write(command, command.length);

    var gpsdListener = this.gpsdListener;
    var dataListener = {
      onStartRequest: function(request, context) {},
      onStopRequest: function(request, context, status) {},
      onDataAvailable: function(request, context, input_stream, offset, count) {
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        var s_input_stream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        s_input_stream.init(input_stream);

        var json = s_input_stream.read(count);

        var jsons = json.match(/({"class":[^\r]+})\r\n/);
        if (jsons != null) {
          for (var i = 0; i < jsons.length; i++) {
            var str = jsons[i].replace("\r\n", "");
            var data = JSON.parse(str);
            if (data["class"] == "TPV") {
              gpsdListener.update(str);
            }
          }
        }
      }
    };

    var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
    pump.init(this.input_stream, -1, -1, 0, 0, false);
    pump.asyncRead(dataListener, null);
    this.warn("WiFi monitoring started");
  },

  //
  stopWatching: function() {
    this.output_stream.close();
    this.input_stream.close();
    this.transport.close(Components.results.NS_OK);
    this.gpsdListener = null;
    this.warn("WiFi monitoring stopped");
  },

  //
  restartWatching: function() {
    this.stopWatching();
    this.startWatching();
  },

  // error message
  warn: function(message) {
    if (this.debug) {
      window.openDialog("chrome://wps_logger/content/warning.xul", "",
          "chrome, dialog, modal, resizable=yes",
          {title: "GPSDMonitor", message: message});
    }
  },
};

var wifi_monitor = new WifiMonitor();
var gpsd_monitor = new GPSDMonitor();

function openSetupDialog() {
  window.openDialog("chrome://wps_logger/content/wps_logger_config.xul", "wps_logger-preferences", "");
};
