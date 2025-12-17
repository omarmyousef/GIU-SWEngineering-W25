// Simple Bootstrap-based notification helper
// type: "success" | "info" | "warning" | "danger"
function showNotification(message, type) {
  type = type || "info";

  var $container = $("#notification-container");
  if (!$container.length) {
    $container = $(
      "<div id='notification-container' " +
        "style='position:fixed; top:20px; right:20px; z-index:9999; width:320px;'></div>"
    );
    $("body").append($container);
  }

  var $alert = $(
    "<div class='alert alert-" +
      type +
      " alert-dismissible fade in' role='alert' style='box-shadow:0 2px 6px rgba(0,0,0,0.2);'>" +
      "<button type='button' class='close' data-dismiss='alert' aria-label='Close'>" +
      "<span aria-hidden='true'>&times;</span>" +
      "</button>" +
      "<span class='notification-message'></span>" +
      "</div>"
  );

  $alert.find(".notification-message").text(message);
  $container.append($alert);

  // Auto-dismiss after 4 seconds
  setTimeout(function () {
    $alert.alert("close");
  }, 4000);
}


