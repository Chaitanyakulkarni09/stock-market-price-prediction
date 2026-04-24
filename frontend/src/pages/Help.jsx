import { motion } from 'framer-motion'

export default function Help() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl pb-10">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Help & User Guide</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Master the AI-powered features of the platform</p>
      </div>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Getting Started</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Register or login to access personalized features like your custom watchlist, the Portfolio Builder, and saved chat history.
          </p>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. AI Engine – Explore AI Concepts</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Visit the AI Engine page to interact with core AI implementations:</p>
          <ul className="space-y-3">
            {[
              { title: 'BFS/DFS vs Informed Search', desc: 'Select an algorithm and run it on a stock decision tree to see how AI explores possibilities.' },
              { title: 'Propositional Logic', desc: 'Toggle various premises (like RSI < 30) to see how the inference engine derives trading rules.' },
              { title: 'Production Rules & Agents', desc: 'Understand the PEAS framework and how the agent uses rules to decide Buy/Sell/Hold signals.' }
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{item.title}</strong> – {item.desc}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Portfolio Builder (CSP)</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Set your budget, minimum/maximum stocks, risk level, and sectors to exclude. The <strong>Constraint Satisfaction Problem (CSP)</strong> solver returns valid portfolios respecting all your rules. Results are sorted by expected return using live ML predictions.
          </p>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Dashboard – Means‑Ends Analysis</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            On the Dashboard, use the goal card to set a target portfolio value and time horizon. The system uses <strong>Means‑Ends Analysis</strong> to calculate the gap and recommends aggressive, moderate, or conservative actions to reach your financial goal.
          </p>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Chatbot – Turing Test</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Ask any stock‑related question. After each response, rate it as <strong>Human</strong> or <strong>Machine</strong>. This interactive Turing Test helps evaluate the conversational quality of our AI.
          </p>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Watchlist & Predictions</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Add stocks to your watchlist to track prices. Use the Predictions page to see historical forecast accuracy and visualize how the Random Forest model performs across different sectors.
          </p>
        </section>

        <div className="card bg-amber-500/5 border-amber-500/20">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠️ Disclaimer</p>
          <p className="text-xs text-amber-600 dark:text-amber-500/70 leading-relaxed">
            This platform is for educational purposes only. AI predictions are not financial advice.
            Always conduct your own research before making investment decisions.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
