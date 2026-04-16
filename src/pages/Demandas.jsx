import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Demandas({ empleado }) {
  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [items, setItems] = useState([{ nombre:"", cantidad:"", unidad:"Pza" }]);
  const [nota, setNota] = useState("");

  const UNIDADES = ["Pza","Kg","L","ml","g","m","Caja","Rollo"];

  useEffect(() => { fetchDemandas(); }, []);

  const fetchDemandas = async () => {
    setLoading(true);
    const { data } = await supabase.from("empleados_demandas").select("*")
      .eq("empleado_id", empleado.id).order("created_at", { ascending: false });
    if(data) setDemandas(data);
    setLoading(false);
  };

  const addItem = () => setItems(prev=>[...prev,{nombre:"",cantidad:"",unidad:"Pza"}]);
  const updateItem = (i, field, val) => { const n=[...items]; n[i]={...n[i],[field]:val}; setItems(n); };
  const removeItem = (i) => setItems(prev=>prev.filter((_,j)=>j!==i));

  const saveDemanda = async () => {
    if(items.every(i=>!i.nombre)) return alert("Agrega al menos un material");
    const { data, error } = await supabase.from("empleados_demandas").insert([{
      empleado_id: empleado.id,
      empleado_nombre: empleado.nombre,
      planta: empleado.planta||"",
      items: items.filter(i=>i.nombre),
      nota,
      status: "Pendiente"
    }]).select();
    if(!error){
      setDemandas(prev=>[data[0],...prev]);
      setShowNew(false);
      setItems([{nombre:"",cantidad:"",unidad:"Pza"}]);
      setNota("");
    } else alert("Error: "+JSON.stringify(error));
  };

  const statusColor = {"Pendiente":["#fff8e6","#854f0b"],"Aprobada":["#eaf3de","#3b6d11"],"Rechazada":["#fcebeb","#a32d2d"],"Entregada":["#e6f1fb","#185fa5"]};
  const fmtFecha = (d) => { if(!d) return ""; const dt=new Date(d); return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`; };

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Demandas de material</div>

      <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:16}}>
        + Nueva demanda
      </button>

      {showNew&&(
        <div style={{background:"#fff",borderRadius:10,padding:14,marginBottom:14,border:"0.5px solid #ddd",boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Nueva demanda de material</div>
          {items.map((item,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 28px",gap:6,marginBottom:8,alignItems:"center"}}>
              <input value={item.nombre} onChange={e=>updateItem(i,"nombre",e.target.value)} placeholder="Material..." style={{padding:"9px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,boxSizing:"border-box"}}/>
              <input type="number" value={item.cantidad} onChange={e=>updateItem(i,"cantidad",e.target.value)} placeholder="Cant." style={{padding:"9px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,boxSizing:"border-box"}}/>
              <select value={item.unidad} onChange={e=>updateItem(i,"unidad",e.target.value)} style={{padding:"9px",borderRadius:8,border:"0.5px solid #ddd",fontSize:12}}>
                {UNIDADES.map(u=><option key={u}>{u}</option>)}
              </select>
              <button onClick={()=>removeItem(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#a32d2d",fontSize:16}}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{fontSize:12,padding:"5px 12px",borderRadius:6,border:"0.5px solid #ddd",background:"#fff",cursor:"pointer",marginBottom:10}}>+ Agregar material</button>
          <textarea value={nota} onChange={e=>setNota(e.target.value)} placeholder="Nota o comentario (opcional)..." rows={2} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:10,resize:"none",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveDemanda} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:"#1a3a6b",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:500}}>Enviar demanda</button>
            <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"0.5px solid #ddd",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {demandas.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin demandas aún 📦</div>
      ) : demandas.map(d=>(
        <div key={d.id} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,color:"#888"}}>📅 {fmtFecha(d.created_at)}{d.planta?` · 📍 ${d.planta}`:""}</div>
            <span style={{background:statusColor[d.status]?.[0]||"#eee",color:statusColor[d.status]?.[1]||"#555",fontSize:10,padding:"2px 8px",borderRadius:8,fontWeight:500}}>{d.status}</span>
          </div>
          {(d.items||[]).map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #eee",fontSize:13}}>
              <span>{item.nombre}</span>
              <span style={{color:"#1a3a6b",fontWeight:500}}>{item.cantidad} {item.unidad}</span>
            </div>
          ))}
          {d.nota&&<div style={{fontSize:12,color:"#888",marginTop:8}}>{d.nota}</div>}
        </div>
      ))}
    </div>
  );
}