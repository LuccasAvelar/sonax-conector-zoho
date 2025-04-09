const hubspot = require("@hubspot/api-client")

exports.main = async (context = {}) => {
    const { contactId } = context.parameters

    if (!contactId) {
        return {
            success: false,
            message: "ID do contato não fornecido",
        }
    }

    try {
        const hubspotClient = new hubspot.Client({
            accessToken: context.secrets.PRIVATE_APP_ACCESS_TOKEN,
        })

        // Buscar os dados do contato
        const contactResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, [
            "phone",
            "firstname",
            "lastname",
            "email",
        ])

        if (contactResponse && contactResponse.properties) {
            return {
                success: true,
                data: {
                    id: contactId,
                    firstName: contactResponse.properties.firstname,
                    lastName: contactResponse.properties.lastname,
                    email: contactResponse.properties.email,
                    phone: contactResponse.properties.phone,
                },
            }
        } else {
            return {
                success: false,
                message: "Não foi possível obter os dados do contato",
            }
        }
    } catch (error) {
        console.error("Error fetching contact data:", error)
        return {
            success: false,
            message: `Erro ao buscar dados do contato: ${error.message}`,
        }
    }
}
