function getInputsByType(target, type_name, id_name) {
  var elem_list = target.getElementsByTagName('input');

  for (var i = 0; i < elem_list.length; i++) {
    var elem = elem_list[i];

    if (elem.getAttribute('type') == type_name) {
      if(!(typeof this.id_name === "undefined" || this.id_name === null)
          & this.id_name != elem.getAttribute('id')) {
        continue;
      }
      return elem;
    }
  }
  alert('element#' + this.wifi_elem_id + ' is not defined in this page');
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
  this.prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch).QueryInterface(Ci.nsIPrefService);
  this.prefService.setCharPref("wps_logger.wifi.elem", "wifi_towers");
  this.prefService.setBoolPref("wps_logger.wifi.auto_submit", false);
  this.wifi_listener = null;
};

WifiMonitor.prototype = {
  //
  startWatching: function() {
    this.wifi_elem_id = this.prefService.getCharPref("wps_logger.wifi.elem");
    this.auto_submit = this.prefService.getBoolPref("wps_logger.wifi.auto_submit");
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if(typeof this.wifi_listener === "undefined" || this.wifi_listener === null) {
      var wifi_towers = content.document.getElementById(this.wifi_elem_id);
      if (typeof wifi_towers === "undefined" || wifi_towers === null) {
        alert('element#' + this.wifi_elem_id + ' is not defined in this page');
        return;
      }
      if (this.auto_submit) {
        this.wifi_listener = new WifiListener(wifi_towers, getInputsByType(content.document, 'submit'));
      } else {
        this.wifi_listener = new WifiListener(wifi_towers);
      }
    }
    if(typeof this.service === "undefined" || this.service === null) {
      this.service = Cc["@mozilla.org/wifi/monitor;1"].getService(Ci.nsIWifiMonitor);
    }
    this.service.startWatching(this.wifi_listener);
  },
  stopWatching: function() {
    //netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    this.service.stopWatching(this.wifi_listener);
    this.wifi_listener = null;
  },
  restartWatching: function() {
    this.stopWatching();
    this.startWatching();
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
  this.prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch).QueryInterface(Ci.nsIPrefService);
  this.prefService.setCharPref("wps_logger.gpsd.elem", "gpsd_tpv");
  this.prefService.setBoolPref("wps_logger.gpsd.auto_submit", false);
  this.gpsd_listener = null;
};

GPSDMonitor.prototype = {
  //
  startWatching: function() {
    this.gpsd_elem_id = this.prefService.getCharPref("wps_logger.gpsd.elem");
    this.auto_submit = this.prefService.getBoolPref("wps_logger.gpsd.auto_submit");
    if(typeof this.gpsd_listener === "undefined" || this.gpsd_listener === null) {
      var gpsd_tpv = content.document.getElementById(this.gpsd_elem_id);
      if (typeof gpsd_tpv === "undefined" || gpsd_tpv === null) {
        alert('element#' + this.gpsd_elem_id + ' is not defined in this page');
        return;
      }
      if (this.auto_submit) {
        this.gpsd_listener = new GPSDListener(gpsd_tpv, getInputsByType(content.document, 'submit'));
      } else {
        this.gpsd_listener = new GPSDListener(gpsd_tpv);
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

    var data_listener = {
      onStartRequest: function(request, context) {},
      onStopRequest: function(request, context, status) {},
      onDataAvailable: function(request, context, input_stream, offset, count) {
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        var s_input_stream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        s_input_stream.init(input_stream);

        var json = s_input_stream.read(count);

        jsons = json.match(/({"class":[^\r]+})\r\n/);
        for (var i = 0; i < jsons.length; i++) {
          str = jsons[i].replace("\r\n", "");
          data = JSON.parse(str);
          if (data["class"] == "TPV") {
            this.gpsd_listener.update(str);
          }
        }
      }
    };

    var pump = Cc["@mozilla.org/network/input-stream-pump;1"].createInstance(Ci.nsIInputStreamPump);
    pump.init(this.input_stream, -1, -1, 0, 0, false);
    pump.asyncRead(data_listener, null);
  },

  //
  stopWatching: function() {
    this.output_stream.close();
    this.input_stream.close();
    this.transport.close(Components.results.NS_OK);
    this.gpsd_listener = null;
  },

  //
  restartWatching: function() {
    this.stopWatching();
    this.startWatching();
  },
};

var wifi_monitor = new WifiMonitor();
var gpsd_monitor = new GPSDMonitor();

function openSetupDialog() {
  window.openDialog("chrome://wps_logger/content/wps_logger_setup.xul", "setup_window", "");
};
