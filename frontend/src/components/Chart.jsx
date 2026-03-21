import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useTheme } from '../context/ThemeContext'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
)

const baseOptions = (isDark) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: {
        color: isDark ? '#94a3b8' : '#64748b',
        font: { family: 'Inter', size: 12 },
        boxWidth: 12,
        padding: 16,
      }
    },
    tooltip: {
      backgroundColor: isDark ? '#1E293B' : '#fff',
      titleColor: isDark ? '#f1f5f9' : '#0f172a',
      bodyColor: isDark ? '#94a3b8' : '#64748b',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
    }
  },
  scales: {
    x: {
      grid: { color: isDark ? '#1e293b' : '#f1f5f9', drawBorder: false },
      ticks: { color: isDark ? '#475569' : '#94a3b8', font: { size: 11 }, maxTicksLimit: 8 }
    },
    y: {
      grid: { color: isDark ? '#1e293b' : '#f1f5f9', drawBorder: false },
      ticks: { color: isDark ? '#475569' : '#94a3b8', font: { size: 11 } }
    }
  }
})

export function LineChart({ labels, datasets, height = 280 }) {
  const { isDark } = useTheme()
  return (
    <div style={{ height }}>
      <Line
        data={{ labels, datasets }}
        options={{
          ...baseOptions(isDark),
          elements: { line: { tension: 0.4 }, point: { radius: 0, hoverRadius: 5 } }
        }}
      />
    </div>
  )
}

export function BarChart({ labels, datasets, height = 200 }) {
  const { isDark } = useTheme()
  return (
    <div style={{ height }}>
      <Bar data={{ labels, datasets }} options={baseOptions(isDark)} />
    </div>
  )
}

export function Sparkline({ data, color = '#3B82F6', height = 60 }) {
  const { isDark } = useTheme()
  const labels = data.map((_, i) => i)
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: [{
            data,
            borderColor: color,
            borderWidth: 2,
            fill: true,
            backgroundColor: `${color}15`,
            tension: 0.4,
            pointRadius: 0,
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }}
      />
    </div>
  )
}

export default LineChart
