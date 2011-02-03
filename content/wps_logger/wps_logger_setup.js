const Cc = Components.classes;
const Ci = Components.interfaces;

function WpsLoggerConfig() {
  this.prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch).QueryInterface(Ci.nsIPrefService);
  this.wifi_elem_id = document.getElementById('wifi_elem_id');
  this.wifi_auto_submit = document.getElementById('wifi_auto_submit');
  this.gpsd_elem_id = document.getElementById('gpsd_elem_id');
  this.gpsd_auto_submit = document.getElementById('gpsd_auto_submit');
};

WpsLoggerConfig.prototype = {
  readValues: function() {
    this.wifi_elem_id.value = this.prefService.getCharPref("wps_logger.wifi.elem");
    this.wifi_auto_submit.checked = this.prefService.getBoolPref("wps_logger.wifi.auto_submit");
    this.gpsd_elem_id.value = this.prefService.getCharPref("wps_logger.gpsd.elem");
    this.gpsd_auto_submit.checked = this.prefService.getBoolPref("wps_logger.gpsd.auto_submit");
  },
  writeValues: function() {
    this.prefService.setCharPref("wps_logger.wifi.elem", this.wifi_elem_id.value);
    this.prefService.setBoolPref("wps_logger.wifi.auto_submit", Boolean(this.wifi_auto_submit.checked));
    this.prefService.setCharPref("wps_logger.gpsd.elem", this.gpsd_elem_id.value);
    this.prefService.setBoolPref("wps_logger.gpsd.auto_submit", Boolean(this.gpsd_auto_submit.checked));
  },
};

var wps_logger_config = null;

window.onload = function() {
  wps_logger_config = new WpsLoggerConfig();
  wps_logger_config.readValues();
};
