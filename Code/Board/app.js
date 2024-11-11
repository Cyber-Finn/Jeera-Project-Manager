//this happens as soon as the document is ready to load -> equivalent to the body onload function
$(document).ready(function() {
    
    window.openCreateModal = function() { 
        $('#taskId').val(''); 
        $('#title').val(''); 
        $('#description').val(''); 
        $('#due_date').val(''); 
        $('#modalTitle').text('Create Task'); 
        $('#taskForm')[0].reset(); 
        $('#taskModal').show(); // Show the modal 
        } 
        
        window.closeModal = function() { 
            $('#taskModal').hide(); // Hide the modal
        }

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
      fetchAndOrganizeTasks(function(JamesTasks) {
          const swimlanesContainer = $('#swimlanes-container');
          swimlanesContainer.empty();

          if (Object.keys(JamesTasks).length === 0) {
              swimlanesContainer.append(createEmptyMessage());
          } else {
              createSwimlanes(JamesTasks);
              appendTasksToColumns(JamesTasks);
          }
      });
  }

  function fetchAndOrganizeTasks(callback) {
      ajaxRequest('index.php?action=get_tasks', 'GET', null, function(response) {
          const JamesTasks = {};

          if (response.tasks && response.tasks.length > 0) {
              response.tasks.forEach(task => {
                  if (!JamesTasks[task.user]) {
                      JamesTasks[task.user] = {
                          todo: [],
                          inProgress: [],
                          done: []
                      };
                  }
                  if (task.status === 'To Do') {
                      JamesTasks[task.user].todo.push(task);
                  } else if (task.status === 'In Progress') {
                      JamesTasks[task.user].inProgress.push(task);
                  } else if (task.status === 'Done') {
                      JamesTasks[task.user].done.push(task);
                  }
              });
          }
          callback(JamesTasks);
      });
  }

  function createSwimlanes(JamesTasks) {
    const swimlanesContainer = $('#swimlanes-container');

    Object.keys(JamesTasks).forEach(James => {
        const userSwimlane = $('<div>', {
            class: 'user-swimlane',
            style: `border-left: 5px solid #ccc;`
        });

        const header = $('<h4>', {
            text: James
        });
        userSwimlane.append(header);

        const columnsContainer = $('<div>', { class: 'columns-container' });

        const todoColumn = $('<div>', {
            class: 'column todo-column',
            id: `todo-${James}-tasks`
        }).append($('<h3>').text('To Do'));

        const inProgressColumn = $('<div>', {
            class: 'column in-progress-column',
            id: `in-progress-${James}-tasks`
        }).append($('<h3>').text('In Progress'));

        const doneColumn = $('<div>', {
            class: 'column done-column',
            id: `done-${James}-tasks`
        }).append($('<h3>').text('Done'));

        columnsContainer.append(todoColumn, inProgressColumn, doneColumn);
        userSwimlane.append(columnsContainer);
        swimlanesContainer.append(userSwimlane);
    });

    // Add event listeners for columns
    $('.column').on('dragover', function(event) { 
        allowDrop(event.originalEvent); 
    }); 
    $('.column').on('drop', function(event) { 
        drop(event.originalEvent); 
    });
}

function appendTasksToColumns(JamesTasks) {
    Object.keys(JamesTasks).forEach(James => {
        JamesTasks[James].todo.forEach(task => {
            const taskCard = taskFactory(task, James);
            const todoColumn = $(`#todo-${James}-tasks`);
            console.log(`Appending task to TODO column: #todo-${James}-tasks`, todoColumn);
            todoColumn.append(taskCard);
        });
        JamesTasks[James].inProgress.forEach(task => {
            const taskCard = taskFactory(task, James);
            const inProgressColumn = $(`#in-progress-${James}-tasks`);
            console.log(`Appending task to In Progress column: #in-progress-${James}-tasks`, inProgressColumn);
            inProgressColumn.append(taskCard);
        });
        JamesTasks[James].done.forEach(task => {
            const taskCard = taskFactory(task, James);
            taskCard.addClass('completed').attr('draggable', false);
            const doneColumn = $(`#done-${James}-tasks`);
            console.log(`Appending task to Done column: #done-${James}-tasks`, doneColumn);
            doneColumn.append(taskCard);
        });
    });
}

function taskFactory(task, James) {
    const taskCard = $('<div>', {
        class: 'task-card',
        draggable: true,
        id: `task-${task.id}`,
        'data-id': task.id,
        html: `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <p>Due: ${task.due_date}</p>
        `
    }).on('dragstart', function(event) {
        drag(event.originalEvent);
    }).on('click', function(event) {
        event.stopPropagation();
        openEditModal(task);
    });

    return taskCard;
}

function drag(event) {
    event.dataTransfer.setData('text', event.target.id);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text');
    const taskCard = document.getElementById(taskId);

    const newStatus = $(event.target).closest('.column').hasClass('todo-column') ? 'To Do' :
                      $(event.target).closest('.column').hasClass('in-progress-column') ? 'In Progress' : 'Done';

    $(event.target).closest('.column').append(taskCard);

    // Update task status in the backend
    updateTaskStatus(taskId, newStatus);
}

function updateTaskStatus(taskId, newStatus) {
    ajaxRequest(`index.php?action=update_task_status&task_id=${taskId}&status=${newStatus}`, 'POST', null, function(response) {
        if (response.success) {
            console.log('Task status updated successfully');
        } else {
            console.error('Failed to update task status');
        }
    });
}


  function createEmptyMessage() {
      const emptyMessage = $('<p>').text('No tasks to display');
      return emptyMessage;
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
