"use client"

import { useState, useEffect } from "react"
import { Divider, Button, Text, Flex, hubspot, LoadingSpinner, Heading, EmptyState } from "@hubspot/ui-extensions"
import { Phone, User, Hash, AlertTriangle } from "@hubspot/ui-extensions-icons"

// Define the extension to be run within the Hubspot CRM
hubspot.extend(({ context, runServerlessFunction, actions }) => (
    <Extension context={context} runServerless={runServerlessFunction} sendAlert={actions.addAlert} />
))

// Define the Extension component, taking in runServerless, context, & sendAlert as props
const Extension = ({ context, runServerless, sendAlert }) => {
  const [loading, setLoading] = useState(false);
  const [objectData, setObjectData] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [sendingToWebhook, setSendingToWebhook] = useState(false);

  useEffect(() => {
    // Log para depuração
    console.log("Context:", context);

    // Fetch object data only if we're in a record context (objectId and objectTypeId are available)
    const fetchObjectData = async () => {
      if (context.objectId && context.objectTypeId) {
        setLoading(true);
        try {
          const { response } = await runServerless({
            name: "getContactData",
            parameters: { contactId: context.objectId, objectTypeId: context.objectTypeId },
          });

          if (response && response.success) {
            setObjectData(response.data);
          } else {
            console.error("Error response:", response);
          }
        } catch (error) {
          console.error("Error fetching object data:", error);
          sendAlert({ message: "Erro ao buscar dados do objeto", type: "error" });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchObjectData();
  }, [context.objectId, context.objectTypeId, runServerless, sendAlert]);

  const handleCallClick = async () => {
    if (!objectData || !objectData.phone) {
      sendAlert({ message: "Número de telefone não disponível", type: "error" });
      return;
    }

    setCallInProgress(true);
    try {
      const { response } = await runServerless({
        name: "initiateCall",
        parameters: {
          agentId: context.user.id,
          extension: "default",
          phoneNumber: objectData.phone,
        },
      });

      if (response && response.success) {
        sendAlert({ message: "Chamada iniciada com sucesso!", type: "success" });
      } else {
        sendAlert({
          message: response?.message || "Erro ao iniciar chamada",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      sendAlert({ message: "Erro ao iniciar chamada", type: "error" });
    } finally {
      setCallInProgress(false);
    }
  };

  const handleSendToWebhook = async () => {
    if (!objectData || !objectData.phone) {
      sendAlert({ message: "Número de telefone não disponível", type: "error" });
      return;
    }

    setSendingToWebhook(true);
    try {
      const { response } = await runServerless({
        name: "sendToWebhook",
        parameters: {
          userId: context.user.id,
          phoneNumber: objectData.phone,
        },
      });

      if (response && response.success) {
        sendAlert({ message: "Dados enviados com sucesso para o webhook!", type: "success" });
      } else {
        sendAlert({
          message: response?.message || "Erro ao enviar dados para o webhook",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error sending data to webhook:", error);
      sendAlert({ message: "Erro ao enviar dados para o webhook", type: "error" });
    } finally {
      setSendingToWebhook(false);
    }
  };

  // Determinar a localização atual com base no context
  const isRecordContext = context.objectId && context.objectTypeId;
  const isIndexContext = context.portalId && !context.objectId;

  if (loading && isRecordContext) {
    return (
        <Flex justify="center" align="center" style={{ height: "100px" }}>
          <LoadingSpinner />
        </Flex>
    );
  }

  if (isRecordContext && !objectData) {
    return (
        <EmptyState
            title="Dados do objeto não disponíveis"
            description="Não foi possível carregar os dados do objeto."
        />
    );
  }

  // Renderizar conteúdo para páginas de índice (ex.: lista de contatos)
  if (isIndexContext) {
    return (
        <Flex direction="column" gap="medium">
          <Heading>Sonax Telefonia</Heading>
          <Text>Este é o cartão Sonax Telefonia na página de índice.</Text>
          <Flex align="center" gap="small">
            <User />
            <Text format={{ fontWeight: "bold" }}>Atendente:</Text>
            <Text>
              {context.user.firstName} {context.user.lastName}
            </Text>
          </Flex>
          <Flex align="center" gap="small">
            <Hash />
            <Text format={{ fontWeight: "bold" }}>ID do Atendente:</Text>
            <Text>{context.user.id}</Text>
          </Flex>
          <Text format={{ fontSize: "sm", color: "muted" }} align="center">
            Powered by Sonax Conector
          </Text>
        </Flex>
    );
  }

  // Renderizar conteúdo para registros (ex.: página de um contato)
  let objectLabel = "Objeto";
  let nameField = objectData.name || `${objectData.firstname || ""} ${objectData.lastname || ""}`.trim() || objectData.dealname || objectData.subject || "Desconhecido";

  switch (context.objectTypeId) {
    case "0-1":
      objectLabel = "Contato";
      break;
    case "0-2":
      objectLabel = "Empresa";
      break;
    case "0-3":
      objectLabel = "Negócio";
      break;
    case "0-5":
      objectLabel = "Ticket";
      break;
    default:
      objectLabel = "Cliente";
      break;
  }

  return (
      <Flex direction="column" gap="medium">
        <Heading>Sonax Telefonia</Heading>

        <Flex direction="column" gap="small">
          <Flex align="center" gap="small">
            <Text format={{ fontWeight: "bold" }}>{objectLabel}:</Text>
            <Text>{nameField}</Text>
          </Flex>

          <Flex align="center" gap="small">
            <Phone />
            <Text format={{ fontWeight: "bold" }}>Telefone:</Text>
            <Text>{objectData.phone || "Não disponível"}</Text>
          </Flex>

          <Flex align="center" gap="small">
            <User />
            <Text format={{ fontWeight: "bold" }}>Atendente:</Text>
            <Text>
              {context.user.firstName} {context.user.lastName}
            </Text>
          </Flex>

          <Flex align="center" gap="small">
            <Hash />
            <Text format={{ fontWeight: "bold" }}>ID do Atendente:</Text>
            <Text>{context.user.id}</Text>
          </Flex>
        </Flex>

        <Divider />

        <Flex justify="center" gap="small">
          <Button
              onClick={handleCallClick}
              disabled={callInProgress || !objectData.phone}
              variant="primary"
              size="md"
              icon={<Phone />}
          >
            {callInProgress ? "Iniciando chamada..." : "Ligar agora"}
          </Button>

          <Button
              onClick={handleSendToWebhook}
              disabled={sendingToWebhook || !objectData.phone}
              variant="secondary"
              size="md"
          >
            {sendingToWebhook ? "Enviando..." : "Enviar para Webhook"}
          </Button>
        </Flex>

        {!objectData.phone && (
            <Flex align="center" gap="small" style={{ color: "#f5a623" }}>
              <AlertTriangle />
              <Text format={{ fontSize: "sm", color: "#f5a623" }}>
                Este {objectLabel.toLowerCase()} não possui número de telefone cadastrado
              </Text>
            </Flex>
        )}

        <Text format={{ fontSize: "sm", color: "muted" }} align="center">
          Powered by Sonax Conector
        </Text>
      </Flex>
  );
};