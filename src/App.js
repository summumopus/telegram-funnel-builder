import React, { useState, useEffect } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { supabase } from './supabaseClient'
import { validateTelegramAuth } from './utils/telegramAuth'

const App = () => {
  const [tg, setTg] = useState(null)
  const [view, setView] = useState('home')
  const [funnels, setFunnels] = useState([])
  const [selectedFunnel, setSelectedFunnel] = useState(null)
  const [pages, setPages] = useState([])

  // Initialize Telegram WebApp or fallback
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setTg(window.Telegram.WebApp)
    } else {
      setTg({
        ready: () => { },
        expand: () => { },
        MainButton: { setText: () => { }, show: () => { }, hide: () => { }, onClick: () => { } },
        BackButton: { show: () => { }, hide: () => { }, onClick: () => { } },
        HapticFeedback: { impactOccurred: () => { }, selectionChanged: () => { } },
        themeParams: {
          bg_color: '#ffffff',
          text_color: '#000000',
          hint_color: '#999999',
          link_color: '#2481cc',
          button_color: '#2481cc',
          button_text_color: '#ffffff',
          secondary_bg_color: '#f4f4f5',
          section_bg_color: '#ffffff',
          section_header_text_color: '#6d6d72',
          subtitle_text_color: '#999999',
          destructive_text_color: '#ff3b30',
        },
      })
    }
  }, [])

  const t = tg?.themeParams || {}

  // Telegram authentication
  const initData = window.Telegram?.WebApp?.initData
  const { isValid, user } = validateTelegramAuth(initData || '')

  // Setup Telegram UI
  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
    document.body.style.margin = '0'
    document.body.style.backgroundColor = t.bg_color

    // Back button handling
    tg.BackButton.onClick(() => {
      if (view !== 'home') {
        tg.HapticFeedback.impactOccurred('light')
        setView('home')
        tg.BackButton.hide()
      }
    })

    if (view === 'home') tg.BackButton.hide()
    else tg.BackButton.show()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, view])

  // Fetch funnels
  useEffect(() => {
    if (!isValid) return
    async function fetchFunnels() {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      else setFunnels(data)
    }
    fetchFunnels()
  }, [view, isValid, user?.id])

  // Fetch pages for selected funnel
  useEffect(() => {
    if (!selectedFunnel || !isValid) return
    async function fetchPages() {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position', { ascending: true })
      if (error) console.error(error)
      else setPages(data)
    }
    fetchPages()
  }, [selectedFunnel, isValid])

  // Haptic feedback
  const haptic = () => tg?.HapticFeedback?.impactOccurred('light')

  // Create new funnel
  const createFunnel = async () => {
    if (!isValid) return
    const { data, error } = await supabase
      .from('funnels')
      .insert({ user_id: user.id, name: 'New Funnel', status: 'draft' })
      .select()
    if (error) console.error(error)
    else {
      setFunnels([data[0], ...funnels])
      setSelectedFunnel(data[0])
      setView('funnel')
    }
  }

  // Add new page
  const addPage = async () => {
    if (!selectedFunnel || !isValid) return
    const { data, error } = await supabase
      .from('pages')
      .insert({
        funnel_id: selectedFunnel.id,
        name: 'New Page',
        type: 'landing',
        order_position: pages.length + 1,
      })
      .select()
    if (error) console.error(error)
    else setPages([...pages, data[0]])
  }

  // Home View
  const HomeView = () => (
    <div style={{ backgroundColor: t.secondary_bg_color, minHeight: '100vh' }}>
      <div style={{ backgroundColor: t.bg_color, padding: '20px 16px', borderBottom: `0.5px solid ${t.secondary_bg_color}` }}>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: '700', color: t.text_color }}>Funnels</h1>
      </div>

      {/* Funnels list */}
      <div style={{ backgroundColor: t.bg_color }}>
        {funnels.map((f, index) => (
          <div
            key={f.id}
            onClick={() => {
              setSelectedFunnel(f)
              setView('funnel')
              haptic()
            }}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: index < funnels.length - 1 ? `0.5px solid ${t.secondary_bg_color}` : 'none',
            }}
          >
            <div style={{ flex: 1, fontSize: '17px', color: t.text_color }}>{f.name}</div>
            <ChevronRight size={20} color={t.hint_color} />
          </div>
        ))}
      </div>

      <div
        onClick={createFunnel}
        style={{
          margin: '12px 16px',
          backgroundColor: t.bg_color,
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: t.link_color,
          fontSize: '17px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        <Plus size={20} /> New Funnel
      </div>
    </div>
  )

  // Funnel View
  const FunnelView = () => (
    <div style={{ backgroundColor: t.secondary_bg_color, minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ backgroundColor: t.bg_color, padding: '16px', borderBottom: `0.5px solid ${t.secondary_bg_color}` }}>
        <input
          type="text"
          value={selectedFunnel?.name || ''}
          onChange={async (e) => {
            setSelectedFunnel({ ...selectedFunnel, name: e.target.value })
            await supabase.from('funnels').update({ name: e.target.value }).eq('id', selectedFunnel.id)
          }}
          style={{
            width: '100%',
            fontSize: '28px',
            fontWeight: '700',
            color: t.text_color,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
          }}
        />
        <div style={{ fontSize: '15px', color: t.subtitle_text_color, marginTop: '4px' }}>{pages.length} pages</div>
      </div>

      {/* Pages List */}
      <div style={{ backgroundColor: t.bg_color }}>
        {pages.map((p, index) => (
          <div
            key={p.id}
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: index < pages.length - 1 ? `0.5px solid ${t.secondary_bg_color}` : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '17px', fontWeight: '400', color: t.text_color }}>
                {p.name} ({p.type})
              </div>
            </div>
            <ChevronRight size={20} color={t.hint_color} />
          </div>
        ))}
      </div>

      {/* Add Page Button */}
      <div
        onClick={addPage}
        style={{
          margin: '12px 16px',
          backgroundColor: t.bg_color,
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: t.link_color,
          fontSize: '17px',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        <Plus size={20} /> Add Page
      </div>
    </div>
  )

  return <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{view === 'home' ? <HomeView /> : <FunnelView />}</div>
}

export default App
