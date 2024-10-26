document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem('userId', data.userId);
            window.location.href = 'todolist.html';
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Error en el inicio de sesión');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al conectar con el servidor');
    }
});

// Manejo del botón de registro
document.getElementById('registerButton').addEventListener('click', () => {
    window.location.href = 'registro.html';
});
