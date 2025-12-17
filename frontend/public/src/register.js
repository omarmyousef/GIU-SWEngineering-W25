$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val().trim();
      const email = $('#email').val().trim();
      const password = $('#password').val();
      const birthdate = $('#birthdate').val();

      if(!name || !email || !password || !birthdate){
        alert("Please fill in all required fields (name, email, password, birth date).");
        return;
      }

      const data = {
        name,
        email,
        password,
        birthdate
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user',
        data : data,
        success: function(serverResponse) {
          if(serverResponse) {
            console.log(serverResponse);
            alert("Successfully registered user. You can now login.");
            location.href = '/';
          }
        },
        error: function(errorResponse) {
          if(errorResponse) {
            alert(`Error Register User: ${errorResponse.responseText}`);
          }            
        }
      });
    });      
  });