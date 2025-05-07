// Esperar que todo el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar IndexedDB
    let db;
    const request = indexedDB.open('SegundoParcialDB', 1);

    request.onerror = (event) => {
        console.error('Error al abrir la base de datos:', event.target.error);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore('users', { keyPath: 'email' });
    };

    // Función para guardar usuario
    function saveUser(user) {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        store.add(user);
    }

    // Función para buscar usuario
    function getUser(email, callback) {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(email);

        request.onsuccess = () => callback(request.result);
    }

    // Validar correo institucional
    function isInstitutionalEmail(email) {
        return email.endsWith('@ucatolica.edu.co') || email.endsWith('@misena.edu.co');
    }

    // -------- Registro --------
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        // Cargar departamentos
        const departmentSelect = document.getElementById('department');
        const citySelect = document.getElementById('city');

        fetch('https://api-colombia.com/api/v1/Department')
            .then(response => response.json())
            .then(data => {
                data.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    departmentSelect.appendChild(option);
                });
            });

        // Cargar ciudades basadas en departamento
        departmentSelect.addEventListener('change', () => {
            citySelect.innerHTML = '<option value=\"\">Seleccione Ciudad</option>';
            const deptId = departmentSelect.value;
            fetch(`https://api-colombia.com/api/v1/Department/${deptId}/cities`)
                .then(response => response.json())
                .then(cities => {
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.name;
                        option.textContent = city.name;
                        citySelect.appendChild(option);
                    });
                });
        });

        // Evento submit de registro
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const department = departmentSelect.options[departmentSelect.selectedIndex].text;
            const city = citySelect.value.trim();
            const password = document.getElementById('password').value;

            const message = document.getElementById('register-message');

            if (!isInstitutionalEmail(email)) {
                message.textContent = 'Debe usar un correo institucional.';
                return;
            }

            getUser(email, (user) => {
                if (user) {
                    message.textContent = 'El correo ya está registrado.';
                } else {
                    saveUser({ name, email, phone, department, city, password });
                    message.style.color = 'green';
                    message.textContent = '¡Registro exitoso!';
                    registerForm.reset();
                }
            });
        });
    }

    // -------- Login --------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            const message = document.getElementById('login-message');

            getUser(email, (user) => {
                if (user && user.password === password) {
                    sessionStorage.setItem('user', JSON.stringify(user));
                    window.location.href = 'index.html'; // Redirigir a home
                } else {
                    message.textContent = 'Correo o contraseña incorrectos.';
                }
            });
        });
    }

    // -------- Mostrar bienvenida si hay sesión activa --------
    if (document.getElementById('welcome-message')) {
        const userSession = JSON.parse(sessionStorage.getItem('user'));
        if (userSession) {
            document.getElementById('welcome-message').textContent = `¡Bienvenido, ${userSession.name}!`;
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar sesión';
            logoutButton.className = 'btn';
            logoutButton.onclick = () => {
                sessionStorage.removeItem('user');
                window.location.reload();
            };
            document.querySelector('.container').appendChild(logoutButton);
        } else {
            document.querySelector('.button-group').classList.remove('hidden');
        }
    }
});
