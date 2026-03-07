
import React from "react";
import { Switch, message } from "antd";
import { useDriverOnline } from "../core/useDriverOnline";
import { canActivateService } from "../core/serviceGuards";
import { useDriverText } from "../shared/i18n_driverLocalize";

export default function DriverOnlineToggle({ serviceType, onBeforeOnline, onAfterOnlineChange, checkedChildren = "ON", unCheckedChildren = "OFF" }) {
  const { cp } = useDriverText();
  const { isOnline, activeService, setOnline, setOffline } = useDriverOnline();
  const active = isOnline && activeService === serviceType;

  const onChange = async (next) => {
    if (next) {
      if (!canActivateService(activeService, serviceType)) {
        message.warning(cp("Avval boshqa xizmatni offline qiling"));
        return;
      }
      const allowed = await (onBeforeOnline?.() ?? true);
      if (allowed === false) return;
      await setOnline(serviceType);
      onAfterOnlineChange?.(true);
      return;
    }
    await setOffline();
    onAfterOnlineChange?.(false);
  };

  return (
    <Switch
      checked={active}
      onChange={onChange}
      checkedChildren={checkedChildren}
      unCheckedChildren={unCheckedChildren}
    />
  );
}
