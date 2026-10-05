const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configurações do DataServer do RM Cloud
const RM_CONFIG = {
  apiUrl: 'https://inspired203870.rm.cloudtotvs.com.br:10607/rmsrestdataserver/rest/RMSPRJ4440576Server',
  username: 'claudio.totvs',
  password: 'Totvs@2025'
};

// Rota do Webhook do Unico
app.post('/webhook', async (req, res) => {
  try {
    const payloadUnico = req.body;
    console.log('[Webhook Unico Recebido]:', JSON.stringify(payloadUnico));

    // Mapeamento do JSON recebido da Unico para o DataServer ZMDWEBHOOK
    const bodyRM = {
      ZMDWEBHOOK: [
        {
          INTEGRATION: payloadUnico.integration || payloadUnico.id || "",
          UIDFUNC: payloadUnico.position || payloadUnico.uidfunc || payloadUnico.integration || "",
          POSNUMBER: payloadUnico["position-number"] || payloadUnico.posnumber || "",
          UNIT: payloadUnico.unit || "",
          EVENTO: payloadUnico.event || "EVENTO_UNICO"
        }
      ]
    };

    // Autenticação Basic para o TOTVS RM Cloud
    const authHeader = Buffer.from(`\({RM_CONFIG.username}:\){RM_CONFIG.password}`).toString('base64');

    // Envio POST para o DataServer do RM
    const rmResponse = await axios.post(RM_CONFIG.apiUrl, bodyRM, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      timeout: 30000
    });

    console.log('[Resposta DataServer RM]:', rmResponse.status, rmResponse.data);

    // Resposta imediata de sucesso para a Unico
    return res.status(200).json({
      status: "success",
      message: "Webhook recebido e enviado ao RM com sucesso."
    });

  } catch (error) {
    console.error('[Erro Webhook -> RM]:', error.message);
    if (error.response) {
      console.error('[Detalhes RM]:', error.response.status, error.response.data);
    }

    return res.status(500).json({
      status: "error",
      message: "Erro ao repassar dados para o RM",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de Webhook rodando na porta ${PORT}`));