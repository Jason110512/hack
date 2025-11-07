document.getElementById('problemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    getProblems();
});

/**
 * Función genérica para realizar llamadas a la API de Zabbix.
 * @param {string} method - El método de la API de Zabbix a llamar.
 * @param {object} params - Los parámetros para el método.
 * @param {string} auth - El token de autenticación.
 * @returns {Promise<object>} La respuesta JSON de la API.
 */
function makeApiCall(method, params, auth) {
    const url = document.getElementById('zabbixUrl').value;
    const payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "auth": auth,
        "id": 1
    };
    
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => response.json());
}

/**
 * Traduce el código de severidad de Zabbix a texto con clases CSS.
 * @param {number} severity - El código de severidad (0-5).
 * @returns {string} HTML con el texto de severidad y la clase CSS.
 */
function getSeverityText(severity) {
    const severities = {
        0: 'No clasificado',
        1: 'Información',
        2: 'Advertencia',
        3: 'Promedio',
        4: 'Alto',
        5: 'Desastre'
    };
    return `<span class="severity-${severity}">${severities[severity] || 'Desconocido'}</span>`;
}

/**
 * Convierte un timestamp Unix a formato de hora local legible.
 * @param {number} timestamp - El timestamp Unix (segundos).
 * @returns {string} La hora formateada.
 */
function unixToLocalTime(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Consulta y muestra los problemas (triggers activos) de Zabbix.
 */
async function getProblems() {
    const authToken = document.getElementById('authToken').value;
    const messageDiv = document.getElementById('message');
    const problemListDiv = document.getElementById('problemList');
    
    messageDiv.textContent = 'Buscando problemas activos...';
    messageDiv.style.color = '#333';
    problemListDiv.innerHTML = ''; 

    // --- 1. Parámetros para problem.get ---
    const problemParams = {
        output: "extend",
        // Mostrar solo los problemas que NO han sido resueltos
        recent: true, 
        // Excluir eventos cerrados
        acknowledged: false, 
        // Obtener datos del trigger y host asociados
        selectHosts: ["name"], 
        selectTriggers: ["description", "severity"]
    };

    try {
        // --- 2. Llamar al método problem.get ---
        const data = await makeApiCall("problem.get", problemParams, authToken);
        
        if (data.error) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = `🚫 Error de API: ${data.error.data || data.error.message}. Verifica el token y los permisos.`;
        } else if (data.result && data.result.length > 0) {
            const problems = data.result;
            messageDiv.style.color = 'red'; // Color de alerta
            messageDiv.textContent = `🚨 Se encontraron ${problems.length} "Vuelos Activos" (Problemas) sin resolver.`;

            // --- 3. Generar la tabla de resultados ---
            let tableHTML = '<table>';
            tableHTML += '<thead><tr><th>Host Afectado</th><th>Problema (Trigger)</th><th>Severidad</th><th>Hora de Inicio</th></tr></thead><tbody>';

            problems.forEach(problem => {
                const hostName = problem.hosts && problem.hosts.length > 0 ? problem.hosts[0].name : 'Host Desconocido';
                const problemDescription = problem.opdata || problem.name;
                const severity = problem.severity;
                
                tableHTML += `
                    <tr>
                        <td><strong>${hostName}</strong></td>
                        <td>${problemDescription}</td>
                        <td>${getSeverityText(severity)}</td>
                        <td>${unixToLocalTime(problem.clock)}</td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            problemListDiv.innerHTML = tableHTML;

        } else {
            messageDiv.style.color = 'green';
            problemListDiv.innerHTML = '';
            messageDiv.textContent = `✅ ¡No hay "Vuelos Activos" (Problemas) sin resolver!`;
        }

    } catch (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = `❌ Error de conexión: ${error.message}`;
    }
}