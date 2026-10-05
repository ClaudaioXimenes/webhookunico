const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configurações do DataServer do RM Cloud (sem espaços extras)
const RM_CONFIG = {
  apiUrl: 'https://inspired203870.rm.cloudtotvs.com.br:10607/rmsrestdataserver/rest/RMSPRJ4440576Server',
  username: '1/claudio.totvs',
  password: 'Totvs2026'
};

// Rota do Webhook do Unico
app.post('/webhook', async (req, res) => {
  try {
    const payloadUnico = req.body;
    console.log('[Webhook Unico Recebido]:', JSON.stringify(payloadUnico));

    // Suporta tanto o payload padrão do Unico como o JSON ZMDWEBHOOK enviado nos testes
    let itemData = {};
    if (payloadUnico.ZMDWEBHOOK && Array.isArray(payloadUnico.ZMDWEBHOOK)) {
      itemData = payloadUnico.ZMDWEBHOOK[0];
    } else {
      itemData = {
        INTEGRATION: payloadUnico.integration || payloadUnico.id || "",
        UIDFUNC: payloadUnico.position || payloadUnico.uidfunc || payloadUnico.integration || "",
        POSNUMBER: String(payloadUnico["position-number"] || payloadUnico.posnumber || ""),
        UNIT: payloadUnico.unit || "",
        EVENTO: payloadUnico.event || "EVENTO_UNICO"
      };
    }

    const bodyRM = {
      ZMDWEBHOOK: [itemData]
    };

    // Autenticação Basic limpa e corrigida
    const credentials = `\({RM_CONFIG.username.trim()}:\){RM_CONFIG.password.trim()}`;
    const authHeader = Buffer.from(credentials).toString('base64');

    // Envio POST para o DataServer do RM
    const rmResponse = await axios.post(RM_CONFIG.apiUrl, bodyRM, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeader}`
      },
      timeout: 30000
    });

    console.log('[Resposta DataServer RM]:', rmResponse.status, rmResponse.data);

    // Resposta de sucesso
    return res.status(200).json({
      status: "success",
      message: "Webhook recebido e enviado ao RM com sucesso.",
      dataServerResponse: rmResponse.data
    });

  } catch (error) {
    console.error('[Erro Webhook -> RM]:', error.message);
    if (error.response) {
      console.error('[Detalhes RM]:', error.response.status, error.response.data);
    }

    return res.status(500).json({
      status: "error",
      message: "Erro ao repassar dados para o RM",
      error: error.response ? error.response.data : error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de Webhook rodando na porta ${PORT}`));