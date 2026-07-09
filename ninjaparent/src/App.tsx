import { useState } from 'react'
import { children } from './data/mockData'
import { Header } from './components/Header'
import { Sidebar, type FilterType } from './components/Sidebar'
import { PriorityFeed } from './components/PriorityFeed'
import { WeekOverview } from './components/WeekOverview'
import { ConnectedSources } from './components/ConnectedSources'

function App() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar
          children={children}
          selectedChild={selectedChild}
          activeFilter={activeFilter}
          onSelectChild={setSelectedChild}
          onSelectFilter={setActiveFilter}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-8">
            <WeekOverview />
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <PriorityFeed selectedChild={selectedChild} activeFilter={activeFilter} />
              <div className="hidden lg:block">
                <ConnectedSources />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
