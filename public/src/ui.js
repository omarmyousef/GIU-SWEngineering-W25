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

// Simple global loading overlay
function showLoading(message) {
  message = message || "Loading...";
  var $overlay = $("#global-loading");
  if (!$overlay.length) {
    $overlay = $(
      "<div id='global-loading'>" +
        "<div class='loading-card'>" +
          "<span class='loading-text'></span>" +
        "</div>" +
      "</div>"
    );
    $("body").append($overlay);
  }
  $overlay.find(".loading-text").text(message);
  $overlay.show();
}

function hideLoading() {
  $("#global-loading").hide();
}

// Logout helper: any <a data-logout="1">Logout</a>
function bindLogoutLinks() {
  $(document).on("click", "a[data-logout='1']", function (e) {
    e.preventDefault();
    showLoading("Signing out...");
    $.ajax({
      type: "POST",
      url: "/api/v1/user/logout",
      complete: function () {
        hideLoading();
        window.location.href = "/login";
      },
    });
  });
}

$(document).ready(function () {
  bindLogoutLinks();
});


