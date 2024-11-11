//this happens as soon as the document is ready to load -> equivalent to the body onload function
$(document).ready(function() {
    // Define global functions to make them accessible at our inline statements in the HTML
    //  This is so that we can access OpenCreateModal and CloseModal from the HTML element onclicks
    // This method triggers when the user clicks the big + button to add a task
    window.openCreateModal = function() { 
        $('#taskId').val(''); 
        $('#title').val(''); 
        $('#description').val(''); 
        $('#due_date').val(''); 
        $('#modalTitle').text('Create Task'); 
        $('#taskForm')[0].reset(); 
        $('#taskModal').show(); // Show the modal 
        } 
        // Happens when the x button is clicked on the modal -> to close the form
        window.closeModal = function() { 
            $('#taskModal').hide(); // Hide the modal
        }

    // Allow drop event handler
    window.allowDrop = function(event) {
      event.preventDefault();
    }

    // Drag event handler
    window.drag = function(event) {
      const taskId = event.target.id;
      console.log('Dragging task:', taskId); // Debug log
      event.originalEvent.dataTransfer.setData("text/plain", taskId);
    }

    // Drop event handler
    window.drop = function(event) {
      event.preventDefault();
      const data = event.dataTransfer.getData("text/plain"); //todo: having an issue with this where it can't access the dataTransfer method... Previously had these as a function, but then couldn't access it from outside HTML, so when we create the tasks, they would fail to call this when ondrop, etc.
      const taskCard = document.getElementById(data);

      if (!taskCard) {
        console.error('No task card found for data:', data);
        return;
      }

      const taskId = taskCard.dataset.id;
      if (!taskId) {
        console.error('Task card has no dataset id:', taskCard);
        return;
      }

      const column = $(event.target).closest('.column');
      if (!column.length) {
        console.error('No column found for target:', event.target);
        return;
      }

      // Adjust status ID mapping
      const newStatus = column.attr('id');
      let statusId;
      switch (newStatus) {
        case 'todo-column':
          statusId = 1;
          break;
        case 'in-progress-column':
          statusId = 2;
          break;
        case 'done-column':
          statusId = 3;
          break;
        default:
          console.error('Invalid new status:', newStatus);
          return; // Exit function to prevent sending invalid status
      }

      // Update task card style based on the new status
      if (newStatus === 'done-column') {
        $(taskCard).addClass('completed').attr('draggable', false);
      } else {
        $(taskCard).removeClass('completed').attr('draggable', true);
      }

      const title = $(taskCard).find('h3').text();
      const description = $(taskCard).find('p').first().text().split('Due: ')[0];

      ajaxRequest('update_task_status.php', 'POST', {
        id: taskId,
        status_id: statusId,
        title: title,
        description: description
      }, function(response) {
        if (response.message === 'Task updated successfully') {
          loadTasks();
        } else {
          alert('Failed to update task.');
        }
      });

      column.append(taskCard);
    }
    
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
            console.log("raw response: " + response);
            const parsedResponse = typeof response === 'object' ? response : JSON.parse(response);
            //callback here is a bit weird at first, but it's basically just the method we've told AJAX to call when it gets a response
            //  in the signature of this method, we pass in something called "callback", which is actually a method
            //    this code basically just calls that method, without knowing explicitly what it is
            //      this is really cool because it lets us create a reusable component that handles AJAx for us
            if (parsedResponse.redirect) { 
              window.location.href = '../Login/index.html'; // Redirect to login page because the session expired
              } else { 
                callback(parsedResponse); 
              }
          } catch (e) { //errors with our input payload
            console.error('Error parsing JSON:', e);
          }
        },
        error: function(xhr, status, error) { //network or request error
          console.log("Raw response: " + xhr.message);
          console.error('Error with request:', status, error, xhr.message);
        }
      });
    }
  
    // Event listener for form submission
    //  This happens whenever the user hits the submit button (happens on both the update and submit forms)
    $('#taskForm').on('submit', function(event) {
      event.preventDefault();
      const taskId = $('#taskId').val();
      const title = $('#title').val();
      const description = $('#description').val();
      const dueDate = $('#due_date').val();
  
      const formData = {
        id: taskId,
        title: title,
        description: description,
        due_date: dueDate
      };
  
      // If the task already exists, update it
      if (taskId) {
        ajaxRequest('update_task_details.php', 'POST', formData, function(response) {
          if (response.message === 'Task updated successfully') { // todo: Should look into returning only a code (01, 02), just to lower network usage
            loadTasks();
            closeModal();
          } else {
            alert('Failed to update task.');
          }
        });
      } else { //If the task doesn't already exist, create it
        ajaxRequest('index.php?action=create_task', 'POST', formData, function(response) {
          if (response.message === 'Task created successfully') { // todo: Should look into returning only a code (01, 02), just to lower network usage
            loadTasks();
            closeModal();
          } else {
            alert('Failed to create task.');
          }
        });
      }
    });
  
    // Function to load tasks and populate the columns
    function loadTasks() {
      ajaxRequest('index.php?action=get_tasks', 'GET', null, function(response) {
        const todoColumn = $('#todo-column');
        const inProgressColumn = $('#in-progress-column');
        const doneColumn = $('#done-column');
  
        todoColumn.html('<h3>To Do</h3>');
        inProgressColumn.html('<h3>In Progress</h3>');
        doneColumn.html('<h3>Done</h3>');
  
        if (!response.tasks || response.tasks.length === 0) {
          todoColumn.append('<p>No tasks to display</p>');
          inProgressColumn.append('<p>No tasks to display</p>');
          doneColumn.append('<p>No tasks to display</p>');
        } else {
          $.each(response.tasks, function(index, task) {
            const taskCard = $('<div>', {
              'class': 'task-card',
              'draggable': true,
              'id': `task-${task.id}`,
              'data-id': task.id,
              'html': `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Due: ${task.due_date}</p>
              `
            }).on('dragstart', drag).on('click', function(event) {
              event.stopPropagation(); // Stop click from triggering drag
              openEditModal(task);
            });
  
            // Apply styles and draggable attribute based on status
            if (task.status === 'Done') {
              taskCard.addClass('completed').attr('draggable', false);
            } else {
              taskCard.attr('draggable', true);
            }
  
            // Append task card to the corresponding column
            if (task.status === 'To Do') {
              todoColumn.append(taskCard);
            } else if (task.status === 'In Progress') {
              inProgressColumn.append(taskCard);
            } else if (task.status === 'Done') {
              doneColumn.append(taskCard);
            }
          });
        }
      });
    }
  
  
    // Open modal for editing a task
    function openEditModal(task) {
      $('#taskId').val(task.id);
      $('#title').val(task.title);
      $('#description').val(task.description);
      $('#due_date').val(task.due_date);
      $('#modalTitle').text('Edit Task');
      $('#taskModal').show(); // Show the modal
    }
  
    // Load tasks on document ready
    loadTasks();
  
    // Add event listeners for drop zones
    $('.column').on('dragover', function(event) { 
      allowDrop(event.originalEvent); // Use originalEvent for jQuery events -> we were having issues here previously because we made our drop methods globally accessible
    }); 
    $('.column').on('drop', function(event) { 
      drop(event.originalEvent); // Use originalEvent for jQuery events -> we were having issues here previously because we made our drop methods globally accessible
    });
  });

//make sure the user session gets destroyed once they leave
$(window).on('beforeunload', function() {
    $.ajax({
        url: '../Login/logout.php',
        type: 'GET',
        async: false, // Perform synchronous request to ensure it's completed before the page unloads
        success: function(response) {
            console.log('Logged out successfully');
        },
        error: function(xhr, status, error) {
            console.error('Error logging out:', status, error);
        }
    });
});