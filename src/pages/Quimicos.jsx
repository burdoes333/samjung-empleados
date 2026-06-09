import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const PLANTAS = ["NIFCO I", "NIFCO II", "MAUTO", "HIHO"];

export default function Quimicos({ empleado }) {
  const [lista, setLista] = useState([]);
  const [usos, setUsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showAddQuimico, setShowAddQuimico] = useState(false);
  const [uploadingFosa1, setUploadingFosa1] = useState(false);
  const [uploadingFosa2, setUploadingFosa2] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plantaFiltro, setPlantaFiltro] = useState(null); // null = pas encore choisi
  const [photoViewer, setPhotoViewer] = useState(null); // URL photo en grand
  const [editando, setEditando] = useState(null); // fecha en cours d'édition

  // Formulaire nouveau
  const [cantidades, setCantidades] = useState({});
  const [nota, setNota] = useState("");
  const [fotosFosa1, setFotosFosa1] = useState([]);
  const [fotosFosa2, setFotosFosa2] = useState([]);
  const [plantaForm, setPlantaForm] = useState(PLANTAS[0]);

  // Formulaire édition
  const [editCantidades, setEditCantidades] = useState({});
  const [editNota, setEditNota] = useState("");
  const [editFotosFosa1, setEditFotosFosa1] = useState([]);
  const [editFotosFosa2, setEditFotosFosa2] = useState([]);
  const [uploadingEditFosa1, setUploadingEditFosa1] = useState(false);
  const [uploadingEditFosa2, setUploadingEditFosa2] = useState(false);

  const [newQuimico, setNewQuimico] = useState({ nombre:"", unidad:"L", stock_actual:0 });

  useEffect(() => { if(plantaFiltro) fetchAll(); }, [plantaFiltro]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: l }, { data: u }] = await Promise.all([
      supabase.from("empleados_quimicos_lista").select("*").order("nombre"),
      supabase.from("empleados_quimicos_uso").select("*")
        .eq("empleado_id", empleado.id)
        .eq("planta", plantaFiltro)
        .order("created_at", { ascending: false })
        .limit(50),
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

  const uploadFoto = async (file, fosa, isEdit=false) => {
    if(!file || !file.type.startsWith("image/")) return;
    const currentFosa1 = isEdit ? editFotosFosa1 : fotosFosa1;
    const currentFosa2 = isEdit ? editFotosFosa2 : fotosFosa2;
    const current = fosa === 1 ? currentFosa1 : currentFosa2;
    if(current.length >= 2) return alert("Máximo 2 fotos por fosa");
    if(isEdit) { fosa===1 ? setUploadingEditFosa1(true) : setUploadingEditFosa2(true); }
    else { fosa===1 ? setUploadingFosa1(true) : setUploadingFosa2(true); }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const ext = file.name.split('.').pop();
        const filename = `fosa${fosa}_${Date.now()}.${ext}`;
        const blob = await fetch(ev.target.result).then(r => r.blob());
        const { error } = await supabase.storage.from("quimicos-fotos").upload(filename, blob, { contentType: file.type, upsert: true });
        if(error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("quimicos-fotos").getPublicUrl(filename);
        if(isEdit) {
          if(fosa===1) setEditFotosFosa1(prev=>[...prev,publicUrl]);
          else setEditFotosFosa2(prev=>[...prev,publicUrl]);
        } else {
          if(fosa===1) setFotosFosa1(prev=>[...prev,publicUrl]);
          else setFotosFosa2(prev=>[...prev,publicUrl]);
        }
      } catch(e) { alert("Error al subir foto: "+e.message); }
      if(isEdit) { fosa===1 ? setUploadingEditFosa1(false) : setUploadingEditFosa2(false); }
      else { fosa===1 ? setUploadingFosa1(false) : setUploadingFosa2(false); }
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = (fosa, idx, isEdit=false) => {
    if(isEdit) {
      if(fosa===1) setEditFotosFosa1(prev=>prev.filter((_,i)=>i!==idx));
      else setEditFotosFosa2(prev=>prev.filter((_,i)=>i!==idx));
    } else {
      if(fosa===1) setFotosFosa1(prev=>prev.filter((_,i)=>i!==idx));
      else setFotosFosa2(prev=>prev.filter((_,i)=>i!==idx));
    }
  };

  const saveUso = async () => {
    const productosUsados = lista.filter(q => cantidades[q.nombre] && parseFloat(cantidades[q.nombre]) > 0);
    if(productosUsados.length === 0) return alert("Ingresa al menos una cantidad");
    setSaving(true);
    const fecha = new Date().toISOString().slice(0,10);
    const inserts = productosUsados.map(q => ({
      empleado_id: empleado.id,
      quimico: q.nombre,
      cantidad: parseFloat(cantidades[q.nombre]),
      unidad: q.unidad,
      nota,
      planta: plantaForm,
      fecha,
      fotos_fosa1: fotosFosa1,
      fotos_fosa2: fotosFosa2,
    }));
    const { data, error } = await supabase.from("empleados_quimicos_uso").insert(inserts).select();
    if(!error){
      for(const q of productosUsados) {
        const qi = lista.find(l=>l.nombre===q.nombre);
        if(qi) await updateStock(q.nombre, Math.max(0,(qi.stock_actual||0)-parseFloat(cantidades[q.nombre])));
      }
      setUsos(prev=>[...data.reverse(),...prev]);
      setCantidades({}); setNota(""); setFotosFosa1([]); setFotosFosa2([]);
      setShowNew(false);
    } else alert("Error: "+JSON.stringify(error));
    setSaving(false);
  };

  const openEdit = (fecha, items) => {
    const cants = {};
    items.forEach(u => { cants[u.quimico] = String(u.cantidad); });
    setEditCantidades(cants);
    setEditNota(items[0]?.nota || "");
    setEditFotosFosa1(items[0]?.fotos_fosa1 || []);
    setEditFotosFosa2(items[0]?.fotos_fosa2 || []);
    setEditando(fecha);
  };

  const saveEdit = async (fecha, items) => {
    setSaving(true);
    // Mettre à jour chaque item existant
    for(const u of items) {
      const newCant = parseFloat(editCantidades[u.quimico]) || 0;
      await supabase.from("empleados_quimicos_uso").update({
        cantidad: newCant,
        nota: editNota,
        fotos_fosa1: editFotosFosa1,
        fotos_fosa2: editFotosFosa2,
      }).eq("id", u.id);
    }
    // Ajouter nouveaux produits si quantité renseignée
    const existants = items.map(u=>u.quimico);
    const nouveaux = lista.filter(q => !existants.includes(q.nombre) && editCantidades[q.nombre] && parseFloat(editCantidades[q.nombre])>0);
    if(nouveaux.length>0) {
      const inserts = nouveaux.map(q=>({
        empleado_id: empleado.id,
        quimico: q.nombre,
        cantidad: parseFloat(editCantidades[q.nombre]),
        unidad: q.unidad,
        nota: editNota,
        planta: items[0]?.planta || plantaFiltro,
        fecha,
        fotos_fosa1: editFotosFosa1,
        fotos_fosa2: editFotosFosa2,
      }));
      await supabase.from("empleados_quimicos_uso").insert(inserts);
    }
    await fetchAll();
    setEditando(null);
    setSaving(false);
  };

  const deleteUso = async (ids) => {
    if(!window.confirm("¿Eliminar todos los registros de este día?")) return;
    for(const id of ids) await supabase.from("empleados_quimicos_uso").delete().eq("id", id);
    setUsos(prev => prev.filter(x => !ids.includes(x.id)));
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
  const inp = {width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,boxSizing:"border-box"};

  const renderFotosPicker = (fosa, fotos, uploading, isEdit=false) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,color:"#888",display:"block",marginBottom:6}}>📸 Fosa {fosa} (máx. 2 fotos)</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {fotos.map((f,i)=>(
          <div key={i} style={{position:"relative",width:80,height:80}}>
            <img src={f} alt="" onClick={()=>setPhotoViewer(f)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:8,border:"0.5px solid #ddd",cursor:"pointer"}}/>
            <button onClick={()=>removeFoto(fosa,i,isEdit)} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(163,45,45,0.9)",border:"none",color:"#fff",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ))}
        {fotos.length < 2 && (
          <label style={{width:80,height:80,border:"1.5px dashed #b5d4f4",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#f9f9ff",color:"#1a3a6b",fontSize:10,gap:2}}>
            {uploading ? <span>⏳</span> : <><span style={{fontSize:20}}>+</span><span>Foto</span></>}
            <input type="file" accept="image/*" style={{display:"none"}} disabled={uploading} onChange={e=>{ if(e.target.files[0]) uploadFoto(e.target.files[0],fosa,isEdit); e.target.value=""; }}/>
          </label>
        )}
      </div>
    </div>
  );

  const usosFiltrados = usos.filter(u => !plantaFiltro || u.planta === plantaFiltro);
  const usosPorFecha = usosFiltrados.reduce((acc, u) => {
    const key = u.fecha || "Sin fecha";
    if(!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  // Écran de sélection de planta
  if(!plantaFiltro) return (
    <div style={{padding:24}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:20}}>Químicos utilizados</div>
      <div style={{fontSize:14,fontWeight:500,color:"#1a3a6b",marginBottom:16,textAlign:"center"}}>¿En qué planta estás trabajando?</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {PLANTAS.map(p=>(
          <button key={p} onClick={()=>setPlantaFiltro(p)} style={{padding:"20px 12px",borderRadius:12,border:"1.5px solid #1a3a6b",background:"#fff",color:"#1a3a6b",fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"center"}}>
            🏭 {p}
          </button>
        ))}
      </div>
    </div>
  );

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:16}}>
      {/* Photo viewer */}
      {photoViewer&&(
        <div onClick={()=>setPhotoViewer(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,cursor:"pointer"}}>
          <img src={photoViewer} alt="" style={{maxWidth:"95vw",maxHeight:"95vh",objectFit:"contain",borderRadius:8}}/>
          <button onClick={()=>setPhotoViewer(null)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:24,width:40,height:40,borderRadius:"50%",cursor:"pointer"}}>✕</button>
        </div>
      )}

      {/* Header avec planta sélectionnée */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>Químicos — {plantaFiltro}</div>
        <button onClick={()=>{setPlantaFiltro(null);setUsos([]);}} style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"0.5px solid #ddd",background:"#fff",color:"#888",cursor:"pointer"}}>Cambiar planta</button>
      </div>

      {/* Stock actual */}
      {lista.length > 0 && (
        <div style={{background:"#f0f4ff",borderRadius:10,padding:12,marginBottom:14,border:"0.5px solid #b5d4f4"}}>
          <div style={{fontSize:11,fontWeight:500,color:"#1a3a6b",marginBottom:8}}>📦 Stock actual</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
            {lista.map(q=>(
              <div key={q.id} style={{background:"#fff",borderRadius:8,padding:"10px 12px",textAlign:"center",border:"0.5px solid #dce6fb"}}>
                <div style={{fontSize:11,color:"#888",marginBottom:2}}>{q.nombre}</div>
                <div style={{fontSize:18,fontWeight:600,color:(q.stock_actual||0)<10?"#c0392b":"#1a3a6b"}}>{q.stock_actual||0}</div>
                <div style={{fontSize:10,color:"#aaa",marginBottom:4}}>{q.unidad}</div>
                <input type="number" defaultValue={q.stock_actual||0} onBlur={e=>{ const v=parseFloat(e.target.value)||0; if(v!==(q.stock_actual||0)) updateStock(q.nombre,v); }} style={{width:"100%",padding:"4px 6px",borderRadius:6,border:"0.5px solid #ddd",fontSize:11,textAlign:"center",boxSizing:"border-box"}} title="Editar stock"/>
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
            <option value="L">Litros (L)</option><option value="Kg">Kilogramos (Kg)</option><option value="ml">Mililitros (ml)</option><option value="g">Gramos (g)</option><option value="Pza">Piezas (Pza)</option>
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
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Registrar uso del día — {plantaFiltro}</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:8}}>Cantidades utilizadas</label>
            {lista.map(q=>(
              <div key={q.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 50px",gap:8,alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:500}}>{q.nombre}</div>
                <input type="number" value={cantidades[q.nombre]||""} onChange={e=>setCantidades(prev=>({...prev,[q.nombre]:e.target.value}))} placeholder="0" style={{...inp,padding:"8px 10px"}}/>
                <div style={{fontSize:12,color:"#888",textAlign:"center"}}>{q.unidad}</div>
              </div>
            ))}
          </div>
          {renderFotosPicker(1,fotosFosa1,uploadingFosa1)}
          {renderFotosPicker(2,fotosFosa2,uploadingFosa2)}
          <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Nota (opcional)</label>
          <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={2} placeholder="Observaciones..." style={{...inp,marginBottom:12,resize:"none"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveUso} disabled={saving} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:saving?"#888":"#1a3a6b",color:"#fff",fontSize:13,cursor:saving?"not-allowed":"pointer",fontWeight:500}}>{saving?"Guardando...":"Guardar"}</button>
            <button onClick={()=>{setShowNew(false);setCantidades({});setNota("");setFotosFosa1([]);setFotosFosa2([]);}} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Historique */}
      {Object.keys(usosPorFecha).length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin registros aún 🧪</div>
      ) : Object.entries(usosPorFecha).map(([fecha, items])=>{
        const fosa1=items[0]?.fotos_fosa1||[];
        const fosa2=items[0]?.fotos_fosa2||[];
        const notaDia=items[0]?.nota||"";
        const isEditing = editando === fecha;
        return (
          <div key={fecha} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,boxShadow:"0 1px 8px rgba(0,0,0,0.07)",border:"0.5px solid #eee"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,paddingBottom:8,borderBottom:"0.5px solid #f0f0f0"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#1a3a6b"}}>📅 {fmtFecha(fecha)}</div>
                <div style={{fontSize:11,color:"#888"}}>📍 {items[0]?.planta||plantaFiltro}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>isEditing?setEditando(null):openEdit(fecha,items)} style={{padding:"4px 10px",borderRadius:6,border:"none",background:isEditing?"#f0f4ff":"#f0f4ff",color:"#1a3a6b",fontSize:11,cursor:"pointer"}}>✏️ {isEditing?"Cerrar":"Editar"}</button>
                <button onClick={()=>deleteUso(items.map(u=>u.id))} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#fcebeb",color:"#a32d2d",fontSize:11,cursor:"pointer"}}>🗑️</button>
              </div>
            </div>

            {isEditing ? (
              /* Mode édition */
              <div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:11,color:"#888",display:"block",marginBottom:8}}>Cantidades</label>
                  {lista.map(q=>(
                    <div key={q.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 50px",gap:8,alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:13,fontWeight:500}}>{q.nombre}</div>
                      <input type="number" value={editCantidades[q.nombre]||""} onChange={e=>setEditCantidades(prev=>({...prev,[q.nombre]:e.target.value}))} placeholder="0" style={{...inp,padding:"8px 10px"}}/>
                      <div style={{fontSize:12,color:"#888",textAlign:"center"}}>{q.unidad}</div>
                    </div>
                  ))}
                </div>
                {renderFotosPicker(1,editFotosFosa1,uploadingEditFosa1,true)}
                {renderFotosPicker(2,editFotosFosa2,uploadingEditFosa2,true)}
                <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Nota</label>
                <textarea value={editNota} onChange={e=>setEditNota(e.target.value)} rows={2} style={{...inp,marginBottom:12,resize:"none"}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>saveEdit(fecha,items)} disabled={saving} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:saving?"#888":"#1d9e75",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:500}}>{saving?"Guardando...":"💾 Guardar cambios"}</button>
                  <button onClick={()=>setEditando(null)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
                </div>
              </div>
            ) : (
              /* Mode affichage */
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:12}}>
                  {items.map(u=>(
                    <div key={u.id} style={{background:"#f0f4ff",borderRadius:8,padding:"10px 12px",textAlign:"center",border:"0.5px solid #dce6fb"}}>
                      <div style={{fontSize:11,color:"#888",marginBottom:2}}>🧪 {u.quimico}</div>
                      <div style={{fontSize:18,fontWeight:700,color:"#1a3a6b"}}>{u.cantidad}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{u.unidad}</div>
                    </div>
                  ))}
                </div>
                {(fosa1.length>0||fosa2.length>0)&&(
                  <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:notaDia?10:0}}>
                    {fosa1.length>0&&(
                      <div>
                        <div style={{fontSize:10,color:"#888",marginBottom:4,fontWeight:500}}>Fosa 1</div>
                        <div style={{display:"flex",gap:6}}>{fosa1.map((f,i)=><img key={i} src={f} alt="" onClick={()=>setPhotoViewer(f)} style={{width:70,height:70,objectFit:"cover",borderRadius:8,border:"0.5px solid #ddd",cursor:"pointer"}}/>)}</div>
                      </div>
                    )}
                    {fosa2.length>0&&(
                      <div>
                        <div style={{fontSize:10,color:"#888",marginBottom:4,fontWeight:500}}>Fosa 2</div>
                        <div style={{display:"flex",gap:6}}>{fosa2.map((f,i)=><img key={i} src={f} alt="" onClick={()=>setPhotoViewer(f)} style={{width:70,height:70,objectFit:"cover",borderRadius:8,border:"0.5px solid #ddd",cursor:"pointer"}}/>)}</div>
                      </div>
                    )}
                  </div>
                )}
                {notaDia&&<div style={{fontSize:12,color:"#555",padding:"6px 10px",background:"#f9f9f9",borderRadius:6}}>{notaDia}</div>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}