const hubspot = require("@hubspot/api-client");

exports.main = async (context = {}) => {
    const { contactId, objectTypeId } = context.parameters;

    if (!contactId || !objectTypeId) {
        return {
            success: false,
            message: "ID do objeto ou tipo de objeto não fornecido",
        };
    }

    try {
        const hubspotClient = new hubspot.Client({
            accessToken: context.secrets.privatekey2,
        });

        let properties = [];
        let objectData;

        // Definir as propriedades a buscar com base no tipo de objeto
        switch (objectTypeId) {
            case "0-1": // Contatos
                properties = ["phone", "firstname", "lastname", "email"];
                objectData = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties);
                break;
            case "0-2": // Empresas
                properties = ["phone", "name"];
                objectData = await hubspotClient.crm.companies.basicApi.getById(contactId, properties);
                break;
            case "0-3": // Negócios
                // Negócios não têm telefone diretamente, então buscamos o contato associado
                const dealData = await hubspotClient.crm.deals.basicApi.getById(contactId, ["dealname"]);
                const associations = await hubspotClient.crm.deals.associationsApi.getAll(contactId, "contact");
                if (associations.results && associations.results.length > 0) {
                    const associatedContactId = associations.results[0].id;
                    const contactData = await hubspotClient.crm.contacts.basicApi.getById(associatedContactId, ["phone"]);
                    objectData = {
                        properties: {
                            dealname: dealData.properties.dealname,
                            phone: contactData.properties.phone,
                        },
                    };
                } else {
                    objectData = {
                        properties: {
                            dealname: dealData.properties.dealname,
                            phone: null,
                        },
                    };
                }
                break;
            case "0-5": // Tickets
                // Tickets podem ter propriedades personalizadas, ajustamos conforme necessário
                properties = ["subject", "content"];
                objectData = await hubspotClient.crm.tickets.basicApi.getById(contactId, properties);
                // Buscar contato associado para obter o telefone
                const ticketAssociations = await hubspotClient.crm.tickets.associationsApi.getAll(contactId, "contact");
                if (ticketAssociations.results && ticketAssociations.results.length > 0) {
                    const associatedContactId = ticketAssociations.results[0].id;
                    const contactData = await hubspotClient.crm.contacts.basicApi.getById(associatedContactId, ["phone"]);
                    objectData.properties.phone = contactData.properties.phone;
                } else {
                    objectData.properties.phone = null;
                }
                break;
            default: // Objetos personalizados (como "Clientes")
                // Para objetos personalizados, usamos a API genérica
                properties = ["phone"]; // Ajuste conforme as propriedades do seu objeto personalizado
                objectData = await hubspotClient.crm.objects.basicApi.getById(objectTypeId, contactId, properties);
                break;
        }

        if (objectData && objectData.properties) {
            return {
                success: true,
                data: {
                    id: contactId,
                    objectTypeId: objectTypeId,
                    ...objectData.properties,
                },
            };
        } else {
            return {
                success: false,
                message: "Não foi possível obter os dados do objeto",
            };
        }
    } catch (error) {
        console.error("Error fetching object data:", error);
        return {
            success: false,
            message: `Erro ao buscar dados do objeto: ${error.message}`,
        };
    }
};