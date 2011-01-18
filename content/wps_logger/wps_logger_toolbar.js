function WifiListener(elem) {
  this.elem = elem;
};

WifiListener.prototype =
{
  onChange: function (accessPoints) {
    this.elem.innerHTML = JSON.stringify(accessPoints);
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

  elem: null
};

function WifiMonitor() {
};

WifiMonitor.prototype = {
  startWatching: function() {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    if(typeof this.wifi_listener === "undefined" || this.wifi_listener === null) {
      var wifi_towers = content.document.getElementById('wifi_towers');
      if (typeof wifi_towers === "undefined" || wifi_towers === null) {
        alert('element#wifi_towers is not defined in this page');
        return;
      }
      this.wifi_listener = new WifiListener(wifi_towers);
    }
    if(typeof this.service === "undefined" || this.service === null) {
      this.service = Components.classes["@mozilla.org/wifi/monitor;1"].getService(Components.interfaces.nsIWifiMonitor);
    }
    this.service.startWatching(this.wifi_listener);
  },
  stopWatching: function() {
    //netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    this.service.stopWatching(this.wifi_listener);
    this.wifi_listener = null;
  },
  restartWatching: function() {
    this.stopWatching(this.wifi_listener);
    this.startWatching(this.wifi_listener);
  },
};

function GPSDListener(elem) {
  this.elem = elem;
};

GPSDListener.prototype = {
  update: function(json) {
    this.elem.innerHTML = json;
  },
};

function GPSDMonitor() {
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
  this.prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).QueryInterface(Components.interfaces.nsIPrefService);
};

GPSDMonitor.prototype = {
  //
  startWatching: function() {
    if(typeof this.gpsd_listener === "undefined" || this.gpsd_listener === null) {
      var gpsd = content.document.getElementById('gpsd');
      if (typeof gpsd === "undefined" || gpsd === null) {
        alert('element#gpsd is not defined in this page');
        return;
      }
      this.gpsd_listener = new WifiListener(gpsd);
    }
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    var socket_service = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);

    var hostIPAddr = "127.0.0.1";
    var hostPort = "2947";

    try {
      hostIPAddr = this.prefService.getCharPref("geo.gpsd.host.ipaddr");    } catch (e) {}
    try {
      hostPort = this.prefService.getCharPref("geo.gpsd.host.port");
    } catch (e) {}

    this.transport = socket_service.createTransport(null, 0, hostIPAddr, hostPort, null);

    // Alright to open streams here as they are non-blocking by default
    this.outputStream = this.transport.openOutputStream(0,0,0);
    this.inputStream = this.transport.openInputStream(0,0,0);

    var command = "?WATCH={\"enable\":true,\"json\":true}\n";
    this.outputStream.write(command, command.length);

    var dataListener = {
      onStartRequest: function(request, context) {},
      onStopRequest: function(request, context, status) {},
      onDataAvailable: function(request, context, inputStream, offset, count) {
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        var sInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
        sInputStream.init(inputStream);

        var json = sInputStream.read(count);

        jsons = json.match(/({"class":[^\r]+})\r\n/);
        jsons.each(function(str) {
            str = str.replace("\r\n", "");
            data = JSON.parse(str);
            if (data["class"] == "TPV") {
            this.gpsd_listener.update(str);
            }
            });
      }
    };

    var pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
    pump.init(this.inputStream, -1, -1, 0, 0, false);
    pump.asyncRead(dataListener, null);
  },

  //
  stopWatching: function() {
    this.outputStream.close();
    this.inputStream.close();
    this.transport.close(Components.results.NS_OK);
  },

  //
  restartWatching: function() {
    this.stopWatching(this.gpsd_listener);
    this.startWatching(this.gpsd_listener);
  },
};

var wifi_monitor = new WifiMonitor();
var gpsd_monitor = new GPSDMonitor();

