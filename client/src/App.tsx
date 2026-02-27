import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { CreateEscrowPage } from './pages/CreateEscrowPage'
import { OpenEscrowsPage } from './pages/OpenEscrowsPage'
import './App.css'

function App() {
  const account = useCurrentAccount()

  return (
    <div className="app-shell">
      <div className="bg-grid" />
      <header className="navbar">
        <NavLink to="/" className="brand" end>
          Scrow
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className="nav-link" end>
            Landing
          </NavLink>
          <NavLink to="/create" className="nav-link">
            Create Escrow
          </NavLink>
          <NavLink to="/open" className="nav-link">
            View Open Escrows
          </NavLink>
        </nav>

        <ConnectButton className="connect-btn" connectText="Connect Wallet" />
      </header>

      {account ? (
        <p className="wallet-chip">Connected: {shortAddress(account.address)}</p>
      ) : (
        <p className="wallet-chip muted">Connect your wallet to create or view escrows.</p>
      )}

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateEscrowPage />} />
          <Route path="/open" element={<OpenEscrowsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default App
