import './App.css'

const statCards = [
  { label: 'Audience Growth', value: '+28%', note: 'vs last month', tone: 'sunrise' },
  { label: 'Engagement Rate', value: '7.4%', note: 'above benchmark', tone: 'ocean' },
  { label: 'Scheduled Posts', value: '18', note: 'next 5 days', tone: 'mint' },
]

const performanceBars = [
  { day: 'Mon', value: 64 },
  { day: 'Tue', value: 82 },
  { day: 'Wed', value: 74 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 86 },
  { day: 'Sat', value: 58 },
  { day: 'Sun', value: 77 },
]

const campaignQueue = [
  { platform: 'Instagram', title: 'Spring launch teaser', time: '09:30 AM', status: 'Ready' },
  { platform: 'LinkedIn', title: 'Founder insight carousel', time: '11:45 AM', status: 'Review' },
  { platform: 'X', title: 'Live event reminder', time: '05:15 PM', status: 'Queued' },
]

const topPosts = [
  { title: 'Behind the build reel', metric: '124K reach', accent: 'coral' },
  { title: 'Community poll snapshot', metric: '8.9% CTR', accent: 'gold' },
  { title: 'Product reveal thread', metric: '3.2K saves', accent: 'sky' },
]

function App() {
  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">OptiZenqor social command</p>
          <h1>One screen to steer campaigns, creators, and momentum.</h1>
          <p className="hero-text">
            Track channel health, spot the next growth move, and keep every post in
            motion without hopping between tabs.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-action">
            Create Campaign
          </button>
          <button type="button" className="secondary-action">
            Export Report
          </button>
        </div>
      </section>

      <section className="stat-grid" aria-label="Key performance metrics">
        {statCards.map((card) => (
          <article key={card.label} className={`stat-card ${card.tone}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Weekly pulse</p>
              <h2>Engagement performance</h2>
            </div>
            <span className="pill positive">+12.6%</span>
          </div>

          <div className="performance-chart" aria-label="Weekly engagement chart">
            {performanceBars.map((bar) => (
              <div key={bar.day} className="bar-column">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${bar.value}%` }} />
                </div>
                <span>{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="performance-footer">
            <div>
              <span className="footer-label">Best window</span>
              <strong>Thu, 8:00 PM</strong>
            </div>
            <div>
              <span className="footer-label">Top channel</span>
              <strong>Instagram Reels</strong>
            </div>
          </div>
        </article>

        <article className="panel queue-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Publishing lane</p>
              <h2>Today&apos;s queue</h2>
            </div>
            <span className="pill neutral">3 items</span>
          </div>

          <div className="queue-list">
            {campaignQueue.map((item) => (
              <div key={item.title} className="queue-item">
                <div className="queue-badge">{item.platform.slice(0, 2)}</div>
                <div className="queue-copy">
                  <strong>{item.title}</strong>
                  <span>
                    {item.platform} · {item.time}
                  </span>
                </div>
                <span className={`queue-status ${item.status.toLowerCase()}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel insights-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Top content</p>
              <h2>Posts worth repeating</h2>
            </div>
            <a href="/" onClick={(event) => event.preventDefault()} className="text-link">
              View all
            </a>
          </div>

          <div className="insight-list">
            {topPosts.map((post) => (
              <div key={post.title} className="insight-item">
                <span className={`insight-dot ${post.accent}`} />
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.metric}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel spotlight-panel">
          <p className="section-label">Team spotlight</p>
          <h2>Creator collaboration is lifting saves by 19% this week.</h2>
          <p className="spotlight-copy">
            Short-form behind-the-scenes posts are outperforming polished launch
            edits. Double down on authentic cuts for the weekend push.
          </p>

          <div className="spotlight-tags">
            <span>#creator-led</span>
            <span>#weekend-push</span>
            <span>#save-rate</span>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
