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
  const [loading, setLoading] = useState(false)
  const [contactData, setContactData] = useState(null)
  const [callInProgress, setCallInProgress] = useState(false)

  useEffect(() => {
    // Fetch contact data when the component loads
    const fetchContactData = async () => {
      if (context.objectTypeId === "0-1" && context.objectId) {
        // 0-1 is for contacts
        setLoading(true)
        try {
          const { response } = await runServerless({
            name: "getContactData",
            parameters: { contactId: context.objectId },
          })

          if (response && response.success) {
            setContactData(response.data)
          } else {
            console.error("Error response:", response)
          }
        } catch (error) {
          console.error("Error fetching contact data:", error)
          sendAlert({ message: "Erro ao buscar dados do contato", type: "error" })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchContactData()
  }, [context.objectId, context.objectTypeId, runServerless, sendAlert])

  const handleCallClick = async () => {
    if (!contactData || !contactData.phone) {
      sendAlert({ message: "Número de telefone não disponível", type: "error" })
      return
    }

    setCallInProgress(true)
    try {
      const { response } = await runServerless({
        name: "initiateCall",
        parameters: {
          agentId: context.user.id,
          extension: "default", // Você pode adicionar um campo para personalizar isso
          phoneNumber: contactData.phone,
        },
      })

      if (response && response.success) {
        sendAlert({ message: "Chamada iniciada com sucesso!", type: "success" })
      } else {
        sendAlert({
          message: response?.message || "Erro ao iniciar chamada",
          type: "error",
        })
      }
    } catch (error) {
      console.error("Error initiating call:", error)
      sendAlert({ message: "Erro ao iniciar chamada", type: "error" })
    } finally {
      setCallInProgress(false)
    }
  }

  if (loading) {
    return (
        <Flex justify="center" align="center" style={{ height: "100px" }}>
          <LoadingSpinner />
        </Flex>
    )
  }

  if (!contactData) {
    return (
        <EmptyState
            title="Dados do contato não disponíveis"
            description="Não foi possível carregar os dados do contato."
        />
    )
  }

  return (
      <Flex direction="column" gap="medium">
        <Heading>Sonax Telefonia</Heading>

        <Flex direction="column" gap="small">
          <Flex align="center" gap="small">
            <Phone />
            <Text format={{ fontWeight: "bold" }}>Telefone:</Text>
            <Text>{contactData.phone || "Não disponível"}</Text>
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

        <Flex justify="center">
          <Button
              onClick={handleCallClick}
              disabled={callInProgress || !contactData.phone}
              variant="primary"
              size="md"
              icon={<Phone />}
          >
            {callInProgress ? "Iniciando chamada..." : "Ligar agora"}
          </Button>
        </Flex>

        {!contactData.phone && (
            <Flex align="center" gap="small" style={{ color: "#f5a623" }}>
              <AlertTriangle />
              <Text format={{ fontSize: "sm", color: "#f5a623" }}>
                Este contato não possui número de telefone cadastrado
              </Text>
            </Flex>
        )}

        <Text format={{ fontSize: "sm", color: "muted" }} align="center">
          Powered by Sonax Conector
        </Text>
      </Flex>
  )
}
