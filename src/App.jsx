
import React from "react";
import AppRouter from "./app/router/AppRouter.jsx";

function App(){

  const role = localStorage.getItem("role") || "client"

  return <AppRouter role={role}/>

}

export default React.memo(App);
