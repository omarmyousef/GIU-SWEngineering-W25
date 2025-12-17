$(document).ready(function () {
  $("#submit").click(function () {
    const email = $("#email").val().trim();
    const password = $("#password").val();

    if (!email || !password) {
      if (typeof showNotification === "function") {
        showNotification("Please enter both email and password.", "warning");
      } else {
        alert("Please enter both email and password.");
      }
      return;
    }

    const data = {
      email,
      password,
    };

    $.ajax({
      type: "POST",
      url: "/api/v1/user/login",
      data: data,
      success: function (serverResponse) {
        if (serverResponse) {
          if (typeof showNotification === "function") {
            showNotification("Login successful", "success");
          } else {
            alert("Login successful");
          }

          var role = serverResponse.user && serverResponse.user.role;
          var target = "/dashboard";

          if (role === "truckOwner") {
            target = "/vendor/dashboard";
          } else if (role === "customer") {
            target = "/customer/dashboard";
          } else if (role === "admin") {
            target = "/profile";
          }

          // Backend sets session cookie; redirect based on role
          setTimeout(function () {
            location.href = target;
          }, 600);
        }
      },
      error: function (errorResponse) {
        let message = "User login error.";
        if (errorResponse && errorResponse.responseJSON && errorResponse.responseJSON.error) {
          message = errorResponse.responseJSON.error;
        } else if (errorResponse && errorResponse.responseText) {
          message = errorResponse.responseText;
        }
        if (typeof showNotification === "function") {
          showNotification(message, "danger");
        } else {
          alert(message);
        }
      },
    });
  });
});