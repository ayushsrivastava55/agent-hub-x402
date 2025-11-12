export type HubConfig = {
  facilitatorUrl: string
  network: string
  receiverAddress: string
  resourceUrl: string
  resourceDescription: string
}

export function getConfig(): HubConfig {
  const facilitatorUrl = process.env.FACILITATOR_URL || 'https://x402.org/facilitator'
  const network = process.env.NETWORK || 'solana-devnet'
  const receiverAddress = process.env.RECEIVER_ADDRESS || ''
  const resourceUrl = process.env.RESOURCE_URL || 'https://example.com/resource'
  const resourceDescription = process.env.RESOURCE_DESCRIPTION || 'Hub payment execution'

  if (!receiverAddress) {
    // We allow empty during dev, but adapters should validate before executing
  }

  return { facilitatorUrl, network, receiverAddress, resourceUrl, resourceDescription }
}
