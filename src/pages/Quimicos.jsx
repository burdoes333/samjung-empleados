import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Quimicos({ empleado }) {
  const [lista, setLista] = useState([]);
  const [usos, setUsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showAddQuimico, setShowAddQuimico] = useState(false);
  const [uploadingFosa1, setUploadingFosa1] = useState(false);
  const [uploadingFosa2, setUploadingFosa2] = useState(false);
  const [form, setForm] = useState({ quimico:"", cantidad:"", unidad:"L", nota:"", fotos_fosa1:[], fotos_fosa2:[] });
  const [newQuimico, setNewQuimico] = useState({ nombre:"", unidad:"L", stock_actual:0 });

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
    if(!error){ setLista(prev=>[...prev,data[0]].sort((a,b)=>a.nombre.localeCompare(b.nombre))); setNewQuimico({nombre:"",unidad:"L",stock_actual:0}); setShowAddQuimico(false); }
  };

  const updateStock = async (quimicoNombre, stockNuevo) => {
    await supabase.from("empleados_quimicos_lista").update({ stock_actual: stockNuevo }).eq("nombre", quimicoNombre);
    setLista(prev => prev.map(q => q.nombre === quimicoNombre ? {...q, stock_actual: stockNuevo} : q));
  };

  const saveUso = async () => {
    if(!form.quimico || !form.cantidad) return alert("Completa los campos");
    const quimicoInfo = lista.find(l => l.nombre === form.quimico);
    const { data, error } = await supabase.from("empleados_quimicos_uso").insert([{
      empleado_id: empleado.id,
      quimico: form.quimico,
      cantidad: parseFloat(form.cantidad),
      unidad: form.unidad,
      nota: form.nota,
      planta: empleado.planta || "",
      fecha: new Date().toISOString().slice(0,10),
      fotos_fosa1: form.fotos_fosa1,
      fotos_fosa2: form.fotos_fosa2,
    }]).select();
    if(!error){
      // Déduire du stock
      if(quimicoInfo) {
        const newStock = Math.max(0, (quimicoInfo.stock_actual||0) - parseFloat(form.cantidad));
        await updateStock(form.quimico, newStock);
      }
      setUsos(prev=>[data[0],...prev]);
      setForm({quimico:"",cantidad:"",unidad:"L",nota:"",fotos_fosa1:[],fotos_fosa2:[]});
      setShowNew(false);
    } else alert("Error: "+JSON.stringify(error));
  };

  const uploadFoto = async (file, fosa, setUploading) => {
    if(!file || !file.type.startsWith("image/")) return;
    const currentFotos = fosa === 1 ? form.fotos_fosa1 : form.fotos_fosa2;
    if(currentFotos.length >= 2) return alert("Máximo 2 fotos por fosa");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const ext = file.name.split('.').pop();
        const filename = `fosa${fosa}_${Date.now()}.${ext}`;
        const blob = await fetch(ev.target.result).then(r => r.blob());
        const { error } = await supabase.storage.from("quimicos-fotos").upload(filename, blob, { contentType: file.type, upsert: true });
        if(error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("quimicos-fotos").getPublicUrl(filename);
        if(fosa === 1) setForm(prev => ({...prev, fotos_fosa1: [...prev.fotos_fosa1, publicUrl]}));
        else setForm(prev => ({...prev, fotos_fosa2: [...prev.fotos_fosa2, publicUrl]}));
      } catch(e) { alert("Error al subir foto: " + e.message); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = (fosa, idx) => {
    if(fosa === 1) setForm(prev => ({...prev, fotos_fosa1: prev.fotos_fosa1.filter((_,i)=>i!==idx)}));
    else setForm(prev => ({...prev, fotos_fosa2: prev.fotos_fosa2.filter((_,i)=>i!==idx)}));
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };

  const inp = {width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,boxSizing:"border-box"};

  const renderFotosPicker = (fosa, fotos, uploading, setUploading) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,color:"#888",display:"block",marginBottom:6}}>📸 Fosa {fosa} (máx. 2 fotos)</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {fotos.map((f,i)=>(
          <div key={i} style={{position:"relative",width:80,height:80}}>
            <img src={f} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8,border:"0.5px solid #ddd"}}/>
            <button onClick={()=>removeFoto(fosa,i)} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(163,45,45,0.9)",border:"none",color:"#fff",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ))}
        {fotos.length < 2 && (
          <label style={{width:80,height:80,border:"1.5px dashed #b5d4f4",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#f9f9ff",color:"#1a3a6b",fontSize:10,gap:2}}>
            {uploading ? <span>⏳</span> : <><span style={{fontSize:20}}>+</span><span>Foto</span></>}
            <input type="file" accept="image/*" style={{display:"none"}} disabled={uploading} onChange={e=>{ if(e.target.files[0]) uploadFoto(e.target.files[0], fosa, setUploading); e.target.value=""; }}/>
          </label>
        )}
      </div>
    </div>
  );

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Químicos utilizados</div>

      {/* Stock actual */}
      {lista.length > 0 && (
        <div style={{background:"#f0f4ff",borderRadius:10,padding:12,marginBottom:14,border:"0.5px solid #b5d4f4"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#1a3a6b",marginBottom:8}}>📦 Stock actual</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
            {lista.map(q=>(
              <div key={q.id} style={{background:"#fff",borderRadius:8,padding:"10px 12px",textAlign:"center",border:"0.5px solid #dce6fb"}}>
                <div style={{fontSize:11,color:"#888",marginBottom:2}}>{q.nombre}</div>
                <div style={{fontSize:16,fontWeight:600,color:(q.stock_actual||0)<10?"#c0392b":"#1a3a6b"}}>{q.stock_actual||0}</div>
                <div style={{fontSize:10,color:"#aaa"}}>{q.unidad}</div>
                {/* Editar stock */}
                <input
                  type="number"
                  defaultValue={q.stock_actual||0}
                  onBlur={e=>{ const v=parseFloat(e.target.value)||0; if(v!==q.stock_actual) updateStock(q.nombre,v); }}
                  style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"0.5px solid #ddd",fontSize:11,textAlign:"center",marginTop:4,boxSizing:"border-box"}}
                  title="Editar stock"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={()=>setShowNew(true)} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer"}}>+ Registrar uso</button>
        <button onClick={()=>setShowAddQuimico(true)} style={{padding:"12px 14px",borderRadius:10,border:"0.5px solid #1a3a6b",background:"#fff",color:"#1a3a6b",fontSize:13,cursor:"pointer"}}>⚙️</button>
      </div>

      {showAddQuimico&&(
        <div style={{background:"#f0f4ff",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #b5d4f4"}}>
          <div style={{fontSize:12,fontWeight:500,color:"#1a3a6b",marginBottom:8}}>Agregar químico a la lista</div>
          <input value={newQuimico.nombre} onChange={e=>setNewQuimico({...newQuimico,nombre:e.target.value})} placeholder="Nombre del químico" style={{...inp,marginBottom:8}}/>
          <select value={newQuimico.unidad} onChange={e=>setNewQuimico({...newQuimico,unidad:e.target.value})} style={{...inp,marginBottom:8}}>
            <option value="L">Litros (L)</option>
            <option value="Kg">Kilogramos (Kg)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="g">Gramos (g)</option>
            <option value="Pza">Piezas (Pza)</option>
          </select>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Stock inicial</label>
            <input type="number" value={newQuimico.stock_actual} onChange={e=>setNewQuimico({...newQuimico,stock_actual:parseFloat(e.target.value)||0})} style={inp}/>
          </div>
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
          <select value={form.quimico} onChange={e=>{ const q=lista.find(l=>l.nombre===e.target.value); setForm({...form,quimico:e.target.value,unidad:q?.unidad||"L"}); }} style={{...inp,marginBottom:10}}>
            <option value="">Seleccionar...</option>
            {lista.map(q=><option key={q.id} value={q.nombre}>{q.nombre} (stock: {q.stock_actual||0} {q.unidad})</option>)}
          </select>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Cantidad utilizada</label>
              <input type="number" value={form.cantidad} onChange={e=>setForm({...form,cantidad:e.target.value})} placeholder="0" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Unidad</label>
              <input value={form.unidad} readOnly style={{...inp,background:"#f5f5f5"}}/>
            </div>
          </div>

          {/* Fotos Fosa 1 y Fosa 2 */}
          {renderFotosPicker(1, form.fotos_fosa1, uploadingFosa1, setUploadingFosa1)}
          {renderFotosPicker(2, form.fotos_fosa2, uploadingFosa2, setUploadingFosa2)}

          <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Nota (opcional)</label>
          <textarea value={form.nota} onChange={e=>setForm({...form,nota:e.target.value})} rows={2} placeholder="Observaciones..." style={{...inp,marginBottom:10,resize:"none"}}/>

          <div style={{display:"flex",gap:8}}>
            <button onClick={saveUso} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:500}}>Guardar</button>
            <button onClick={()=>{setShowNew(false);setForm({quimico:"",cantidad:"",unidad:"L",nota:"",fotos_fosa1:[],fotos_fosa2:[]});}} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
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
          <button onClick={async()=>{ if(!window.confirm("¿Eliminar este registro?")) return; const {error}=await supabase.from("empleados_quimicos_uso").delete().eq("id",u.id); if(!error) setUsos(prev=>prev.filter(x=>x.id!==u.id)); }} style={{marginTop:8,padding:"4px 10px",borderRadius:6,border:"none",background:"#fcebeb",color:"#a32d2d",fontSize:11,cursor:"pointer"}}>🗑️ Eliminar</button>
          {/* Fotos */}
          {((u.fotos_fosa1||[]).length>0||(u.fotos_fosa2||[]).length>0)&&(
            <div style={{marginTop:8,display:"flex",gap:12,flexWrap:"wrap"}}>
              {(u.fotos_fosa1||[]).length>0&&(
                <div>
                  <div style={{fontSize:10,color:"#888",marginBottom:4}}>Fosa 1</div>
                  <div style={{display:"flex",gap:6}}>
                    {(u.fotos_fosa1||[]).map((f,i)=><img key={i} src={f} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:"0.5px solid #ddd"}}/>)}
                  </div>
                </div>
              )}
              {(u.fotos_fosa2||[]).length>0&&(
                <div>
                  <div style={{fontSize:10,color:"#888",marginBottom:4}}>Fosa 2</div>
                  <div style={{display:"flex",gap:6}}>
                    {(u.fotos_fosa2||[]).map((f,i)=><img key={i} src={f} alt="" style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:"0.5px solid #ddd"}}/>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}