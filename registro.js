document.getElementById('formulario-registro').addEventListener('submit', function(e) {
    e.preventDefault();

    // ***************************************************************
    // !!! ADVERTENCIA DE SEGURIDAD CRÍTICA !!!
    // NUNCA expongas la URL de la API de Zabbix ni el AUTH_TOKEN en código de cliente (navegador).
    // Esta lógica DEBE residir en un backend seguro.
    // ***************************************************************
    const ZABBIX_URL = 'https://tudominio.zabbix.cloud/api_jsonrpc.php';
    const AUTH_TOKEN = 'TU_TOKEN_DE_API_ZABBIX_AQUI'; 
    // ***************************************************************

    const alias = document.getElementById('alias').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const usrgrpid = document.getElementById('usrgrpid').value;
    
    // Los campos "edad" y "anio" NO son reconocidos por la API de Zabbix user.create.
    
    const requestData = {
        "jsonrpc": "2.0",
        "method": "user.create",
        "params": {
            "alias": alias,
            "passwd": password,
            "name": name,
            "surname": surname,
            "usrgrps": [
                { "usrgrpid": usrgrpid } // Se requiere el ID del grupo
            ],
            "lang": "es_ES"
        },
        "auth": AUTH_TOKEN, 
        "id": 1 
    };

    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.style.display = 'block';
    resultadoDiv.textContent = 'Enviando solicitud a la API de Zabbix...';

    fetch(ZABBIX_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json-rpc',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.result) {
            resultadoDiv.style.backgroundColor = '#d4edda';
            resultadoDiv.style.color = '#155724';
            resultadoDiv.textContent = `✅ Usuario creado con éxito. User ID(s): ${data.result.userids.join(', ')}`;
        } else if (data.error) {
            resultadoDiv.style.backgroundColor = '#f8d7da';
            resultadoDiv.style.color = '#721c24';
            resultadoDiv.textContent = `❌ Error de API: ${data.error.message} - ${data.error.data}`;
        } else {
            resultadoDiv.style.backgroundColor = '#fff3cd';
            resultadoDiv.style.color = '#856404';
            resultadoDiv.textContent = '⚠️ Respuesta inesperada de la API.';
        }
    })
    .catch(error => {
        resultadoDiv.style.backgroundColor = '#f8d7da';
        resultadoDiv.style.color = '#721c24';
        resultadoDiv.textContent = `❌ Error de red/conexión: ${error}`;
    });
});