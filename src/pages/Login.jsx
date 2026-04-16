import { useState } from "react";
import { supabase } from "../supabase";

export default function Login({ onLogin }) {
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if(!nombre.trim()||pin.length<4) return setError("Ingresa tu nombre y PIN de 4 dígitos");
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("empleados")
      .select("*")
      .ilike("nombre", nombre.trim())
      .eq("pin", pin.trim());
    if(error||!data||data.length===0){
      setError("Nombre o PIN incorrecto");
      setLoading(false);
      return;
    }
    onLogin(data[0]);
    setLoading(false);
  };

  const handlePinClick = (digit) => { if(pin.length<4) setPin(prev=>prev+digit); };
  const handleDelete = () => setPin(prev=>prev.slice(0,-1));

  return (
    <div style={{minHeight:"100vh",background:"#1a3a6b",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{marginBottom:30,textAlign:"center"}}>
        <div style={{background:"#fff",color:"#1a3a6b",padding:"8px 20px",borderRadius:6,fontWeight:"bold",fontSize:18,letterSpacing:2,display:"inline-block",marginBottom:12}}>SAMJUNG</div>
        <div style={{color:"#fff",fontSize:14,opacity:0.8}}>Portal Empleados</div>
      </div>
      <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:15,fontWeight:500,color:"#222",marginBottom:16,textAlign:"center"}}>Iniciar sesión</div>
        <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Tu nombre</label>
        <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Angel Ahumada"
          style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #ddd",fontSize:14,marginBottom:16,background:"#f5f7fa",boxSizing:"border-box"}}/>
        <label style={{fontSize:11,color:"#888",display:"block",marginBottom:8}}>PIN (4 dígitos)</label>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:16}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${pin.length>i?"#1a3a6b":"#ddd"}`,background:pin.length>i?"#1a3a6b":"#f5f7fa",transition:"all 0.15s"}}/>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} onClick={()=>d==="⌫"?handleDelete():d!==""?handlePinClick(String(d)):null}
              style={{padding:"14px",borderRadius:10,border:"0.5px solid #eee",background:d==="⌫"?"#fff3f3":d===""?"transparent":"#fff",fontSize:18,fontWeight:500,cursor:d===""?"default":"pointer",color:d==="⌫"?"#a32d2d":"#222",boxShadow:d!==""&&d!=="⌫"?"0 1px 4px rgba(0,0,0,0.06)":"none"}}>
              {d}
            </button>
          ))}
        </div>
        {error&&<div style={{color:"#a32d2d",fontSize:12,textAlign:"center",marginBottom:12}}>{error}</div>}
        <button onClick={handleLogin} disabled={loading||!nombre.trim()||pin.length<4}
          style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:(!nombre.trim()||pin.length<4)?"#ccc":"#1a3a6b",color:"#fff",fontSize:14,fontWeight:500,cursor:(!nombre.trim()||pin.length<4)?"not-allowed":"pointer"}}>
          {loading?"Verificando...":"Entrar"}
        </button>
      </div>
    </div>
  );
}