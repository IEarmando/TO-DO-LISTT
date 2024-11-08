const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'client')));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// Ruta para registrar usuarios
app.post('/api/registro', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan datos de registro' });
    }

    if (password.length < 8){
        return res.status(400).json({ message: 'Contraseña demasiado corta (minimo 8 digitos)' });
    }

    // Verificar si el nombre de usuario ya está en uso
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error al verificar usuario:', err);
            return res.status(500).send('Error al verificar usuario');
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Este usuario ya existe' });
        }

        bcrypt.hash(password.toString(), 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error al encriptar contraseña:', err);
                return res.status(500).send('Error al registrar usuario');
            }

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
        });
    });
});


// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    console.log(`Usuario ingresado: ${username}`);
    console.log(`Contraseña ingresada: ${password}`);

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error al comparar la contraseña:', err);
                    return res.status(500).json({ error: 'Error interno del servidor' });
                }
                
                if (isMatch) {
                    req.session.userId = user.id;
                    res.status(200).json({ userId: user.id });
                } else {
                    res.status(400).json({ error: 'Contraseña incorrecta' });
                }
            });
        } else {
            res.status(400).json({ error: 'Usuario no encontrado' });
        }
    });
});

// Ruta para cerrar sesión
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.send('Sesión cerrada');
    });
});

// Ruta para agregar tareas
app.post('/api/tasks', (req, res) => {
    const task = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'INSERT INTO tasks (id_user, name, completed) VALUES (?, ?, ?)';
    db.query(sql, [userId, task.name, false], (err, result) => {
        if (err) {
            console.error('Error al agregar tarea:', err);
            res.status(500).send('Error al agregar tarea');
        } else {
            res.status(201).json({ id: result.insertId, ...task });
        }
    });
});

// Ruta para obtener tareas (requiere autenticación)
app.get('/api/tasks', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'SELECT * FROM tasks WHERE id_user = ?';
    db.query(sql, [userId], (err, tasks) => {
        if (err) {
            console.error('Error al obtener tareas:', err);
            res.status(500).send('Error al obtener tareas');
        } else {
            res.json(tasks);
        }
    });
});

// Ruta para editar una tarea
app.put('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { name } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'UPDATE tasks SET name = ? WHERE id_user = ? AND id = ?';
    db.query(sql, [name, userId, taskId], (err) => {
        if (err) {
            console.error('Error al editar la tarea:', err);
            res.status(500).send('Error al editar la tarea');
        } else {
            res.send('Tarea editada con éxito');
        }
    });
});

// Ruta para cambiar el estado de completado de una tarea
app.patch('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { completed } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'UPDATE tasks SET completed = ? WHERE id_user = ? AND id = ?';
    db.query(sql, [completed, userId, taskId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el estado de la tarea:', err);
            res.status(500).send('Error al actualizar el estado de la tarea');
        } else {
            res.send('Estado de tarea actualizado');
        }
    });
});

// Ruta para eliminar una tarea
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).send('Usuario no autenticado');
    }

    const sql = 'DELETE FROM tasks WHERE id_user = ? AND id = ?';
    db.query(sql, [userId, taskId], (err, result) => {
        if (err) {
            console.error('Error al eliminar la tarea:', err);
            res.status(500).send('Error al eliminar la tarea');
        } else {
            res.send('Tarea eliminada con éxito');
        }
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
