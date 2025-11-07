document.getElementById('trafficTrendForm').addEventListener('submit', function(e) {
    e.preventDefault();
    getTrafficTrends();
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
 * Convierte un timestamp Unix (segundos) a formato de hora local legible.
 * @param {number} timestamp - El timestamp Unix.
 * @returns {string} La hora formateada.
 */
function unixToLocalTime(timestamp) {
    if (!timestamp) return 'N/A';
    // Multiplicamos por 1000 porque el timestamp de Zabbix está en segundos (Unix)
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Consulta y muestra los datos de tendencia (tráfico de carga) de Zabbix.
 */
async function getTrafficTrends() {
    const authToken = document.getElementById('authToken').value;
    const itemId = document.getElementById('itemId').value;
    const timeFrom = dateToUnixTimestamp(document.getElementById('timeFrom').value);
    const timeTill = dateToUnixTimestamp(document.getElementById('timeTill').value);
    const messageDiv = document.getElementById('message');
    const trendDataDiv = document.getElementById('trendData');
    
    // Tipo de tendencia: 0 (numérico float) es el más común
    const trendType = 0; 
    
    messageDiv.textContent = 'Obteniendo tendencias de tráfico...';
    messageDiv.style.color = '#333';
    trendDataDiv.innerHTML = 'Cargando...';

    // --- 1. Parámetros para trend.get ---
    const trendParams = {
        output: ["clock", "num", "value_avg", "value_min", "value_max"],
        history: trendType,
        itemids: [itemId],
        time_from: timeFrom,
        time_till: timeTill,
        sortfield: "clock",
        sortorder: "ASC"
    };

    try {
        // --- 2. Llamar al método trend.get ---
        const data = await makeApiCall("trend.get", trendParams, authToken);
        
        if (data.error) {
            messageDiv.style.color = 'red';
            messageDiv.textContent = `🚫 Error de API: ${data.error.data || data.error.message}. Verifica el token y el ID del ítem.`;
            trendDataDiv.innerHTML = 'Error en la consulta de tendencias.';
        } else if (data.result && data.result.length > 0) {
            const trends = data.result;
            messageDiv.style.color = 'green';
            messageDiv.textContent = `✅ ${trends.length} periodos de tráfico aéreo analizados con éxito.`;

            // --- 3. Mostrar los resultados de las tendencias en una lista ---
            let trendHTML = '';
            
            trends.forEach(trend => {
                trendHTML += `
                    <div class="traffic-item">
                        <strong>Periodo:</strong> ${unixToLocalTime(trend.clock)} <br>
                        Promedio de Carga: <strong>${parseFloat(trend.value_avg).toFixed(2)}</strong> (Min: ${parseFloat(trend.value_min).toFixed(2)}, Max: ${parseFloat(trend.value_max).toFixed(2)})
                    </div>
                `;
            });

            trendDataDiv.innerHTML = trendHTML;

        } else {
            messageDiv.style.color = 'orange';
            trendDataDiv.innerHTML = 'No se encontraron datos de tendencia (tráfico) en el rango de tiempo especificado.';
            messageDiv.textContent = `⚠️ Ítem ${itemId} no tiene datos de tendencia disponibles.`;
        }

    } catch (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = `❌ Error de conexión o servidor: ${error.message}`;
    }
}