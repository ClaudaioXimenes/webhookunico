const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const RM_CONFIG = {
  apiUrl: 'https://inspired203870.rm.cloudtotvs.com.br:10607/rmsrestdataserver/rest/RMSPRJ4440576Server',
  // Usando exatamente a hash Base64 que funcionou no cURL/Postman
  authHeader: 'Basic Y2xhdWRpby50b3R2czpUb3R2czIwMjY='
};

app.get('/', (req, res) => {
  res.send('Gateway Webhook Unico -> TOTVS RM Cloud OK!');
});

app.post('/webhook', async (req, res) => {
  try {
    const payloadUnico = req.body;
    console.log('[Webhook Unico Recebido]:', JSON.stringify(payloadUnico));

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

    // Imita exatamente os cabeçalhos de uma requisição do Postman
    const rmResponse = await axios.post(RM_CONFIG.apiUrl, bodyRM, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': RM_CONFIG.authHeader,
        'User-Agent': 'PostmanRuntime/7.32.3',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    });

    console.log('[Resposta DataServer RM]:', rmResponse.status, rmResponse.data);

    return res.status(200).json({
      status: "success",
      message: "Webhook recebido e gravado no RM com sucesso.",
      dataServerResponse: rmResponse.data
    });

  } catch (error) {
    console.error('[Erro Webhook -> RM]:', error.message);
    if (error.response) {
      console.error('[Detalhes RM Error Status]:', error.response.status);
      console.error('[Detalhes RM Error Data]:', error.response.data);
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