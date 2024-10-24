const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

//cargar variables de entorno
require('dotenv').config();

// Configurar la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'backend', 
    user: process.env.DB_USER || 'manguito_user',
    password: process.env.DB_PASSWORD || 'manguito',
    database: process.env.DB_NAME || 'TO_DO_List'
});

function connectWithRetry() {
    db.connect((err) => {
        if (err) {
            console.error('Error conectando a la base de datos, reintentando en 5 segundos...', err);
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log('Conexión exitosa a la base de datos MySQL');
        }
    });
}

connectWithRetry();


const app = express();
//usar puerto dsde .env o por defecto 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Ruta para registrar usuarios
app.post('/api/registro', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error al registrar usuario:', err);
                res.status(500).send('Error al registrar usuario');
            } else {
                console.log('Usuario registrado con éxito:', result.insertId);
                res.send({ id: result.insertId });
            }
        });
    } catch (error) {
        console.error('Error al encriptar contraseña:', error);
        res.status(500).send('Error al registrar usuario');
    }
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    console.log(`Usuario ingresado: ${username}`);
    console.log(`Contraseña ingresada: ${password}`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    // Buscar el usuario en la base de datos
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];

            // Comparar la contraseña usando bcrypt
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error al comparar la contraseña:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }
                
                console.log(`Contraseña ingresada: ${user.password}`);
                console.log(`Contraseña almacenada (hash): ${user.password}`);
                console.log(`¿Las contraseñas coinciden?: ${isMatch}`);
            
                if (isMatch) {
                    req.session.userId = user.id; // Guardar el ID del usuario en la sesión
                    res.status(200).json({ message: 'Login exitoso' });
                } else {
                    res.status(400).json({ error: 'Contraseña incorrecta' });
                }
            });
            
        } else {
            res.status(400).json({ error: 'Usuario no encontrado' });
        }
    });
});




// Ruta para agregar tareas (requiere autenticación)
app.post('/api/tasks', (req, res) => {
    const task = req.body; 
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    
    const sql = 'INSERT INTO tasks (id_user, name, completed) VALUES (?, ?, ?)';
    db.query(sql, [userId, task.name, task.completed], (err, result) => {
        if (err) {
            console.error('Error al guardar la tarea:', err);
            res.status(500).send('Error al guardar la tarea');
        } else {
            res.send({ id: result.insertId });
        }
    });
});


// Ruta para obtener las tareas del usuario autenticado
app.get('/api/tasks', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'SELECT * FROM tasks WHERE id_user = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener tareas:', err);
            res.status(500).send('Error al obtener tareas');
        } else {
            res.send(results);
        }
    });
});

// Ruta para editar una tarea
app.put('/api/tasks/:name', (req, res) => {
    const taskName = req.params.name;
    const { name, completed } = req.body;

    const sql = 'UPDATE tasks SET name = ?, completed = ? WHERE name = ?'; // Cambia 'id' por 'name'
    db.query(sql, [name, completed, taskName], (err, result) => {
        if (err) {
            console.error('Error al actualizar tarea:', err);
            res.status(500).send('Error al actualizar tarea');
        } else {
            res.send({ message: 'Tarea actualizada con éxito' });
        }
    });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:name', (req, res) => {
    const taskName = req.params.name;

    const sql = 'DELETE FROM tasks WHERE name = ?';
    db.query(sql, [taskName], (err, result) => {
        if (err) {
            console.error('Error al eliminar tarea:', err);
            res.status(500).send('Error al eliminar tarea');
        } else {
            res.send({ message: 'Tarea eliminada con éxito' });
        }
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
