import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

export default function Fotos({ empleado }) {
  const [carpetas, setCarpetas] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCarpeta, setSelectedCarpeta] = useState(null);
  const [showNewCarpeta, setShowNewCarpeta] = useState(false);
  const [showAddFoto, setShowAddFoto] = useState(false);
  const [newCarpeta, setNewCarpeta] = useState("");
  const [comentario, setComentario] = useState("");
  const [uploading, setUploading] = useState(false);
  const [zoomFoto, setZoomFoto] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: c }, { data: f }] = await Promise.all([
      supabase.from("empleados_fotos_carpetas").select("*").eq("empleado_id", empleado.id).order("created_at", { ascending: false }),
      supabase.from("empleados_fotos").select("*").eq("empleado_id", empleado.id).order("created_at", { ascending: false }),
    ]);
    if(c) setCarpetas(c);
    if(f) setFotos(f);
    setLoading(false);
  };

  const createCarpeta = async () => {
    if(!newCarpeta.trim()) return;
    const { data, error } = await supabase.from("empleados_fotos_carpetas").insert([{ empleado_id: empleado.id, nombre: newCarpeta.trim() }]).select();
    if(!error){ setCarpetas(prev=>[data[0],...prev]); setNewCarpeta(""); setShowNewCarpeta(false); }
  };

  const deleteCarpeta = async (id) => {
    if(!window.confirm("¿Eliminar esta carpeta y todas sus fotos?")) return;
    await supabase.from("empleados_fotos").delete().eq("carpeta_id", id);
    await supabase.from("empleados_fotos_carpetas").delete().eq("id", id);
    setCarpetas(prev=>prev.filter(c=>c.id!==id));
    setFotos(prev=>prev.filter(f=>f.carpeta_id!==id));
    if(selectedCarpeta?.id===id) setSelectedCarpeta(null);
  };

  const uploadFoto = async (file) => {
    if(!file||!selectedCarpeta) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${empleado.id}/${selectedCarpeta.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("empleados-fotos").upload(fileName, file);
    if(upErr){ alert("Error subiendo foto"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("empleados-fotos").getPublicUrl(fileName);
    const fecha = new Date().toISOString().slice(0,10);
    const { data, error } = await supabase.from("empleados_fotos").insert([{
      empleado_id: empleado.id, carpeta_id: selectedCarpeta.id,
      url: urlData.publicUrl, comentario, fecha
    }]).select();
    if(!error){ setFotos(prev=>[data[0],...prev]); setComentario(""); setShowAddFoto(false); }
    setUploading(false);
  };

  const deleteFoto = async (foto) => {
    if(!window.confirm("¿Eliminar esta foto?")) return;
    await supabase.from("empleados_fotos").delete().eq("id", foto.id);
    setFotos(prev=>prev.filter(f=>f.id!==foto.id));
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
  const carpetaFotos = (id) => fotos.filter(f=>f.carpeta_id===id);

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Mis fotos</div>

      {/* Zoom modal */}
      {zoomFoto&&(
        <div onClick={()=>setZoomFoto(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <img src={zoomFoto} alt="" style={{maxWidth:"95vw",maxHeight:"90vh",objectFit:"contain",borderRadius:8}}/>
        </div>
      )}

      {!selectedCarpeta ? (
        <>
          <button onClick={()=>setShowNewCarpeta(true)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:16}}>
            + Nueva carpeta
          </button>

          {showNewCarpeta&&(
            <div style={{background:"#f0f4ff",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #b5d4f4"}}>
              <input value={newCarpeta} onChange={e=>setNewCarpeta(e.target.value)} placeholder="Nombre de la carpeta (ej: Fosa 2)" style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:14,marginBottom:10,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={createCarpeta} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,cursor:"pointer"}}>Crear</button>
                <button onClick={()=>setShowNewCarpeta(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              </div>
            </div>
          )}

          {carpetas.length===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin carpetas aún 📁</div>
          ) : carpetas.map(c=>(
            <div key={c.id} onClick={()=>setSelectedCarpeta(c)} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:500}}>📁 {c.nombre}</div>
                <div style={{fontSize:11,color:"#888",marginTop:2}}>{carpetaFotos(c.id).length} foto{carpetaFotos(c.id).length!==1?"s":""}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:20,color:"#1a3a6b"}}>›</span>
                <button onClick={e=>{e.stopPropagation();deleteCarpeta(c.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:16}}>🗑️</button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>setSelectedCarpeta(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#1a3a6b"}}>←</button>
            <div style={{fontSize:14,fontWeight:500}}>📁 {selectedCarpeta.nombre}</div>
          </div>

          <button onClick={()=>setShowAddFoto(true)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#1d9e75",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:16}}>
            📷 Agregar foto
          </button>

          {showAddFoto&&(
            <div style={{background:"#f0fff4",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #a8e6c1"}}>
              <div style={{fontSize:12,color:"#888",marginBottom:8}}>Selecciona una foto y agrega un comentario</div>
              <input type="file" accept="image/*" ref={fileRef} style={{marginBottom:10,fontSize:13}}/>
              <textarea value={comentario} onChange={e=>setComentario(e.target.value)} placeholder="Comentario (opcional)..." rows={2} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:10,boxSizing:"border-box",resize:"none"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>uploadFoto(fileRef.current?.files[0])} disabled={uploading} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1d9e75",color:"#fff",fontSize:13,cursor:"pointer"}}>
                  {uploading?"Subiendo...":"📤 Subir"}
                </button>
                <button onClick={()=>setShowAddFoto(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              </div>
            </div>
          )}

          {carpetaFotos(selectedCarpeta.id).length===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin fotos en esta carpeta 📷</div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {carpetaFotos(selectedCarpeta.id).map(f=>(
                <div key={f.id} style={{background:"#fff",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
                  <div style={{position:"relative"}}>
                    <img src={f.url} alt="" onClick={()=>setZoomFoto(f.url)} style={{width:"100%",height:120,objectFit:"cover",cursor:"zoom-in"}}/>
                    <button onClick={()=>deleteFoto(f)} style={{position:"absolute",top:4,right:4,background:"rgba(163,45,45,0.85)",border:"none",color:"#fff",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:11}}>✕</button>
                  </div>
                  <div style={{padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#888",marginBottom:2}}>📅 {fmtFecha(f.fecha)}</div>
                    {f.comentario&&<div style={{fontSize:11,color:"#555",lineHeight:1.4}}>{f.comentario}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}