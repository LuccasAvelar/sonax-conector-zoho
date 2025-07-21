const axios = require("axios");

exports.main = async (context = {}) => {
    const { userId, phoneNumber } = context.parameters;

    if (!userId || !phoneNumber) {
        return {
            success: false,
            message: "ID do usuário ou número de telefone não fornecido",
        };
    }

    try {
        // Formatar o número de telefone (remover caracteres não numéricos)
        const formattedPhone = phoneNumber.replace(/\D/g/, "");

        // Enviar os dados para o webhook
        const webhookUrl = "https://n8n.sonax.io/webhook-test/73ec61c8-e1f7-4ce2-a054-56b77e23ddcc";

        console.log("Enviando dados para webhook:", {
            userId,
            phoneNumber: formattedPhone,
        });

        const response = await axios.post(webhookUrl, {
            userId,
            phoneNumber: formattedPhone,
        });

        console.log("Resposta do webhook:", response.data);

        if (response.status >= 200 && response.status < 300) {
            return {
                success: true,
                message: "Dados enviados com sucesso para o webhook",
                data: response.data,
            };
        } else {
            return {
                success: false,
                message: `Erro ao enviar dados: ${response.statusText}`,
            };
        }
    } catch (error) {
        console.error("Erro ao enviar dados para o webhook:", error);
        return {
            success: false,
            message: `Erro ao enviar dados: ${error.message}`,
        };
    }
};