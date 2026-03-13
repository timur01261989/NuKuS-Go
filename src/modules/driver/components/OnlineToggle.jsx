import React, { useCallback } from "react";

function OnlineToggle({ checked = false, onChange }) {
  const handleClick = useCallback(() => {
    onChange?.(!checked);
  }, [checked, onChange]);

  return (
    <button type="button" onClick={handleClick}>
      {checked ? "Online" : "Offline"}
    </button>
  );
}

export default React.memo(OnlineToggle);
