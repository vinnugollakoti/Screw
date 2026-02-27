import { useNavigate } from 'react-router-dom'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <section className="landing">
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      <article className="hero panel hero-surface">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Landing Page</p>
            <h1>
              <span>Scrow</span>
              <small>Modern Sui escrow with clean on-chain execution.</small>
            </h1>
            <p className="lead">
              Built for trusted buyer and seller settlement. Lock SUI, track
              escrow state in real time, and complete with transparent release
              or refund actions.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => navigate('/create')}>
                Create Escrow
              </button>
              <button className="secondary-btn" onClick={() => navigate('/open')}>
                View Open Escrows
              </button>
            </div>

            <div className="hero-links">
              <a href="https://github.com/vinnugollakoti/Screw.git" target="_blank" rel="noreferrer">
                GitHub Repository
              </a>
              <a href="https://x.com/VinnuGollakoti" target="_blank" rel="noreferrer">
                Creator on X
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="pulse-ring pulse-ring-one" />
            <div className="pulse-ring pulse-ring-two" />
            <div className="stat-card">
              <p>Chain</p>
              <strong>Sui Testnet</strong>
            </div>
            <div className="stat-card">
              <p>Flow</p>
              <strong>Create - Track - Settle</strong>
            </div>
            <div className="stat-card">
              <p>Brand</p>
              <strong>Scrow = Sui Escrow</strong>
            </div>
          </div>
        </div>
      </article>

      <section className="feature-grid">
        <article className="feature-card panel">
          <h3>On-chain trust layer</h3>
          <p>Funds remain in escrow until release, refund, or cancellation approval conditions are met.</p>
        </article>
        <article className="feature-card panel">
          <h3>Action-first controls</h3>
          <p>Create, monitor, request cancel, approve cancel, and settle from a single interface.</p>
        </article>
        <article className="feature-card panel">
          <h3>Fast Sui execution</h3>
          <p>Move-powered escrow logic with wallet-native transaction signing and status updates.</p>
        </article>
      </section>

      <section className="steps panel">
        <h2>How It Works</h2>
        <div className="step-row">
          <div>
            <strong>01</strong>
            <p>Buyer creates escrow and locks SUI with seller address and timeout details.</p>
          </div>
          <div>
            <strong>02</strong>
            <p>Escrow stays open while both parties track status and optional cancel requests.</p>
          </div>
          <div>
            <strong>03</strong>
            <p>Release or refund finalizes the deal with transparent records on Sui.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Scrow - Sui Escrow</p>
        <a href="https://x.com/VinnuGollakoti" target="_blank" rel="noreferrer">
          Crafted by Vinnu Gollakoti
        </a>
      </footer>
    </section>
  )
}
