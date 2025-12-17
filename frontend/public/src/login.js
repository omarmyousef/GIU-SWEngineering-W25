$(document).ready(function(){
    $("#submit").click(function() {
      const email = $('#email').val().trim();
      const password = $('#password').val();

      if(!email || !password){
        alert("Please enter both email and password.");
        return;
      }

      const data = {
        email,
        password,
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user/login',
        data,
        success: function(serverResponse) {
          if(serverResponse) {
            alert("Login successful");
            location.href = '/dashboard';
          }
        },
        error: function(errorResponse) {
          if(errorResponse) {
            alert(`User login error: ${errorResponse.responseText}`);
          }            
        }
      });
    });
  });