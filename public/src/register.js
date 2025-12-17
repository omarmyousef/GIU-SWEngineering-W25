$(document).ready(function () {
  // Handle Registration Button Click
  $("#register").click(function () {
    const name = $("#name").val().trim();
    const email = $("#email").val().trim();
    const password = $("#password").val();
    const birthdate = $("#birthdate").val();
    const role = $("input[name='role']:checked").val() || "customer";

    if (!name || !email || !password || !birthdate) {
      if (typeof showNotification === "function") {
        showNotification("Please fill in all required fields (name, email, password, birth date).", "warning");
      } else {
        alert("Please fill in all required fields (name, email, password, birth date).");
      }
      return;
    }

    // Backend expects the field name "birthDate"
    const data = {
      name: name,
      email: email,
      password: password,
      birthDate: birthdate,
      role: role,
    };

    $.ajax({
      type: "POST",
      url: "/api/v1/user",
      data: data,
      success: function (serverResponse) {
        if (serverResponse) {
          console.log(serverResponse);
          if (typeof showNotification === "function") {
            showNotification("Successfully registered. You can now login.", "success");
          } else {
            alert("Successfully registered user. You can now login.");
          }
          setTimeout(function () {
            location.href = "/login";
          }, 800);
        }
      },
      error: function (errorResponse) {
        let message = "Error registering user.";
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