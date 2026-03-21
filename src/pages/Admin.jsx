import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const fmt   = p => new Intl.NumberFormat('ru-RU').format(p) + " so'm"
const ROWS  = ['lower','upper','tall']
const CATS  = ['Pastki shkaflar','Yuqori shkaflar','Baland shkaflar']
const KINDS = ['','sink','drawers','glass','fridge','oven','corner']
const STATUS_COLORS = { new:'#D4956A', processing:'#6A9AD4', done:'#6AAD6A', cancelled:'#888' }

const EMPTY_MOD = { label:'', width:60, row:'lower', price:1500000, color:'#C9875A', kind:'', category:'Pastki shkaflar', active:true, sort_order:0 }

export default function Admin({ onExit }) {
  const [user,      setUser]      = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [authErr,   setAuthErr]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [tab,       setTab]       = useState('modules')
  const [modules,   setModules]   = useState([])
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(false)
  const [toast,     setToast]     = useState(null)

  const [editMod,   setEditMod]   = useState(null)   // null | 'new' | {module obj}
  const [form,      setForm]      = useState(EMPTY_MOD)
  const [saving,    setSaving]    = useState(false)

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_,s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      if (tab==='modules') loadModules()
      else loadOrders()
    }
  }, [user, tab])

  const login = async () => {
    setLoginLoading(true); setAuthErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthErr(error.message)
    setLoginLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const showToast = (msg, type='ok') => {
    setToast({ msg, type })
    setTimeout(()=>setToast(null), 3000)
  }

  // ── Modules CRUD ──────────────────────────────────────────────────────────
  const loadModules = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('modules').select('*').order('category').order('sort_order')
    if (error) showToast('❌ '+error.message,'error')
    else setModules(data)
    setLoading(false)
  }

  const openNew   = () => { setForm({...EMPTY_MOD}); setEditMod('new') }
  const openEdit  = m  => { setForm({...m}); setEditMod(m) }
  const closeEdit = () => setEditMod(null)

  const saveMod = async () => {
    setSaving(true)
    const payload = {
      label: form.label.trim(), width: +form.width, row: form.row,
      price: +form.price, color: form.color, kind: form.kind||null,
      category: form.category, active: form.active, sort_order: +form.sort_order
    }
    let error
    if (editMod==='new') {
      ({ error } = await supabase.from('modules').insert(payload))
    } else {
      ({ error } = await supabase.from('modules').update(payload).eq('id', editMod.id))
    }
    setSaving(false)
    if (error) { showToast('❌ '+error.message,'error'); return }
    showToast('✅ Saqlandi')
    closeEdit()
    loadModules()
  }

  const toggleActive = async (m) => {
    const { error } = await supabase.from('modules').update({ active: !m.active }).eq('id', m.id)
    if (error) showToast('❌ '+error.message,'error')
    else setModules(ms => ms.map(x => x.id===m.id ? {...x,active:!x.active} : x))
  }

  const deleteMod = async (id) => {
    if (!confirm('Haqiqatan ham o\'chirishni xohlaysizmi?')) return
    const { error } = await supabase.from('modules').delete().eq('id', id)
    if (error) showToast('❌ '+error.message,'error')
    else { showToast('🗑 O\'chirildi'); setModules(ms=>ms.filter(m=>m.id!==id)) }
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending:false })
    if (error) showToast('❌ '+error.message,'error')
    else setOrders(data)
    setLoading(false)
  }

  const updateOrderStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) showToast('❌ '+error.message,'error')
    else setOrders(os => os.map(o => o.id===id ? {...o,status} : o))
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (authLoading) return <div style={A.loading}>⏳ Yuklanmoqda...</div>

  if (!user) return (
    <div style={A.loginWrap}>
      <div style={A.loginBox}>
        <div style={A.loginTitle}>🔐 Admin Panel</div>
        <div style={A.loginSub}>Supabase email / parol bilan kiring</div>
        {authErr && <div style={A.authErr}>{authErr}</div>}
        <input style={A.input} type="email" placeholder="Email"
          value={email} onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()} />
        <input style={A.input} type="password" placeholder="Parol"
          value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()} />
        <button style={{...A.btnPrimary,opacity:loginLoading?0.6:1}}
          onClick={login} disabled={loginLoading}>
          {loginLoading ? '⏳ Kirish...' : '→ Kirish'}
        </button>
        <button style={A.btnGhost} onClick={onExit}>← Konstruktorga qaytish</button>
        <div style={{fontSize:11,color:'#555',marginTop:8,textAlign:'center'}}>
          💡 Supabase → Authentication → Users → Add User orqali yarating
        </div>
      </div>
    </div>
  )

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div style={A.app}>

      {/* Toast */}
      {toast && (
        <div style={{...A.toast,background:toast.type==='error'?'#6B1818':'#1A4A1A',borderColor:toast.type==='error'?'#AA3030':'#2A7A2A'}}>
          {toast.msg}
        </div>
      )}

      {/* Edit / New Module Modal */}
      {editMod && (
        <div style={A.overlay} onClick={closeEdit}>
          <div style={A.modal} onClick={e=>e.stopPropagation()}>
            <div style={A.modalTitle}>{editMod==='new'?'➕ Yangi modul':'✏️ Modulni tahrirlash'}</div>

            <div style={A.grid2}>
              <div style={A.field}>
                <label style={A.label}>Nomi *</label>
                <input style={A.input} value={form.label}
                  onChange={e=>setForm(p=>({...p,label:e.target.value}))} placeholder="Past shkaf" />
              </div>
              <div style={A.field}>
                <label style={A.label}>Kenglik (cm) *</label>
                <input style={A.input} type="number" value={form.width}
                  onChange={e=>setForm(p=>({...p,width:e.target.value}))} />
              </div>
              <div style={A.field}>
                <label style={A.label}>Narx (so'm) *</label>
                <input style={A.input} type="number" value={form.price}
                  onChange={e=>setForm(p=>({...p,price:e.target.value}))} />
              </div>
              <div style={A.field}>
                <label style={A.label}>Qator</label>
                <select style={A.input} value={form.row}
                  onChange={e=>setForm(p=>({...p,row:e.target.value}))}>
                  {ROWS.map(r=><option key={r} value={r}>{r==='lower'?'Pastki':r==='upper'?'Yuqori':'Baland'}</option>)}
                </select>
              </div>
              <div style={A.field}>
                <label style={A.label}>Kategoriya</label>
                <select style={A.input} value={form.category}
                  onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={A.field}>
                <label style={A.label}>Turi (kind)</label>
                <select style={A.input} value={form.kind||''}
                  onChange={e=>setForm(p=>({...p,kind:e.target.value}))}>
                  {KINDS.map(k=><option key={k} value={k}>{k||'— oddiy —'}</option>)}
                </select>
              </div>
              <div style={A.field}>
                <label style={A.label}>Rang (hex)</label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input style={{...A.input,flex:1}} value={form.color}
                    onChange={e=>setForm(p=>({...p,color:e.target.value}))} />
                  <input type="color" value={form.color}
                    onChange={e=>setForm(p=>({...p,color:e.target.value}))}
                    style={{width:36,height:36,border:'none',background:'none',cursor:'pointer',padding:0}} />
                </div>
              </div>
              <div style={A.field}>
                <label style={A.label}>Tartibi</label>
                <input style={A.input} type="number" value={form.sort_order}
                  onChange={e=>setForm(p=>({...p,sort_order:e.target.value}))} />
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:4}}>
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,color:'#AAA'}}>
                <input type="checkbox" checked={form.active}
                  onChange={e=>setForm(p=>({...p,active:e.target.checked}))}
                  style={{width:16,height:16}} />
                Aktiv (katalogda ko'rinsin)
              </label>
            </div>

            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button style={A.btnGhost} onClick={closeEdit}>Bekor</button>
              <button style={{...A.btnPrimary,opacity:saving?0.6:1}} onClick={saveMod} disabled={saving}>
                {saving?'⏳ Saqlanmoqda...':'💾 Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Topbar ── */}
      <div style={A.topbar}>
        <span style={A.topTitle}>⚙️ Admin Panel</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:12,color:'#666'}}>{user.email}</span>
        <button style={A.btnGhostSm} onClick={onExit}>← Konstruktor</button>
        <button style={A.btnGhostSm} onClick={logout}>Chiqish</button>
      </div>

      {/* ── Tabs ── */}
      <div style={A.tabBar}>
        <button style={{...A.tabBtn,...(tab==='modules'?A.tabBtnA:{})}} onClick={()=>setTab('modules')}>
          📦 Modullar ({modules.length})
        </button>
        <button style={{...A.tabBtn,...(tab==='orders'?A.tabBtnA:{})}} onClick={()=>setTab('orders')}>
          📋 Buyurtmalar ({orders.length})
        </button>
      </div>

      {/* ── Content ── */}
      <div style={A.content}>

        {/* MODULES TAB */}
        {tab==='modules' && (
          <>
            <div style={A.actionBar}>
              <div style={{fontSize:13,color:'#888'}}>{modules.length} ta modul</div>
              <button style={A.btnPrimary} onClick={openNew}>+ Yangi modul</button>
            </div>

            {loading ? <div style={A.loadMsg}>⏳ Yuklanmoqda...</div> : (
              <div style={A.table}>
                <div style={A.thead}>
                  <div style={{width:32}}/>
                  <div style={{flex:2}}>Nomi</div>
                  <div style={{width:60}}>Kengl.</div>
                  <div style={{width:70}}>Qator</div>
                  <div style={{width:60}}>Turi</div>
                  <div style={{flex:2}}>Narx</div>
                  <div style={{width:70}}>Holat</div>
                  <div style={{width:88}}>Amallar</div>
                </div>
                {modules.map(m => (
                  <div key={m.id} style={{...A.trow,opacity:m.active?1:0.45}}>
                    <div style={{width:32}}>
                      <div style={{width:16,height:16,borderRadius:3,background:m.color,border:'1px solid #333'}}/>
                    </div>
                    <div style={{flex:2,fontSize:13,fontWeight:600,color:'#D8D0C8'}}>{m.label}</div>
                    <div style={{width:60,fontSize:12,color:'#AAA'}}>{m.width}cm</div>
                    <div style={{width:70,fontSize:11,color:'#888'}}>
                      {m.row==='lower'?'Pastki':m.row==='upper'?'Yuqori':'Baland'}
                    </div>
                    <div style={{width:60,fontSize:11,color:'#888'}}>{m.kind||'—'}</div>
                    <div style={{flex:2,fontSize:12,color:'#C4A880'}}>{fmt(m.price)}</div>
                    <div style={{width:70}}>
                      <button onClick={()=>toggleActive(m)} style={{
                        padding:'3px 8px',borderRadius:4,border:'none',cursor:'pointer',fontSize:11,fontWeight:700,
                        background:m.active?'#1A4A1A':'#3A3530',color:m.active?'#6AD46A':'#888'
                      }}>
                        {m.active?'Aktiv':'Off'}
                      </button>
                    </div>
                    <div style={{width:88,display:'flex',gap:5}}>
                      <button onClick={()=>openEdit(m)} style={A.btnEdit}>✏️</button>
                      <button onClick={()=>deleteMod(m.id)} style={A.btnDelete}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ORDERS TAB */}
        {tab==='orders' && (
          <>
            <div style={A.actionBar}>
              <div style={{fontSize:13,color:'#888'}}>{orders.length} ta buyurtma</div>
              <button style={A.btnGhost} onClick={loadOrders}>🔄 Yangilash</button>
            </div>

            {loading ? <div style={A.loadMsg}>⏳ Yuklanmoqda...</div> : (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {orders.map(o => (
                  <div key={o.id} style={A.orderCard}>
                    <div style={A.orderHead}>
                      <div>
                        <span style={{fontWeight:700,color:'#D8D0C8',marginRight:10}}>
                          {o.customer_name || 'Ism yo\'q'}
                        </span>
                        <span style={{color:'#D4956A',fontSize:13}}>{o.customer_phone}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:11,color:'#666'}}>
                          {new Date(o.created_at).toLocaleString('ru-RU')}
                        </span>
                        <select
                          value={o.status}
                          onChange={e=>updateOrderStatus(o.id,e.target.value)}
                          style={{
                            background:'#252018',border:'1px solid #3A3530',borderRadius:5,
                            color:STATUS_COLORS[o.status]||'#888',padding:'3px 8px',fontSize:11,cursor:'pointer'
                          }}>
                          <option value="new">Yangi</option>
                          <option value="processing">Jarayonda</option>
                          <option value="done">Bajarildi</option>
                          <option value="cancelled">Bekor</option>
                        </select>
                      </div>
                    </div>

                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                      {(o.items||[]).map((item,i) => (
                        <div key={i} style={{
                          padding:'4px 10px',borderRadius:4,fontSize:11,
                          background:'#252018',border:'1px solid #333',
                          display:'flex',gap:5,alignItems:'center'
                        }}>
                          <div style={{width:8,height:8,borderRadius:2,background:item.color,flexShrink:0}}/>
                          {item.label} {item.width}cm
                        </div>
                      ))}
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',marginTop:10,paddingTop:8,borderTop:'1px solid #252220'}}>
                      <div style={{fontSize:12,color:'#777'}}>
                        {o.total_width_cm ? `📐 ${o.total_width_cm}cm · ` : ''}{o.items?.length} ta modul
                        {o.notes && <span style={{color:'#555',marginLeft:8}}>💬 {o.notes}</span>}
                      </div>
                      <div style={{fontWeight:700,color:'#D4956A',fontSize:13}}>{fmt(o.total_price)}</div>
                    </div>
                  </div>
                ))}
                {orders.length===0 && <div style={A.loadMsg}>Hali buyurtma yo'q</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const A = {
  app:        { display:'flex', flexDirection:'column', height:'100vh', background:'#151210', fontFamily:"-apple-system,'Segoe UI',sans-serif", color:'#E8DDD0', overflow:'hidden' },
  loading:    { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#151210', color:'#888', fontSize:16 },
  toast:      { position:'fixed', top:18, left:'50%', transform:'translateX(-50%)', padding:'10px 22px', borderRadius:8, border:'1px solid', fontSize:13, fontWeight:600, zIndex:9999, color:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.5)' },
  loginWrap:  { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#151210' },
  loginBox:   { background:'#1C1916', border:'1px solid #3A3530', borderRadius:16, padding:'36px 32px', width:380, maxWidth:'90vw', display:'flex', flexDirection:'column', gap:14 },
  loginTitle: { fontSize:22, fontWeight:700, color:'#D4956A', textAlign:'center' },
  loginSub:   { fontSize:12, color:'#666', textAlign:'center', marginTop:-8 },
  authErr:    { background:'#501010', border:'1px solid #801818', borderRadius:6, padding:'8px 12px', fontSize:12, color:'#FF9090' },
  topbar:     { padding:'11px 20px', background:'#1A1714', borderBottom:'1px solid #2A2520', display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  topTitle:   { fontSize:16, fontWeight:700, color:'#D4956A' },
  tabBar:     { display:'flex', gap:0, background:'#1C1916', borderBottom:'1px solid #2A2520', flexShrink:0 },
  tabBtn:     { padding:'12px 24px', border:'none', background:'transparent', color:'#777', cursor:'pointer', fontSize:13, fontWeight:600, borderBottom:'3px solid transparent', transition:'all 0.15s' },
  tabBtnA:    { color:'#D4956A', background:'#222018', borderBottom:'3px solid #D4956A' },
  content:    { flex:1, overflow:'auto', padding:'20px 24px' },
  actionBar:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  loadMsg:    { color:'#555', fontSize:13, textAlign:'center', marginTop:40 },
  table:      { background:'#1C1916', border:'1px solid #2A2520', borderRadius:10, overflow:'hidden' },
  thead:      { display:'flex', padding:'10px 16px', background:'#222018', fontSize:11, fontWeight:700, color:'#666', gap:10, borderBottom:'1px solid #2A2520' },
  trow:       { display:'flex', padding:'11px 16px', gap:10, borderBottom:'1px solid #1E1C18', alignItems:'center', transition:'background 0.1s' },
  btnEdit:    { padding:'4px 8px', background:'#1A2A3A', border:'1px solid #2A3A4A', borderRadius:5, color:'#7AAABB', cursor:'pointer', fontSize:12 },
  btnDelete:  { padding:'4px 8px', background:'#3A1818', border:'1px solid #5A2828', borderRadius:5, color:'#E08080', cursor:'pointer', fontSize:12 },
  orderCard:  { background:'#1C1916', border:'1px solid #2A2520', borderRadius:10, padding:'14px 16px' },
  orderHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 },
  modal:      { background:'#1C1916', border:'1px solid #3A3530', borderRadius:14, padding:'26px 24px', width:560, maxWidth:'95vw', maxHeight:'90vh', overflow:'auto', display:'flex', flexDirection:'column', gap:14 },
  modalTitle: { fontSize:17, fontWeight:700, color:'#D4956A' },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 16px' },
  field:      { display:'flex', flexDirection:'column', gap:5 },
  label:      { fontSize:11, color:'#888', fontWeight:600 },
  input:      { background:'#252018', border:'1px solid #3A3530', borderRadius:6, padding:'9px 12px', color:'#E8DDD0', fontSize:13, outline:'none', fontFamily:'inherit', width:'100%' },
  btnPrimary: { padding:'9px 18px', background:'linear-gradient(135deg,#D4956A,#A86030)', border:'none', borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 },
  btnGhost:   { padding:'9px 16px', background:'#252018', border:'1px solid #3A3530', borderRadius:7, color:'#AAA', cursor:'pointer', fontSize:13 },
  btnGhostSm: { padding:'6px 12px', background:'#252018', border:'1px solid #3A3530', borderRadius:5, color:'#888', cursor:'pointer', fontSize:11 },
}
