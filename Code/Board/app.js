$(document).ready(function() { // Anything inside here will be called when the doc is ready to load
    // This happens when they click the big + button to add a task
    window.openCreateModal = function() {
        $('#taskId').val(''); 
        $('#title').val(''); 
        $('#description').val(''); 
        $('#due_date').val(''); 
        $('#modalTitle').text('Create Task'); 
        $('#taskForm')[0].reset(); // Resets the form's values when they open the form, so that there's no lingering data
        $('#taskModal').show(); 
    }
    // This happens when they hit the X button on the Task update/create form
    window.closeModal = function() {
        $('#taskModal').hide();
    }
    // Since this is the only explicit call to do something, we can have this anywhere in the onDocReady, I just prefer to have it closer to the start
    loadTasks();

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
                        // Callback here is very neat!
                        // The power of this approach allows us to have only 1 method to do asynchronous communications
                        // while being able to do a whole bunch of different things when we get the response back
                        // At first glance, it looks like I'm just calling another method here, 
                        // but I'm actually calling the method that we told AJAX to call when it gets a response, in the calling method.
                        // The method signature above has a variable called "callback", which we treat as a method in the line of code below this
                        // this approach lets us have a really nicely decoupled method for doing AJAX, while being agile enough to do different things based on the responses and request type at runtime
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
        // Task already exists, update it
        if (taskId) {
            ajaxRequest('update_task_details.php', 'POST', formData, function(response) {
                if (response.message === 'Task updated successfully') {
                    loadTasks();
                    closeModal();
                } else {
                    alert('Failed to update task.');
                }
            });
        } else { // Create it
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
    function appendTasksToColumns(userTasks) {
        Object.keys(userTasks).forEach(user => {
            userTasks[user].todo.forEach(task => {
                const taskCard = taskFactory(task);
                const todoColumn = $(`#todo-${user}-tasks`);
                todoColumn.append(taskCard);
            });
            userTasks[user].inProgress.forEach(task => {
                const taskCard = taskFactory(task);
                const inProgressColumn = $(`#in-progress-${user}-tasks`);
                inProgressColumn.append(taskCard);
            });
            userTasks[user].done.forEach(task => {
                const taskCard = taskFactory(task);
                taskCard.addClass('completed').attr('draggable', false);
                const doneColumn = $(`#done-${user}-tasks`);
                doneColumn.append(taskCard);
            });
        });
    }
    // This is essentially what "creates" our tasks and populates the data they display
    function taskFactory(task) {
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
                    if (columnsContainer.is(':visible')) {
                        $(this).text('▲');
                    } else {
                        $(this).text('▼');
                    }
                }
            });
            const header = $('<h4>').append(
                $('<span>', { text: user }),
                toggleButton
            );
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
        }).on('drop', function(event) { 
            drop(event.originalEvent); 
        });
        // Note: I removed the events for mobile since it was out of scope
    }
    function drag(event) {
        event.dataTransfer.setData('text', event.target.id);
    }
    function allowDrop(event) {
        event.preventDefault();
    }
    function drop(event) {
        event.preventDefault();
        const taskIdWithPrefix = event.dataTransfer.getData('text');
        const taskId = taskIdWithPrefix.replace('task-', ''); // Remove our task- prefix so that we can use the right data for the update
        const taskCard = document.getElementById(taskIdWithPrefix);
        const newStatus = $(event.target).closest('.column').hasClass('todo-column') ? 'To Do' :
                          $(event.target).closest('.column').hasClass('in-progress-column') ? 'In Progress' : 'Done';
        $(event.target).closest('.column').append(taskCard);
        updateTaskStatus(taskId, newStatus);
    }
    function updateTaskStatus(taskId, newStatus) {
        const statusMap = {
            'To Do': 1,
            'In Progress': 2,
            'Done': 3
        };
        const statusId = statusMap[newStatus];
        const numericTaskId = parseInt(taskId, 10);
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
    function createEmptyMessage() {
        const emptyMessage = $('<p>').text('No tasks to display');
        return emptyMessage;
    }
    function openEditModal(task) {
        $('#taskId').val(task.id);
        $('#title').val(task.title);
        $('#description').val(task.description);
        $('#due_date').val(task.due_date);
        $('#modalTitle').text('Edit Task');
        $('#taskModal').show();
    }
    // Add event listeners for drop zones -> these can also be placed anywhere, I just like to have them at the end
    $('.column').on('dragover', function(event) { 
        allowDrop(event.originalEvent); 
    }); 
    $('.column').on('drop', function(event) { 
        drop(event.originalEvent); 
    });
}); // This is the end of the onDocReady
// Ensure user session gets destroyed once they leave
$(window).on('beforeunload', function() { // Beforeunload is honestly best-attempt, so we also do a server-side check to see when they were last active. This can be improved by having a timed event fire to unset their session as well, but was out of scope for me
  $.ajax({
      url: '../Login/logout.php',
      type: 'GET',
      async: false,
      success: function(response) {
        //console.log('Logged out successfully');
      },
      error: function(xhr, status, error) {
        console.error('Error logging out:', status, error);
      }
  });
});
