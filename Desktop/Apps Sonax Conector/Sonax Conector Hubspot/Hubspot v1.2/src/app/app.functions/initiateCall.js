const axios = require("axios")

exports.main = async (context = {}) => {
    const { agentId, extension, phoneNumber } = context.parameters

    if (!phoneNumber) {
        return {
            success: false,
            message: "Número de telefone não fornecido",
        }
    }

    try {
        // Formatar o número de telefone (remover caracteres não numéricos)
        const formattedPhone = phoneNumber.replace(/\D/g, "")

        // Enviar os dados para o webhook
        const webhookUrl = "https://n8n.sonax.io/webhook-test/73ec61c8-e1f7-4ce2-a054-56b77e23ddcc"

        console.log("Enviando dados para webhook:", {
            agentId,
            extension,
            phoneNumber: formattedPhone,
        })

        const response = await axios.post(webhookUrl, {
            agentId: agentId || "default_agent",
            extension: extension || "default_extension",
            phoneNumber: formattedPhone,
        })

        console.log("Resposta do webhook:", response.data)

        if (response.status >= 200 && response.status < 300) {
            return {
                success: true,
                message: "Chamada iniciada com sucesso",
                data: response.data,
            }
        } else {
            return {
                success: false,
                message: `Erro ao iniciar chamada: ${response.statusText}`,
            }
        }
    } catch (error) {
        console.error("Error initiating call:", error)
        return {
            success: false,
            message: `Erro ao iniciar chamada: ${error.message}`,
        }
    }
}
