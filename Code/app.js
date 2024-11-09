function ajaxRequest(url, method, formData, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('Response:', response); // Log response for debugging
          callback(response);
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      } else {
        console.error('Error with request:', xhr.statusText);
      }
    };
    xhr.onerror = function() {
      console.error('Network error:', xhr.statusText);
    };
    xhr.send(formData);
  }

  document.getElementById('taskForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const title = encodeURIComponent(document.getElementById('title').value);
    const description = encodeURIComponent(document.getElementById('description').value);
    const dueDate = encodeURIComponent(document.getElementById('due_date').value);

    const formData = `id=${taskId}&title=${title}&description=${description}&due_date=${dueDate}`;

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

  function loadTasks() {
    ajaxRequest('index.php?action=get_tasks', 'GET', null, function(response) {
      const todoColumn = document.getElementById('todo-column');
      const inProgressColumn = document.getElementById('in-progress-column');
      const doneColumn = document.getElementById('done-column');

      todoColumn.innerHTML = '<h3>To Do</h3>';
      inProgressColumn.innerHTML = '<h3>In Progress</h3>';
      doneColumn.innerHTML = '<h3>Done</h3>';

      if (!response.tasks || response.tasks.length === 0) {
        todoColumn.innerHTML += '<p>No tasks to display</p>';
        inProgressColumn.innerHTML += '<p>No tasks to display</p>';
        doneColumn.innerHTML += '<p>No tasks to display</p>';
      } else {
        response.tasks.forEach(task => {
          const taskCard = document.createElement('div');
          taskCard.className = 'task-card';
          taskCard.draggable = true;
          taskCard.ondragstart = drag;
          taskCard.onclick = function(event) {
            event.stopPropagation(); // Stop click from triggering drag
            openEditModal(task);
          };
          taskCard.id = `task-${task.id}`;
          taskCard.dataset.id = task.id;
          taskCard.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <p>Due: ${task.due_date}</p>
          `;

          // Apply styles and draggable attribute based on status
          if (task.status === 'Done') {
            taskCard.classList.add('completed');
            taskCard.draggable = false;
          } else {
            taskCard.draggable = true;
          }

          if (task.status === 'To Do') {
            todoColumn.appendChild(taskCard);
          } else if (task.status === 'In Progress') {
            inProgressColumn.appendChild(taskCard);
          } else if (task.status === 'Done') {
            doneColumn.appendChild(taskCard);
          }
        });
      }
    });
  }

  function allowDrop(ev) {
    ev.preventDefault();
  }

  function drag(ev) {
    const taskId = ev.target.id;
    console.log('Dragging task:', taskId); // Debug log
    ev.dataTransfer.setData("text/plain", taskId);
  }

  function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text/plain");
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

    const column = ev.target.closest('.column');
    if (!column) {
      console.error('No column found for target:', ev.target);
      return;
    }

    // Adjust status ID mapping
    const newStatus = column.id;
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
      taskCard.classList.add('completed');
      taskCard.draggable = false;
    } else {
      taskCard.classList.remove('completed');
      taskCard.draggable = true;
    }

    const title = taskCard.querySelector('h3').innerText;
    const description = taskCard.querySelector('p').innerText.split('Due: ')[0];

    ajaxRequest('index.php?action=update_task_status', 'POST', `id=${taskId}&status_id=${statusId}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`, function(response) {
      if (response.message === 'Task updated successfully') {
        loadTasks();
      } else {
        alert('Failed to update task.');
      }
    });

    column.appendChild(taskCard);
  }

//   function openCreateModal() {
//     document.getElementById('taskId').value = '';
//     document.getElementById('title').value = '';
//     document.getElementById('description').value = '';
//     document.getElementById('due_date').value = '';
//     document.getElementById('modalTitle').innerText = 'Create Task';
//     document.getElementById('taskForm').reset();
//     document.getElementById('taskModal').style.display = 'block';
//   }

  function openEditModal(task) {
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('due_date').value = task.due_date;
    document.getElementById('modalTitle').innerText = 'Edit Task';
    document.getElementById('taskModal').style.display = 'block'; //this is the line that actually displays our popup
  }

  function closeModal() {
    document.getElementById('taskModal').style.display = 'none'; //this hides the popup
  }
