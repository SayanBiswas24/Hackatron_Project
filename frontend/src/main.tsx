import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WalletManager, WalletProvider, WalletId, NetworkId } from '@txnlab/use-wallet-react'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.tsx'

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}


import { CurrencyProvider } from './context/CurrencyContext'

window.Buffer = Buffer
const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA
  ],
  networks: {
    [NetworkId.TESTNET]: {
      algod: {
        baseServer: 'https://testnet-api.algonode.cloud',
        port: '',
        token: ''
      }
    }
  },
  defaultNetwork: NetworkId.TESTNET
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider manager={walletManager}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </WalletProvider>
  </StrictMode>
)
