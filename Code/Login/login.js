$(document).ready(function() {
    // Show signup form and hide login form
    $('#signup-btn').click(function() {
      $('#login-form').hide();
      $('#signup-form').show();
    });
  
    // Show login form and hide signup form
    $('#login-btn').click(function() {
      $('#signup-form').hide();
      $('#login-form').show();
    });
  
    // Handle login form submission
    $('#login').on('submit', function(event) {
      event.preventDefault();
      const formData = {
        username: $('#username').val(),
        password: $('#password').val()
      };

      console.log(formData);

      ajaxRequest('login.php', 'POST', formData, function(response) {
        if (response.message === 'Login successful') {
          window.location.href = '../Board/index.html'; // Redirect to the task management page once they've logged in
        } else {
          alert('Login failed: ' + response.message);
        }
      }, 'json');
    });
  
    // Handle signup form submission
    $('#signup').on('submit', function(event) {
      event.preventDefault();
      const formData = {
        username: $('#new-username').val(),
        password: $('#new-password').val()
      };
  
      ajaxRequest('signup.php','POST', formData, function(response) {
        if (response.message === 'User created successfully') {
          alert('Signup successful! Please log in.');
          $('#signup-form').hide();
          $('#login-form').show();
        } else {
          alert('Signup failed: ' + response.message);
        }
      }, 'json');
    });

     // AJAX request function using jQuery
    //  This is a generic function we've created that we reuse throughout all the other methods of sending/updating data
    function ajaxRequest(url, method, formData, callback) {
        $.ajax({
          url: url,
          method: method,
          data: formData,
          success: function(response) {
            //console.log('Raw response:', response); // Log the raw response for debugging
            try {
              const parsedResponse = typeof response === 'object' ? response : JSON.parse(response);
              //callback here is a bit weird at first, but it's basically just the method we've told AJAX to call when it gets a response
              //  in the signature of this method, we pass in something called "callback", which is actually a method
              //    this code basically just calls that method, without knowing explicitly what it is
              //      this is really cool because it lets us create a reusable component that handles AJAx for us
              callback(parsedResponse);
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          },
          error: function(xhr, status, error) {
            console.log('Response content:', xhr.responseText);
            console.error('Error with request:', status, error); 
          }
        });
      }
  });
  