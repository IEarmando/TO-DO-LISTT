document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Error en el registro');
        }
    } catch (error) {
        console.error('Error al registrarse:', error);
        alert('Error al conectar con el servidor');
    }
});

document.getElementById('volverlogin').addEventListener('click', () => {
    window.location.href = 'index.html';
});
