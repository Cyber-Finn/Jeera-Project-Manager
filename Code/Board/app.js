$(document).ready(function() {
  window.openCreateModal = function() { 
      // Open the create task modal
      $('#taskId').val(''); 
      $('#title').val(''); 
      $('#description').val(''); 
      $('#due_date').val(''); 
      $('#modalTitle').text('Create Task'); 
      $('#taskForm')[0].reset(); 
      $('#taskModal').show(); 
  } 
      
  window.closeModal = function() { 
      // Close the task modal
      $('#taskModal').hide(); 
  }

  function ajaxRequest(url, method, formData, callback) {
      $.ajax({
          url: url,
          method: method,
          data: formData,
          success: function(response) {
              try {
                  const parsedResponse = typeof response === 'object' ? response : JSON.parse(response);
                  if (parsedResponse.redirect) {
                      window.location.href = '../Login/index.html'; 
                  } else {
                      //callback here is a bit weird at first, but it's basically just the method we've told AJAX to call when it gets a response
                      //  in the signature of this method, we pass in something called "callback", which is actually a method
                      //    this code basically just calls that method, without knowing explicitly what it is
                      //      this is really cool because it lets us create a reusable component that handles AJAx for us
                      callback(parsedResponse);
                  }
              } catch (e) {
                  console.error('Error parsing JSON:', e);
              }
          },
          error: function(xhr, status, error) {
              console.error('Error with request:', status, error);
          }
      });
  }

  // Event listener for form submission
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
              if (response.message === 'Task updated successfully') {
                  loadTasks();
                  closeModal();
              } else {
                  alert('Failed to update task.');
              }
          });
      } else { // If the task doesn't already exist, create it
          ajaxRequest('index.php?action=create_task', 'POST', formData, function(response) {
              if (response.message === 'Task created successfully') {
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
      fetchAndOrganizeTasks(function(userTasks) {
          const swimlanesContainer = $('#swimlanes-container');
          swimlanesContainer.empty();

          if (Object.keys(userTasks).length === 0) {
              swimlanesContainer.append(createEmptyMessage());
          } else {
              createSwimlanes(userTasks);
              appendTasksToColumns(userTasks);
          }
      });
  }

  function fetchAndOrganizeTasks(callback) {
      ajaxRequest('index.php?action=get_tasks', 'GET', null, function(response) {
          const userTasks = {};

          if (response.tasks && response.tasks.length > 0) {
              response.tasks.forEach(task => {
                  if (!userTasks[task.user]) {
                      userTasks[task.user] = {
                          todo: [],
                          inProgress: [],
                          done: []
                      };
                  }
                  if (task.status === 'To Do') {
                      userTasks[task.user].todo.push(task);
                  } else if (task.status === 'In Progress') {
                      userTasks[task.user].inProgress.push(task);
                  } else if (task.status === 'Done') {
                      userTasks[task.user].done.push(task);
                  }
              });
          }
          callback(userTasks);
      });
  }

  function createSwimlanes(userTasks) {
    const swimlanesContainer = $('#swimlanes-container');

    Object.keys(userTasks).forEach(user => {
        const userSwimlane = $('<div>', {
            class: 'user-swimlane',
            style: `border-left: 5px solid #ccc;`
        });

        const toggleButton = $('<button>', {
            class: 'toggle-button',
            text: '▲',
            click: function() {
                const columnsContainer = $(this).closest('.user-swimlane').find('.columns-container');
                columnsContainer.toggle();

                // Update the toggle button text
                if (columnsContainer.is(':visible')) {
                    $(this).text('▲');
                } else {
                    $(this).text('▼');
                }
            }
        });

        const header = $('<h4>', {
            html: `<span>${user}</span>` // Add span for spacing
        }).append(toggleButton); // Add toggle button next to the user's name
        userSwimlane.append(header);

        const columnsContainer = $('<div>', { class: 'columns-container' });

        const todoColumn = $('<div>', {
            class: 'column todo-column',
            id: `todo-${user}-tasks`
        }).append($('<h3>').text('To Do'));

        const inProgressColumn = $('<div>', {
            class: 'column in-progress-column',
            id: `in-progress-${user}-tasks`
        }).append($('<h3>').text('In Progress'));

        const doneColumn = $('<div>', {
            class: 'column done-column',
            id: `done-${user}-tasks`
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



  function appendTasksToColumns(userTasks) {
      Object.keys(userTasks).forEach(user => {
          userTasks[user].todo.forEach(task => {
              const taskCard = taskFactory(task, user);
              const todoColumn = $(`#todo-${user}-tasks`);
              todoColumn.append(taskCard);
          });
          userTasks[user].inProgress.forEach(task => {
              const taskCard = taskFactory(task, user);
              const inProgressColumn = $(`#in-progress-${user}-tasks`);
              inProgressColumn.append(taskCard);
          });
          userTasks[user].done.forEach(task => {
              const taskCard = taskFactory(task, user);
              taskCard.addClass('completed').attr('draggable', false);
              const doneColumn = $(`#done-${user}-tasks`);
              doneColumn.append(taskCard);
          });
      });
  }

  function taskFactory(task, user) {
    const taskCard = $('<div>', {
        class: 'task-card',
        draggable: true,
        id: `task-${task.id}`, // Keep the "task-" prefix here for consistent identification
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

  const statusMap = {
    'To Do': 1,
    'In Progress': 2,
    'Done': 3
};

function updateTaskStatus(taskId, newStatus) {
    const statusId = statusMap[newStatus]; // Map status description to ID
    const numericTaskId = parseInt(taskId, 10); // Convert taskId to a number

    const formData = {
        id: numericTaskId,
        status_id: statusId
    };

    ajaxRequest('index.php?action=update_task_status', 'POST', formData, function(response) {
        if (response.message === 'Task updated successfully') {
          loadTasks();
        } else {
            console.error('Failed to update task status:', response.message);
        }
    });
}

function drop(event) {
    event.preventDefault();
    const taskIdWithPrefix = event.dataTransfer.getData('text');
    const taskId = taskIdWithPrefix.replace('task-', ''); // Remove the "task-" prefix
    const taskCard = document.getElementById(taskIdWithPrefix);

    // Determine the new status based on the drop target
    const newStatus = $(event.target).closest('.column').hasClass('todo-column') ? 'To Do' :
                      $(event.target).closest('.column').hasClass('in-progress-column') ? 'In Progress' : 'Done';

    // Append the task card to the new column
    $(event.target).closest('.column').append(taskCard);

    // Update task status in the backend
    updateTaskStatus(taskId, newStatus);
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
      $('#taskModal').show();
  }

  // Load tasks on document ready
  loadTasks();

  // Add event listeners for drop zones
  $('.column').on('dragover', function(event) { 
      allowDrop(event.originalEvent); 
  }); 
  $('.column').on('drop', function(event) { 
      drop(event.originalEvent); 
  });
});

// Ensure user session gets destroyed once they leave
$(window).on('beforeunload', function() {
  $.ajax({
      url: '../Login/logout.php',
      type: 'GET',
      async: false,
      success: function(response) {
          console.log('Logged out successfully');
      },
      error: function(xhr, status, error) {
          console.error('Error logging out:', status, error);
      }
  });
});
