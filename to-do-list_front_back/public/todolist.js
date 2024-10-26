document.addEventListener('DOMContentLoaded', loadTasks);

document.getElementById('addButton').addEventListener('click', async () => {
    const taskInput = document.getElementById('tarea');
    const taskName = taskInput.value.trim();
    if (taskName) {
        await addTask(taskName);
        taskInput.value = '';
    } else {
        alert('Por favor, ingresa una tarea');
    }
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', {
            method: 'POST'
        });
        sessionStorage.removeItem('userId');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
});

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();

        const taskList = document.getElementById('ListaTareas');
        taskList.innerHTML = ''; 

        if (tasks.length === 0) {
            document.getElementById('vacio').style.display = 'block';
            return;
        }

        document.getElementById('vacio').style.display = 'none';

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.name;
            li.dataset.id = task.id;
            
            if (task.completed) {
                li.classList.add('completed');
            }
            
            const completeButton = document.createElement('button');
            completeButton.textContent = task.completed ? 'Desmarcar' : 'Completar';
            completeButton.className = 'btn btn-success btn-sm';
            completeButton.onclick = () => markAsCompleted(task.id, !task.completed);
        
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.className = 'btn btn-warning btn-sm';
            editButton.onclick = () => editTask(task.id, task.name);
        
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.onclick = () => deleteTask(task.id);
        
            li.appendChild(completeButton);
            li.appendChild(editButton);
            li.appendChild(deleteButton);
            taskList.appendChild(li);
        });
        

        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error al cargar tareas:', error);
    }
}

// Agregar tarea
async function addTask(taskName) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: taskName })
        });

        if (response.ok) {
            loadTasks();
        } else {
            alert('Error al agregar tarea');
        }
    } catch (error) {
        console.error('Error al agregar tarea:', error);
    }
}

// Marcar tarea como completada
async function markAsCompleted(taskId, completed) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });

        if (response.ok) {
            loadTasks(); 
        } else {
            alert('Error al cambiar estado de la tarea');
        }
    } catch (error) {
        console.error('Error al marcar tarea:', error);
    }
}

// Editar tarea
async function editTask(taskId, currentName) {
    const newName = prompt('Editar tarea:', currentName);
    if (newName) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });

            if (response.ok) {
                loadTasks(); 
            } else {
                alert('Error al editar la tarea');
            }
        } catch (error) {
            console.error('Error al editar tarea:', error);
        }
    }
}

// Eliminar tarea
async function deleteTask(taskId) {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadTasks(); 
            } else {
                alert('Error al eliminar tarea');
            }
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
        }
    }
}
