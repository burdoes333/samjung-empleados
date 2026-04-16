import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Quimicos({ empleado }) {
  const [lista, setLista] = useState([]);
  const [usos, setUsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showAddQuimico, setShowAddQuimico] = useState(false);
  const [form, setForm] = useState({ quimico:"", cantidad:"", unidad:"L", nota:"" });
  const [newQuimico, setNewQuimico] = useState({ nombre:"", unidad:"L" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: l }, { data: u }] = await Promise.all([
      supabase.from("empleados_quimicos_lista").select("*").order("nombre"),
      supabase.from("empleados_quimicos_uso").select("*").eq("empleado_id", empleado.id).order("created_at", { ascending: false }).limit(30),
    ]);
    if(l) setLista(l);
    if(u) setUsos(u);
    setLoading(false);
  };

  const addQuimico = async () => {
    if(!newQuimico.nombre.trim()) return;
    const { data, error } = await supabase.from("empleados_quimicos_lista").insert([newQuimico]).select();
    if(!error){ setLista(prev=>[...prev,data[0]].sort((a,b)=>a.nombre.localeCompare(b.nombre))); setNewQuimico({nombre:"",unidad:"L"}); setShowAddQuimico(false); }
  };

  const saveUso = async () => {
    if(!form.quimico||!form.cantidad) return alert("Completa los campos");
    const { data, error } = await supabase.from("empleados_quimicos_uso").insert([{
      empleado_id: empleado.id,
      quimico: form.quimico,
      cantidad: parseFloat(form.cantidad),
      unidad: form.unidad,
      nota: form.nota,
      planta: empleado.planta||"",
      fecha: new Date().toISOString().slice(0,10)
    }]).select();
    if(!error){ setUsos(prev=>[data[0],...prev]); setForm({quimico:"",cantidad:"",unidad:"L",nota:""}); setShowNew(false); }
    else alert("Error: "+JSON.stringify(error));
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Químicos utilizados</div>

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={()=>setShowNew(true)} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer"}}>+ Registrar uso</button>
        <button onClick={()=>setShowAddQuimico(true)} style={{padding:"12px 14px",borderRadius:10,border:"0.5px solid #1a3a6b",background:"#fff",color:"#1a3a6b",fontSize:13,cursor:"pointer"}}>⚙️</button>
      </div>

      {showAddQuimico&&(
        <div style={{background:"#f0f4ff",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #b5d4f4"}}>
          <div style={{fontSize:12,fontWeight:500,color:"#1a3a6b",marginBottom:8}}>Agregar químico a la lista</div>
          <input value={newQuimico.nombre} onChange={e=>setNewQuimico({...newQuimico,nombre:e.target.value})} placeholder="Nombre del químico" style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:8,boxSizing:"border-box"}}/>
          <select value={newQuimico.unidad} onChange={e=>setNewQuimico({...newQuimico,unidad:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:10}}>
            <option value="L">Litros (L)</option>
            <option value="Kg">Kilogramos (Kg)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="g">Gramos (g)</option>
            <option value="Pza">Piezas (Pza)</option>
          </select>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addQuimico} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,cursor:"pointer"}}>Guardar</button>
            <button onClick={()=>setShowAddQuimico(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {showNew&&(
        <div style={{background:"#fff",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #ddd",boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Registrar uso de químico</div>
          <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Químico</label>
          <select value={form.quimico} onChange={e=>{ const q=lista.find(l=>l.nombre===e.target.value); setForm({...form,quimico:e.target.value,unidad:q?.unidad||"L"}); }} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:10}}>
            <option value="">Seleccionar...</option>
            {lista.map(q=><option key={q.id} value={q.nombre}>{q.nombre}</option>)}
          </select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Cantidad</label>
              <input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})} placeholder="0" style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Unidad</label>
              <input value={form.unidad} readOnly style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,background:"#f5f5f5",boxSizing:"border-box"}}/>
            </div>
          </div>
          <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Nota (opcional)</label>
          <textarea value={form.nota} onChange={e=>setForm({...form,nota:e.target.value})} rows={2} placeholder="Observaciones..." style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:10,resize:"none",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveUso} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:500}}>Guardar</button>
            <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {usos.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin registros aún 🧪</div>
      ) : usos.map(u=>(
        <div key={u.id} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{fontSize:14,fontWeight:500}}>🧪 {u.quimico}</div>
            <div style={{fontSize:13,fontWeight:500,color:"#1a3a6b"}}>{u.cantidad} {u.unidad}</div>
          </div>
          <div style={{fontSize:11,color:"#888"}}>📅 {fmtFecha(u.fecha)}{u.planta?` · 📍 ${u.planta}`:""}</div>
          {u.nota&&<div style={{fontSize:12,color:"#555",marginTop:4}}>{u.nota}</div>}
        </div>
      ))}
    </div>
  );
}