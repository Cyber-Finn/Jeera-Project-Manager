$(document).ready(function() {
    // Define global functions to make them accessible via inline event attributes
    //  This is so that we can access OpenCreateModal and CloseModal from the HTML element onclicks
    // This method triggers when the user clicks the big + button
    window.openCreateModal = function() { 
        $('#taskId').val(''); 
        $('#title').val(''); 
        $('#description').val(''); 
        $('#due_date').val(''); 
        $('#modalTitle').text('Create Task'); 
        $('#taskForm')[0].reset(); 
        $('#taskModal').show(); // Show the modal 
        } 
        //happens when the x button is clicked on the modal
        window.closeModal = function() { 
            $('#taskModal').hide(); // Hide the modal
        }

    
    // AJAX request function using jQuery
    function ajaxRequest(url, method, formData, callback) {
      $.ajax({
        url: url,
        method: method,
        data: formData,
        success: function(response) {
          console.log('Raw response:', response); // Log the raw response for debugging
          try {
            const parsedResponse = typeof response === 'object' ? response : JSON.parse(response);
            console.log('Parsed response:', parsedResponse); // Log parsed response for debugging
            callback(parsedResponse);
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
  
      if (taskId) {
        ajaxRequest('update_task_details.php', 'POST', formData, function(response) {
          if (response.message === 'Task updated successfully') {
            loadTasks();
            closeModal();
          } else {
            alert('Failed to update task.');
          }
        });
      } else {
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
  
    // Allow drop event handler
    function allowDrop(ev) {
      ev.preventDefault();
    }
  
    // Drag event handler
    function drag(ev) {
      const taskId = ev.target.id;
      console.log('Dragging task:', taskId); // Debug log
      ev.originalEvent.dataTransfer.setData("text/plain", taskId);
    }
  
    // Drop event handler
    function drop(ev) {
      ev.preventDefault();
      const data = ev.originalEvent.dataTransfer.getData("text/plain");
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
  
      const column = $(ev.target).closest('.column');
      if (!column.length) {
        console.error('No column found for target:', ev.target);
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
    $('.column').on('dragover', allowDrop);
    $('.column').on('drop', drop);
  });
  