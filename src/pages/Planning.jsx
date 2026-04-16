import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Planning({ empleado }) {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPlanes(); }, []);

  const fetchPlanes = async () => {
    setLoading(true);
    const { data } = await supabase.from("limpieza_planes")
      .select("*")
      .contains("empleados", [empleado.nombre])
      .order("fecha", { ascending: false })
      .limit(10);
    if(data) setPlanes(data);
    setLoading(false);
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
  const statusColor = (s) => s==="Completado"?"#eaf3de":s==="En curso"?"#faeeda":"#e6f1fb";
  const statusText = (s) => s==="Completado"?"#3b6d11":s==="En curso"?"#854f0b":"#185fa5";

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:20}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16}}>Mis intervenciones</div>

      {planes.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin intervenciones asignadas 📅</div>
      ) : planes.map(p=>(
        <div key={p.id} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:14,fontWeight:500}}>{p.cliente}</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>{p.turno} · {fmtFecha(p.fecha)}</div>
            </div>
            <span style={{background:statusColor(p.status),color:statusText(p.status),fontSize:10,padding:"2px 8px",borderRadius:8,fontWeight:500}}>{p.status}</span>
          </div>
          {(p.zonas||[]).length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>
              {p.zonas.map(z=><span key={z} style={{background:"#f0f4ff",color:"#1a3a6b",fontSize:10,padding:"2px 7px",borderRadius:6}}>{z}</span>)}
            </div>
          )}
          {p.resumen&&<div style={{fontSize:12,color:"#555",marginTop:8,lineHeight:1.5}}>{p.resumen}</div>}
        </div>
      ))}
    </div>
  );
}