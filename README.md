# WPS Logger extension

Firefox extension for WPS Logger application. This extension provide functions to obtain WiFi status and GPS data from gpsd and set them to the specified element of current web page.

# Installation

## Install from WPS Logger application
Checkout code and start server.

Terminal application:
    % git clone git://github.com/toyokazu/wps_logger.git
    % cd wps_logger
    % rails server

Firfox:
Access to http://localhost:3000/
Click link to "Install WPS Logger extension (Firefox only)".

## Install directory from xpi file

    % git clone git://github.com/toyokazu/wps_logger_extension.git
    % cd wps_logger_extension
    % rake

Drug and drop wps_logger.xpi file to your Firefox browser.

# How to use

At WiFi Log upload page of WPS Logger (http://localhost:3000/wifi_logs/new), you can start/stop/restart monitoring WiFi and GPSD by clicking toolbar menu. After starting monitor function, the extension automatically updates element with id ('wifi_towers' or 'gpsd') by the monitoring results (JSON format). Currently those element ids are hard coded. A function to configure element name is a future work.

# How to test

For testing WiFi monitoring, create a html file as the following, then access the html file. When you start monitoring, you can find that WiFi access points will be written to the textarea in JSON form.

    % vi ~/public_html/test.html
    <html>
      <body>
        <textarea cols="20" rows="3" id="wifi_towers">
        </textarea>
      </body>
    </html>

