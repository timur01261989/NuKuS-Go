import React from "react";
import { Avatar, Button, Drawer, Input, Modal, Rate, Space, Typography } from "antd";
import { CloseOutlined, SendOutlined, SwapOutlined, UserOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const YG_STYLES = `
        .yg-root{position:relative;height:100vh;width:100%;background:#fff;}
        .yg-mapWrap{position:absolute;inset:0;}
        .leaflet-container{background:#dfe6ee;}
        .yg-back{position:absolute;left:16px;top:16px;z-index:900;}
        .yg-locate{position:absolute;right:16px;bottom:340px;z-index:900;}
        .yg-locate .ant-btn{box-shadow:0 6px 18px rgba(0,0,0,.18);border:none;}
        .yg-centerpin{position:absolute;left:50%;top:50%;z-index:800;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;transition:transform .2s cubic-bezier(.175,.885,.32,1.275);transform:translate(-50%,-68%);} 
        .yg-centerpin.dragging{transform:translate(-50%,-90%) scale(1.15);} 
        .yg-pinlabel{background:rgba(17,17,17,.85);color:#fff;padding:6px 10px;border-radius:12px;font-weight:700;font-size:12px;box-shadow:0 10px 24px rgba(0,0,0,.25);transition:opacity .2s;}
        .yg-centerpin.dragging .yg-pinlabel{opacity:.5;}
        .yg-miniPin{filter: drop-shadow(0 10px 18px rgba(0,0,0,.25));}
        .yg-sheet{padding:16px 16px 18px 16px;}
        .yg-sheetHead{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
        .yg-logo{width:44px;height:44px;border-radius:12px;background:conic-gradient(from 180deg, #FFD400, #fff, #111);}
        .yg-bigRow{height:54px;border-radius:18px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;}
        .yg-bigRowText{font-size:16px;font-weight:700;}
        .yg-bigRowArrow{position:absolute;right:16px;font-size:22px;opacity:.7;}
        .yg-history{margin-top:12px;max-height:150px;overflow:auto;}
        .yg-hItem{cursor:pointer;border-radius:14px;}
        .yg-hItem:hover{background:#fafafa;}
        .yg-hIcon{width:36px;height:36px;border-radius:18px;background:#f4f4f4;display:flex;align-items:center;justify-content:center;margin-right:10px;}
        .yg-hText{flex:1;}
        .yg-hTitle{font-weight:800;font-size:15px;}
        .yg-hSub{font-size:12px;color:#8a8a8a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .yg-homeActions{display:flex;gap:10px;margin-top:12px;}
        .yg-orderBtn{flex:1;height:52px;border-radius:20px;font-weight:900;font-size:16px;}
        .yg-smallBtn{width:56px;height:52px;border-radius:20px;}
        .yg-confirmHeader{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border-radius:18px;padding:10px 12px;box-shadow:0 12px 26px rgba(0,0,0,.08);} 
        .yg-confirmTitle{font-weight:900;font-size:16px;line-height:1.1;}
        .yg-pill{border-radius:999px;height:36px;padding:0 14px;background:#f3f3f3;border:none;font-weight:800;}
        .yg-routeInfo{display:flex;align-items:center;justify-content:space-between;margin-top:10px;}
        .yg-routePill{display:flex;align-items:center;gap:8px;border-radius:14px;background:#fff;padding:8px 12px;box-shadow:0 12px 26px rgba(0,0,0,.08);}
        .yg-tabs{display:flex;gap:18px;margin-top:12px;color:#b5b5b5;font-weight:800;}
        .yg-tabActive{color:#111;background:#efefef;border-radius:999px;padding:6px 12px;}
        .yg-tariffs{display:flex;gap:12px;overflow:auto;padding-top:12px;padding-bottom:10px;}
        .yg-tariff{min-width:150px;border-radius:18px;background:#fff;box-shadow:0 12px 26px rgba(0,0,0,.08);padding:12px;cursor:pointer;}
        .yg-tariff.active{outline:3px solid #FFD400;}
        .yg-tariffEta{font-weight:900;color:#111;}
        .yg-tariffName{margin-top:6px;font-weight:800;color:#777;}
        .yg-tariffPrice{margin-top:10px;font-weight:900;font-size:18px;}
        .yg-confirmActions{display:flex;gap:10px;margin-top:10px;}
        .yg-orderBtnYellow{flex:1;height:56px;border-radius:22px;font-weight:900;font-size:18px;background:#FFD400;color:#111;border:none;}
        .yg-orderBtnYellow:hover{background:#ffdf2d;color:#111;}
        .yg-destSheet{height:100%;display:flex;flex-direction:column;}
        .yg-topRows{padding:14px 16px 10px 16px;}
        .yg-topRow{display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:18px;padding:12px;box-shadow:0 12px 26px rgba(0,0,0,.08);margin-bottom:10px;}
        .yg-topIcon{width:46px;height:46px;border-radius:18px;background:#f2f2f2;}
        .yg-topLabel{font-size:12px;color:#999;font-weight:700;}
        .yg-topValue{font-size:18px;font-weight:900;}
        .yg-mapBtn{height:42;border-radius:14px;font-weight:800;background:#efefef;border:none;}
        .yg-suggestions{flex:1;overflow:auto;padding:0 10px 10px 10px;}
        .yg-sItem{cursor:pointer;border-radius:14px;padding-left:10px;padding-right:10px;}
        .yg-sItem:hover{background:#fafafa;}
        .yg-sheetFooter{padding:10px 16px;border-top:1px solid #eee;}
        .yg-miniCard{position:absolute;left:50%;transform:translateX(-50%);bottom:130px;z-index:950;background:#fff;border-radius:18px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:14px 14px;min-width:260px;}
        .yg-miniPrice{display:flex;align-items:center;justify-content:space-between;gap:10px;}
        .yg-miniTime{font-weight:900;font-size:14px;color:#111;}
        .yg-miniMoney{font-weight:900;font-size:18px;color:#111;}
        .yg-waves{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:700;pointer-events:none;}
        .yg-wave{position:absolute;left:50%;top:50%;width:30px;height:30px;border-radius:50%;border:3px solid rgba(59,130,246,.35);transform:translate(-50%,-50%);animation:ygWave 2.2s infinite;}
        .yg-wave:nth-child(2){animation-delay:.7s;}
        .yg-wave:nth-child(3){animation-delay:1.4s;}
        @keyframes ygWave{0%{opacity:.9;transform:translate(-50%,-50%) scale(.6);}100%{opacity:0;transform:translate(-50%,-50%) scale(7);}}
        .yg-searchPanel{position:absolute;left:16px;right:16px;bottom:18px;z-index:950;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:16px;}
        .yg-searchTitle{font-size:18px;font-weight:900;}
        .yg-searchSub{margin-top:4px;color:#888;font-weight:700;}
        .yg-searchBtns{display:flex;gap:12px;margin-top:14px;}
        .yg-grayBtn{flex:1;height:48px;border-radius:18px;background:#f2f2f2;border:none;font-weight:900;}
        .yg-car{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:20px;filter: drop-shadow(0 6px 10px rgba(0,0,0,.25));}
        .yg-accepted{position:absolute;left:16px;right:16px;bottom:18px;z-index:950;}
        .yg-notif{background:rgba(255,255,255,.92);backdrop-filter: blur(10px);border-radius:22px;padding:12px 12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 18px 38px rgba(0,0,0,.18);} 
        .yg-notifLeft{display:flex;align-items:center;gap:10px;}
        .yg-go{width:38px;height:38px;border-radius:19px;background:#2b2b2b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;}
        .yg-notifTop{font-weight:900;}
        .yg-notifSub{font-size:12px;color:#666;font-weight:700;}
        .yg-eta{margin-top:10px;background:#fff;border-radius:22px;padding:12px 14px;font-size:22px;font-weight:900;box-shadow:0 18px 38px rgba(0,0,0,.18);} 
        .yg-driverCard{margin-top:10px;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.18);padding:14px;} 
        .yg-driverRow{display:flex;justify-content:space-between;gap:12px;}
        .yg-driverTitle{font-weight:900;font-size:16px;}
        .yg-driverSub{color:#666;font-weight:800;margin-top:2px;}
        .yg-plate{margin-top:8px;font-weight:900;font-size:40px;letter-spacing:2px;} 
        .yg-driverActions{display:flex;gap:10px;margin-top:12px;}
        .yg-actionBtn{flex:1;height:48px;border-radius:18px;background:#f2f2f2;border:none;font-weight:900;} 
        .yg-pickRow{margin-top:14px;border-top:1px solid #eee;padding-top:10px;cursor:pointer;}
        .yg-pickLabel{color:#777;font-weight:800;font-size:12px;}
        .yg-pickAddr{font-weight:900;font-size:18px;margin-top:2px;} 
        .yg-detailsHint{margin-top:10px;background:#fff;border-radius:18px;box-shadow:0 18px 38px rgba(0,0,0,.18);height:54px;display:flex;align-items:center;justify-content:center;font-weight:900;cursor:pointer;} 
        .yg-details{height:100%;display:flex;flex-direction:column;padding:14px 16px 16px 16px;}
        .yg-detailsTop{display:flex;justify-content:space-between;align-items:center;}
        .yg-detailsHeader{display:flex;align-items:center;gap:10px;}
        .yg-detailsHeaderText{font-weight:900;}
        .yg-detailBtns{display:flex;gap:10px;margin-top:14px;}
        .yg-detailsList{margin-top:16px;background:#fff;border-radius:22px;box-shadow:0 18px 38px rgba(0,0,0,.12);overflow:hidden;}
        .yg-lineItem{display:flex;align-items:center;gap:12px;padding:14px 14px;border-bottom:1px solid #f0f0f0;cursor:pointer;}
        .yg-lineItem:last-child{border-bottom:none;}
        .yg-lineIcon{width:34px;height:34px;border-radius:17px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;font-weight:900;}
        .yg-lineText{flex:1;}
        .yg-lineLabel{font-size:12px;color:#888;font-weight:800;}
        .yg-lineValue{font-size:16px;font-weight:900;}
        .yg-lineArrow{font-size:22px;opacity:.5;}
        .yg-detailsFooter{margin-top:auto;}
`;

export function AcceptedPanel({ assignedDriver, pickupTitle, setDetailsOpen, setChatOpen, message }) {
  return (
    <div className="yg-accepted">
      <div className="yg-notif">
        <div className="yg-notifLeft">
          <div className="yg-go">Go</div>
          <div>
            <div className="yg-notifTop">Yaqinda keladi</div>
            <div className="yg-notifSub">1–3 daqiqadan keyin haydovchi yetib boradi</div>
          </div>
        </div>
        <Button shape="circle" icon={<SwapOutlined />} onClick={() => setDetailsOpen(true)} />
      </div>
      <div className="yg-eta">~{assignedDriver?.eta_min || 2} daq va keladi</div>
      <div className="yg-driverCard">
        <div className="yg-driverRow">
          <div className="yg-driverLeft">
            <div className="yg-driverTitle">Haydovchi ★{assignedDriver?.rating || 4.83}</div>
            <div className="yg-driverSub">{assignedDriver?.car_model || "Oq Chevrolet Cobalt"}</div>
            <div className="yg-plate">{assignedDriver?.car_plate || "95S703RA"}</div>
          </div>
          <div className="yg-driverRight">
            <Avatar size={64} src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
          </div>
        </div>
        <div className="yg-driverActions">
          <Button className="yg-actionBtn" onClick={() => setChatOpen(true)}>Aloqa</Button>
          <Button className="yg-actionBtn" onClick={() => message.info("Xavfsizlik")}>Xavfsizlik</Button>
          <Button className="yg-actionBtn" onClick={() => message.info("Ulashish")}>Ulashish</Button>
        </div>
        <div className="yg-pickRow" onClick={() => setDetailsOpen(true)}>
          <div className="yg-pickLabel">Mijozni olish ~{assignedDriver?.pickup_eta || "23:13"}</div>
          <div className="yg-pickAddr">{pickupTitle}</div>
        </div>
      </div>
      <div className="yg-detailsHint" onClick={() => setDetailsOpen(true)}><span>Yana ko'rsatish</span></div>
    </div>
  );
}

export function DetailsDrawer({ detailsOpen, setDetailsOpen, setChatOpen, message, pickupTitle, destTitle, handleCancel }) {
  return (
    <Drawer
      placement="bottom"
      open={detailsOpen}
      closable={false}
      height={560}
      bodyStyle={{ padding: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" }}
      mask={false}
      onClose={() => setDetailsOpen(false)}
    >
      <div className="yg-details">
        <div className="yg-detailsTop">
          <div className="yg-detailsHeader">
            <div className="yg-go">Go</div>
            <div className="yg-detailsHeaderText">UniGo • Hozir</div>
          </div>
          <Button shape="circle" icon={<CloseOutlined />} onClick={() => setDetailsOpen(false)} />
        </div>
        <div className="yg-detailBtns">
          <Button className="yg-actionBtn" onClick={() => setChatOpen(true)}>Aloqa</Button>
          <Button className="yg-actionBtn" onClick={() => message.info("Xavfsizlik")}>Xavfsizlik</Button>
          <Button className="yg-actionBtn" onClick={() => message.info("Ulashish")}>Ulashish</Button>
        </div>
        <div className="yg-detailsList">
          <div className="yg-lineItem">
            <div className="yg-lineIcon">🙋</div>
            <div className="yg-lineText">
              <div className="yg-lineLabel">Mijozni olish</div>
              <div className="yg-lineValue">{pickupTitle}</div>
            </div>
            <div className="yg-lineArrow">›</div>
          </div>
          <div className="yg-lineItem">
            <div className="yg-lineIcon">🏁</div>
            <div className="yg-lineText">
              <div className="yg-lineLabel">Yetib kelish</div>
              <div className="yg-lineValue">{destTitle}</div>
            </div>
            <div className="yg-lineArrow">›</div>
          </div>
          <div className="yg-lineItem" onClick={handleCancel}>
            <div className="yg-lineIcon" style={{ color: "#ff4d4f" }}>✖</div>
            <div className="yg-lineText">
              <div className="yg-lineValue" style={{ color: "#ff4d4f", fontWeight: 800 }}>Safarni bekor qilish</div>
            </div>
            <div className="yg-lineArrow">›</div>
          </div>
        </div>
        <div className="yg-detailsFooter">
          <Button onClick={() => setDetailsOpen(false)} style={{ width: "100%", borderRadius: 16, height: 46 }}>
            Yana ko'rsatish
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

export function ChatModal({
  assignedDriver,
  cp,
  chatOpen,
  setChatOpen,
  messagesState,
  chatScrollRef,
  msgText,
  setMsgText,
  handleSendMessage,
}) {
  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{assignedDriver?.first_name || cp("Haydovchi")}</div>
            <div style={{ fontSize: 11, color: "#888" }}>{assignedDriver?.car_model}</div>
          </div>
        </div>
      }
      open={chatOpen}
      onCancel={() => setChatOpen(false)}
      footer={null}
      centered
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "420px" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 15, background: "#f5f5f5" }}>
          {messagesState.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
              Henuz xabarlar yo'q.
              <br /> Haydovchiga yozing!
            </div>
          ) : (
            messagesState.map((msg) => {
              const isMe = msg.sender_role === "client";
              return (
                <div key={msg.id || msg.created_at} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "8px 12px",
                      borderRadius: 12,
                      background: isMe ? "#1890ff" : "#fff",
                      color: isMe ? "#fff" : "#000",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      borderTopRightRadius: isMe ? 0 : 12,
                      borderTopLeftRadius: isMe ? 12 : 0,
                    }}
                  >
                    <div style={{ fontSize: 14 }}>{msg.content}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, textAlign: "right", marginTop: 2 }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatScrollRef} />
        </div>
        <div style={{ padding: 10, background: "#fff", borderTop: "1px solid #eee", display: "flex", gap: 10 }}>
          <Input
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Xabar yozing..."
            style={{ borderRadius: 20 }}
          />
          <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendMessage} />
        </div>
      </div>
    </Modal>
  );
}

export function RatingModal({ ratingOpen, setRatingOpen }) {
  return (
    <Modal title="Safar tugadi" open={ratingOpen} onCancel={() => setRatingOpen(false)} onOk={() => setRatingOpen(false)} okText="Yuborish">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text>Haydovchini baholang:</Text>
        <Rate defaultValue={5} />
      </Space>
    </Modal>
  );
}
