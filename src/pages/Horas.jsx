import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Horas({ empleado }) {
  const [horas, setHoras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHoras(); }, []);

  const fetchHoras = async () => {
    setLoading(true);
    const { data } = await supabase.from("empleados_horas")
      .select("*").eq("empleado_id", empleado.id)
      .order("semana_inicio", { ascending: false }).limit(8);
    if(data) setHoras(data);
    setLoading(false);
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
  const totalNormales = horas.reduce((a,h)=>a+Number(h.horas_normales||0),0);
  const totalExtra = horas.reduce((a,h)=>a+Number(h.horas_extra||0),0);

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:20}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16}}>Mis horas</div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 8px rgba(0,0,0,0.06)",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>Horas normales</div>
          <div style={{fontSize:28,fontWeight:"bold",color:"#1a3a6b"}}>{totalNormales}h</div>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 1px 8px rgba(0,0,0,0.06)",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#888",marginBottom:4}}>Horas extra</div>
          <div style={{fontSize:28,fontWeight:"bold",color:"#ef9f27"}}>{totalExtra}h</div>
        </div>
      </div>

      {horas.length===0 ? (
        <div style={{textAlign:"center",padding:40,color:"#aaa",fontSize:13}}>Sin registros de horas ⏱️</div>
      ) : horas.map(h=>(
        <div key={h.id} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Semana del {fmtFecha(h.semana_inicio)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"#888",marginBottom:2}}>Normales</div>
              <div style={{fontSize:18,fontWeight:"bold",color:"#1a3a6b"}}>{h.horas_normales}h</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"#888",marginBottom:2}}>Extra</div>
              <div style={{fontSize:18,fontWeight:"bold",color:"#ef9f27"}}>{h.horas_extra}h</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:10,color:"#888",marginBottom:2}}>Extra previstas</div>
              <div style={{fontSize:18,fontWeight:"bold",color:"#888"}}>{h.horas_extra_previstas}h</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}