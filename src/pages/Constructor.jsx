import { useState, useEffect } from 'react'
import { supabase, TABLES } from '../lib/supabase'

// ─── Scale ─────────────────────────────────────────────────────────────────
const S        = 1.9
const UPPER_H  = Math.round(65 * S)
const LOWER_H  = Math.round(85 * S)
const BSPLASH  = 26
const COUNTER  = 5
const UPPER_Y  = 14
const LOWER_Y  = UPPER_Y + UPPER_H + BSPLASH + COUNTER
const TALL_H   = UPPER_H + BSPLASH + COUNTER + LOWER_H
const CANVAS_H = LOWER_Y + LOWER_H + 28

const ICONS = { sink:'🚿', glass:'🪟', fridge:'❄️', oven:'🔥', corner:'⌐', drawers:'▤' }
const fmt   = p => new Intl.NumberFormat('ru-RU').format(p) + " so'm"
const dk    = (hex, a) => { const n=parseInt(hex.slice(1),16); return `#${[n>>16,(n>>8)&0xff,n&0xff].map(c=>Math.max(0,c-a).toString(16).padStart(2,"0")).join("")}` }
let UID = 0

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Constructor({ onAdmin }) {
  const [catalog,    setCatalog]    = useState({})
  const [loading,    setLoading]    = useState(true)
  const [rows,       setRows]       = useState({ upper:[], lower:[], tall:[] })
  const [sel,        setSel]        = useState(null)
  const [tab,        setTab]        = useState('')
  const [drag,       setDrag]       = useState(null)
  const [color,      setColor]      = useState('#C9875A')
  const [orderModal, setOrderModal] = useState(false)
  const [orderForm,  setOrderForm]  = useState({ name:'', phone:'', notes:'' })
  const [submitting, setSubmitting] = useState(false)
  const [toast,      setToast]      = useState(null)

  // ── Load modules from Supabase ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from(TABLES.modules)
        .select('*')
        .eq('active', true)
        .order('sort_order')

      if (error) {
        showToast('❌ Modullar yuklanmadi: ' + error.message, 'error')
        setLoading(false)
        return
      }

      const grouped = {}
      data.forEach(m => {
        const cat = m.category || 'Boshqa'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(m)
      })
      setCatalog(grouped)
      setTab(Object.keys(grouped)[0] || '')
      setLoading(false)
    }
    load()
  }, [])

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  const all    = [...rows.upper, ...rows.lower, ...rows.tall]
  const totalW = rows.lower.reduce((s,m) => s + m.width, 0)
  const totalP = all.reduce((s,m) => s + m.price, 0)
  const selMod = sel !== null ? all.find(m => m._uid === sel) : null

  const add = item => {
    const m = { ...item, _uid: UID++, color }
    setRows(r => ({ ...r, [item.row]: [...r[item.row], m] }))
  }

  const del = uid => {
    setRows(r => { const n={}; for(const k in r) n[k]=r[k].filter(m=>m._uid!==uid); return n })
    setSel(null)
  }

  const clearAll = () => { setRows({ upper:[], lower:[], tall:[] }); setSel(null) }

  const onCatDrag  = (e, item) => { setDrag(item); e.dataTransfer.effectAllowed='copy' }
  const onDragOver = e => e.preventDefault()
  const onDrop     = (e, rowKey) => {
    e.preventDefault()
    if (drag && drag.row === rowKey) add(drag)
    setDrag(null)
  }

  // ── Submit order ──────────────────────────────────────────────────────────
  const submitOrder = async () => {
    if (!orderForm.phone.trim()) { showToast('Telefon raqamini kiriting!', 'error'); return }
    if (all.length === 0)        { showToast('Avval modul qo\'shing!', 'error'); return }

    setSubmitting(true)
    const { error } = await supabase.from(TABLES.orders).insert({
      items: all.map(m => ({ id: m.id, label: m.label, width: m.width, row: m.row, price: m.price, color: m.color })),
      total_price:    totalP,
      total_width_cm: totalW,
      customer_name:  orderForm.name,
      customer_phone: orderForm.phone,
      notes:          orderForm.notes,
    })
    setSubmitting(false)

    if (error) { showToast('❌ Xatolik: ' + error.message, 'error'); return }

    setOrderModal(false)
    setOrderForm({ name:'', phone:'', notes:'' })
    showToast('✅ Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz 📞')
  }

  const lw = rows.lower.reduce((s,m) => s + m.width*S, 0)
  const uw = rows.upper.reduce((s,m) => s + m.width*S, 0)
  const tw = rows.tall.reduce((s,m)  => s + m.width*S, 0)
  const mainW   = Math.max(lw, uw)
  const canvasW = Math.max(mainW + tw + 80, 520)

  const PALETTE = ['#C9875A','#8A9A7A','#7A95A8','#B8A870','#A88090','#8890A0','#C8C0B0','#606060']

  return (
    <div style={C.app}>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{
          ...C.toast,
          background: toast.type==='error' ? '#6B1818' : '#1A4A1A',
          borderColor: toast.type==='error' ? '#AA3030' : '#2A7A2A'
        }}>{toast.msg}</div>
      )}

      {/* ═══ ORDER MODAL ═══ */}
      {orderModal && (
        <div style={C.overlay} onClick={()=>setOrderModal(false)}>
          <div style={C.modal} onClick={e=>e.stopPropagation()}>
            <div style={C.modalTitle}>📞 Buyurtma berish</div>
            <div style={C.modalSub}>Jami: <b style={{color:'#D4956A'}}>{fmt(totalP)}</b> · {all.length} ta modul · {totalW}cm</div>
            <div style={C.field}>
              <label style={C.label}>Ismingiz</label>
              <input style={C.input} placeholder="Ism Familiya"
                value={orderForm.name}
                onChange={e=>setOrderForm(p=>({...p, name: e.target.value}))} />
            </div>
            <div style={C.field}>
              <label style={C.label}>Telefon <span style={{color:'#D4956A'}}>*</span></label>
              <input style={C.input} placeholder="+998 90 123 45 67" type="tel"
                value={orderForm.phone}
                onChange={e=>setOrderForm(p=>({...p, phone: e.target.value}))} />
            </div>
            <div style={C.field}>
              <label style={C.label}>Izoh</label>
              <textarea style={{...C.input, height:72, resize:'vertical'}} placeholder="Qo'shimcha ma'lumot..."
                value={orderForm.notes}
                onChange={e=>setOrderForm(p=>({...p, notes: e.target.value}))} />
            </div>
            <div style={{display:'flex', gap:10, marginTop:4}}>
              <button style={C.btnCancel} onClick={()=>setOrderModal(false)}>Bekor qilish</button>
              <button style={{...C.btnSubmit, opacity: submitting?0.6:1}}
                onClick={submitOrder} disabled={submitting}>
                {submitting ? '⏳ Yuborilmoqda...' : '✅ Yuborish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CATALOG ═══════════ */}
      <aside style={C.catalog}>
        <div style={C.catHead}>
          <div style={{fontSize:28}}>🪵</div>
          <div>
            <div style={C.catTitle}>Modul Katalogi</div>
            <div style={C.catHint}>Ikki marta bosing yoki torting</div>
          </div>
          <button style={C.btnAdm} onClick={onAdmin} title="Admin panel">⚙️</button>
        </div>

        {/* Color picker */}
        <div style={C.colorBar}>
          <span style={C.colorLabel}>Rang:</span>
          <div style={{display:'flex', gap:5, flex:1, flexWrap:'wrap'}}>
            {PALETTE.map(c => (
              <div key={c} onClick={()=>setColor(c)} style={{
                width:20, height:20, borderRadius:'50%', background:c, cursor:'pointer',
                outline: color===c ? '2px solid #fff' : 'none', outlineOffset:2
              }} />
            ))}
          </div>
          <div style={{width:22,height:22,borderRadius:4,background:color,border:'1px solid #444'}} />
        </div>

        {/* Tabs */}
        <div style={C.tabs}>
          {Object.keys(catalog).map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{...C.tab, ...(tab===t ? C.tabA : {})}}>
              {t.replace(' shkaflar','').replace('Boshqa','')}
            </button>
          ))}
        </div>

        {/* Module list */}
        <div style={C.modList}>
          {loading ? (
            <div style={C.loadingMsg}>⏳ Yuklanmoqda...</div>
          ) : (catalog[tab] || []).map(item => (
            <div key={item.id}
              style={{...C.modCard, borderLeft:`3px solid ${color}`}}
              draggable onDragStart={e=>onCatDrag(e,item)}
              onDoubleClick={()=>add(item)}>
              <div style={{...C.modIcon, background:color}}>
                {ICONS[item.kind] ?? (item.row==='upper'?'🗄️':item.row==='tall'?'🏗️':'📦')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={C.modName}>{item.label} <span style={{color:'#AAA'}}>{item.width}cm</span></div>
                <div style={C.modPrice}>{fmt(item.price)}</div>
              </div>
              <button style={C.btnAdd} onClick={()=>add(item)}>+</button>
            </div>
          ))}
        </div>

        <div style={C.catFoot}>💡 Torting yoki 2x bosing</div>
      </aside>

      {/* ═══════════ CANVAS ═══════════ */}
      <main style={C.canvasArea}>
        <div style={C.toolbar}>
          <span style={C.tTitle}>🍳 Oshxona Konstruktori</span>
          <div style={{flex:1}}/>
          <span style={C.tStat}>Kenglik: <b style={{color:'#C4A880'}}>{totalW} cm</b></span>
          <span style={C.tStat}>Modullar: <b style={{color:'#C4A880'}}>{all.length}</b></span>
          <span style={C.tTotal}>{fmt(totalP)}</span>
          {sel!==null && <button style={C.btnDel} onClick={()=>del(sel)}>🗑</button>}
          {all.length>0 && <button style={C.btnClear} onClick={clearAll}>✕ Tozalash</button>}
        </div>

        <div style={C.scroll}>
          <div style={{position:'relative', width:canvasW, height:CANVAS_H+36, minWidth:'100%'}}>

            {/* Wall */}
            <div style={{
              position:'absolute', left:10, right:10, top:6, bottom:22,
              background:`linear-gradient(180deg,#242018 0%,#2E2820 6%,#EDE4D0 6%,#EDE4D0 68%,#786040 68%,#887060 100%)`,
              borderRadius:8, border:'1px solid #3A3530',
              boxShadow:'inset 0 0 40px rgba(0,0,0,0.3)'
            }}/>

            {/* Backsplash */}
            {(lw>0||uw>0) && (
              <div style={{
                position:'absolute', left:20, top:UPPER_Y+UPPER_H+10,
                width:mainW+12, height:BSPLASH,
                backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 12px,rgba(160,140,110,0.45) 12px,rgba(160,140,110,0.45) 13px),repeating-linear-gradient(90deg,transparent,transparent 12px,rgba(160,140,110,0.45) 12px,rgba(160,140,110,0.45) 13px)`,
                backgroundColor:'#D8CCBA',
              }}/>
            )}

            {/* Countertop */}
            {lw>0 && (
              <div style={{
                position:'absolute', left:20, top:LOWER_Y+10-COUNTER,
                width:lw+2, height:COUNTER,
                background:'linear-gradient(180deg,#7A6545,#584030)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.6)', borderRadius:'1px 1px 0 0'
              }}/>
            )}

            {/* Upper row */}
            <RowContainer modules={rows.upper} rowKey="upper" drag={drag}
              sel={sel} setSel={setSel} onDrop={onDrop} onDragOver={onDragOver}
              h={UPPER_H} top={UPPER_Y+10} left={20} minW={420} hint="Yuqori shkaflar bu yerga" />

            {/* Lower row */}
            <RowContainer modules={rows.lower} rowKey="lower" drag={drag}
              sel={sel} setSel={setSel} onDrop={onDrop} onDragOver={onDragOver}
              h={LOWER_H} top={LOWER_Y+10} left={20} minW={420} hint="Pastki shkaflar bu yerga" />

            {/* Tall modules */}
            <div style={{
              position:'absolute',
              left: mainW>0 ? mainW+24 : 24,
              top: UPPER_Y+10, height:TALL_H,
              minWidth:130, width:Math.max(tw+30,130),
              display:'flex',
              border: drag?.row==='tall' ? '2px dashed #9A7A5080' : '2px dashed #33302A',
              borderRadius:4,
              background: drag?.row==='tall' ? '#9A7A5010' : 'transparent',
              overflow:'hidden', transition:'all 0.2s',
            }}
              onDrop={e=>onDrop(e,'tall')} onDragOver={onDragOver}>
              {rows.tall.length===0 ? (
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:drag?.row==='tall'?'#C09060':'#3A3530',fontSize:11,textAlign:'center',gap:4,pointerEvents:'none'}}>
                  <span style={{fontSize:24}}>🏗️</span>
                  <span>{drag?.row==='tall'?'⬇ Bu yerga':'Baland\nshkaflar'}</span>
                </div>
              ) : rows.tall.map(mod => (
                <ModuleBlock key={mod._uid} mod={mod} h={TALL_H}
                  selected={sel===mod._uid} onSel={()=>setSel(sel===mod._uid?null:mod._uid)} />
              ))}
            </div>

            {/* Floor */}
            <div style={{position:'absolute',left:10,right:10,bottom:22,height:1,background:'#4A3A28',opacity:0.6}}/>

            {/* Empty state */}
            {all.length===0 && !drag && !loading && (
              <div style={C.empty}>
                <div style={{fontSize:60}}>🍳</div>
                <div style={{fontSize:17,fontWeight:600,marginTop:10}}>Oshxonangizni loyihalang</div>
                <div style={{fontSize:13,color:'#555',marginTop:6}}>Chap paneldan modullarni torting</div>
                <div style={{fontSize:12,color:'#444',marginTop:4}}>yoki ikki marta bosing</div>
              </div>
            )}
          </div>
        </div>

        <div style={C.scalebar}>
          <span>📏 10cm = {Math.round(10*S)}px</span>
          {selMod
            ? <span style={{color:'#D4956A'}}>✓ {selMod.label} {selMod.width}cm — {fmt(selMod.price)}</span>
            : <span>Modulni tanlash uchun bosing</span>}
        </div>
      </main>

      {/* ═══════════ SUMMARY ═══════════ */}
      <aside style={C.summary}>
        <div style={C.sumHead}>
          <span>📋 Loyiha</span>
          {all.length>0 && <span style={{color:'#888',fontSize:11}}>{all.length} ta</span>}
        </div>

        <div style={C.sumList}>
          {all.length===0 ? (
            <div style={C.noMods}><div style={{fontSize:32,marginBottom:8}}>📦</div>Hali modul qo'shilmagan</div>
          ) : all.map(m => (
            <div key={m._uid}
              style={{...C.sumItem, ...(sel===m._uid?{borderColor:m.color,background:'#25211C'}:{})}}
              onClick={()=>setSel(sel===m._uid?null:m._uid)}>
              <div style={{width:8,height:8,borderRadius:2,background:m.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={C.sumName}>{m.label} {m.width}cm</div>
                <div style={C.sumPrice}>{fmt(m.price)}</div>
              </div>
              <button style={C.sumDel} onClick={e=>{e.stopPropagation();del(m._uid)}}>✕</button>
            </div>
          ))}
        </div>

        <div style={C.sumFoot}>
          <div style={C.sumRow}><span>Pastki</span><span>{rows.lower.length} ta · {rows.lower.reduce((s,m)=>s+m.width,0)}cm</span></div>
          <div style={C.sumRow}><span>Yuqori</span><span>{rows.upper.length} ta · {rows.upper.reduce((s,m)=>s+m.width,0)}cm</span></div>
          <div style={C.sumRow}><span>Baland</span><span>{rows.tall.length} ta</span></div>
          <div style={C.sumTotal}><span>Jami</span><span>{fmt(totalP)}</span></div>
          {sel!==null && (
            <button style={C.btnDelFull} onClick={()=>del(sel)}>🗑 O'chirish</button>
          )}
          <button style={C.btnOrder} disabled={all.length===0}
            onClick={()=>setOrderModal(true)}>
            📞 Buyurtma berish
          </button>
        </div>
      </aside>
    </div>
  )
}

// ─── Row Container ────────────────────────────────────────────────────────────
function RowContainer({ modules, rowKey, drag, sel, setSel, onDrop, onDragOver, h, top, left, minW, hint }) {
  const w = modules.reduce((s,m) => s + m.width*S, 0)
  const isDT = drag?.row === rowKey
  return (
    <div style={{
      position:'absolute', left, top, height:h, minWidth:minW,
      width:Math.max(w+120,minW), display:'flex',
      border: isDT ? '2px dashed #C9875A90' : '2px dashed transparent',
      borderRadius:4, background: isDT ? '#C9875A08' : 'transparent', transition:'all 0.2s'
    }} onDrop={e=>onDrop(e,rowKey)} onDragOver={onDragOver}>
      {modules.map(mod => (
        <ModuleBlock key={mod._uid} mod={mod} h={h}
          selected={sel===mod._uid} onSel={()=>setSel(sel===mod._uid?null:mod._uid)} />
      ))}
      <div style={{flex:1,minWidth:80,height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:isDT?'#C9875A':'#2E2B28',fontSize:11,pointerEvents:'none',padding:'0 8px',textAlign:'center',transition:'color 0.2s'}}>
        {modules.length===0 ? hint : isDT ? '⬇ Bu yerga tashlang' : ''}
      </div>
    </div>
  )
}

// ─── Module Block ─────────────────────────────────────────────────────────────
function ModuleBlock({ mod, h, selected, onSel }) {
  const w = mod.width * S
  const nDoors = Math.max(1, Math.floor(mod.width / 50))
  return (
    <div onClick={e=>{e.stopPropagation();onSel()}} style={{
      width:w, height:h, flexShrink:0, cursor:'pointer', marginRight:1,
      background:`linear-gradient(160deg,${mod.color} 0%,${dk(mod.color,22)} 100%)`,
      borderRadius:3, outline: selected ? '2px solid #D4956A' : 'none', outlineOffset:2,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      position:'relative', overflow:'hidden', gap:3, userSelect:'none',
      boxShadow: selected ? '0 0 14px #D4956A60,inset 0 0 0 1px rgba(255,255,255,0.25)' : 'inset 0 0 0 1px rgba(255,255,255,0.08),inset 0 -4px 8px rgba(0,0,0,0.2)',
      filter: selected ? 'brightness(1.15)' : 'none', transition:'filter 0.15s,box-shadow 0.15s',
    }}>
      {!mod.kind && [...Array(nDoors-1)].map((_,i) => (
        <div key={i} style={{position:'absolute',top:5,bottom:5,left:`${(i+1)*100/nDoors}%`,width:1,background:'rgba(0,0,0,0.22)'}}/>
      ))}
      {!mod.kind && (
        <div style={{position:'absolute',bottom:h>100?14:8,left:'50%',transform:'translateX(-50%)',width:Math.min(w*0.4,28),height:3,background:'rgba(0,0,0,0.28)',borderRadius:2}}/>
      )}
      {mod.kind==='sink' && (
        <div style={{width:Math.min(w*0.62,50),height:Math.min(h*0.38,34),background:'rgba(0,0,0,0.32)',borderRadius:6,border:'1.5px solid rgba(0,0,0,0.4)',boxShadow:'inset 0 2px 5px rgba(0,0,0,0.5)',marginBottom:4}}/>
      )}
      {mod.kind==='drawers' && (
        <div style={{display:'flex',flexDirection:'column',gap:3,width:'68%',marginBottom:6}}>
          {[1,2,3].map(n=>(
            <div key={n} style={{height:8,background:'rgba(0,0,0,0.25)',borderRadius:2,position:'relative'}}>
              <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:8,height:3,background:'rgba(0,0,0,0.3)',borderRadius:1}}/>
            </div>
          ))}
        </div>
      )}
      {mod.kind==='glass' && (
        <div style={{width:Math.min(w*0.65,48),height:Math.min(h*0.5,42),background:'rgba(160,210,230,0.2)',border:'1px solid rgba(160,210,230,0.5)',borderRadius:2,marginBottom:4}}/>
      )}
      {(mod.kind==='fridge'||mod.kind==='oven') && (
        <span style={{fontSize:28,opacity:0.85,marginBottom:4}}>{mod.kind==='fridge'?'❄️':'🔥'}</span>
      )}
      {mod.kind==='corner' && <div style={{fontSize:22,opacity:0.6,marginBottom:4}}>⌐</div>}
      <span style={{fontSize:w<55?9:11,fontWeight:700,color:'rgba(255,255,255,0.9)',textShadow:'0 1px 3px rgba(0,0,0,0.7)',position:mod.kind==='sink'?'absolute':'relative',bottom:mod.kind==='sink'?5:'auto'}}>
        {mod.width}cm
      </span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  app:       { display:'flex', height:'100vh', background:'#151210', fontFamily:"-apple-system,'Segoe UI',sans-serif", color:'#E8DDD0', overflow:'hidden', position:'relative' },
  toast:     { position:'fixed', top:18, left:'50%', transform:'translateX(-50%)', padding:'10px 22px', borderRadius:8, border:'1px solid', fontSize:13, fontWeight:600, zIndex:9999, color:'#fff', boxShadow:'0 4px 24px rgba(0,0,0,0.5)' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 },
  modal:     { background:'#1C1916', border:'1px solid #3A3530', borderRadius:14, padding:'28px 26px', width:380, maxWidth:'90vw', display:'flex', flexDirection:'column', gap:14 },
  modalTitle:{ fontSize:18, fontWeight:700, color:'#D4956A' },
  modalSub:  { fontSize:12, color:'#888', marginTop:-8 },
  field:     { display:'flex', flexDirection:'column', gap:5 },
  label:     { fontSize:12, color:'#AAA', fontWeight:600 },
  input:     { background:'#252018', border:'1px solid #3A3530', borderRadius:6, padding:'9px 12px', color:'#E8DDD0', fontSize:13, outline:'none', fontFamily:'inherit' },
  btnCancel: { flex:1, padding:'9px', background:'#252018', border:'1px solid #3A3530', borderRadius:7, color:'#888', cursor:'pointer', fontSize:13 },
  btnSubmit: { flex:1, padding:'9px', background:'linear-gradient(135deg,#D4956A,#A86030)', border:'none', borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 },
  catalog:   { width:258, background:'#1C1916', borderRight:'1px solid #2C2825', display:'flex', flexDirection:'column', flexShrink:0 },
  catHead:   { padding:'14px', borderBottom:'1px solid #2C2825', display:'flex', gap:10, alignItems:'center' },
  catTitle:  { fontSize:14, fontWeight:700, color:'#D4956A', marginBottom:2 },
  catHint:   { fontSize:10, color:'#666' },
  btnAdm:    { marginLeft:'auto', background:'transparent', border:'none', fontSize:18, cursor:'pointer', flexShrink:0 },
  colorBar:  { display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid #2A2520', flexWrap:'wrap' },
  colorLabel:{ fontSize:11, color:'#888', flexShrink:0 },
  tabs:      { display:'flex', borderBottom:'1px solid #2A2520' },
  tab:       { flex:1, padding:'9px 2px', border:'none', background:'transparent', color:'#777', cursor:'pointer', fontSize:10, fontWeight:600, borderBottom:'2px solid transparent', transition:'all 0.15s' },
  tabA:      { color:'#D4956A', background:'#222018', borderBottom:'2px solid #D4956A' },
  modList:   { flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:6 },
  loadingMsg:{ color:'#555', fontSize:13, textAlign:'center', marginTop:20 },
  modCard:   { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#232018', border:'1px solid #2C2825', borderRadius:7, cursor:'grab', transition:'all 0.15s' },
  modIcon:   { width:32, height:32, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 },
  modName:   { fontSize:12, fontWeight:600, color:'#D8D0C8' },
  modPrice:  { fontSize:10, color:'#888', marginTop:1 },
  btnAdd:    { width:24, height:24, borderRadius:5, background:'#D4956A22', border:'1px solid #D4956A44', color:'#D4956A', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:700, lineHeight:1 },
  catFoot:   { padding:'8px 14px', fontSize:10, color:'#4A4540', borderTop:'1px solid #222018' },
  canvasArea:{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  toolbar:   { padding:'9px 18px', background:'#1A1714', borderBottom:'1px solid #2A2520', display:'flex', alignItems:'center', gap:14, flexShrink:0 },
  tTitle:    { fontSize:14, fontWeight:700, color:'#E8DDD0' },
  tStat:     { fontSize:12, color:'#888' },
  tTotal:    { fontSize:14, fontWeight:700, color:'#D4956A' },
  btnDel:    { padding:'5px 12px', background:'#6B1818', border:'none', borderRadius:5, color:'#FFA0A0', cursor:'pointer', fontSize:11, fontWeight:700 },
  btnClear:  { padding:'5px 10px', background:'#252220', border:'1px solid #3A3530', borderRadius:5, color:'#888', cursor:'pointer', fontSize:11 },
  scroll:    { flex:1, overflow:'auto', padding:'22px 20px' },
  empty:     { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#3A3530', textAlign:'center', pointerEvents:'none', gap:2 },
  scalebar:  { padding:'6px 18px', background:'#1A1714', borderTop:'1px solid #2A2520', fontSize:11, color:'#555', display:'flex', justifyContent:'space-between', flexShrink:0 },
  summary:   { width:218, background:'#1A1714', borderLeft:'1px solid #2A2520', display:'flex', flexDirection:'column', flexShrink:0 },
  sumHead:   { padding:'14px 16px', fontSize:13, fontWeight:700, color:'#D4956A', borderBottom:'1px solid #2A2520', display:'flex', justifyContent:'space-between', alignItems:'center' },
  sumList:   { flex:1, overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:5 },
  noMods:    { color:'#3A3530', fontSize:12, textAlign:'center', marginTop:30, display:'flex', flexDirection:'column', alignItems:'center' },
  sumItem:   { display:'flex', alignItems:'center', gap:7, padding:'7px 9px', background:'#201E1A', border:'1px solid #2A2520', borderRadius:6, cursor:'pointer', transition:'all 0.15s' },
  sumName:   { fontSize:11, fontWeight:600, color:'#CCC5BB' },
  sumPrice:  { fontSize:10, color:'#888', marginTop:1 },
  sumDel:    { width:18, height:18, borderRadius:3, background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  sumFoot:   { padding:13, borderTop:'1px solid #252220', display:'flex', flexDirection:'column', gap:6 },
  sumRow:    { display:'flex', justifyContent:'space-between', fontSize:11, color:'#777' },
  sumTotal:  { display:'flex', justifyContent:'space-between', padding:'9px 0', borderTop:'1px solid #252220', fontWeight:700, color:'#D4956A', fontSize:13 },
  btnDelFull:{ width:'100%', padding:'7px', background:'#501010', border:'1px solid #701818', borderRadius:5, color:'#FF9090', cursor:'pointer', fontSize:11, fontWeight:600 },
  btnOrder:  { width:'100%', padding:'10px', background:'linear-gradient(135deg,#D4956A,#A86030)', border:'none', borderRadius:7, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 },
}