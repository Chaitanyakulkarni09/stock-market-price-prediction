import { motion } from 'framer-motion'

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold gradient-text">About AI Stock Predictor</h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          This project demonstrates 11 core AI concepts from the syllabus through a practical stock market prediction system.
          It combines historical data analysis, real-time market insights, and various search and logic-based algorithms
          to assist in investment decision-making.
        </p>

        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">AI Concepts Implemented</h2>
          <ul className="space-y-3">
            {[
              { concept: 'Knowledge Base Systems', desc: 'Trained ML models (Random Forest) store patterns from historical data.' },
              { concept: 'State Space Search', desc: 'BFS/DFS visualizer on stock decision tree (AI Engine page).' },
              { concept: 'Production Systems', desc: 'IF‑THEN trading rules panel (AI Engine).' },
              { concept: 'Intelligent Agents', desc: 'PEAS description of prediction agent (AI Engine).' },
              { concept: 'Informed Search / Heuristic', desc: 'A* panel with custom heuristic (AI Engine).' },
              { concept: 'Minimax / Adversarial Search', desc: 'AI vs Market game simulation (AI Engine).' },
              { concept: 'Forward/Backward Chaining', desc: 'Propositional Logic truth table (AI Engine).' },
              { concept: 'Turing Test', desc: 'Rate chatbot responses as human/machine (Chatbot page).' },
              { concept: 'Problem Formulation', desc: 'Stock prediction defined as search problem (AI Engine).' },
              { concept: 'Constraint Satisfaction', desc: 'Portfolio Builder with budget, stock limits, and sector exclusions (Portfolio page).' },
              { concept: 'Means‑Ends Analysis', desc: 'Goal‑based investment planner (Dashboard card).' }
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white font-semibold">{item.concept}</strong> – {item.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-blue-500">Backend</p>
              <ul className="text-slate-600 dark:text-slate-400">
                <li>FastAPI, Python, scikit-learn</li>
                <li>Alpha Vantage API, MySQL</li>
                <li>Deployed on Railway/Render</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-blue-500">Frontend</p>
              <ul className="text-slate-600 dark:text-slate-400">
                <li>React, Vite, Tailwind CSS</li>
                <li>Lightweight Charts, Framer Motion</li>
                <li>Deployed on Vercel</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <a href="https://github.com" target="_blank" rel="noreferrer" 
             className="px-6 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold hover:opacity-90 transition-all">
            View on GitHub
          </a>
        </div>
      </div>
    </motion.div>
  )
}
