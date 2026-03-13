
import React from "react";
import { BrowserRouter } from "react-router-dom";
import ClientRoutes from "./ClientRoutes.jsx";
import DriverRoutes from "./DriverRoutes.jsx";

function AppRouter({ role }){

  if(role === "driver"){
    return (
      <BrowserRouter>
        <DriverRoutes/>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <ClientRoutes/>
    </BrowserRouter>
  )

}

export default React.memo(AppRouter);
