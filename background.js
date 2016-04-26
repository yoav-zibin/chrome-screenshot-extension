// Listen for a click on the camera icon. On that click, take a screenshot.
// The screenshot width&height are matched against the list of supported device 
// to find the emulated device. Then the screenshot is resized to the correct size (according to the device).
// Finally the screenshot is saved in the Downloads folder in the correct folder with the correct name.
chrome.browserAction.onClicked.addListener(function() {

  chrome.tabs.captureVisibleTab(null, { format : "png"}, function(screenshotUrl) {
    var timestamp = new Date().toISOString().replace(/[.]/g, " ").replace(/:/g, "_");
    var filename = "printscreens/" + timestamp + ".png";
    chrome.downloads.download({
        url: screenshotUrl,
        filename: filename,
      }, function (downloadId) {
        myAlert("Saved printscreen in ~/Downloads/" + filename);
      }); 
    resizeImage(screenshotUrl, function (newUrl, device) {
      var filename = "printscreens/" + device.dirName + "/" + timestamp + ".png";
      chrome.downloads.download({
        url: newUrl,
        filename: filename,
      }, function (downloadId) {
        myAlert("Saved printscreen in ~/Downloads/" + filename);
      });
    });
  });
});

function myAlert(msg) {
  chrome.notifications.create(null, {type: "basic", title: "From Yoav screenshot extension:", message: msg, iconUrl: "camera.png"});
}

var supportedDevices = [
  {
    dirName: "iPhone4-3_5inch-640x960",
    deviceMetrics: { width: 320 , height: 480, pixelRatio: 2},
  },
  {
    dirName: "iPhone5-4inch-640x1136",
    deviceMetrics: { width: 320 , height: 568, pixelRatio: 2},
  },
  {
    dirName: "iPhone6-4_7inch-750x1334", // width/height = 0.562218891
    deviceMetrics: { width: 375 , height: 667, pixelRatio: 2},
  },
  { // 700 × 1242 = 0.563607085  0.563405797
    dirName: "iPhone6Plus-5_5inch-1242x2208",
    deviceMetrics: { width: 414 , height: 736, pixelRatio: 3}, // ratio = 0.5625 
  },
  {
    dirName: "iPad-1024x768", // iPad mini has the same ratio
    deviceMetrics: { width: 1024 , height: 768, pixelRatio: 1},
  },
  {
    dirName: "iPadPro-2732x2048",
    deviceMetrics: { width: 1366 , height: 1024, pixelRatio: 2},
  },
  {
    dirName: "Nexus5-720x1134",
    deviceMetrics: { width: 360 , height: 567, pixelRatio: 2},
  },
  {
    dirName: "Nexus7-1920x1200", // Nexus 10 has exactly the same ratio: 800/1280 = 0.625
    deviceMetrics: { width: 600 , height: 960, pixelRatio: 2}, // ratio = 0.625
  },
  {
    dirName: "Nexus6p-870x1546",
    deviceMetrics: { width: 435 , height: 773, pixelRatio: 2},
  },
];

function roundDigits(ratio, multiplier) {
  return Math.round(ratio * multiplier);
}
function findDevicesWithMultiplier(width, height, multiplier) {
  var ratio = roundDigits(width / height, multiplier);
  var devices = [];
  for (var i = 0 ; i < supportedDevices.length; i++) {
    var device = supportedDevices[i];
    var deviceMetrics = device.deviceMetrics;
    if (ratio == roundDigits(deviceMetrics.width / deviceMetrics.height, multiplier)) {
      devices.push(device);
    }
    if (ratio == roundDigits(deviceMetrics.height / deviceMetrics.width, multiplier)) {
      // Rotated device (landscape <--> portrait)
      devices.push({
        dirName: device.dirName,
        deviceMetrics: { width: deviceMetrics.height , height: deviceMetrics.width, pixelRatio: deviceMetrics.pixelRatio},
      });
    }
  }
  return devices;
}
function findDevices(width, height) {
  var multiplier = 100000;
  while (multiplier >= 100) {
    var devices = findDevicesWithMultiplier(width, height, multiplier);
    if (devices.length >= 3) return [];
    if (devices.length > 0) return devices;
    multiplier /= 10;
  }
  return [];
}

function resizeImage(url, callback) {
  var sourceImage = new Image();

  sourceImage.onload = function() {
    var actualWidth = sourceImage.width;
    var actualHeight = sourceImage.height; 
    var devices = findDevices(actualWidth, actualHeight);
    
    for (var i = 0 ; i < devices.length; i++) {
      var device = devices[i];
      var deviceMetrics = device.deviceMetrics;
      // Create a canvas with the desired dimensions
      var canvas = document.createElement("canvas");
      var w = deviceMetrics.width * deviceMetrics.pixelRatio;
      var h = deviceMetrics.height * deviceMetrics.pixelRatio;
      canvas.width = w;
      canvas.height = h;

      // Scale and draw the source image to the canvas
      canvas.getContext("2d").drawImage(sourceImage, 0, 0, w, h);

      // Convert the canvas to a data URL in PNG format
      callback(canvas.toDataURL(), device);
    }
  }

  sourceImage.src = url;
}
