import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Puntaje({ empleado }) {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fechaHoy = new Date().toISOString().slice(0,10);

  useEffect(() => { fetchToday(); }, []);

  const fetchToday = async () => {
    setLoading(true);
    const { data } = await supabase.from("empleados_puntaje")
      .select("*").eq("empleado_id", empleado.id).eq("fecha", fechaHoy).single();
    if(data) setToday(data);
    setLoading(false);
  };

  const registrarEntrada = async () => {
    setSaving(true);
    const { data } = await supabase.from("empleados_puntaje").insert([{
      empleado_id: empleado.id, fecha: fechaHoy, hora_entrada: new Date().toISOString()
    }]).select().single();
    if(data) setToday(data);
    setSaving(false);
  };

  const registrarSalida = async () => {
    setSaving(true);
    const { data } = await supabase.from("empleados_puntaje")
      .update({ hora_salida: new Date().toISOString() })
      .eq("id", today.id).select().single();
    if(data) setToday(data);
    setSaving(false);
  };

  const fmtHora = (ts) => { if(!ts) return "—"; const d=new Date(ts); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

  const calcHoras = () => {
    if(!today?.hora_entrada||!today?.hora_salida) return null;
    const diff = new Date(today.hora_salida) - new Date(today.hora_entrada);
    const h = Math.floor(diff/3600000);
    const m = Math.floor((diff%3600000)/60000);
    return `${h}h ${m}m`;
  };

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:20}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16}}>Puntaje de hoy</div>

      <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:13,color:"#888",marginBottom:4}}>{new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,margin:"16px 0"}}>
          <div style={{background:"#f0f4ff",borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888",marginBottom:4}}>Entrada</div>
            <div style={{fontSize:24,fontWeight:"bold",color:"#1a3a6b"}}>{fmtHora(today?.hora_entrada)}</div>
          </div>
          <div style={{background:"#f0fff4",borderRadius:10,padding:14,textAlign:"center"}}>
            <div style={{fontSize:11,color:"#888",marginBottom:4}}>Salida</div>
            <div style={{fontSize:24,fontWeight:"bold",color:"#1d9e75"}}>{fmtHora(today?.hora_salida)}</div>
          </div>
        </div>

        {calcHoras()&&(
          <div style={{textAlign:"center",fontSize:13,color:"#555",marginBottom:16}}>
            Total trabajado: <strong>{calcHoras()}</strong>
          </div>
        )}

        {!today&&(
          <button onClick={registrarEntrada} disabled={saving}
            style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer"}}>
            {saving?"...":"👆 Registrar entrada"}
          </button>
        )}
        {today&&!today.hora_salida&&(
          <button onClick={registrarSalida} disabled={saving}
            style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:"#1d9e75",color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer"}}>
            {saving?"...":"🏁 Registrar salida"}
          </button>
        )}
        {today?.hora_salida&&(
          <div style={{textAlign:"center",padding:"12px",background:"#eaf3de",borderRadius:10,fontSize:13,color:"#3b6d11",fontWeight:500}}>
            ✅ Jornada completada
          </div>
        )}
      </div>
    </div>
  );
}