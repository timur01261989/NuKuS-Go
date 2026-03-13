import React from "react";

function Select(props) {
  return <select {...props} />;
}

export default React.memo(Select);
