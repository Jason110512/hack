document.getElementById('statsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    getHistoricalStats();
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
 * Convierte una cadena de datetime-local a timestamp Unix (segundos).
 * @param {string} datetimeLocalString - La cadena de fecha y hora local.
 * @returns {number} El timestamp Unix en segundos.
 */
function dateToUnixTimestamp(datetimeLocalString) {
    if (!datetimeLocalString) return 0;
    // getTime() devuelve milisegundos, por eso se divide por 1000
    return Math.floor(new Date(datetimeLocalString).getTime() / 1000);
}

/**
 * Obtiene el historial de un ítem de Zabbix, calcula estadísticas (min/max/avg), y las muestra.
 */
async function getHistoricalStats() {
    const authToken = document.getElementById('authToken').value;
    const itemId = document.getElementById('itemId').value;
    const timeFrom = dateToUnixTimestamp(document.getElementById('timeFrom').value);
    const timeTill = dateToUnixTimestamp(document.getElementById('timeTill').value);
    const messageDiv = document.getElementById('message');
    
    // Tipo de historial: 0 (numérico float) es el más común
    const historyType = 0; 
    
    messageDiv.textContent = 'Obteniendo datos históricos...';
    messageDiv.style.color = '#333';

    // Limpiar resultados previos
    document.getElementById('sampleCount').textContent = '---';
    document.getElementById('averageValue').textContent = '---';
    document.getElementById('minValue').textContent = '---';
    document.getElementById('maxValue').textContent = '---';

    // --- 1. Parámetros para history.get ---
    const historyParams = {
        output: "extend",
        history: historyType,
        itemids: [itemId],
        time_from: timeFrom,
        time_till: timeTill,
        sortfield: "clock",
        sortorder: "DESC"
    };

    try {
        // --- 2. Llamar al método history.get ---
        const data = await makeApiCall("history.get", historyParams, authToken);
        
        if (data.error) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = `🚫 Error de API: ${data.error.data || data.error.message}. Verifica tus permisos, token o el ID del ítem.`;
            
        } else if (data.result && data.result.length > 0) {
            const values = data.result.map(entry => parseFloat(entry.value));
            
            // --- 3. Calcular estadísticas ---
            const total = values.reduce((sum, value) => sum + value, 0);
            const average = total / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            messageDiv.style.color = 'green';
            messageDiv.textContent = `✅ ${values.length} muestras analizadas con éxito.`;

            // Mostrar los resultados
            document.getElementById('sampleCount').textContent = values.length;
            document.getElementById('averageValue').textContent = average.toFixed(2);
            document.getElementById('minValue').textContent = min;
            document.getElementById('maxValue').textContent = max;

        } else {
            messageDiv.style.color = 'orange';
            messageDiv.textContent = `⚠️ No se encontraron datos históricos para el Ítem ${itemId} en el rango de tiempo especificado.`;
        }

    } catch (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = `❌ Error de conexión: ${error.message}`;
    }
}