document.addEventListener('DOMContentLoaded', () => {
    // Inicializar IndexedDB
    let db;
    const request = indexedDB.open('SegundoParcialDB', 1);

    request.onerror = (event) => {
        console.error('Database error:', event.target.error);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore('users', { keyPath: 'username' });
    };

    function saveUser(user) {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        store.add(user);
    }

    function getUser(username, callback) {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(username);
        request.onsuccess = () => callback(request.result);
    }

    function validatePhone(phone) {
        const regex = /^\+\d{10,15}$/;
        return regex.test(phone);
    }

    function loadCountryData() {
        fetch('CountryCodes.json')
            .then(res => res.json())
            .then(countries => {
                const countrySelect = document.getElementById('country');
                countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.code;
                    option.textContent = country.name;
                    countrySelect.appendChild(option);
                });

                countrySelect.addEventListener('change', (e) => {
                    const selected = countries.find(c => c.code === e.target.value);
                    if (selected) {
                        document.getElementById('phone').value = selected.dial_code + " ";
                        document.getElementById('flag').src = `https://flagcdn.com/w80/${selected.code.toLowerCase()}.png`;
                        document.getElementById('flag').classList.remove('hidden');
                    }
                });
            });
    }
    function loadDepartments() {
        fetch('https://api-colombia.com/api/v1/Department')
            .then(response => response.json())
            .then(departments => {
                const departmentSelect = document.getElementById('department');
                const cityInput = document.getElementById('city');
    
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    departmentSelect.appendChild(option);
                });
    
                departmentSelect.addEventListener('change', () => {
                    const selectedId = departmentSelect.value;
                    if (!selectedId) {
                        cityInput.value = '';
                        return;
                    }
    
                    fetch(`https://api-colombia.com/api/v1/Department/${selectedId}/cities`)
                        .then(response => response.json())
                        .then(cities => {
                            if (cities.length > 0) {
                                cityInput.value = cities[0].name;
                            } else {
                                cityInput.value = 'Sin ciudad disponible';
                            }
                        })
                        .catch(error => {
                            console.error('Error cargando ciudades:', error);
                            cityInput.value = 'Error al cargar ciudades';
                        });
                });
            });
    }
    
    

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        loadCountryData();
        loadDepartments();

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const username = document.getElementById('username').value.trim();
            const departmentSelect = document.getElementById('department');
            const department = departmentSelect.options[departmentSelect.selectedIndex].text.trim();
            const city = document.getElementById('city').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const password = document.getElementById('password').value;
            const message = document.getElementById('register-message');

            let valid = true;
            document.querySelectorAll('input, select').forEach(input => input.classList.remove('error'));
            message.textContent = '';

            if (username === '' || !username.includes('.')) {
                valid = false;
                document.getElementById('username').classList.add('error');
                message.textContent = 'Debe ingresar un nombre de usuario válido (ej: nombre.apellido)';
            }

            if (!validatePhone(phone)) {
                valid = false;
                document.getElementById('phone').classList.add('error');
                message.textContent = 'El número de teléfono debe ser válido, mínimo 10 dígitos incluyendo el código de país.';
            }

            if (!valid) return;

            const fullEmail = username + "@ucatolica.edu.co";

            getUser(username, (user) => {
                if (user) {
                    document.getElementById('username').classList.add('error');
                    message.textContent = 'Ese nombre de usuario ya está en uso. Prueba con otro.';
                } else {
                    const userData = { name, username, email: fullEmail, department, city, phone, password };
                    saveUser(userData);
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    window.location.href = 'home.html'; // 🔥 REDIRECCIÓN AL HOME
                }
            });
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const message = document.getElementById('login-message');

            document.querySelectorAll('input').forEach(input => input.classList.remove('error'));
            message.textContent = '';

            if (username === '') {
                document.getElementById('login-username').classList.add('error');
                message.textContent = 'Ingrese su nombre de usuario.';
                return;
            }

            getUser(username, (user) => {
                if (!user) {
                    document.getElementById('login-username').classList.add('error');
                    message.textContent = 'Usuario no encontrado.';
                } else if (user.password !== password) {
                    document.getElementById('login-password').classList.add('error');
                    message.textContent = 'Contraseña incorrecta.';
                } else {
                    sessionStorage.setItem('user', JSON.stringify(user));
                    window.location.href = 'home.html';
                }
            });
        });
    }

    if (document.getElementById('welcome-message')) {
        const userSession = JSON.parse(sessionStorage.getItem('user'));
        if (userSession) {
            document.getElementById('welcome-message').textContent = `¡Bienvenido, ${userSession.name}!`;
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar sesión';
            logoutButton.className = 'btn';
            logoutButton.onclick = () => {
                sessionStorage.removeItem('user');
                window.location.href = 'index.html';
            };
            document.querySelector('.container').appendChild(logoutButton);
        }
    }
});
